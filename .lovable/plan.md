

## Split Sessions Tab into Meetings & Workshops

The current "Sessions" tab in Project Detail treats all sessions equally. NDG needs to distinguish between:
- **Workshops** — the actual delivery sessions (e.g., ADHD Awareness Workshop)  
- **Meetings** — planning calls, prep meetings, check-ins, etc.

### Approach

**Database change:** Add a `session_type` column to the `sessions` table with values `'workshop'` or `'meeting'` (default `'meeting'`).

**Component changes:**

1. **Replace the single "Sessions" tab** with two tabs: **"Workshops"** and **"Meetings"** in `ProjectDetail.tsx`

2. **Split `SessionsTab.tsx`** into two components (or one with a `type` prop) that filters by `session_type`:
   - `WorkshopsTab` — shows only `session_type = 'workshop'`, styled with delivery-oriented info (delegate count, location, duration)
   - `MeetingsTab` — shows only `session_type = 'meeting'`, lighter style for calls/check-ins

3. **Update `CreateSessionDialog.tsx`** — add a session type selector (Meeting / Workshop) so users can specify the type when creating

4. **Update `Meetings.tsx`** page — add a filter/tabs to toggle between meetings and workshops, or show both with visual distinction

5. **Update `Scheduling.tsx`** — show workshop vs meeting with different visual indicators (e.g., badge colour)

### Build error fixes (in same pass)

6. **Fix `useDeliveries.ts` line 176** — cast `data as unknown as Template[]` to resolve the TS2352 error
7. **Fix `PublicForm.tsx` line 87** — `.rpc()` doesn't have `.catch()` directly; wrap in try/catch or use `.then().catch()`

### File changes

- **Migration:** `ALTER TABLE sessions ADD COLUMN session_type text NOT NULL DEFAULT 'meeting';`
- `src/components/projects/SessionsTab.tsx` → accept a `type` prop, filter by `session_type`
- `src/pages/ProjectDetail.tsx` → replace single "Sessions" tab with "Workshops" and "Meetings" tabs
- `src/components/dialogs/CreateSessionDialog.tsx` → add Meeting/Workshop toggle
- `src/pages/Meetings.tsx` → add visual distinction or filter for type
- `src/hooks/useDeliveries.ts` → fix Template[] cast
- `src/pages/PublicForm.tsx` → fix `.catch()` on rpc call

