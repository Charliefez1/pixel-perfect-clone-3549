import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

import { getCorsHeaders } from "../_shared/cors.ts";

// No request body expected for this cron function, but validate if one is provided
const RequestSchema = z.object({}).optional();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    // Validate request body if present
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
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
            headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
          }
        );
      }
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find invoices that are sent but past due date
    const today = new Date().toISOString().split("T")[0];
    const { data: overdueInvoices, error: fetchError } = await supabase
      .from("invoices")
      .select("id, invoice_number")
      .eq("status", "sent")
      .lt("due_date", today);

    if (fetchError) {
      return new Response(
        JSON.stringify({ error: fetchError.message, code: "DB_ERROR" }),
        {
          status: 500,
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        }
      );
    }

    if (!overdueInvoices || overdueInvoices.length === 0) {
      return new Response(JSON.stringify({ message: "No overdue invoices found" }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // Update all to overdue
    const ids = overdueInvoices.map((inv) => inv.id);
    const { error: updateError } = await supabase
      .from("invoices")
      .update({ status: "overdue" })
      .in("id", ids);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: updateError.message, code: "DB_UPDATE_ERROR" }),
        {
          status: 500,
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        }
      );
    }

    // Log activity for each
    const activityEntries = overdueInvoices.map((inv) => ({
      entity_type: "invoice",
      entity_id: inv.id,
      entity_title: inv.invoice_number,
      action: "marked_overdue",
      metadata: { auto: true },
    }));

    await supabase.from("activity_log").insert(activityEntries);

    return new Response(
      JSON.stringify({ message: `Marked ${ids.length} invoices as overdue` }),
      { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
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
