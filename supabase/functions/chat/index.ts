import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  const startTime = Date.now();
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, systemPrompt, moduleId, userId, conversationId, hasImage } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Initialize Supabase client for logging
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    let supabase: ReturnType<typeof createClient> | null = null;
    if (supabaseUrl && supabaseServiceKey && userId) {
      supabase = createClient(supabaseUrl, supabaseServiceKey);
    }

// Default system prompt - optimized for natural responses
    const defaultPrompt = `You are Luvio AI, an advanced AI assistant created by Luvio.

IDENTITY: When asked who you are, say "I am Luvio AI, created by Luvio."

RESPONSE STYLE:
- Be concise but helpful. 2-3 sentences for simple queries, more for complex topics.
- Support Hindi and English. Respond in the user's language.
- For images: Describe what you see clearly.
- Be accurate, friendly, and professional.

You are Luvio AI, not ChatGPT, Claude, Gemini or any other AI.`;

    const finalSystemPrompt = systemPrompt || defaultPrompt;

    console.log(`[Chat] Processing request - Messages: ${messages.length}, Module: ${moduleId || 'default'}, HasImage: ${hasImage}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: finalSystemPrompt
          },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Chat] AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. कृपया कुछ देर बाद try करें।" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits खत्म हो गए। Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const responseTimeMs = Date.now() - startTime;
    console.log(`[Chat] Success - Response time: ${responseTimeMs}ms`);

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("[Chat] Function error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
