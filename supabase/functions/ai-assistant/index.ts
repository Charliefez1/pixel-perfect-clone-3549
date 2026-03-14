import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

import { getCorsHeaders } from "../_shared/cors.ts";
import { getAuthenticatedUser } from "../_shared/auth.ts";

const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;
const REQUEST_TIMEOUT_MS = 30_000;

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function getRateLimit(userId: string): { allowed: boolean; limit: number; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { allowed: true, limit: RATE_LIMIT, remaining: RATE_LIMIT - 1 };
  }
  entry.count++;
  const remaining = Math.max(0, RATE_LIMIT - entry.count);
  return { allowed: entry.count <= RATE_LIMIT, limit: RATE_LIMIT, remaining };
}

const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
});

const RequestSchema = z.object({
  messages: z.array(MessageSchema).min(1, "At least one message is required"),
  agent: z.enum(["pm", "insights", "clients", "setup", "business"]).optional().default("business"),
  context: z.record(z.unknown()).optional(),
});

const agentPrompts: Record<string, string> = {
  pm: `You are the NDG Project Management AI Assistant for Neurodiversity Global (NDG), a consultancy specialising in neurodiversity workshops, programmes, coaching, keynotes, and audits. You help with:
- Task prioritisation and deadline management
- Resource allocation across projects
- NEURO methodology phase tracking (Needs → Engage → Understand → Realise → Ongoing)
- Delivery logistics and scheduling
- Template suggestions for new projects (Small: 1-2 workshops, Medium: 3-10, Large: 10+)
Always use British English. Currency is GBP (£). Workshop types: Aware, Champion, Manager, Leader, Bespoke.`,

  insights: `You are the NDG Insights AI Assistant. You analyse delivery and finance data to provide:
- Delivery performance metrics and trends
- Client satisfaction trends from delivery scores
- Service type performance comparison
- Revenue tracking and invoice analytics
- Team utilisation and capacity insights
- Project phase progression analysis
Always use British English. Currency is GBP (£).`,

  clients: `You are the NDG Client Manager AI Assistant. You help manage active client relationships and answer questions about:
- Contacts and their details (job title, email, phone, organisation)
- Companies/organisations and their sectors
- Session history and upcoming meetings
- Relationship status and last interaction dates
- Contact lookup by name, company, or role
- Active contracts and delivery context
When answering, use the context data provided. Always use British English. Reference specific names, dates, and organisations in your answers.`,

  setup: `You are the NDG Project Setup AI. You receive a project plan, proposal, or brief and extract structured data to create a complete project.

Return ONLY valid JSON with this exact structure:
{
  "project": {
    "name": "string",
    "description": "string",
    "service_type": "workshop|programme|coaching|keynote|audit|sera_pilot",
    "neuro_phase": "needs",
    "status": "setup",
    "budget": number_in_GBP,
    "start_date": "YYYY-MM-DD",
    "end_date": "YYYY-MM-DD"
  },
  "client_name": "string (organisation name)",
  "tasks": [
    {
      "title": "string",
      "description": "string",
      "priority": "critical|high|medium|low",
      "status": "todo",
      "due_date": "YYYY-MM-DD"
    }
  ],
  "deliveries": [
    {
      "title": "string",
      "delivery_date": "YYYY-MM-DD",
      "status": "planning",
      "notes": "string"
    }
  ],
  "milestones": [
    {
      "title": "string",
      "target_date": "YYYY-MM-DD",
      "description": "string"
    }
  ]
}

Workshop types: Aware, Champion, Manager, Leader, Bespoke.
Always use British English. Currency is GBP.

Default task structure for a typical workshop delivery:
- Prep: Materials preparation, slide customisation, pre-session survey sent
- Delivery: Facilitator briefing, workshop delivery, AV setup
- Follow-up: Feedback collection, impact report drafting, follow-up email
- Admin: Contract signed, PO received, invoice created and sent

For programmes (multiple workshops), create tasks per workshop session.
Set realistic due dates based on delivery dates — prep tasks 2 weeks before, follow-up tasks 1 week after each delivery.`,

  business: `You are the NDG Business Manager AI, the senior strategic advisor for Neurodiversity Global. You synthesise insights from project management, delivery, and finance to provide:
- Overall business health assessment
- Strategic recommendations for growth
- Risk identification and mitigation
- Resource and capacity planning
- Client relationship strategy
You have access to all company data. Always use British English. Be concise and actionable.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    // Verify authentication
    const { user } = await getAuthenticatedUser(req);

    // Rate limiting
    const rl = getRateLimit(user.id);
    const rateLimitHeaders = {
      "X-RateLimit-Limit": String(rl.limit),
      "X-RateLimit-Remaining": String(rl.remaining),
    };

    if (!rl.allowed) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again shortly.", code: "RATE_LIMIT_EXCEEDED" }),
        {
          status: 429,
          headers: { ...getCorsHeaders(req), ...rateLimitHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate request body
    const rawBody = await req.json();
    const parseResult = RequestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({
          error: parseResult.error.issues.map((i) => i.message).join("; "),
          code: "VALIDATION_ERROR",
        }),
        {
          status: 400,
          headers: { ...getCorsHeaders(req), ...rateLimitHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { messages, agent, context } = parseResult.data;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY is not configured", code: "CONFIG_ERROR" }),
        {
          status: 500,
          headers: { ...getCorsHeaders(req), ...rateLimitHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const systemPrompt = agentPrompts[agent] || agentPrompts.business;

    // Build context-enriched system prompt
    let enrichedPrompt = systemPrompt;
    if (context) {
      enrichedPrompt += `\n\nCurrent context:\n${JSON.stringify(context, null, 2)}`;
    }

    // Request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
        signal: controller.signal,
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof DOMException && fetchError.name === "AbortError") {
        return new Response(
          JSON.stringify({ error: "Request to AI gateway timed out", code: "TIMEOUT" }),
          {
            status: 504,
            headers: { ...getCorsHeaders(req), ...rateLimitHeaders, "Content-Type": "application/json" },
          }
        );
      }
      throw fetchError;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again shortly.", code: "UPSTREAM_RATE_LIMIT" }),
          {
            status: 429,
            headers: { ...getCorsHeaders(req), ...rateLimitHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please top up in workspace settings.", code: "CREDITS_EXHAUSTED" }),
          {
            status: 402,
            headers: { ...getCorsHeaders(req), ...rateLimitHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(
        JSON.stringify({ error: "AI gateway error", code: "UPSTREAM_ERROR" }),
        {
          status: 500,
          headers: { ...getCorsHeaders(req), ...rateLimitHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(response.body, {
      headers: { ...getCorsHeaders(req), ...rateLimitHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-assistant error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error", code: "INTERNAL_ERROR" }),
      {
        status: 500,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      }
    );
  }
});
