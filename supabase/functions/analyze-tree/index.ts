import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Trusted origins for CORS
const ALLOWED_ORIGINS = [
  'https://treemath.lovable.app',
  'https://vijsarilxqwghzyaygcm.lovable.app',
  'https://vijsarilxqwghzyaygcm.supabase.co',
  'http://localhost:5173',
  'http://localhost:3000',
];

const getCorsHeaders = (origin: string) => {
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
};

// File validation constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
]);

serve(async (req) => {
  const origin = req.headers.get('origin') || '';
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    // Build new FormData for upstream
    const upstreamFormData = new FormData();
    upstreamFormData.append("file", file);

    // Forward optional bounding box parameters
    const personBox = formData.get("person_box");
    const treeBox = formData.get("tree_box");
    if (personBox) upstreamFormData.append("person_box", personBox as string);
    if (treeBox) upstreamFormData.append("tree_box", treeBox as string);

    // Ensure the URL ends with /predict
    const predictUrl = upstreamUrl.endsWith('/predict') 
      ? upstreamUrl 
      : `${upstreamUrl.replace(/\/$/, '')}/predict`;

    console.log(`Proxying request to: ${predictUrl}`);
    console.log(`File: ${file.name}, Size: ${file.size}, Type: ${mimeType}`);

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
