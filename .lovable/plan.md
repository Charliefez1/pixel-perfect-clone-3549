

# CRM Integration Plan: Clarify → NDG Hub

## What We're Building

Three capabilities connecting your Clarify CRM to the Hub:

### 1. Sync Contacts & Companies
An edge function `sync-clarify` that pulls companies and people from Clarify into the Hub's `organisations` and `contacts` tables. It will:
- Query Clarify for all companies and persons using the MCP tools at build time, but at runtime use the Clarify MCP query tool via a dedicated edge function
- Match by email/domain to avoid duplicates
- Create or update organisations (mapping: name, website from domains, sector from categories, linkedin)
- Create or update contacts (mapping: first_name, last_name, email, phone, job_title, linkedin_url, organisation_id, last_contacted from last_interaction)
- Add a "Sync CRM" button on the Dashboard (next to existing "Sync Gmail")

**Approach:** Create an edge function `sync-clarify/index.ts` that uses the Clarify Postgres query interface (via direct SQL queries against the Clarify database through a proxy edge function pattern). Since the Clarify MCP tools are agent-only, the runtime sync will instead query Clarify data through the agent at build time and we'll build a webhook-based or manual-trigger approach.

**Revised approach:** Since MCP tools are agent-only (not callable from edge functions), the sync will work as follows:
- I'll use the Clarify `query-data` tool now to pull your current companies and contacts
- Insert them into the Hub database
- For ongoing sync, create an n8n workflow that periodically queries Clarify's API and calls a Hub edge function to upsert records

### 2. Sync Meeting Activity
- Query Clarify meetings with person/company associations
- Insert into the Hub's `activities` table as type "meeting" with subject, date, and linked contact/organisation
- Deduplicate by meeting title + date (same pattern as Gmail sync)

### 3. Query CRM Data On Demand
- Enhance the AI Chat Panel to include a "CRM" agent mode
- When in CRM mode, the AI assistant edge function will receive queries and can return CRM insights
- At runtime, this will query the Hub's synced data (after sync) rather than calling Clarify directly

## Implementation Steps

1. **Run initial data sync** -- Use Clarify MCP tools right now to pull companies, persons, and recent meetings, then insert them into the Hub database
2. **Add "Sync CRM" button** to Dashboard that triggers re-sync
3. **Create `sync-clarify` edge function** that accepts POST data from n8n (companies/contacts/meetings payload) and upserts into Hub tables
4. **Add CRM agent to AI Chat Panel** for querying synced CRM data
5. **Wire n8n scheduled workflow** to periodically push Clarify data to the sync endpoint

## Technical Details

- Matching logic: Companies matched by name (case-insensitive), contacts matched by email
- New fields won't be added to existing tables -- we'll map to what already exists
- The edge function will use service role key for upserts
- No schema changes needed -- existing tables cover all mapped fields

