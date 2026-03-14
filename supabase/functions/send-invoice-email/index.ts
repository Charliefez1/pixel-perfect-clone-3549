import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

import { getCorsHeaders } from "../_shared/cors.ts";
import { getAuthenticatedUser, createServiceClient } from "../_shared/auth.ts";

const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;

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

const RequestSchema = z.object({
  invoice_id: z.string().uuid("invoice_id must be a valid UUID"),
  to_email: z.string().email("to_email must be a valid email address").optional(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
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

    const { invoice_id, to_email } = parseResult.data;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch invoice
    const { data: invoice, error: invError } = await supabase
      .from("invoices")
      .select("*, organisations(name, email), projects(name), invoice_items(*)")
      .eq("id", invoice_id)
      .single();

    if (invError || !invoice) {
      return new Response(
        JSON.stringify({ error: invError?.message || "Invoice not found", code: "NOT_FOUND" }),
        {
          status: 404,
          headers: { ...getCorsHeaders(req), ...rateLimitHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Determine recipient
    const recipientEmail = to_email || invoice.organisations?.email;
    if (!recipientEmail) {
      return new Response(
        JSON.stringify({ error: "No recipient email. Provide to_email or set organisation email.", code: "MISSING_RECIPIENT" }),
        {
          status: 400,
          headers: { ...getCorsHeaders(req), ...rateLimitHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const orgName = invoice.organisations?.name || "Client";
    const items = invoice.invoice_items || [];

    // Update invoice status to sent if still draft
    if (invoice.status === "draft") {
      await supabase
        .from("invoices")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", invoice_id);
    }

    // Log activity
    await supabase.from("activity_log").insert({
      entity_type: "invoice",
      entity_id: invoice_id,
      entity_title: invoice.invoice_number,
      action: "marked_sent",
      metadata: { to: recipientEmail },
    });

    // Return invoice data for n8n or external email service to handle actual sending
    return new Response(
      JSON.stringify({
        success: true,
        message: `Invoice ${invoice.invoice_number} marked as sent. Email delivery handled externally.`,
        invoice_number: invoice.invoice_number,
        recipient_email: recipientEmail,
        organisation_name: orgName,
        total: invoice.total,
        subtotal: invoice.subtotal,
        vat_amount: invoice.vat_amount,
        vat_rate: invoice.vat_rate,
        due_date: invoice.due_date,
        issue_date: invoice.issue_date,
        notes: invoice.notes,
        items: items.map((item: any) => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.total,
        })),
      }),
      { headers: { ...getCorsHeaders(req), ...rateLimitHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message, code: "INTERNAL_ERROR" }),
      {
        status: 500,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      }
    );
  }
});
