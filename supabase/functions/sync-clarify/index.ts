import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { companies, contacts, meetings } = await req.json();
    const results = { companies: 0, contacts: 0, meetings: 0, errors: [] as string[] };

    // --- Sync Companies → Organisations ---
    if (companies?.length) {
      for (const c of companies) {
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
      const companyIds = [...new Set(contacts.map((p: any) => p.company_id).filter(Boolean))];
      const companyNameMap: Record<string, string> = {};

      // If company names provided in payload
      for (const p of contacts) {
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

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("sync-clarify error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
