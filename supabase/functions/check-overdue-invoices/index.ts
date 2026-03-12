import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { getCorsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
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

    if (fetchError) throw fetchError;

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

    if (updateError) throw updateError;

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
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
