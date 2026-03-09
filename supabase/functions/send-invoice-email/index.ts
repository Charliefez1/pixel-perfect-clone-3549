import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invoice_id, to_email } = await req.json();
    if (!invoice_id) throw new Error("invoice_id is required");

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

    if (invError || !invoice) throw new Error(invError?.message || "Invoice not found");

    // Determine recipient
    const recipientEmail = to_email || invoice.organisations?.email;
    if (!recipientEmail) throw new Error("No recipient email. Provide to_email or set organisation email.");

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
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
