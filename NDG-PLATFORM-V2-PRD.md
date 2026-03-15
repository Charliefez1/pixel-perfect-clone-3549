# NDG Platform v2 — PRD & Build Plan

> **Neurodiversity Global** — Professional Services Management Platform
> Created: 2026-03-14 | Status: Planning

---

## 1. Problem & Context

We run Neurodiversity Global (NDG), a neurodiversity consulting and training business. We deliver a mix of workshops, coaching, and organisational development programmes. 2-person team internally, with clients accessing a portal.

**The pain:** Managing client engagements after they accept a proposal is scattered. We have a separate CRM for sales — this platform handles everything *after verbal acceptance*: project setup, delivery planning, session design, feedback collection, invoicing, and impact analysis.

**v1 failed because:** We vibed out 30 database tables, 35 pages, and 89 components in 6 days. Features were added horizontally (a bit of everything) instead of vertically (one workflow end-to-end). No backend layer — all business logic lived in React components. Schema was designed on-the-fly with 30 migrations. Monolithic page files (1,000+ lines). Role confusion. No meaningful tests. Result: things break, data gets weird, can't trust the platform day-to-day.

**What v2 fixes:** Rebuild properly with a clean schema, backend layer (Supabase Edge Functions), the three-axis model, vertical slices, and reliability as the #1 priority.

---

## 2. Outcomes & Success Criteria

1. **Reliability first** — The platform just works. No broken data, no weird states. Every mutation is validated server-side.
2. **One complete workflow** — Create a project from an accepted proposal, plan deliveries and sessions, collect feedback, generate an invoice. End-to-end, polished.
3. **Three-axis clarity** — Operational lifecycle, neuro-phase, and Kirkpatrick evaluation are separate, never blended into one status field.
4. **Client portal works** — Clients can see their project status and submit feedback without us emailing PDFs.
5. **AI is genuinely useful** — Session planning, content generation, and a smart assistant that knows the platform data.

**We'll be happy if:** A new client engagement can go from "they said yes" to "invoice sent" entirely within the platform, with feedback collected and impact measured, and nothing breaks along the way.

---

## 3. User Personas & Key Workflows

### Persona 1: Consultant/Facilitator (role: `team`)
Plans and delivers workshops/coaching sessions.
- "When I'm preparing for a delivery, I can see the session agenda, materials, delegate count, and previous feedback — so I don't walk in cold."
- "When I finish a delivery, I can mark it complete and trigger feedback collection — so I don't forget."
- "When I need a session agenda, I can ask AI to generate one based on the neuro-phase and service type — so I'm not starting from scratch."

### Persona 2: Business Owner (role: `admin`)
Manages the pipeline, oversees projects, handles invoicing.
- "When a proposal is accepted, I can create a project with deliveries in one go — so setup takes minutes, not hours."
- "When I look at the dashboard, I can see active projects, upcoming deliveries, and overdue invoices — so I know the health of the business."
- "When a project's deliveries are done, I can generate an invoice with the correct day rates and line items — so billing is accurate."

### Persona 3: Client Contact (role: `client`)
Receives services, provides feedback, tracks their project.
- "When I log into the portal, I can see what's been delivered and what's coming up — without chasing the consultants by email."
- "When I get a feedback form after a session, I can fill it in quickly — so my input actually gets captured."

---

## 4. Scope

### v1 Must-Haves (Phase 1)
- Project creation and lifecycle management (7-stage operational status)
- Delivery planning with neuro-phase and Kirkpatrick level
- Session management with agenda builder
- Feedback forms (create, publish, collect, analyse)
- Invoicing (generate from deliveries, day-rate calculation)
- Client portal (project visibility + form submission)
- Dashboard (active projects, upcoming deliveries, overdue invoices)
- Auth + RLS (admin, team, client — 3 roles only)
- AI assistant (basic, reworked from v1)

### Nice-to-Haves (Phase 2-3)
- Task management within projects
- Document management
- Project milestones and timeline
- Reporting and analytics
- Templates (delivery, session, form, task)
- Time tracking and timesheets
- Automations engine
- Contracts and purchase orders
- Advanced client portal (messaging, documents)

