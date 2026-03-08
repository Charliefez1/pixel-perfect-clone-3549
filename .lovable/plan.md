

## Analysis: What's Already Done vs What's Needed

### Prompt 3 (Link Proposals to Contracts) — ALREADY DONE
- `proposal_id` column on `contracts` — exists (migration `20260308152429`)
- `contract_id` column on `invoices` — exists (same migration)
- `deal_id` column on `invoices` — already existed
- `handle_proposal_accepted()` trigger function — exists (migration `20260308152525`)
- **Nothing to do here.**

### Prompt 4 (Link Contracts to Invoices) — ALREADY DONE
- `handle_contract_signed()` function — exists in the database functions list, with correct NDG-YYYY-NNN numbering, VAT calculation, and 30-day due date
- **Nothing to do here.**

### Prompt 5 (Quick-Add Bar on Dashboard) — NEEDS BUILDING
This is the only new work. Add a row of 4 quick-action buttons between the dashboard header and stat cards.

**Implementation:**
1. Import `useDialogs` from `@/App` and `Plus` from `lucide-react` in `Dashboard.tsx`
2. Call `const { openCreateDeal, openCreateContact, openCreateInvoice } = useDialogs()`
3. Add a `flex items-center gap-2` div after the header and before the stats grid containing:
   - `+ Deal` → calls `openCreateDeal()`
   - `+ Contact` → calls `openCreateContact()`
   - `+ Invoice` → calls `openCreateInvoice()`
   - `+ Delivery` → navigates to `/deliveries`
4. Each button: `variant="outline" size="sm"` with a `Plus` icon

Single file change: `src/pages/Dashboard.tsx` — ~10 lines added.

