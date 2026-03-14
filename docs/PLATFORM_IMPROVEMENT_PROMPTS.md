# NDG Platform Improvement Prompts
## Senior Prompt Engineer Playbook

These are structured, production-grade prompts designed to be used with Claude Code (or similar AI coding assistants) to systematically bring the NDG Hub platform to a workable, production-ready standard. Execute them in order.

---

## Phase 1: Critical Infrastructure

### Prompt 1.1 — Database Schema Audit & Migration Cleanup

```
Analyse all Supabase migrations in supabase/migrations/ in chronological order.
Identify:
1. Conflicting or duplicate column definitions across migrations
2. Tables referenced in code (grep src/hooks/ for .from("tablename")) that have no migration
3. Enum types that are defined in one migration but extended in another without IF NOT EXISTS
4. Missing foreign key constraints between related tables
5. RLS policies that reference functions not yet created

Output a single consolidated migration file that:
- Drops and recreates any broken policies
- Ensures all enums are complete (app_role should include admin, user, team, client)
- Adds missing indexes on frequently queried columns (entity_id, project_id, organisation_id, user_id)
- Documents each change with inline SQL comments
```

### Prompt 1.2 — Auth System Unification

```
The auth system has a split-brain problem: roles exist in BOTH profiles.role column AND user_roles table.

Refactor to use a single source of truth:
1. Read src/hooks/useAuth.tsx, src/types/auth.ts, src/components/auth/RequireRole.tsx
2. Read all migrations that touch user_roles or profiles.role
3. Choose profiles.role as the canonical source (it's set by the handle_new_user trigger)
4. Update useAuth.tsx to read role from profiles table only, remove user_roles fallback
5. Update weekly-digest edge function to query profiles instead of user_roles
6. Create a migration that copies any existing user_roles entries into profiles.role
7. Update RequireRole to handle the loading→null→profile race condition by adding an explicit "auth failed" state distinct from "still loading"

Test by checking: does a brand-new signup get role='client' and can they access client-only routes?
```

### Prompt 1.3 — Edge Function Security Hardening

```
All Supabase edge functions currently accept unauthenticated requests.

For each function in supabase/functions/:
1. Read the function and determine if it should be:
   a) User-authenticated (ai-assistant, send-invoice-email, generate-invoice-pdf)
   b) Service-to-service only (check-overdue-invoices, weekly-digest) — require a shared secret header
   c) Authenticated + role-checked (sync-clarify, sync-gmail — admin only)

2. Implement the appropriate auth pattern using the _shared/auth.ts helper
3. Add input validation with Zod schemas for all request bodies
4. Add rate limiting headers (X-RateLimit-Remaining) for user-facing functions
5. Add request timeout with AbortController (30s max) for external API calls in sync functions
6. Ensure all error responses use consistent JSON format: { error: string, code: string }

Do NOT break existing functionality. Test each function by checking the request/response contract.
```

---

## Phase 2: Performance & Reliability

### Prompt 2.1 — React Query Optimisation Pass

```
Review every hook in src/hooks/ that uses useQuery or useMutation.

For each hook:
1. Add staleTime: 60_000 minimum for list queries, 300_000 for reporting/analytics
2. Ensure mutations invalidate specific query keys, not broad ["tablename"] patterns
   Example: invalidate ["deliveries", deliveryId] not just ["deliveries"]
3. Add optimistic updates for simple status changes (task status, delivery status)
4. For hooks that fetch all records then filter client-side (useDeliveries, useSessions),
   add server-side filtering via .eq() parameters passed from the component
5. Remove any queryFn that fetches data but doesn't return it (bug pattern found in useDelivery)
6. Add enabled: false for queries that depend on parameters that might be undefined

Output a summary table: hook name | before staleTime | after staleTime | mutations fixed
```

### Prompt 2.2 — Bundle Size & Code Splitting

