import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

import { getCorsHeaders } from "../_shared/cors.ts";
import { getAuthenticatedUser, createServiceClient } from "../_shared/auth.ts";

const REQUEST_TIMEOUT_MS = 30_000;

const CompanySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  domains: z.object({
    items: z.array(z.string()).optional(),
  }).optional(),
  categories: z.object({
    items: z.array(z.string()).optional(),
  }).optional(),
});

const ContactSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email_addresses: z.object({
    items: z.array(z.string()).optional(),
  }).optional(),
  phone_numbers: z.object({
    items: z.array(z.string()).optional(),
  }).optional(),
  company_name: z.string().optional(),
  company_id: z.string().optional(),
  job_title: z.string().optional(),
  linkedin: z.string().optional(),
  last_interaction: z.string().optional(),
});

const MeetingSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  start: z.string().min(1, "Meeting start date is required"),
  company_name: z.string().optional(),
});

const RequestSchema = z.object({
  companies: z.array(CompanySchema).optional(),
  contacts: z.array(ContactSchema).optional(),
  meetings: z.array(MeetingSchema).optional(),
}).refine(
  (data) => data.companies?.length || data.contacts?.length || data.meetings?.length,
  { message: "At least one of companies, contacts, or meetings must be provided" }
);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    const { user } = await getAuthenticatedUser(req);

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
          headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        }
      );
    }

    const { companies, contacts, meetings } = parseResult.data;
    const supabase = createServiceClient();
    const results = { companies: 0, contacts: 0, meetings: 0, errors: [] as string[] };

    // Set up request timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      // --- Sync Companies → Organisations ---
      if (companies?.length) {
        for (const c of companies) {
          if (controller.signal.aborted) throw new DOMException("Request timed out", "AbortError");

          const website = c.domains?.items?.[0] ? `https://${c.domains.items[0]}` : null;
          const sector = c.categories?.items?.[0] || null;

          const { data: existing } = await supabase
            .from("organisations")
            .select("id")
            .ilike("name", c.name)
            .maybeSingle();

          if (existing) {
            await supabase.from("organisations").update({
              website: website || undefined,
              sector: sector || undefined,
            }).eq("id", existing.id);
          } else {
            const { error } = await supabase.from("organisations").insert({
              name: c.name,
              website,
              sector,
            });
            if (error) {
              results.errors.push(`Org "${c.name}": ${error.message}`);
              continue;
            }
          }
          results.companies++;
        }
      }

      // --- Sync Persons → Contacts ---
      if (contacts?.length) {
        // Pre-fetch org lookup by name for company_id mapping
        const companyNameMap: Record<string, string> = {};

        for (const p of contacts) {
          if (controller.signal.aborted) throw new DOMException("Request timed out", "AbortError");

          if (!p.first_name && !p.last_name) continue;
          const email = p.email_addresses?.items?.[0] || null;
          const phone = p.phone_numbers?.items?.[0] || null;

          // Try to find org by company_name (provided in payload)
          let orgId: string | null = null;
          if (p.company_name) {
            if (!companyNameMap[p.company_name]) {
              const { data: org } = await supabase
                .from("organisations")
                .select("id")
                .ilike("name", p.company_name)
                .maybeSingle();
              if (org) companyNameMap[p.company_name] = org.id;
            }
            orgId = companyNameMap[p.company_name] || null;
          }

          // Match by email
          let existing = null;
          if (email) {
            const { data } = await supabase
              .from("contacts")
              .select("id")
              .eq("email", email)
              .maybeSingle();
            existing = data;
          }

          if (existing) {
            await supabase.from("contacts").update({
              job_title: p.job_title || undefined,
              linkedin_url: p.linkedin ? `https://linkedin.com/in/${p.linkedin}` : undefined,
              phone: phone || undefined,
              organisation_id: orgId || undefined,
              last_contacted: p.last_interaction || undefined,
            }).eq("id", existing.id);
          } else {
            const { error } = await supabase.from("contacts").insert({
              first_name: p.first_name || "Unknown",
              last_name: p.last_name || "Unknown",
              email,
              phone,
              job_title: p.job_title || null,
              linkedin_url: p.linkedin ? `https://linkedin.com/in/${p.linkedin}` : null,
              organisation_id: orgId,
              last_contacted: p.last_interaction || null,
            });
            if (error) {
              results.errors.push(`Contact "${p.first_name} ${p.last_name}": ${error.message}`);
              continue;
            }
          }
          results.contacts++;
        }
      }

      // --- Sync Meetings → Activities ---
      if (meetings?.length) {
        for (const m of meetings) {
          if (controller.signal.aborted) throw new DOMException("Request timed out", "AbortError");

          // Deduplicate by subject + date
          const { data: existing } = await supabase
            .from("activities")
            .select("id")
            .eq("type", "meeting")
            .eq("subject", m.title || "Untitled Meeting")
            .eq("activity_date", m.start)
            .maybeSingle();

          if (!existing) {
            // Try to find linked org by company_name
            let orgId: string | null = null;
            if (m.company_name) {
              const { data: org } = await supabase
                .from("organisations")
                .select("id")
                .ilike("name", m.company_name)
                .maybeSingle();
              orgId = org?.id || null;
            }

            const { error } = await supabase.from("activities").insert({
              type: "meeting",
              subject: m.title || "Untitled Meeting",
              body: m.description ? m.description.substring(0, 500) : null,
              activity_date: m.start,
              source: "clarify",
              organisation_id: orgId,
            });
            if (error) {
              results.errors.push(`Meeting "${m.title}": ${error.message}`);
              continue;
            }
          }
          results.meetings++;
        }
      }
    } finally {
      clearTimeout(timeoutId);
    }

    return new Response(JSON.stringify(results), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("sync-clarify error:", e);

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
