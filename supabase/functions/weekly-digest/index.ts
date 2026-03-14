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

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const today = now.toISOString().split("T")[0];

    // Get all admin users to send digest to
    const { data: admins } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("role", "admin");

    if (!admins || admins.length === 0) {
      return new Response(JSON.stringify({ message: "No admin users found" }), {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    // 1. Deals won this week
    const { data: dealsWon } = await supabase
      .from("deals")
      .select("title, value")
      .eq("stage", "won")
      .gte("updated_at", sevenDaysAgo);

    // 2. New deals created this week
    const { data: newDeals } = await supabase
      .from("deals")
      .select("title, value, stage")
      .gte("created_at", sevenDaysAgo);

    // 3. Overdue invoices
    const { data: overdueInvoices } = await supabase
      .from("invoices")
      .select("invoice_number, total")
      .eq("status", "overdue");

    // 4. Overdue tasks
    const { data: overdueTasks } = await supabase
      .from("tasks")
      .select("title")
      .in("status", ["todo", "in_progress"])
      .lt("due_date", today);

    // 5. Upcoming deliveries (next 7 days)
    const { data: upcomingDeliveries } = await supabase
      .from("deliveries")
      .select("title, delivery_date")
      .gte("delivery_date", today)
      .lte("delivery_date", sevenDaysFromNow)
      .neq("status", "complete");

    // Build digest message
    const lines: string[] = [];

    const wonCount = dealsWon?.length || 0;
    const wonValue = dealsWon?.reduce((s, d) => s + (Number(d.value) || 0), 0) || 0;
    if (wonCount > 0) lines.push(`🎉 ${wonCount} deal(s) won — £${wonValue.toLocaleString()}`);

    const newCount = newDeals?.length || 0;
    if (newCount > 0) lines.push(`📥 ${newCount} new deal(s) in pipeline`);

    const overdueInvCount = overdueInvoices?.length || 0;
    const overdueInvTotal = overdueInvoices?.reduce((s, i) => s + (Number(i.total) || 0), 0) || 0;
    if (overdueInvCount > 0) lines.push(`⚠️ ${overdueInvCount} overdue invoice(s) — £${overdueInvTotal.toLocaleString()}`);

    const overdueTaskCount = overdueTasks?.length || 0;
    if (overdueTaskCount > 0) lines.push(`📋 ${overdueTaskCount} overdue task(s)`);

    const deliveryCount = upcomingDeliveries?.length || 0;
    if (deliveryCount > 0) lines.push(`📅 ${deliveryCount} delivery/deliveries scheduled this week`);

    if (lines.length === 0) {
      lines.push("All clear — no notable activity this week.");
    }

    const message = lines.join("\n");

    // Insert notification for each admin
    const notifications = admins.map((a) => ({
      user_id: a.user_id,
      title: "📊 Weekly Digest",
      message,
      link: "/reporting",
    }));

    const { error: insertError } = await supabase.from("notifications").insert(notifications);
    if (insertError) {
      return new Response(
        JSON.stringify({ error: insertError.message, code: "DB_INSERT_ERROR" }),
        {
          status: 500,
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ message: `Digest sent to ${admins.length} admin(s)`, summary: message }),
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