### Explicitly Out of Scope
- **CRM / deal pipeline** — We have a separate CRM. No deals table.
- **Full accounting / ERP** — Invoicing yes, not a finance system.
- **Generic PM features** — Not Asana. The neuro-phases and Kirkpatrick model are what make it ours.
- **No-code platform** — Form builder and automations serve delivery, they're not the product.
- **Scheduling / booking** — Not Calendly. Fold into delivery/session views.

---

## 5. The Three-Axis Model

This is the core architectural insight for v2. Three separate dimensions, never blended:

### Axis 1: Operational Lifecycle (`projects.status`)
The PSA spine — where the project is in the quote-to-cash process:

```
contracting → project_planning → session_planning → content_review → delivery → feedback_analytics → closed
```

### Axis 2: Neuro-Phase (methodology lens)
The NDG methodology — where the *work* is in the neurodiversity journey:

```
needs → engage → understand → realise → ongoing
```

**Lives on:** `deliveries.neuro_phase` (primary), `sessions.neuro_phase` (optional override), `projects.intended_neuro_phase` (metadata only)

A single project can have deliveries in different neuro-phases simultaneously. This is correct — a programme might have an "Engage" awareness workshop and an "Understand" manager session running in parallel.

### Axis 3: Kirkpatrick Level (evaluation depth)
How deeply we've evidenced impact:

```
Level 1: Reaction  |  Level 2: Learning  |  Level 3: Behaviour  |  Level 4: Results
```

**Lives on:** `deliveries.kirkpatrick_level`, `forms.kirkpatrick_level`, `form_responses.kirkpatrick_level`

Enables queries like: "Show me all programmes that reached Level 3 behaviour change."

### Axis Summary Table

| Axis | Lives On | Column | Values |
|------|----------|--------|--------|
| Operational Lifecycle | `projects.status` | `project_status` enum | 7 stages |
| Neuro-Phase | `deliveries.neuro_phase`, `sessions.neuro_phase`, `projects.intended_neuro_phase` | `neuro_phase` enum | 5 phases |
| Kirkpatrick Level | `deliveries.kirkpatrick_level`, `forms.kirkpatrick_level`, `form_responses.kirkpatrick_level` | SMALLINT 1-4 | 4 levels |

---

## 6. Domain Model & Schema

### Entity Hierarchy

```
Organisation (client company)
  └── Contact (person at the org)
  └── Project (engagement after verbal acceptance)
        ├── status: contracting → ... → closed       [Axis 1]
        ├── intended_neuro_phase: metadata only       [Axis 2 hint]
        │
        ├── Delivery 1 (e.g., "Aware Workshop Day 1")
        │     ├── neuro_phase: engage                 [Axis 2]
        │     ├── kirkpatrick_level: 1                [Axis 3]
        │     ├── Session 1a (AM block)
        │     │     └── AgendaItems [...]
        │     └── Session 1b (PM block)
        │           └── AgendaItems [...]
        │
        ├── Delivery 2 (e.g., "Manager Workshop")
        │     ├── neuro_phase: understand             [Axis 2]
        │     ├── kirkpatrick_level: 2                [Axis 3]
        │     └── Session 2a
        │
        ├── Form (Post-workshop feedback, L1)
        │     └── FormResponses [...]
        │
        └── Invoice (covers Delivery 1 + 2)
              └── InvoiceItems [...]
```

### Core Tables (Phase 1)

