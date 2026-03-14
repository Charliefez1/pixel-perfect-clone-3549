import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { getCorsHeaders } from "../_shared/cors.ts";
import { getAuthenticatedUser } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    // Verify authentication
    const { user } = await getAuthenticatedUser(req);

    const { invoice_id } = await req.json();
    if (!invoice_id) throw new Error("invoice_id is required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch invoice with org, project, and line items
    const { data: invoice, error: invError } = await supabase
      .from("invoices")
      .select("*, organisations(name, address, vat_number), projects(name), invoice_items(*)")
      .eq("id", invoice_id)
      .single();

    if (invError || !invoice) throw new Error(invError?.message || "Invoice not found");

    const items = invoice.invoice_items || [];
    const orgName = invoice.organisations?.name || "—";
    const orgAddress = invoice.organisations?.address || "";
    const projectName = invoice.projects?.name || "";

    const formatDate = (d: string | null) => {
      if (!d) return "—";
      const date = new Date(d);
      return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
    };

    const formatCurrency = (v: number | null) => `£${(v || 0).toLocaleString("en-GB", { minimumFractionDigits: 2 })}`;

    const itemRows = items.map((item: any) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:13px;">${item.description}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:13px;text-align:right;">${item.quantity || 1}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:13px;text-align:right;">${formatCurrency(item.unit_price)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:13px;text-align:right;">${formatCurrency(item.total)}</td>
      </tr>
    `).join("");

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Invoice ${invoice.invoice_number}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px; color: #1a1a1a; max-width: 800px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
  .brand { font-size: 24px; font-weight: 700; color: #0066cc; }
  .brand-sub { font-size: 12px; color: #666; margin-top: 4px; }
  .meta { text-align: right; }
  .meta h2 { font-size: 28px; color: #333; margin: 0; }
  .meta p { font-size: 12px; color: #666; margin: 2px 0; }
  .parties { display: flex; justify-content: space-between; margin-bottom: 30px; }
  .party h4 { font-size: 11px; text-transform: uppercase; color: #999; margin: 0 0 4px; letter-spacing: 0.5px; }
  .party p { margin: 2px 0; font-size: 13px; }
  table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  th { background: #f5f5f5; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; color: #666; border-bottom: 2px solid #ddd; }
  th.right { text-align: right; }
  .totals { display: flex; justify-content: flex-end; margin-top: 20px; }
  .totals-table { width: 250px; }
  .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
  .totals-row.total { font-weight: 700; font-size: 16px; border-top: 2px solid #333; padding-top: 10px; margin-top: 4px; }
  .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 11px; color: #999; }
  @media print { body { padding: 0; } }
</style></head><body>
  <div class="header">
    <div>
      <div class="brand">NDG</div>
      <div class="brand-sub">Neuroscience Development Group</div>
    </div>
    <div class="meta">
      <h2>INVOICE</h2>
      <p>${invoice.invoice_number}</p>
    </div>
  </div>

  <div class="parties">
    <div class="party">
      <h4>Bill To</h4>
      <p style="font-weight:600;">${orgName}</p>
      ${orgAddress ? `<p>${orgAddress}</p>` : ""}
    </div>
    <div class="party" style="text-align:right;">
      <p>Issue: ${formatDate(invoice.issue_date)}</p>
      <p>Due: ${formatDate(invoice.due_date)}</p>
      ${projectName ? `<p>Project: ${projectName}</p>` : ""}
    </div>
  </div>

  ${items.length > 0 ? `
  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th class="right">Qty</th>
        <th class="right">Unit Price</th>
        <th class="right">Total</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>
  ` : ""}

  <div class="totals">
    <div class="totals-table">
      <div class="totals-row"><span>Subtotal</span><span>${formatCurrency(invoice.subtotal)}</span></div>
      <div class="totals-row"><span>VAT (${invoice.vat_rate || 20}%)</span><span>${formatCurrency(invoice.vat_amount)}</span></div>
      <div class="totals-row total"><span>Total</span><span>${formatCurrency(invoice.total)}</span></div>
    </div>
  </div>

  <div class="footer">
    <p>Payment Terms: Net 30 days</p>
    <p>Bank: Neuroscience Development Group Ltd</p>
    ${invoice.notes ? `<p>Notes: ${invoice.notes}</p>` : ""}
  </div>
</body></html>`;

    return new Response(html, {
      headers: {
        ...getCorsHeaders(req),
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="Invoice-${invoice.invoice_number}.html"`,
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
