

# Sprint 2 Implementation Plan

This is a massive sprint covering audit fixes, forms overhaul, subtasks, views, templates, portal, and several new modules. Given the scope, I'll break this into ordered implementation phases within a single pass, prioritising stability fixes first.

## Current State Assessment

- **Timer bug**: Already fixed (useEffect pattern in place at line 48)
- **Notifications**: Already navigable (line 88 has `navigate(item.link)`)
- **Resourcing**: Already loads from profiles table (line 20-27)
- **Auth placeholder**: Already fixed (`you@company.com` at line 81)
- **Deals/Proposals pages**: Exist but user says they were intentionally removed — need to remove routes, sidebar links, and page files
- **Sidebar**: Has Deals/Proposals links that need removing; Deliveries already uses `Package` icon
- **Search**: PageHeader has `onSearch` prop wired to `onChange` but no pages pass it
- **⋯ buttons**: Dead on Clients (line 106) and Contacts (line 99)
- **Form system**: FormBuilder, FormDetail, PublicForm all exist with substantial implementations
- **Templates**: Already has template_type, content, variables columns and a rich editor with merge fields

## Phase 1: Cleanup & Audit Fixes (Sprint 2a)

### 1.1 Remove Deals & Proposals (intentionally killed)
- Delete `src/pages/Deals.tsx` and `src/pages/Proposals.tsx`
- Remove routes from `App.tsx` (lines 199-200)
- Remove imports (lines 36-37)
- Remove sidebar entries for Deals and Proposals from `AppSidebar.tsx` (lines 33-34)
- Remove keyboard shortcut references if any
- Keep hooks (`useDeals.ts`, `useProposals.ts`) for future Clarify sync

### 1.2 Delete dead Index page
- Delete `src/pages/Index.tsx`

### 1.3 Wire up search on all pages
- Add `const [search, setSearch] = useState("")` and `onSearch={setSearch}` to PageHeader on: Deliveries, Contacts, Clients, Tasks, Invoices, Contracts, Meetings, Services, RateCards, PurchaseOrders, Forms, Templates
- Filter displayed data by search term matching title/name fields

### 1.4 Fix ⋯ buttons on Clients & Contacts
- Replace plain `<button>⋯</button>` with `<DropdownMenu>` offering: View Details, Edit, Delete
- Wire View Details to open detail panel, Edit to toggle edit mode, Delete to show DeleteConfirmDialog

### 1.5 Add Edit/Delete to detail panels
Entities needing this: Contracts, Invoices, Sessions, Forms, Services, Rate Cards, Purchase Orders
- Add edit mode toggle (pencil icon) with inline field editing
- Add Save/Cancel buttons in edit mode
- Add Delete button with DeleteConfirmDialog
- Follow the Tasks detail panel pattern

### 1.6 Add confirmation on status changes
- Contracts, PurchaseOrders, Invoices: wrap status-change actions in AlertDialog confirmation before executing

### 1.7 Fix detail panel stale data
- After mutation `onSuccess`, invalidate query AND update selected state from returned data

### 1.8 Fix Scheduling booking link
- Remove "coming soon" toast; either remove the button or replace with a copy-link action for the session

### 1.9 Add missing activity logging
- Contracts: log on status change
- Purchase Orders: log on status change
- Tasks: log on status change/completion
- Projects: log on stage/NEURO phase change
- Use existing `useLogActivity` hook

### 1.10 Create reusable EmptyState component
- `src/components/layout/EmptyState.tsx` with icon, title, description, optional CTA
- Apply across all list/table pages

### 1.11 Add loading states to mutation buttons
- All save/status-change buttons show `<Loader2 className="animate-spin" />` and `disabled` while `isPending`

### 1.12 Create CreateDeliveryDialog
- New `src/components/dialogs/CreateDeliveryDialog.tsx`
- Fields: title, project (select), delivery_date, status (default "planning"), notes
- Wire to "Add delivery" button in Deliveries board view

## Phase 2: Subtasks & Views (Sprint 2c)

### 2.1 Subtasks
- **Migration**: `ALTER TABLE tasks ADD COLUMN parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE`
- Update `useTasks` hook to include `parent_task_id` in type
- Tasks page: expand/collapse subtasks under parents, indented in list view, grouped in board view
- "Add Subtask" action in detail panel and on hover
- Subtask count badge on parent tasks

### 2.2 Projects Board View
- Add board view option to Projects page (already has `view` state with "board" | "pipeline" | "list" | "table")
- Kanban columns by `project_stage` enum values
- Cards show: name, client, NEURO dots, task %, next delivery date
- Drag-to-move or click dropdown to change stage

### 2.3 Four task views (list, board, timeline, calendar)
- Already partially implemented (Tasks.tsx has board, list, timeline, calendar views at 614 lines)
- Ensure all 4 views work in both `/tasks` and ProjectDetail tasks tab
- Timeline: horizontal Gantt with bars by due date
- Calendar: month/week view