#### `projects` (reworked)

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id),
  name TEXT NOT NULL,
  description TEXT,
  service_type service_type NOT NULL,

  -- AXIS 1: Operational Lifecycle
  status project_status NOT NULL DEFAULT 'contracting',

  -- AXIS 2: Neuro-Phase as METADATA only
  intended_neuro_phase neuro_phase,

  -- Financial
  budget NUMERIC(12,2),
  day_rate NUMERIC(10,2),
  total_days NUMERIC(6,2),
  invoiced NUMERIC(12,2) DEFAULT 0,

  -- Dates
  start_date DATE,
  end_date DATE,

  -- Ownership
  owner_id UUID REFERENCES auth.users(id),

  -- External CRM reference
  external_ref TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TYPE project_status AS ENUM (
  'contracting', 'project_planning', 'session_planning',
  'content_review', 'delivery', 'feedback_analytics', 'closed'
);
```

#### `deliveries` (reworked)

```sql
CREATE TABLE deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  organisation_id UUID NOT NULL REFERENCES organisations(id),
  title TEXT NOT NULL,
  service_type service_type,

  -- AXIS 1: Delivery-level status
  status delivery_status NOT NULL DEFAULT 'planning',

  -- AXIS 2: Neuro-Phase (LIVES HERE)
  neuro_phase neuro_phase NOT NULL DEFAULT 'needs',

  -- AXIS 3: Kirkpatrick Level (LIVES HERE)
  kirkpatrick_level SMALLINT CHECK (kirkpatrick_level BETWEEN 1 AND 4),

  -- Details
  delivery_date DATE,
  delivery_end_date DATE,
  duration_days NUMERIC(4,2) DEFAULT 1,
  delegate_count INTEGER,
  location TEXT,
  facilitator_id UUID REFERENCES auth.users(id),

  -- Feedback tracking
  feedback_form_id UUID REFERENCES forms(id),
  satisfaction_score NUMERIC(3,1),
  feedback_sent BOOLEAN DEFAULT false,
  feedback_received BOOLEAN DEFAULT false,
  pre_assessment_complete BOOLEAN DEFAULT false,
  post_assessment_complete BOOLEAN DEFAULT false,

  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### `sessions` (reworked — now hangs off deliveries)

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id),
  title TEXT NOT NULL,
  session_type TEXT NOT NULL DEFAULT 'workshop',

  session_date TIMESTAMPTZ,
  duration_minutes INTEGER DEFAULT 90,
  location TEXT,

  -- AXIS 2: Optional override (inherits from delivery if null)
  neuro_phase neuro_phase,

  facilitator_id UUID REFERENCES auth.users(id),
  content_status TEXT DEFAULT 'draft',  -- draft | ready_for_review | approved | delivered

  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### `session_agenda_items` (keep as-is)

Already well-structured: `session_id`, `title`, `type`, `duration_minutes`, `position`, `method`, `description`, `materials`.

#### `forms` (add Kirkpatrick)

```sql
-- Add to existing forms table:
kirkpatrick_level SMALLINT CHECK (kirkpatrick_level BETWEEN 1 AND 4),
delivery_id UUID REFERENCES deliveries(id),
project_id UUID REFERENCES projects(id)
```

#### `form_responses` (add Kirkpatrick)

```sql
-- Add to existing form_responses table:
kirkpatrick_level SMALLINT CHECK (kirkpatrick_level BETWEEN 1 AND 4)
```

#### `invoices` (simplify)

```sql
-- Drop: deal_id, contract_id
-- Add:
delivery_ids UUID[]  -- array of delivery IDs this invoice covers

-- Keep: organisation_id, project_id, invoice_number, status,
-- subtotal, total, vat_rate, vat_amount, due_date, paid_date, notes
```

#### `organisations`, `contacts`, `profiles` — keep as-is

### v1 Table Disposition

