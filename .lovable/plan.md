

## Projects as Your Daily Command Center

You've described exactly what this needs to be: a **working memory prosthetic**. Right now, Projects is a card grid with NEURO phases and budget tracking. It's missing the operational layer -- the checklist-driven, "where am I with each client" view that keeps you on track across dozens of bespoke engagements.

Here's what I'd build:

---

### 1. Project Checklist (Admin Milestones)

Every project gets a **standard milestone checklist** -- not the granular tasks, but the big admin gates that every client must pass through regardless of package size:

- Contract signed
- PO received
- Project plan agreed
- Prep meeting booked
- Prep meeting done
- Content built
- Content scheduled
- Delivery scheduled
- Logistics confirmed
- Pre-assessment sent
- Delivery complete
- Post-assessment sent
- Feedback received
- Invoice sent

**Implementation:** New `project_milestones` table with `project_id`, `milestone_key`, `completed_at`, `sort_order`. When a project is created, auto-populate from a default set. Some milestones auto-complete from triggers (contract signed, invoice sent). The rest are manual checkboxes.

The detail panel gets a new **Milestones** tab showing these as a vertical checklist with completion dates, replacing the current sparse "Overview" tab.

---

### 2. Project Board View Upgrade

The current board cards show NEURO phase and budget. For your daily use, each card should surface:

- **Next uncompleted milestone** (e.g. "Next: Prep meeting")
- **Overdue tasks count** in red
- **Next session date** if one exists
- **Days until next delivery**

This turns the board from a status display into an action dashboard.

---

### 3. "My Day" Filter on Projects

A toggle at the top: **All Projects** | **Needs Action**

"Needs Action" filters to projects where:
- Any milestone is overdue (based on start_date + expected offset)
- Tasks are overdue
- Next session is within 7 days
- No activity in 14+ days

This is the view you open every morning.

---

### 4. Richer Detail Panel

Current detail panel has Tasks + Overview tabs. Expand to:

- **Milestones** -- the admin checklist described above, with click-to-complete
- **Tasks** -- existing, but grouped by status with inline status toggle
- **Sessions** -- linked sessions/meetings for this project with dates
- **Deliveries** -- linked deliveries with their status
- **Documents** -- linked proposal, contract, PO, invoices (from the document chain we already built)
- **Activity** -- recent emails/notes from the activities table

---

### 5. Database Changes

- New `project_milestones` table (project_id, milestone_key, label, completed_at, completed_by, sort_order)
- Default milestone template seeded on project creation (via trigger or frontend logic)
- Query sessions, deliveries, invoices, contracts, proposals by `project_id` or via `deal_id` linkage

---

### Technical Approach

- **Migration:** Create `project_milestones` table with RLS matching projects
- **Trigger:** `after insert on projects` to seed default milestones
- **Frontend:** Rewrite `ProjectDetailPanel` with 5 tabs pulling from milestones, tasks, sessions, deliveries, and linked documents
- **Board cards:** Add queries for sessions and deliveries to the Projects page, compute "next action" per project
- **Filter:** Simple state toggle filtering the projects array client-side

All data relationships already exist (projects have `deal_id`, deliveries have `deal_id`, sessions have `project_id`, invoices have `project_id`/`deal_id`). No new foreign keys needed beyond the milestones table.

