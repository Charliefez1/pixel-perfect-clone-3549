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
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

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

    const formatCurrency = (v: number | null) => `£${(v || 0).toLocaleString("en-GB", { minimumFractionDigits: 2 })}`;
    const formatDate = (d: string | null) => {
      if (!d) return "—";
      const date = new Date(d);
      return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
    };

    const itemRows = items.map((item: any) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px;">${item.description}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px;text-align:right;">${item.quantity || 1}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px;text-align:right;">${formatCurrency(item.unit_price)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px;text-align:right;">${formatCurrency(item.total)}</td>
      </tr>
    `).join("");

    const emailHtml = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
      <div style="padding:30px;background:#f8f9fa;border-radius:8px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:24px;">
          <div>
            <div style="font-size:20px;font-weight:700;color:#0066cc;">NDG</div>
            <div style="font-size:11px;color:#666;">Neuroscience Development Group</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:20px;font-weight:700;">INVOICE</div>
            <div style="font-size:13px;color:#666;">${invoice.invoice_number}</div>
          </div>
        </div>

        <p style="font-size:14px;">Dear ${orgName},</p>
        <p style="font-size:14px;color:#555;">Please find your invoice details below. Payment is due by <strong>${formatDate(invoice.due_date)}</strong>.</p>

        ${items.length > 0 ? `
        <table style="width:100%;border-collapse:collapse;margin:20px 0;">
          <thead>
            <tr style="background:#e9ecef;">
              <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#666;">Description</th>
              <th style="padding:8px 12px;text-align:right;font-size:11px;text-transform:uppercase;color:#666;">Qty</th>
              <th style="padding:8px 12px;text-align:right;font-size:11px;text-transform:uppercase;color:#666;">Unit Price</th>
              <th style="padding:8px 12px;text-align:right;font-size:11px;text-transform:uppercase;color:#666;">Total</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
        ` : ""}

        <div style="text-align:right;margin-top:16px;">
          <div style="font-size:13px;color:#666;">Subtotal: ${formatCurrency(invoice.subtotal)}</div>
          <div style="font-size:13px;color:#666;">VAT (${invoice.vat_rate || 20}%): ${formatCurrency(invoice.vat_amount)}</div>
          <div style="font-size:18px;font-weight:700;margin-top:8px;padding-top:8px;border-top:2px solid #333;">
            Total: ${formatCurrency(invoice.total)}
          </div>
        </div>

        <div style="margin-top:24px;padding-top:16px;border-top:1px solid #ddd;font-size:12px;color:#999;">
          <p>Payment Terms: Net 30 days</p>
          <p>Bank: Neuroscience Development Group Ltd</p>
          ${invoice.notes ? `<p>Notes: ${invoice.notes}</p>` : ""}
        </div>
      </div>
    </div>`;

    // Send via Resend
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "NDG Invoicing <invoices@ndg.co.uk>",
        to: [recipientEmail],
        subject: `Invoice ${invoice.invoice_number} from Neuroscience Development Group`,
        html: emailHtml,
      }),
    });

    const resendData = await resendRes.json();
    if (!resendRes.ok) throw new Error(`Resend error: ${JSON.stringify(resendData)}`);

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
      action: "emailed",
      metadata: { to: recipientEmail },
    });

    return new Response(
      JSON.stringify({ success: true, message: `Invoice emailed to ${recipientEmail}`, resend_id: resendData.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