| Table | Action | Reason |
|-------|--------|--------|
| `profiles` | KEEP | Core, clean up role to 3 values |
| `organisations` | KEEP | Core entity |
| `contacts` | KEEP | Core entity |
| `projects` | REWORK | New 7-stage status, add financial fields |
| `deliveries` | REWORK | Add neuro_phase, kirkpatrick, link to forms |
| `sessions` | REWORK | Link to deliveries, add content_status |
| `session_agenda_items` | KEEP | Already good |
| `invoices` | REWORK | Drop CRM FKs, add delivery_ids |
| `invoice_items` | KEEP | Already good |
| `forms` | ADD COLUMNS | kirkpatrick_level, delivery_id, project_id |
| `form_responses` | ADD COLUMNS | kirkpatrick_level |
| `entity_documents` | KEEP | Phase 2 activation |
| `activity_log` | KEEP | Audit trail |
| `notifications` | KEEP | Phase 2 activation |
| `client_portal_access` | KEEP | Portal auth |
| `portal_messages` | KEEP | Phase 2+ |
| `theme_preferences` | KEEP | Cosmetic |
| `rate_cards` | KEEP | Simplified for Phase 1 |
| `deals` | **DROP** | CRM concern, separate system |
| `activities` | **DROP** | CRM concern |
| `user_roles` | **DROP** | Redundant with profiles.role |
| `user_org_access` | **DROP** | Fold into client_portal_access |
| `entity_links` | **DROP** | Half-built, not needed |
| `comments` | **DROP** | Replace with project_notes |
| `delivery_tasks` | **DROP** | Merge into tasks table |
| `tasks` | PARK → Phase 2 | |
| `project_milestones` | PARK → Phase 2 | |
| `project_notes` | PARK → Phase 2 | |
| `project_updates` | PARK → Phase 2 | |
| `contracts` | PARK → Phase 2 | |
| `purchase_orders` | PARK → Phase 2 | |
| `proposals` | **DROP** | CRM concern |
| `time_entries` | PARK → Phase 3 | |
| `templates` | PARK → Phase 3 | |
| `services` | PARK → Phase 3 | |
| `automations` | PARK → Phase 3 | |
| `automation_logs` | PARK → Phase 3 | |

---

## 7. Functional Requirements (by workflow)

### Workflow 1: Project Setup (from accepted proposal)

1. User clicks "New Project" → dialog with: organisation (select/create), name, service type, day rate, total days, start/end dates, intended neuro-phase
2. Optionally add deliveries inline (title, date, duration, neuro-phase, kirkpatrick level)
3. System creates project + deliveries + default sessions + default feedback form (via `scaffold-project` Edge Function)
4. Project opens in `contracting` status
5. User can add an external CRM reference for cross-linking

### Workflow 2: Delivery Planning

1. Within a project, user adds/edits deliveries
2. Each delivery has: title, date(s), duration in days, neuro-phase, kirkpatrick level, facilitator, location, delegate count
3. Each delivery auto-creates a default session
4. User can add more sessions within a delivery
5. Sessions have the agenda builder (existing, with timed activity blocks)
6. Delivery status: `planning → scheduled → in_progress → delivered → follow_up → complete`

### Workflow 3: Session Design

1. Within a delivery, user designs sessions
2. Each session has: title, type, date/time, duration, facilitator
3. Agenda builder: add timed blocks (activity, break, intro, debrief, energiser) with method and materials
4. Content status: `draft → ready_for_review → approved → delivered`
5. AI can generate agenda suggestions (Phase 4, but UI hook exists)

### Workflow 4: Feedback Collection

1. Create feedback form linked to a delivery and project
2. Set kirkpatrick level on the form (L1=reaction, L2=learning, etc.)
3. Publish form publicly (generates shareable link)
4. Clients submit responses via public URL or portal
5. System processes responses: calculates satisfaction score, updates delivery metrics (via `process-form-response` Edge Function)
6. View aggregated results on form detail page

### Workflow 5: Invoicing

1. From a project, user clicks "Generate Invoice"
2. System selects uninvoiced deliveries, calculates: `duration_days × day_rate` per delivery
3. Creates invoice with auto-generated number (NDG-YYYYMM-NNN), line items, VAT
4. Invoice status: `draft → sent → viewed → paid → overdue`
5. User can manually edit line items, system recalculates totals (via `recalculate-invoice`)
6. Project's `invoiced` total updates automatically

### Workflow 6: Client Portal

1. Client logs in → sees their organisation's projects
2. Project view shows: status (Axis 1), upcoming deliveries, completed deliveries with satisfaction scores
3. Client can submit feedback forms
4. Client can view documents (Phase 2)
5. Client can message team (Phase 2+)

### Workflow 7: Dashboard

1. Admin/team sees: active projects count, upcoming deliveries this week, overdue invoices, total outstanding revenue
2. Quick actions: create project, view overdue invoices
3. Needs attention: projects in `feedback_analytics` with no responses, deliveries past date still in `planning`
4. Charts: project status distribution, neuro-phase distribution across active deliveries

