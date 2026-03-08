

# Gap Analysis: Docs vs Current Implementation

After fully parsing both documents and auditing every page, here is what was used, what was missed, and the upgrade plan.

## Already Implemented
- Deal Kanban with stage colours, service type chips, owner avatars, weighted values, stale indicators
- Won-deal-to-delivery database trigger with template task population
- Deliveries board with 7-stage Kanban, task progress bars, satisfaction scoring
- Multi-view toggle (Board/List/Table) on Deals, Tasks, Projects, Deliveries
- Calendar view on Deals by expected close date
- Dashboard with pipeline stats, needs attention card, sector donut, NEURO distribution, task completion ring, upcoming this week
- Command palette (Cmd+K), create dialogs for all core entities
- Detail slide-over panels on all entity pages

## Gaps to Fill

### 1. Drag-and-Drop on Kanban Boards (spec demands it, not implemented)
- Add DnD to Deals board (updates `stage` + `stage_entered_at` on drop)
- Add DnD to Deliveries board (updates `status` on drop)
- Add DnD to Tasks board (updates `status` on drop)
- Use HTML5 drag events (lightweight, no extra dependency)

### 2. Rich Detail Panels with Linked Data
- **Clients detail**: Show linked contacts list, linked deals list, linked invoices, total deal value
- **Contacts detail**: Show linked company (clickable), linked deals
- **Deals detail**: Activity tab shows real activity_log entries; Documents tab placeholder; Financials tab shows linked invoices from DB
- **Deliveries detail**: Add Feedback tab (satisfaction score, pre/post assessment toggles, "Send Feedback Form" button) and Documents tab

### 3. Inline Editing on Detail Panels
- Make deal fields editable inline (stage dropdown, value, probability, owner, notes, expected close)
- Make delivery fields editable (status, delivery date, delegate count, satisfaction score, NEURO stage)
- Make client/contact fields editable (name, email, phone, sector, notes)
- Make invoice status changeable (draft → sent → paid flow)

### 4. Invoice Upgrades (spec Phase 4)
- Auto-generate invoice number in NDG-YYYY-NNN format
- Add line items support to CreateInvoiceDialog (description, qty, unit price, line total)
- HTML invoice preview modal with NDG letterhead, line items table, totals, payment terms
- "Download PDF" button (generate from HTML using browser print)
- Status flow buttons: "Mark as Sent", "Mark as Paid"

### 5. Activity Logging on Mutations
- When deal stage changes → insert activity_log entry
- When invoice created/sent/paid → insert activity_log entry  
- When delivery status changes → insert activity_log entry
- Display activity timeline in deal/delivery/client detail panels

### 6. Missing Database Columns
- `organisations`: add `vat_number` (text)
- `contacts`: add `linkedin_url` (text), `is_primary` (boolean), `last_contacted` (timestamptz)
- `invoices`: add `deal_id` (uuid), `sent_at` (timestamptz), `viewed_at` (timestamptz), `paid_at` (timestamptz), `pdf_url` (text)

### 7. Keyboard Shortcuts
- `N` → open "New Deal" dialog (context-aware per page)
- `F` or `/` → focus search in PageHeader
- `D` → navigate to dashboard
- Already have Cmd+K for command palette

### 8. Templates Management Page
- New route `/settings/templates`
- List existing templates, edit tasks_json inline
- Add/remove tasks with title, assignee, relative_due_days
- Add link in sidebar under Settings

### 9. Overdue Invoice Edge Function
- Edge function `check-overdue-invoices`: finds invoices where status=sent AND due_date < today, updates to overdue
- Triggered on cron schedule

### 10. Consistent UK Date Formatting
- Audit all date displays to use DD/MM/YYYY format throughout
- Currency always £ with GBP formatting

---

## Technical Plan

**Database migration** (single migration):
- ALTER organisations ADD vat_number text
- ALTER contacts ADD linkedin_url text, is_primary boolean DEFAULT false, last_contacted timestamptz
- ALTER invoices ADD deal_id uuid, sent_at timestamptz, viewed_at timestamptz, paid_at timestamptz, pdf_url text

**New files:**
- `src/hooks/useActivityLog.ts` — query + insert activity entries
- `src/pages/Templates.tsx` — template management page
- `src/components/invoices/InvoicePreview.tsx` — HTML invoice preview component
- `supabase/functions/check-overdue-invoices/index.ts` — edge function

**Modified files:**
- `src/pages/Deals.tsx` — add DnD, enrich detail panel with linked data + inline editing
- `src/pages/Deliveries.tsx` — add DnD, add Feedback/Documents tabs to detail panel
- `src/pages/Tasks.tsx` — add DnD
- `src/pages/Clients.tsx` — enrich detail panel with linked contacts/deals/invoices
- `src/pages/Contacts.tsx` — enrich detail panel with linked company/deals
- `src/pages/Invoices.tsx` — line items, preview, PDF, status flow buttons
- `src/components/dialogs/CreateInvoiceDialog.tsx` — auto-number, line items, deal picker
- `src/components/layout/DetailPanel.tsx` — support editable field mode
- `src/App.tsx` — add keyboard shortcuts, templates route
- `src/components/layout/AppSidebar.tsx` — add Templates link

**Not building yet** (integrations, future phase):
- Gmail sync edge function
- Google Calendar sync
- QuickBooks sync
- AI email drafting / meeting prep briefs
- Client portal authentication
- Proposal/contract builder with e-signatures

This covers everything actionable from both documents that can be built within the current stack.