## Phase 3: Forms Overhaul (Sprint 2b)

### 3.1 Form Builder enhancement
- FormBuilder already exists at 480 lines with drag-and-drop, field types, settings panel
- Verify all 10 field types work: short_text, long_text, single_choice, multiple_choice, rating, likert, nps, date, email, number
- Add Preview mode toggle

### 3.2 Form Responses
- **Migration** (if `form_responses` doesn't exist): Create table with form_id, project_id, delivery_id, respondent_name, respondent_email, answers (JSONB), submitted_at
- RLS: authenticated can read, anon+auth can insert
- FormDetail already has Responses tab — ensure it works with real data

### 3.3 Form Analytics
- FormDetail already has Analytics tab (678 lines) — verify:
  - Rating fields → bar chart
  - Choice fields → pie/bar
  - NPS → gauge
  - Text → listed responses
  - Summary stats

### 3.4 Form Share tab
- FormDetail already has Share tab — verify:
  - Direct link with copy button
  - QR code generation
  - Embed iframe snippet
  - Email compose

### 3.5 Public Form
- PublicForm already exists at 430 lines — verify it renders all field types and submits to form_responses

### 3.6 Default form templates
- Seed 3 default forms: Post-Workshop Feedback, Pre-Session Survey, 90-Day Follow-Up

### 3.7 Link forms to deliveries
- When delivery status → "delivered", show toast suggesting feedback form link

## Phase 4: Document Templates (Sprint 3a)

### 4.1 Templates table enhancement
- **Migration**: Add `template_type`, `content`, `variables` columns if not present
- Templates page already has these columns and a rich editor — verify and enhance

### 4.2 Templates page tabs
- Already has tabs by type (Project, Proposal, Contract, PO) — verify grouping works

### 4.3 Template editor
- Already has markdown editor with merge field sidebar — verify formatting toolbar and live preview

### 4.4 Generate from Project
- ProjectDetail → Documents dropdown → Generate Proposal/Contract/PO
- Pick template → auto-fill merge fields from project data → preview → save to entity_documents

## Phase 5: Client Portal (Sprint 3b)

### 5.1 Portal Settings (/client-portal)
- Enhance existing ClientPortal page with access management, branding, preferences

### 5.2 Portal Frontend (/portal/:orgId)
- Enhance existing PortalView with project cards, milestones, documents, billing

### 5.3 Portal Messages
- **Migration**: Create `portal_messages` table
- Thread-based messaging UI in portal project view

## Phase 6: New Modules (Sprint 4)

### 6.1 Entity Links (Part 7)
- **Migration**: Create `entity_links` table
- "Link" button on entity detail views with type-ahead search
- Linked items shown as chips
- Task dependencies on timeline view

### 6.2 Project Notes (Part 8)
- **Migration**: Create `project_notes` table
- New "Notes" tab in ProjectDetail
- Markdown editor, pinning, quick-add FAB

### 6.3 Content Studio (Part 9)
- New page `/content-studio` with sidebar link
- Source selection (paste text, project notes)
- Content type selection (Q&A, summary, blog, LinkedIn, etc.)
- AI generation via edge function with NDG content prompt
- Rich text editor for refinement

### 6.4 Knowledge/Resource Hub (Part 10)
- **Migration**: Create `resources` table
- New page `/resources` with grid/list view
- Upload files, external links, category filtering, tags, search
- Version history, linked services

### 6.5 Workplace Audits (Part 11)
- **Migrations**: Create `audit_frameworks`, `audit_assessments`, `audit_findings` tables
- "Audit" tab on ProjectDetail for audit-type projects
- Framework selector, category checklist, scoring, AI report generation
- Default NDG framework seeded

---

## Database Migrations Summary

1. `ALTER TABLE tasks ADD COLUMN parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE`
2. Create `form_responses` table (if not exists)
3. Create `portal_messages` table
4. Create `entity_links` table
5. Create `project_notes` table
6. Create `resources` table
7. Create `audit_frameworks`, `audit_assessments`, `audit_findings` tables
8. Add `template_type`, `content`, `variables` to templates (if not exists)

## New Files

- `src/components/layout/EmptyState.tsx`
- `src/components/dialogs/CreateDeliveryDialog.tsx`
- `src/pages/ContentStudio.tsx`
- `src/pages/Resources.tsx`
- Various new hooks for new tables

## Implementation Order

Given the sheer scope, I recommend implementing in this exact order across multiple passes:

**Pass 1** (this session): Phase 1 audit fixes (1.1–1.12) — stability and cleanup
**Pass 2**: Phase 2 subtasks + views — structure
**Pass 3**: Phase 3 forms — verify and enhance existing
**Pass 4**: Phase 4 templates + Phase 5 portal
**Pass 5**: Phase 6 new modules (entity links, notes, content studio, resources, audits)

Shall I proceed with Pass 1 (all audit fixes)?

