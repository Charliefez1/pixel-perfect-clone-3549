

# Competitive Analysis & Feature Steal Plan for NDG Hub

## What They Do Well

### ClickUp
- **Multiple views per dataset**: Board, List, Table, Calendar, Gantt, Timeline — users toggle freely
- **Custom fields on everything**: Any entity can have custom properties (dropdowns, dates, people, formulas)
- **Nested hierarchy**: Workspaces → Spaces → Folders → Lists → Tasks — deep organisation
- **Dashboards with widgets**: Drag-and-drop dashboard builder with charts, tables, embeds
- **Global ⌘K command palette**: Search across all entities, run actions, navigate instantly
- **Activity feed / comments on every entity**: Threaded discussions on tasks, deals, projects
- **Automations builder**: "When X happens, do Y" — no-code workflow automation
- **Time tracking built into tasks**: Start/stop timer directly on any task card

### Monday.com
- **Status columns with colour coding**: Every board has customisable status columns with vivid colours
- **Summary row at bottom of tables**: Auto-calculates totals, averages, counts per column
- **Timeline / Gantt view**: Visual project timelines with dependencies
- **Workload view**: See team capacity at a glance — who's overloaded, who has bandwidth
- **Integrations panel**: Connect email, calendar, Slack etc. from within the app
- **Subitems**: Tasks within tasks, collapsible inline
- **Board templates**: Pre-built templates for common workflows

### Clarify AI
- **Autonomous CRM**: Auto-updates fields, manages pipeline, answers questions
- **Auto-sync with email/calendar**: Every lead, meeting, deal synced without manual entry
- **AI "Rep" agent**: Pre-briefs before meetings, handles follow-ups, enriches leads
- **Minimal UI, maximum automation**: The CRM that "does itself" — radically less data entry
- **Relationship intelligence**: Tracks engagement signals, suggests next actions

### HelloBonsai
- **End-to-end client lifecycle**: CRM → Proposals → Contracts → Projects → Time → Invoices in one flow
- **Template library**: Pre-built proposals, contracts, invoices
- **Client portal**: Clients see their own projects, approve proposals, pay invoices
- **Branded documents**: PDFs with your logo, colours, fonts
- **Recurring invoices & auto-reminders**: Set and forget billing
- **Tax & expense tracking**: Built-in financial management

---

## What NDG Hub Should Steal

Given NDG is a **neurodiversity consultancy** (2-person team, training/workshops, NEURO methodology), here's what's highest impact:

### Priority 1 — Core UX Upgrades

1. **Multi-view toggle on list pages** (ClickUp/Monday)
   - Add Board / List / Table view switcher to Deals, Tasks, Projects
   - Currently Tasks and Deals are board-only; Clients/Contacts are table-only
   - Each page gets a `ViewToggle` component: `Board | List | Table`

2. **Detail panels / slide-overs** (All platforms)
   - Clicking any row/card opens a slide-over panel (not a new page)
   - Shows full detail, edit fields, activity log, comments
   - Reusable `DetailPanel` component using shadcn Sheet

3. **Global command palette (⌘K)** (ClickUp)
   - Search across deals, contacts, projects, tasks, invoices
   - Quick actions: "New Deal", "New Task", navigate to any page
   - Use `cmdk` (already installed)

4. **Inline create forms** (All platforms)
   - "New Deal", "New Task", "New Client" buttons actually open a modal/dialog
   - Quick-add with minimal fields, full edit in detail panel
   - Currently buttons do nothing

### Priority 2 — Workflow & Automation

5. **Activity timeline on entities** (ClickUp/Clarify)
   - Every deal, project, client shows a chronological activity feed
   - "Deal moved to Proposal", "Invoice sent", "Session completed"
   - Uses existing `activity_log` table

6. **Drag-and-drop kanban** (ClickUp/Monday)
   - Deals and Tasks boards get real DnD to move between columns
   - Updates `stage` / `status` in database on drop

7. **Dashboard widgets** (ClickUp/Monday)
   - Revenue by month chart
   - NEURO phase distribution across projects
   - Upcoming sessions timeline
   - Task completion rate
   - Overdue items alert banner

### Priority 3 — NDG-Specific Differentiators

8. **Client portal** (Bonsai)
   - Clients log in and see their projects, sessions, invoices
   - Approve proposals, sign contracts, pay invoices
   - Currently a placeholder page

9. **Session/workshop templates** (Bonsai/Monday)
   - Pre-built templates from NDG's 50+ workshop catalogue
   - "Ask Away", "Gen Z", "Neuro 101" etc.
   - Quick-create a session from a template

10. **Proposal & contract builder** (Bonsai)
    - Generate branded PDF proposals from deal data
    - E-signature workflow
    - Template-based with NDG branding

---

## Technical Implementation Plan

### Files to create:
- `src/components/layout/DetailPanel.tsx` — reusable slide-over detail view
- `src/components/layout/ViewToggle.tsx` — Board/List/Table switcher
- `src/components/layout/CommandPalette.tsx` — ⌘K global search using cmdk
- `src/components/layout/ActivityFeed.tsx` — timeline component
- `src/components/dialogs/CreateDealDialog.tsx` — quick-add deal modal
- `src/components/dialogs/CreateTaskDialog.tsx` — quick-add task modal
- `src/components/dialogs/CreateClientDialog.tsx` — quick-add client modal
- `src/components/dialogs/CreateContactDialog.tsx` — quick-add contact modal

### Files to modify:
- `src/App.tsx` — add CommandPalette at root level
- `src/pages/Deals.tsx` — add ViewToggle, detail panel, create dialog, DnD
- `src/pages/Tasks.tsx` — add ViewToggle, detail panel, create dialog, DnD
- `src/pages/Projects.tsx` — add ViewToggle, detail panel
- `src/pages/Clients.tsx` — add detail panel, create dialog
- `src/pages/Contacts.tsx` — add detail panel, create dialog
- `src/pages/Dashboard.tsx` — expand with more widget cards
- `src/components/layout/PageHeader.tsx` — accept ViewToggle as child
- All hooks — add create/update mutation functions where missing

### Database:
- No new tables needed — existing schema covers all entities
- May need to add `comments` table queries and `activity_log` writes on mutations

This is a large body of work. I'd recommend tackling it in phases:
- **Phase A**: Command palette + inline create dialogs (make the app functional)
- **Phase B**: Detail panels + activity feeds (make entities rich)
- **Phase C**: View toggles + drag-and-drop (power user features)
- **Phase D**: Dashboard expansion + client portal (polish)

