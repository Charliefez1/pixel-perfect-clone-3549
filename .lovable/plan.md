

# NDG Hub — Phase 1: Foundation (with Lovable Cloud)

## Overview
Build the internal operations hub for NDG Group using **Lovable Cloud** for all backend needs (database, auth, edge functions, storage). No external Supabase project needed — everything is managed within Lovable.

---

## 1. App Shell & Navigation
- Dark sidebar with NDG branding, #48BA59 green accent
- Nav items: Dashboard, Pipeline, Contacts, Projects, Tasks, Invoices, Activity, Settings
- Top bar: search, notification bell, user avatar
- Responsive layout (desktop + tablet)

## 2. Lovable Cloud Backend Setup
- **Auth**: Email-based login for Charlie and Rich (expandable later)
- **Database tables**: organisations, contacts, deals, projects, tasks, sessions, invoices, invoice_items, comments, activity_log, notifications
- **User roles table** (separate from profiles): admin role for both founders
- **RLS policies** using `has_role` security definer function
- **Edge functions** as needed for business logic (e.g., activity logging)

## 3. Dashboard
- Summary cards: open deals (total value), active projects, overdue tasks, outstanding invoices
- Pipeline value chart (Recharts)
- Upcoming tasks/sessions list
- Recent activity feed

## 4. CRM & Pipeline
- **Kanban board**: Lead → Qualified → Proposal Sent → Negotiation → Verbal Yes → Won → Lost
- Deal cards: title, org, value, owner, days in stage
- Deal detail page: all fields, linked contact, interaction timeline
- **Contacts & Organisations**: list views with search/filter, detail pages
- Sector tags

## 5. Project & Task Management
- Projects list with status indicators and NEURO phase progress
- Project detail: linked tasks, sessions, budget tracking
- **Task Kanban**: To Do / In Progress / Blocked / Done
- My Tasks view sorted by due date and priority
- Color-coded priorities (Critical=red, High=orange, Medium=yellow, Low=grey)

## 6. Team Collaboration
- Activity feed across all modules
- Comment threads on deals, projects, tasks
- In-app notification panel

## 7. Invoicing (UI + Data)
- Invoice list with status badges (Draft/Sent/Viewed/Paid/Overdue)
- Invoice detail with line items and VAT
- Revenue charts

## 8. Design System
- **Archivo Black** for headings (Google Fonts)
- **#48BA59** green accent throughout
- Dark sidebar, light content area
- Pipeline stage colors, priority color coding
- Clean SaaS aesthetic using shadcn/ui components

## Implementation Order
1. Design system + app shell with routing
2. Lovable Cloud: database schema + auth + RLS
3. Dashboard with real data queries
4. CRM pipeline (kanban + CRUD)
5. Contacts & organisations
6. Projects & tasks
7. Invoicing
8. Activity feed & notifications