---

## 8. Non-Functional Constraints

- **Reliability:** Every multi-table mutation goes through an Edge Function with proper error handling. No silent failures. Toast on success, clear error messages on failure.
- **Performance:** React Query with 5min staleTime. Lazy-loaded pages. Vendor chunk splitting (already configured in v1 Vite config).
- **Security:** RLS on all tables. 3 roles only (admin, team, client). Client sees only their org's data. No API keys in frontend.
- **Audit:** All status changes logged to `activity_log`. Who changed what, when.
- **Data integrity:** Foreign key constraints. NOT NULL where appropriate. Check constraints on enums and kirkpatrick levels.

---

## 9. Tech & Integration Constraints

### Stack (keeping from v1)
- React 18 + TypeScript + Vite
- Supabase (PostgreSQL + Auth + Storage + **Edge Functions for v2**)
- shadcn/ui + Tailwind CSS + Radix UI
- TanStack React Query
- React Router v6
- Recharts for data viz
- React Hook Form + Zod for validation

### New in v2
- **Supabase Edge Functions** (Deno) for all business logic
- **Claude API** (via Edge Functions) for AI features
- **Playwright** for E2E smoke test

### Hosting
- Currently: Lovable
- Target: Vercel or Netlify (static SPA + Supabase backend)

### Rule: No business logic in React
- Hooks do single-table CRUD only
- Multi-table operations → Edge Function
- Computed values (invoice totals, satisfaction scores) → Edge Function
- Status transition validation → Edge Function

---

## 10. Backend Architecture (Supabase Edge Functions)

### Phase 1 Edge Functions

| Function | Trigger | What it does |
|----------|---------|-------------|
| `scaffold-project` | Create project dialog | Creates project + deliveries + sessions + default feedback form in one transaction |
| `scaffold-deliveries` | Add deliveries to project | Creates deliveries + default sessions, validates project isn't closed |
| `generate-invoice` | "Generate Invoice" button | Calculates line items from delivery day rates, auto-generates invoice number, creates invoice + items |
| `recalculate-invoice` | Invoice item edited | Re-sums items, recalculates VAT and total |
| `process-form-response` | Form submitted | Sets kirkpatrick_level, calculates satisfaction score, updates delivery metrics |
| `advance-project-status` | Status change | Validates transition is legal, logs to activity_log, checks close conditions |

### Hook Pattern for Edge Functions

```typescript
// Instead of direct supabase.from("projects").insert()
export function useScaffoldProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ScaffoldProjectInput) => {
      const { data, error } = await supabase.functions.invoke('scaffold-project', {
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project created");
    },
  });
}
```

Simple CRUD (update a delivery title, toggle a boolean) stays as direct Supabase calls.

---

## 11. Component Decomposition

### ProjectDetail.tsx (1,052 lines → ~7 files)

```
pages/ProjectDetail.tsx (~120 lines)
  ├── Fetches project, handles loading/error
  ├── ProjectDetailHeader
  └── Tabs container

components/projects/ProjectDetailHeader.tsx (~100 lines)
  ├── Back button, name, status badge [Axis 1]
  ├── Neuro-phase badge [Axis 2 metadata]
  ├── Actions (edit, delete, generate invoice)
  └── Status advancement dropdown

components/projects/OverviewTab.tsx (~150 lines)
  ├── Stats cards (budget, invoiced, days, deliveries)
  ├── Financial summary
  └── Upcoming deliveries/sessions timeline

components/projects/DeliveriesTab.tsx (~200 lines)
  ├── Delivery list with 3-axis badges
  ├── Add delivery trigger
  └── Delivery cards

components/projects/SessionsTab.tsx (existing)
components/projects/NotesTab.tsx (existing, Phase 2)
components/projects/DocumentsTab.tsx (existing, Phase 2)
components/projects/ActivityTab.tsx (existing)
components/projects/MilestonesTab.tsx (existing, Phase 2)
```

