import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const agentPrompts: Record<string, string> = {
  sales: `You are the NDG Sales AI Assistant for Neurodiversity Global (NDG), a consultancy specialising in neurodiversity workshops, programmes, coaching, keynotes, and audits. Your role is to help with:
- Analysing deals and suggesting next actions
- Drafting follow-up emails and proposals
- Identifying cross-sell/upsell opportunities
- Advising on deal qualification and probability
- Providing insights on pipeline health
Always use British English. Currency is GBP (£). Workshop types: Aware, Champion, Manager, Leader, Bespoke.`,

  pm: `You are the NDG Project Management AI Assistant. You help with:
- Task prioritisation and deadline management
- Resource allocation across projects
- NEURO methodology phase tracking (Needs → Engage → Understand → Realise → Ongoing)
- Delivery logistics and scheduling
- Template suggestions for new projects (Small: 1-2 workshops, Medium: 3-10, Large: 10+)
Always use British English.`,

  insights: `You are the NDG Insights AI Assistant. You analyse data to provide:
- Pipeline analytics and revenue forecasting
- Client satisfaction trends from delivery scores
- Service type performance comparison
- Conversion rate analysis by stage
- Team utilisation and capacity insights
Always use British English. Currency is GBP (£).`,

  business: `You are the NDG Business Manager AI, the senior strategic advisor for Neurodiversity Global. You synthesise insights from sales, project management, and analytics to provide:
- Overall business health assessment
- Strategic recommendations for growth
- Risk identification and mitigation
- Resource and capacity planning
- Client relationship strategy
You have access to all company data. Always use British English. Be concise and actionable.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, agent = "business", context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = agentPrompts[agent] || agentPrompts.business;

    // Build context-enriched system prompt
    let enrichedPrompt = systemPrompt;
    if (context) {
      enrichedPrompt += `\n\nCurrent context:\n${JSON.stringify(context, null, 2)}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: enrichedPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please top up in workspace settings." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
