import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

import { getCorsHeaders } from "../_shared/cors.ts";
import { getAuthenticatedUser, createServiceClient } from "../_shared/auth.ts";

const REQUEST_TIMEOUT_MS = 30_000;

// No request body fields expected; this function is triggered without a body
const RequestSchema = z.object({}).optional();

async function getAccessToken(signal?: AbortSignal): Promise<string> {
  const clientId = Deno.env.get("GMAIL_CLIENT_ID")!;
  const clientSecret = Deno.env.get("GMAIL_CLIENT_SECRET")!;
  const refreshToken = Deno.env.get("GMAIL_REFRESH_TOKEN")!;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
    signal,
  });

  const data = await response.json();
  if (!data.access_token) throw new Error("Failed to refresh Gmail token");
  return data.access_token;
}

async function fetchRecentEmails(accessToken: string, hoursBack: number = 24, signal?: AbortSignal) {
  const after = Math.floor((Date.now() - hoursBack * 60 * 60 * 1000) / 1000);
  const query = encodeURIComponent(`after:${after}`);
  const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=50`;

  const listRes = await fetch(listUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal,
  });
  const listData = await listRes.json();

  if (!listData.messages) return [];

  const emails = [];
  for (const msg of listData.messages.slice(0, 50)) {
    const msgUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date`;
    const msgRes = await fetch(msgUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal,
    });
    const msgData = await msgRes.json();

    const headers = msgData.payload?.headers || [];
    const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || "";

    emails.push({
      id: msg.id,
      from: getHeader("From"),
      to: getHeader("To"),
      subject: getHeader("Subject"),
      date: getHeader("Date"),
      snippet: msgData.snippet || "",
    });
  }

  return emails;
}

function extractEmail(headerValue: string): string | null {
  const match = headerValue.match(/<([^>]+)>/) || headerValue.match(/([^\s,]+@[^\s,]+)/);
  return match ? match[1].toLowerCase() : null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    const { user } = await getAuthenticatedUser(req);

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

    const supabase = createServiceClient();

    // Get all contact emails for matching
    const { data: contacts } = await supabase
      .from("contacts")
      .select("id, email, organisation_id")
      .not("email", "is", null);

    const contactMap = new Map<string, { id: string; organisation_id: string | null }>();
    for (const c of contacts || []) {
      if (c.email) contactMap.set(c.email.toLowerCase(), { id: c.id, organisation_id: c.organisation_id });
    }

    // Our email address(es) to identify sent vs received — loaded from OUR_EMAILS secret (comma-separated)
    const ourEmailsRaw = Deno.env.get("OUR_EMAILS") || "";
    const ourEmails = new Set(ourEmailsRaw.split(",").map(e => e.trim().toLowerCase()).filter(Boolean));

    // Set up request timeout for external API calls
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let accessToken: string;
    let emails: any[];

    try {
      accessToken = await getAccessToken(controller.signal);
      emails = await fetchRecentEmails(accessToken, 24, controller.signal);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof DOMException && fetchError.name === "AbortError") {
        return new Response(
          JSON.stringify({ error: "Request to Gmail API timed out", code: "TIMEOUT" }),
          {
            status: 504,
            headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
          }
        );
      }
      throw fetchError;
    } finally {
      clearTimeout(timeoutId);
    }

    let synced = 0;
    let skipped = 0;

    for (const email of emails) {
      const fromEmail = extractEmail(email.from);
      const toEmail = extractEmail(email.to);
      if (!fromEmail && !toEmail) { skipped++; continue; }

      const isSent = fromEmail ? ourEmails.has(fromEmail) : false;
      const matchEmail = isSent ? toEmail : fromEmail;
      if (!matchEmail) { skipped++; continue; }

      const contact = contactMap.get(matchEmail);
      if (!contact) { skipped++; continue; }

      // Deduplicate
      const emailDate = new Date(email.date).toISOString();
      const { data: existing } = await supabase
        .from("activities")
        .select("id")
        .eq("contact_id", contact.id)
        .eq("subject", email.subject)
        .gte("activity_date", new Date(new Date(email.date).getTime() - 60000).toISOString())
        .lte("activity_date", new Date(new Date(email.date).getTime() + 60000).toISOString())
        .limit(1);

      if (existing && existing.length > 0) { skipped++; continue; }

      // Find most recent active deal for this org
      let dealId = null;
      if (contact.organisation_id) {
        const { data: deals } = await supabase
          .from("deals")
          .select("id")
          .eq("organisation_id", contact.organisation_id)
          .not("stage", "in", '("won","lost")')
          .order("updated_at", { ascending: false })
          .limit(1);
        if (deals && deals.length > 0) dealId = deals[0].id;
      }

      await supabase.from("activities").insert({
        type: isSent ? "email_sent" : "email_received",
        subject: email.subject,
        body: email.snippet.substring(0, 500),
        contact_id: contact.id,
        organisation_id: contact.organisation_id,
        deal_id: dealId,
        source: "gmail_sync",
        activity_date: emailDate,
      });

      await supabase
        .from("contacts")
        .update({ last_contacted: emailDate })
        .eq("id", contact.id);

      synced++;
    }

    return new Response(
      JSON.stringify({ success: true, synced, skipped, total: emails.length }),
      { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("sync-gmail error:", e);

    if (e instanceof DOMException && e.name === "AbortError") {
      return new Response(
        JSON.stringify({ error: "Request timed out after 30 seconds", code: "TIMEOUT" }),
        {
          status: 504,
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error", code: "INTERNAL_ERROR" }),
      {
        status: 500,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      }
    );
  }
});