### FormDetail.tsx (678 lines → ~5 files)

```
pages/FormDetail.tsx (~80 lines)
components/forms/FormDetailHeader.tsx (~60 lines)
components/forms/FormOverviewTab.tsx (~80 lines)
components/forms/FormResponsesTab.tsx (~120 lines)
components/forms/FormAnalyticsTab.tsx (~150 lines)
```

### Deliveries.tsx (452 lines → ~4 files)

```
pages/Deliveries.tsx (~80 lines)
components/deliveries/DeliveryBoard.tsx (~150 lines)
components/deliveries/DeliveryListView.tsx (~100 lines)
components/deliveries/DeliveryDetailPanel.tsx (~120 lines)
  ├── Three-axis badges
  ├── Sessions list
  └── Feedback status
```

### ClientDetail.tsx (525 lines → ~4 files)
### FormBuilder.tsx (480 lines → ~4 files)
### Templates.tsx (507 lines → ~3 files)

Same pattern: page shell + feature components.

---

## 12. Phased Delivery Plan

### Phase 1: Core Delivery Workflow (4-6 weeks)

**Goal:** One complete path from "accepted proposal" to "invoice sent", with working three-axis model.

**Schema:**
- New `project_status` enum (7 stages)
- Reworked `projects`, `deliveries`, `sessions` tables
- Added columns to `forms`, `form_responses`
- Reworked `invoices`
- Dropped: `deals`, `activities`, `user_roles`, `user_org_access`, `entity_links`, `comments`
- Role cleanup: 'user' → 'team'

**Edge Functions:**
- `scaffold-project`, `scaffold-deliveries`
- `generate-invoice`, `recalculate-invoice`
- `process-form-response`
- `advance-project-status`

**Pages (active):**
- Dashboard, Projects, ProjectDetail, Deliveries, Forms, FormDetail, FormBuilder, PublicForm, Invoices, ClientPortal, PortalView, Settings, Auth, Notifications, AI Assistant (basic)

**Pages (removed from nav):**
- Meetings, Contracts, Scheduling, PurchaseOrders, Services, TimeTracking, Timesheets, Resourcing, Portfolio, DailyBrief, Contacts (fold into ClientDetail)

**Components:**
- ProjectDetail decomposed (7 files)
- FormDetail decomposed (5 files)
- Deliveries decomposed (4 files)
- New DeliveryDetail page
- CreateProjectDialog reworked for scaffold-project

### Phase 2: Operational Depth (3-4 weeks)

**Schema additions:** tasks (add delivery_id), project_milestones, project_notes, project_updates, entity_documents, contracts, purchase_orders

**Edge Functions:** `scaffold-tasks-from-template`, `update-milestone-progress`

**Pages activated:** Tasks tab in ProjectDetail, Milestones tab, Documents tab, Notes tab, Contacts (standalone), Contracts, PurchaseOrders, Reporting

### Phase 3: Efficiency & Scale (3-4 weeks)

**Schema additions:** templates (reworked), time_entries, automations + automation_logs (rebuilt), services

**Edge Functions:** `apply-template`, `run-automation`

**Pages activated:** Templates, TimeTracking, Timesheets, Automations, Services

### Phase 4: Intelligence (4-6 weeks)

**Edge Functions (AI):**
- `ai-session-planner` — generates agenda items from delivery context
- `ai-content-generator` — generates session materials, proposals, reports
- `ai-smart-assistant` — reworked with Claude tool_use for DB queries
- `ai-impact-reporter` — generates impact reports from form responses

**Components:** AI panel in session editor, AI panel in delivery view, AI-powered reporting, Smart assistant with full platform context

---

## 13. AI Integration Architecture

### Provider
Claude API via Supabase Edge Functions. `ANTHROPIC_API_KEY` stored in Supabase secrets. Never in frontend.

- Sonnet for generation (agenda planning, content, reports)
- Haiku for extraction (form response → satisfaction score)

### Integration Points

