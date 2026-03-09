

# NDG Hub — Full Repository Audit Report

---

## 1. Project Summary

NDG Hub is an internal business management platform for **Neurodiversity Global (NDG)**, a consultancy delivering neurodiversity workshops, programmes, coaching, keynotes, and audits. It is a React + TypeScript SPA (Vite, Tailwind, shadcn/ui) backed by Lovable Cloud (Supabase). It covers: project management with a proprietary NEURO methodology, CRM (clients/contacts), deals pipeline, delivery tracking, invoicing, contracts, purchase orders, time tracking, forms/surveys, scheduling, AI assistant, Gmail sync, and reporting.

---

## 2. Critical Risks

| # | Risk | Severity |
|---|------|----------|
| 1 | **Hardcoded employee emails** in `supabase/functions/sync-gmail/index.ts` line 93 — `charlie@neurodiversityglobal.com`, `rich@neurodiversityglobal.com` | HIGH |
| 2 | **Hardcoded employee names** in `src/pages/Resourcing.tsx` line 12-16 — "Charlie", "Rich" with roles | MEDIUM |
| 3 | **Hardcoded placeholder email** in `src/pages/Auth.tsx` line 81 — `charlie@ndggroup.co.uk` | LOW |
| 4 | **Timer bug** in `TimeTracking.tsx` line 48 — `useState(() => {...})` used as `useEffect`. The cleanup function is returned as the initial state value, not as a cleanup. The interval runs forever and is never cleared. Timer display won't update because `timerStart` is captured at mount time (stale closure). | CRITICAL |
| 5 | **.env file is committed** and not in `.gitignore` — contains Supabase URL and anon key. While the anon key is publishable, the `.env` file itself should be gitignored as a best practice. | LOW |
| 6 | **No Deals or Proposals pages** — routes missing despite full database schema, hooks, and triggers existing. Core sales pipeline is inaccessible. | HIGH |

---

## 3. Security and Secrets Check

**Committed secrets:**
- `.env` — Contains `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`. These are publishable keys, so not a security breach. However, `.env` is not in `.gitignore`.

**Edge function secrets (properly stored in Supabase secrets):**
- `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN` — referenced in `sync-gmail/index.ts`, stored as Supabase secrets (not in code). Correct.
- `LOVABLE_API_KEY`, `N8N_API_KEY`, `ELEVENLABS_API_KEY`, `FIRECRAWL_API_KEY`, `PERPLEXITY_API_KEY` — all stored as secrets. Correct.

**`.gitignore` gaps:**
- Missing: `.env`, `.env.local`, `.env.production`, `.env*.local`
- Missing: `supabase/.temp/` (Supabase CLI temp files)

**RLS:** Security uses a proper `has_role` security definer function. RLS is enforced on data tables requiring `admin` role. This is sound.

**Verdict:** No leaked secrets. Minor `.gitignore` improvement needed.

---

## 4. Public Repo Safety

**Not safe to publish as-is.** Reasons:

1. **Hardcoded employee emails** (`charlie@neurodiversityglobal.com`, `rich@neurodiversityglobal.com`) in `sync-gmail/index.ts`
2. **Hardcoded employee names** ("Charlie", "Rich") in `Resourcing.tsx`
3. **Placeholder email** `charlie@ndggroup.co.uk` in Auth page
4. **AI system prompts** in `ai-assistant/index.ts` expose detailed internal methodology (NEURO phases), business structure, pricing approach, workshop types, and operational processes
5. **Business-specific triggers** reveal internal workflows (deal-won auto-creates delivery, proposal-accepted auto-creates contract, contract-signed auto-creates invoice with NDG invoice numbering)

**Action required:** Move hardcoded emails to env/secrets, genericise or remove AI prompts, remove personal names from code before making public.

---

## 5. Codebase Health

**Structure:** Clean and logical. `src/pages/`, `src/hooks/`, `src/components/` separation is consistent. Edge functions are well-organised.

**Good patterns:**
- TanStack Query hooks per entity with consistent CRUD pattern
- Centralised dialog management via React Context (`DialogContext`)
- Keyboard shortcuts and command palette
- Activity logging pattern

**Problems:**

| Issue | Location |
|-------|----------|
| **312 `as any` casts** across 25 files | Widespread — indicates type schema is out of sync with actual DB columns |
| **Dead page:** `src/pages/Index.tsx` — boilerplate, not routed | `Index.tsx` |
| **No Deals page** — hook exists, no route/page | `App.tsx` missing `/deals` |
| **No Proposals page** — hook exists, no route/page | `App.tsx` missing `/proposals` |
| **Sidebar label mismatch:** "Sessions" link goes to `/meetings` | `AppSidebar.tsx` line 39 |
| **Duplicate icon:** Deliveries and Projects both use `FolderKanban` | `AppSidebar.tsx` lines 28-29 |
| **Missing sidebar links:** Time Tracking, Timesheets, Resourcing, Scheduling, Notifications, Rate Cards, Deals, Proposals | `AppSidebar.tsx` |
| **Unused imports/components likely exist** due to rapid iteration | Various |

---

## 6. Deployment Readiness

**Build-blocking issues:**
- Previous TS errors were patched with `as any` casts, which mask real type mismatches. The build will succeed but the type safety is compromised.
- `deno.lock` was created empty — edge functions may have dependency resolution issues on first deploy.