```
Analyse the production bundle for this Vite + React app:

1. Run `npx vite-bundle-visualizer` and identify the largest chunks
2. The following vendor libraries should be in separate chunks:
   - react + react-dom + react-router-dom → vendor-react
   - All @radix-ui/* → vendor-ui
   - recharts → vendor-charts
   - @tanstack/react-query → vendor-query
   - react-markdown → vendor-markdown
3. Verify ALL pages in src/pages/ use React.lazy() (they currently do — confirm none regressed)
4. Identify any component in src/components/ larger than 500 lines and split it:
   - CreateInvoiceDialog → InvoiceForm + LineItemEditor + InvoiceCalculator
   - CreateProjectFromPlanDialog → PlanInput + PlanPreview + PlanCreator
   - CSVImportDialog → CSVUpload + ColumnMapper + ImportPreview
5. Move the 7 dialog components out of the AppShell root and lazy-load them
6. Add Suspense boundaries per route group (settings, projects, finance) instead of one global boundary
```

### Prompt 2.3 — Memory Leak Elimination

```
Find and fix all memory leaks in the React application:

1. Components with intervals/timers: AgendaBuilder uses setInterval for live mode.
   Ensure clearInterval is called in useEffect cleanup.
2. Components with streaming: AIChatPanel uses fetch + ReadableStream.
   Ensure AbortController cancels the stream on unmount or panel close.
3. Components with Supabase realtime: TopBar subscribes to notifications channel.
   Verify supabase.removeChannel is called in useEffect cleanup.
4. Components with DOM element creation: useEntityDocuments creates anchor elements
   for downloads. Ensure URL.revokeObjectURL and element removal happen.
5. Test by: navigate rapidly between pages 20 times, then check browser DevTools
   Memory tab for detached DOM nodes or growing heap.
```

---

## Phase 3: Data Integrity & Validation

### Prompt 3.1 — Form Validation Audit

```
Every dialog in src/components/dialogs/ accepts user input without proper validation.

For each Create*Dialog:
1. Add Zod schemas for all form fields
2. Integrate with react-hook-form using @hookform/resolvers/zod
3. Specific validations needed:
   - CreateInvoiceDialog: line item amounts must be positive, VAT rate must be configurable (not hardcoded 20%)
   - CreateProjectDialog: budget > 0, name 2-100 chars, dates must be valid ranges
   - CreateContactDialog: email format validation, name min 1 char
   - CreateSessionDialog: duration > 0, date not in past for new sessions
   - CreateTaskDialog: title 1-200 chars, due_date optional but valid if provided
   - CreateDeliveryDialog: delivery_date required, delegate_count >= 0
4. Show inline field errors, not just toast messages
5. Disable submit button while form is invalid

Do not change the visual design — only add validation logic.
```

### Prompt 3.2 — TypeScript Strictness Pass

```
The project has strict: true now enabled in tsconfig.app.json.

Fix all resulting TypeScript errors:
1. Replace all `as any` casts with proper types. Key patterns:
   - Supabase table names cast as `as any` → create a Tables type from the generated types
   - Event handlers cast as `as any` → use proper React event types
   - Error objects cast as `as any` → use Error or PostgrestError types
2. Add return type annotations to all exported functions
3. Fix null/undefined access patterns (use optional chaining or type guards)
4. Add proper generics to useQuery<TData> and useMutation<TData, TError, TVariables>
5. Fix the SessionsTab `(s as any).session_type` — add session_type to the Session interface

Run `npx tsc --noEmit` and fix every error. Target: zero TypeScript errors.
```

---

## Phase 4: UX & Accessibility

### Prompt 4.1 — Loading & Error State Audit

```
Review every page in src/pages/ and every tab component in src/components/projects/.

For each data-fetching component:
1. If it uses useQuery, it MUST handle three states: loading, error, success
2. Loading state: show Skeleton components (already available from shadcn/ui)
3. Error state: show a retry button with the error message
4. Empty state: show a meaningful message with a CTA (not just "No data")

Components currently missing loading states:
- ActivityTab, DeliveriesTab, SessionsTab (partially fixed — verify)
- Templates page (no loading skeleton)
- RateCards page (no loading skeleton)
- PortalView (no loading state for initial data)
- AIAssistant (no error retry for failed API calls)

Pattern to follow — see Dashboard.tsx and Reporting.tsx which already implement this well.
```

### Prompt 4.2 — Accessibility Pass