| Feature | Where | Edge Function | Input | Output |
|---------|-------|---------------|-------|--------|
| Session planning | Agenda builder, "AI Suggest" button | `ai-session-planner` | Delivery context, neuro-phase, duration, service type, previous agendas | Array of agenda items |
| Content generation | Session detail, "Generate Materials" | `ai-content-generator` | Session agenda, delivery context | Markdown content |
| Smart assistant | Floating chat panel | `ai-smart-assistant` | User query + tool_use for DB queries | Natural language + actions |
| Impact reporting | Reporting page, "Generate Report" | `ai-impact-reporter` | Form responses, satisfaction scores, kirkpatrick data | Structured report (markdown/PDF) |

### Smart Assistant Tool Use

```typescript
const tools = [
  { name: "get_upcoming_deliveries", description: "..." },
  { name: "get_project_summary", description: "..." },
  { name: "get_kirkpatrick_report", description: "..." },
  { name: "get_revenue_summary", description: "..." },
];
```

### Cost Control
- Rate limit: 20 AI calls per user per hour
- Cache AI-generated content in `ai_generations` table
- Model selection: Haiku for simple tasks, Sonnet for generation

---

## 14. Migration & Hardening

### Role Cleanup
1. `UPDATE profiles SET role = 'team' WHERE role = 'user'`
2. `AppRole = 'admin' | 'team' | 'client'` (drop 'user')
3. Update `useAuth.tsx`, `RequireRole.tsx`, all route guards
4. Update `is_admin_or_team()` DB function

### RLS
- All tables: RLS enabled
- Admin/team: full access via `is_admin_or_team()`
- Client: scoped to their org via `client_portal_access`
- Edge Functions use `service_role` key for server-side operations

### Test Strategy

**Integration tests (4):**
1. `scaffold-project` — verify project + deliveries + sessions + form created
2. `generate-invoice` — verify line items, totals, invoice number uniqueness
3. `process-form-response` — verify satisfaction score updates
4. `advance-project-status` — verify valid/invalid transitions

**Component tests (2):**
1. Three-axis badge rendering
2. Project status stepper

**E2E smoke test (1, Playwright):**
1. Login → Create project → View deliveries → Generate invoice → Submit feedback form → Verify score updates

---

## 15. AI Coding Brief

> Paste this into your coding AI session when starting implementation.

**Core goal:** Build the NDG Professional Services Management Platform v2. Manages client engagements from verbal acceptance through delivery to invoicing. 2-person neurodiversity consulting business.

**Tech stack:** React 18 + TypeScript + Vite | Supabase (PostgreSQL + Auth + Storage + Edge Functions) | shadcn/ui + Tailwind | TanStack React Query | React Router v6

**Three-axis model:**
1. `projects.status` = operational lifecycle (7 stages: contracting → closed)
2. `deliveries.neuro_phase` = methodology (5 phases: needs → ongoing)
3. `deliveries.kirkpatrick_level` = evaluation depth (L1-L4)

**Core entities:** Organisation → Project → Delivery → Session → AgendaItem. Plus: Forms, FormResponses, Invoices, InvoiceItems.

**First vertical slice:** Project creation (via scaffold-project Edge Function) → Delivery planning → Session design with agenda → Feedback form → Invoice generation. One complete workflow, end-to-end.

**Key rules:**
- No business logic in React — multi-table ops go through Edge Functions
- 3 roles only: admin, team, client
- RLS on all tables
- No CRM — starts at verbal acceptance
- Sessions hang off Deliveries, not Projects
- Page files under 200 lines — decompose into components

---

## Verification Checklist

After implementation, test by:
1. Create an organisation and contact
2. Create a project (via scaffold) with 2 deliveries in different neuro-phases
3. Verify project status is `contracting`, deliveries have neuro-phases and kirkpatrick levels
4. Add sessions with agendas to each delivery
5. Advance project through status stages
6. Create a feedback form with kirkpatrick level, publish publicly
7. Submit feedback via public URL
8. Verify satisfaction score updates on delivery
9. Generate invoice from deliveries, verify day-rate calculation
10. Log in as client, verify portal shows only their org's data
11. `npm run build` — no TypeScript errors
12. `npm run test` — all tests pass
