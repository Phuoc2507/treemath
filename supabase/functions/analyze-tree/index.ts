import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers - allow all origins for public API
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// File validation constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
]);

// Rate limiting constants
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10; // 10 requests per minute per IP

// Rate limiting function
async function checkRateLimit(clientIp: string): Promise<{ allowed: boolean; count: number }> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials for rate limiting");
    return { allowed: true, count: 0 }; // Fail open if no credentials
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const now = new Date();
  const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW_MS);
  const action = "analyze_tree";

  try {
    // Check current count in window
    const { data: existing, error: selectError } = await supabase
      .from("request_rate_limits")
      .select("count, window_start")
      .eq("ip", clientIp)
      .eq("action", action)
      .gte("window_start", windowStart.toISOString())
      .order("window_start", { ascending: false })
      .limit(1)
      .single();

    if (selectError && selectError.code !== "PGRST116") {
      console.error("Rate limit check error:", selectError);
      return { allowed: true, count: 0 }; // Fail open on error
    }

    if (existing) {
      // Update existing record
      const newCount = existing.count + 1;
      if (newCount > MAX_REQUESTS_PER_WINDOW) {
        return { allowed: false, count: newCount };
      }

      await supabase
        .from("request_rate_limits")
        .update({ count: newCount })
        .eq("ip", clientIp)
        .eq("action", action)
        .eq("window_start", existing.window_start);

      return { allowed: true, count: newCount };
    } else {
      // Create new record
      await supabase.from("request_rate_limits").insert({
        ip: clientIp,
        action: action,
        window_start: now.toISOString(),
        count: 1,
      });

      return { allowed: true, count: 1 };
    }
  } catch (error) {
    console.error("Rate limit error:", error);
    return { allowed: true, count: 0 }; // Fail open on error
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP for rate limiting
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("x-real-ip") || 
                     "unknown";

    // Check rate limit
    const { allowed, count } = await checkRateLimit(clientIp);
    if (!allowed) {
      console.warn(`Rate limit exceeded for IP: ${clientIp.substring(0, 10)}... (${count} requests)`);
      return new Response(
        JSON.stringify({ 
          error: "Rate limit exceeded. Please try again later.",
          retry_after_seconds: 60
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "Retry-After": "60"
          } 
        }
      );
    }

    const upstreamUrl = Deno.env.get("TREE_ANALYSIS_UPSTREAM_URL");
    if (!upstreamUrl) {
      console.error("TREE_ANALYSIS_UPSTREAM_URL is not configured");
      return new Response(
        JSON.stringify({ error: "Server configuration error: upstream URL not set" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse incoming form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      console.warn("No file provided in request");
      return new Response(
        JSON.stringify({ error: "No image file provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      console.warn(`File too large: ${file.size} bytes (max ${MAX_FILE_SIZE})`);
      return new Response(
        JSON.stringify({ error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate MIME type
    const mimeType = file.type.toLowerCase();
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      console.warn(`Invalid file type: ${mimeType}`);
      return new Response(
        JSON.stringify({ error: `Invalid file type: ${mimeType}. Allowed: JPEG, PNG, WebP` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate bounding box format
    const validateBox = (boxStr: string | null): boolean => {
      if (!boxStr) return true;
      try {
        const parsed = JSON.parse(boxStr);
        return Array.isArray(parsed) && 
               parsed.length === 4 &&
               parsed.every((n: unknown) => typeof n === 'number' && n >= 0 && n <= 10000);
      } catch { return false; }
    };

    // Forward optional bounding box parameters with validation
    const personBox = formData.get("person_box") as string | null;
    const treeBox = formData.get("tree_box") as string | null;

    if (!validateBox(personBox) || !validateBox(treeBox)) {
      console.warn("Invalid bounding box format provided");
      return new Response(
        JSON.stringify({ error: "Invalid bounding box format. Expected [x1, y1, x2, y2] with values 0-10000" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build new FormData for upstream
    const upstreamFormData = new FormData();
    upstreamFormData.append("file", file);
    if (personBox) upstreamFormData.append("person_box", personBox);
    if (treeBox) upstreamFormData.append("tree_box", treeBox);

    // Ensure the URL ends with /predict
    const predictUrl = upstreamUrl.endsWith('/predict') 
      ? upstreamUrl 
      : `${upstreamUrl.replace(/\/$/, '')}/predict`;

    // Sanitize filename for logging (remove special characters)
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);
    console.log(`Proxying request to: ${predictUrl}`);
    console.log(`File: ${sanitizedName}, Size: ${file.size}, Type: ${mimeType}`);

    // Forward to upstream Python API
    const upstreamResponse = await fetch(predictUrl, {
      method: "POST",
      body: upstreamFormData,
    });

    const responseText = await upstreamResponse.text();
    console.log(`Upstream response status: ${upstreamResponse.status}`);

    if (!upstreamResponse.ok) {
      console.error(`Upstream error: ${responseText}`);
      return new Response(
        JSON.stringify({ error: "Image analysis failed", details: responseText }),
        { status: upstreamResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return upstream response
    return new Response(responseText, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in analyze-tree function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