**Non-blocking but risky:**
- `sync-gmail` function references `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN` — these secrets are listed in the secrets store, but if not populated the function will crash on invocation.
- The `generate-invoice-pdf` function generates HTML-based "PDFs" (just HTML) — not actual PDF generation. May confuse users expecting downloadable PDFs.
- No error boundary component — unhandled React errors will white-screen the app.

**Verdict:** Deployable with caveats. Timer bug will cause UX issues. Missing pages will confuse users.

---

## 7. UX and Product Risks

| Risk | Impact |
|------|--------|
| **Timer doesn't work** — `useState` instead of `useEffect` means the timer display never updates and the interval leaks | Users will see 00:00:00 forever |
| **Search bars are decorative** — `onSearch` never wired on any page | Users will type and nothing happens |
| **No Deals page** — the entire sales pipeline is invisible | Core business function missing |
| **"Add delivery" button is a no-op** in board view | Frustrating dead click |
| **Notification links don't navigate** — clicking marks as read but doesn't go to the linked page | Defeats purpose of notifications |
| **No Edit/Delete** on most entities (Contracts, Sessions, Forms, Services, Rate Cards, POs) | Users can create but not fix mistakes |
| **Sidebar says "Sessions"** but the feature was just split into Meetings and Workshops | Confusing label |
| **No confirmation dialogs** on status changes (Contract signed, Invoice paid) | Accidental irreversible clicks |
| **No error boundaries** — any React error crashes the entire app | White screen of death |

---

## 8. Technical Debt

**Fix now:**
1. **Timer bug** (`TimeTracking.tsx` line 48) — `useState(() => ...)` must be `useEffect(() => ..., [timerStart])`
2. **312 `as any` casts** — indicates the DB schema and TypeScript types are out of sync. Every `as any` is a potential runtime crash hiding behind a type bypass. The root cause is that columns like `stage`, `service_type`, `template_type`, `content` exist in the DB but not in the generated types, or vice versa.
3. **Hardcoded team array** in Resourcing — should pull from `profiles` table
4. **Hardcoded emails** in sync-gmail — should be env variable or DB config

**Fix later:**
5. **Direct Supabase calls** in `Templates.tsx` and `Notifications.tsx` bypass the hook pattern used everywhere else
6. **Oversized components** — `Deliveries.tsx` (442 lines), `ProjectDetail.tsx`, `Dashboard.tsx` should be split
7. **No data validation** on CSV import — any malformed data goes straight to DB
8. **No pagination** — all queries fetch full datasets, will degrade with scale
9. **Stale detail panels** — selecting an item captures its state at click time; mutations don't refresh the panel

---

## 9. Documentation and Handover Gaps

- **README** is generic Lovable boilerplate — no mention of NDG, no architecture explanation, no entity model, no setup instructions beyond `npm i && npm run dev`
- **No architecture diagram** — entity relationships (Deal → Delivery → Tasks, Proposal → Contract → Invoice) are only discoverable by reading triggers
- **No environment setup guide** — which secrets are required, which are optional, how to set up Gmail sync
- **No deployment runbook** — which edge functions need which secrets, what order to configure
- **No data model documentation** — 20+ tables with complex relationships, no ERD
- **AI agent prompts** are the closest thing to business documentation but are embedded in edge function code

**Verdict:** A new developer would take days to understand the system. Not handover-ready.

---

## 10. Top 10 Priority Fixes

| # | Fix | Effort |
|---|-----|--------|
| 1 | **Fix timer bug** — change `useState(() => ...)` to `useEffect` in `TimeTracking.tsx` | 5 min |
| 2 | **Create Deals page** with pipeline board view and full CRUD | 2-3 hrs |
| 3 | **Create Proposals page** with status management | 1-2 hrs |
| 4 | **Fix sidebar** — add all missing nav links (Deals, Proposals, Time Tracking, Timesheets, Scheduling, Resourcing, Notifications), rename "Sessions" to "Meetings", fix duplicate icon | 30 min |
| 5 | **Move hardcoded emails** from `sync-gmail/index.ts` to Supabase secrets or a config table | 15 min |
| 6 | **Wire up search** across all pages — `PageHeader` `onSearch` is never connected | 1-2 hrs |
| 7 | **Add `.env` to `.gitignore`** | 1 min |
| 8 | **Add React error boundary** wrapping `<AppLayout>` to prevent white-screen crashes | 30 min |
| 9 | **Fix "Add delivery" no-op button** in `Deliveries.tsx` board view — wire to a create dialog | 30 min |
| 10 | **Make notification links navigable** — clicking should both mark as read AND navigate to the link | 15 min |

---

## 11. Final Verdict

| Criterion | Status |
|-----------|--------|
| **Safe** (no leaked secrets) | Yes, with minor `.gitignore` fix |
| **Clean** | No — 312 `as any` casts, dead code, hardcoded values, missing pages |
| **Deployable** | Technically yes, but timer is broken and core features (Deals, Proposals) are missing |
| **Ready to share publicly** | No — contains personal emails, employee names, and proprietary business methodology in AI prompts |
| **Handover-ready** | No — README is boilerplate, no architecture docs, no setup guide |

**Bottom line:** The platform has a solid foundation — good component architecture, proper RLS security, well-structured hooks, and thoughtful UI design. But it has the characteristics of a rapidly built prototype: missing pages for core entities, widespread type bypasses, a broken timer, decorative search bars, and several no-op buttons. Fixing the top 10 items above would bring it to a shippable state. A documentation pass and `as any` cleanup would make it handover-ready.

