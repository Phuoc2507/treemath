import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Trusted origins for CORS
const ALLOWED_ORIGINS = [
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

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20; // 20 messages per minute per IP

const systemPrompt = `Bạn là trợ lý AI chuyên hướng dẫn đo đạc cây xanh cho học sinh Việt Nam. 

🎯 NHIỆM VỤ CHÍNH:
1. Hướng dẫn đo CHIỀU CAO cây bằng các phương pháp:
   - Phương pháp giác kế (clinometer): Đo góc từ mắt đến ngọn cây, tính chiều cao = khoảng cách × tan(góc) + chiều cao người đo
   - Phương pháp bóng: So sánh bóng cây với bóng của vật có chiều cao biết trước
   - Phương pháp que: Dùng que dài cầm trước mặt, điều chỉnh khoảng cách để que bằng chiều cao cây
   - Dùng app điện thoại: Các app đo chiều cao như Measure, AR Ruler

2. Hướng dẫn đo CHU VI thân cây:
   - Đo bằng thước dây quấn quanh thân cây
   - QUAN TRỌNG: Đo ở độ cao 1.3 mét từ mặt đất (đường kính ngang ngực - DBH)
   - Đo vuông góc với thân cây, không xoắn thước

3. Công thức tính ĐƯỜNG KÍNH:
   - Đường kính = Chu vi ÷ π (≈ 3.14159)
   - Ví dụ: Chu vi 100cm → Đường kính ≈ 31.8cm

📝 QUY TẮC TRẢ LỜI:
- Trả lời ngắn gọn, dễ hiểu, phù hợp với học sinh
- Sử dụng emoji để sinh động 🌳📏🎯
- Mỗi bước hướng dẫn rõ ràng, có đánh số
- Đưa ra tips để đo chính xác hơn
- Nếu hỏi ngoài chủ đề, nhẹ nhàng dẫn về đo cây

💡 VÍ DỤ CÁCH TRẢ LỜI:
Nếu hỏi "Làm sao đo chiều cao cây?", trả lời:
"🌳 Có nhiều cách đo chiều cao cây! Cách đơn giản nhất cho học sinh:

**Phương pháp bóng:**
1️⃣ Chọn lúc trời nắng, cây có bóng rõ
2️⃣ Đo chiều dài bóng cây (L_bóng)
3️⃣ Cắm 1 cây que có chiều cao biết trước (h_que)
4️⃣ Đo chiều dài bóng que (l_bóng)
5️⃣ Tính: Chiều cao cây = h_que × L_bóng ÷ l_bóng

📌 Tip: Đo nhanh khi bóng ít thay đổi!"`;

async function checkRateLimit(clientIp: string): Promise<{ allowed: boolean; currentCount: number }> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Supabase credentials not configured for rate limiting");
    // Allow request if rate limiting is not configured
    return { allowed: true, currentCount: 0 };
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const windowStart = new Date(
    Math.floor(Date.now() / RATE_LIMIT_WINDOW_MS) * RATE_LIMIT_WINDOW_MS
  ).toISOString();
  
  try {
    // Check current count
    const { data: rateLimitData, error: selectError } = await supabase
      .from('request_rate_limits')
      .select('count')
      .eq('ip', clientIp)
      .eq('action', 'tree_chat')
      .eq('window_start', windowStart)
      .maybeSingle();
    
    if (selectError) {
      console.error("Rate limit check error:", selectError);
      return { allowed: true, currentCount: 0 };
    }
    
    const currentCount = rateLimitData?.count || 0;
    
    if (currentCount >= MAX_REQUESTS_PER_WINDOW) {
      console.log(`[tree-measurement-chat] Rate limit exceeded for IP ${clientIp}: ${currentCount}/${MAX_REQUESTS_PER_WINDOW}`);
      return { allowed: false, currentCount };
    }
    
    // Update counter
    const { error: upsertError } = await supabase
      .from('request_rate_limits')
      .upsert({
        ip: clientIp,
        action: 'tree_chat',
        window_start: windowStart,
        count: currentCount + 1,
      }, { onConflict: 'ip,action,window_start' });
    
    if (upsertError) {
      console.error("Rate limit update error:", upsertError);
    }
    
    console.log(`[tree-measurement-chat] Rate limit for IP ${clientIp}: ${currentCount + 1}/${MAX_REQUESTS_PER_WINDOW}`);
    return { allowed: true, currentCount: currentCount + 1 };
  } catch (error) {
    console.error("Rate limit error:", error);
    return { allowed: true, currentCount: 0 };
  }
}

serve(async (req) => {
  const origin = req.headers.get('origin') || '';
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP for rate limiting
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    
    console.log(`[tree-measurement-chat] Request from IP: ${clientIp}, Origin: ${origin}`);
    
    // Check rate limit
    const { allowed, currentCount } = await checkRateLimit(clientIp);
    
    if (!allowed) {
      return new Response(
        JSON.stringify({ error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`[tree-measurement-chat] Sending request to Lovable AI with ${messages.length} messages`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Đã vượt quá giới hạn, vui lòng thử lại sau." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Cần nạp thêm credits để sử dụng." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "Lỗi AI, vui lòng thử lại." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[tree-measurement-chat] Streaming response from AI gateway");
    
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Error in tree-measurement-chat function:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
