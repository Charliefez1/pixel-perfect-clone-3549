

## Internal Error

The "internal error" in your screenshot is a **Lovable platform error** (trace ID `88cb7cfc...`), not a bug in your app code. This typically happens when a previous AI response was interrupted or failed server-side. It is not caused by your application. Clicking "Retry" or sending a new message usually resolves it.

---

## Implementation Plan

This is a large scope covering 5 areas. Here is the plan broken into deliverable chunks.

### 1. Document/File Attachments System

The `documents` storage bucket and `entity_documents` table already exist in the database. What's missing is the frontend code.

**Create:**
- `src/hooks/useEntityDocuments.ts` — hook for uploading files to the `documents` bucket, inserting metadata into `entity_documents`, listing files by entity, and downloading/deleting
- `src/components/documents/EntityDocuments.tsx` — reusable component with file drop zone, upload progress, file list with download/delete actions
- Wire into `DealDetailPanel` (Deals.tsx), project detail tabs, contract detail, and invoice detail panels via a new "Files" tab

### 2. Drag-and-Drop Kanban Board for Deals

The Deals page **already has a working drag-and-drop Kanban board** using native HTML5 drag events (`handleDragStart`, `handleDragOver`, `handleDrop`). No changes needed here.

### 3. Notification Triggers

The `notifications` table exists but there are **no triggers** in the database. Need to create a migration with `AFTER` triggers using `SECURITY DEFINER` functions:

- **Deal won** — trigger on `deals` when `stage` changes to `'won'`
- **Invoice overdue** — trigger on `invoices` when `status` changes to `'overdue'`
- **Proposal accepted** — trigger on `proposals` when `status` changes to `'accepted'`
- **Task assigned** — trigger on `tasks` when `assignee_id` is set

Each trigger will insert into `notifications` with a relevant title, message, link, and `user_id` (the deal owner, task assignee, or a fallback admin query).

### 4. Reporting Dashboard

**Create:**
- `src/hooks/useReportingData.ts` — queries for revenue by month (from paid invoices), pipeline value by stage, delivery satisfaction scores, invoice aging buckets
- `src/pages/Reporting.tsx` — page with 4 chart cards using recharts (BarChart for revenue, BarChart for pipeline, BarChart for invoice aging, BarChart/gauge for satisfaction)
- Add route `/reporting` to `App.tsx`
- Add sidebar nav item in `AppSidebar.tsx`

### 5. Mobile-Responsive UI

Currently the layout uses a fixed sidebar (`w-60`) with no mobile adaptation.

**Changes:**
- `AppLayout.tsx` — detect mobile via `useIsMobile()`, hide sidebar on mobile, add a bottom tab bar for primary navigation and a hamburger/sheet for full nav
- `AppSidebar.tsx` — wrap in a Sheet/Drawer on mobile so it slides in from left when triggered
- `PageHeader.tsx` — stack search and actions vertically on mobile, reduce padding
- `Deals.tsx` board view — force single-column scrollable view on mobile with horizontal swipe for stages
- Dashboard — stack stat cards in 1-col on small screens (already uses `sm:grid-cols-2`, mostly fine)
- AI Chat panel — use full-screen sheet on mobile instead of side panel
- Detail panels — use full-screen drawer on mobile instead of right panel

**Mobile bottom tab bar** will include: Home, Deals, Projects, Tasks, More (opens full nav sheet).

### Technical Details

**Database migration (for triggers):**
```sql
-- Notification helper function
CREATE OR REPLACE FUNCTION public.notify_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
-- Handles deal_won, proposal_accepted, invoice_overdue, task_assigned
-- Inserts into notifications table with appropriate user_id
$$;

-- Trigger bindings
CREATE TRIGGER trg_notify_deal_won AFTER UPDATE ON deals ...
CREATE TRIGGER trg_notify_proposal_accepted AFTER UPDATE ON proposals ...
CREATE TRIGGER trg_notify_invoice_overdue AFTER UPDATE ON invoices ...
CREATE TRIGGER trg_notify_task_assigned AFTER UPDATE ON tasks ...
```

**Files to create:**
- `src/hooks/useEntityDocuments.ts`
- `src/components/documents/EntityDocuments.tsx`
- `src/hooks/useReportingData.ts`
- `src/pages/Reporting.tsx`
- `src/components/layout/MobileNav.tsx`

**Files to modify:**
- `src/App.tsx` — add `/reporting` route
- `src/components/layout/AppLayout.tsx` — mobile layout with bottom nav
- `src/components/layout/AppSidebar.tsx` — add Reporting nav item, mobile sheet wrapper
- `src/components/layout/PageHeader.tsx` — responsive stacking
- `src/pages/Deals.tsx` — mobile board adaptations, add files tab to detail panel
- `src/components/ai/AIChatPanel.tsx` — full-screen on mobile
- `src/components/layout/DetailPanel.tsx` — drawer on mobile