```
Run an accessibility audit on the application:

1. All clickable elements that aren't <button> or <a> must have role="button" and tabIndex={0}
2. All icon-only buttons must have aria-label attributes:
   - AgendaBuilder: move up/down/delete buttons
   - TaskCalendarView: day cells
   - EntityDocuments: drag-and-drop zone needs aria-label and keyboard fallback
3. All form inputs must have associated <label> elements (shadcn Input + Label pattern)
4. Colour contrast: verify all text meets WCAG AA (4.5:1 ratio)
5. Focus management: after dialog close, focus should return to trigger element
6. Keyboard navigation: all interactive elements must be reachable via Tab
7. Screen reader: add aria-live="polite" to notification badge in TopBar

Use axe-core or similar to validate. Target: zero critical/serious a11y violations.
```

---

## Phase 5: Testing & CI

### Prompt 5.1 — Test Coverage Foundation

```
The project has vitest configured but only one example test.

Create a test foundation:
1. Unit tests for all utility functions in src/lib/ (errors.ts, utils.ts, formTypes.ts)
2. Hook tests for the 5 most critical hooks:
   - useAuth (mock Supabase, test role detection, loading states)
   - useDashboardStats (mock queries, test data aggregation)
   - useDeliveries (test the useDelivery return value bug is fixed)
   - useActivityLog (test enabled condition works correctly)
   - useAutomations (test query builder chaining)
3. Component tests for:
   - RequireRole (test redirect on wrong role, render on correct role)
   - ErrorBoundary (test error catching and display)
4. Use @testing-library/react and MSW for API mocking
5. Add test:coverage script to package.json

Target: >60% coverage on hooks, >40% on components.
```

### Prompt 5.2 — CI Pipeline Setup

```
Create a GitHub Actions CI pipeline (.github/workflows/ci.yml):

1. On push to main and on PR:
   - Install dependencies (use bun for speed)
   - Run TypeScript type checking (tsc --noEmit)
   - Run ESLint
   - Run vitest with coverage
   - Run vite build (catch build errors)
2. Add branch protection rules documentation
3. Add pre-commit hook via husky:
   - lint-staged: run eslint --fix on staged .ts/.tsx files
4. Add a "build size" check that warns if any chunk exceeds 500KB

Create the workflow file and husky config. Do NOT run git push.
```

---

## Phase 6: Monitoring & Observability

### Prompt 6.1 — Error Tracking Setup

```
Add structured error tracking throughout the application:

1. Create src/lib/logger.ts with functions:
   - logError(error, context) — for caught errors
   - logWarning(message, data) — for non-fatal issues
   - logEvent(name, properties) — for analytics events
2. Replace all console.error/console.warn calls with the structured logger
3. In ErrorBoundary.tsx, log the caught error with full component stack
4. In useAuth.tsx, log auth failures with user context (no PII)
5. In all edge functions, add structured JSON logging with request_id correlation
6. Add a health check endpoint that returns { status, version, uptime }

The logger should be environment-aware:
- Development: console output with colors
- Production: JSON format suitable for log aggregation
```

---

## Execution Order

| Priority | Prompt | Impact | Effort |
|----------|--------|--------|--------|
| P0 | 1.2 Auth Unification | Fixes broken auth | Medium |
| P0 | 1.3 Edge Function Security | Fixes security holes | Medium |
| P1 | 2.1 React Query Optimisation | Fixes slow UI | Low |
| P1 | 3.1 Form Validation | Fixes data corruption | Medium |
| P1 | 2.3 Memory Leak Elimination | Fixes crashes | Low |
| P2 | 1.1 Database Schema Audit | Prevents future bugs | High |
| P2 | 3.2 TypeScript Strictness | Catches bugs at compile time | High |
| P2 | 4.1 Loading States | Better UX | Low |
| P3 | 2.2 Bundle Size | Faster load times | Medium |
| P3 | 4.2 Accessibility | Compliance | Medium |
| P3 | 5.1 Test Coverage | Prevents regressions | High |
| P4 | 5.2 CI Pipeline | Automation | Medium |
| P4 | 6.1 Error Tracking | Observability | Medium |
