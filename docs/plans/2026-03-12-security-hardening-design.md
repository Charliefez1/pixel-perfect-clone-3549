# NDG Hub: Enterprise Security Hardening Design

**Date:** 2026-03-12
**Branch:** claude/analysis-iterations-12M3b
**Status:** Approved

## Context

The NDG Hub is a React + Supabase business management platform built with Lovable (AI scaffold). It is being promoted from a vibecoded prototype to the enterprise-grade internal system for Neurodiversity Global, replacing Monday.com and Clarify as the source of truth for work and business management.

### Current State

- 30+ pages, 37 hooks, 7 edge functions, 25 migrations
- **All RLS policies are `USING (true) WITH CHECK (true)`** — any authenticated user can read/write/delete every row in every table
- No role system — auth hook exposes only `session`, `user`, `loading`
- Client portal takes `orgId` from URL with zero server-side authorization
- All data hooks fetch the entire table, client-side filtering only
- Storage policies allow any authenticated user to access any document
- Raw database error messages exposed to the UI
- Console.logs throughout, no production stripping
- Edge functions accept CORS from any origin
- Optimistic UI updates — mutations show success before database confirms

### Threat Model

Three user tiers planned:
- **Admin** (Charlie): Full access
- **Team** (Rich): Full access minus user management
- **Client**: Read-only, scoped to their own organisation's data

The primary risk vector is the client portal. Without RLS enforcement, a client user can query any table's full contents using the Supabase anon key (which is in the client bundle by design). This is a **data breach by default**, not a hypothetical.

---

## Design

### Phase 1: Database Security Layer

#### 1.1 New Tables

**`user_profiles`**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | FK → auth.users(id) |
| email | text | |
| full_name | text | |
| role | enum('admin','team','client') | Default: 'client' |
| organisation_id | uuid FK nullable | FK → organisations. Null for admin/team |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**`user_org_access`** (client → org mapping, supports multi-org access)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid FK | FK → auth.users(id) |
| organisation_id | uuid FK | FK → organisations(id) |
| access_level | enum('read','write') | |
| granted_by | uuid FK | FK → auth.users(id) |
| created_at | timestamptz | |

A database trigger on `auth.users` INSERT auto-creates a `user_profiles` row with `role = 'client'`. Admin/team roles assigned manually.

#### 1.2 RLS Policy Pattern

Drop all existing `USING (true)` policies. Replace with:

**Admin/team — full access:**
```sql
CREATE POLICY "admin_team_full_access" ON public.{table}
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'team')
    )
  );
```

**Client — read-only, org-scoped:**
```sql
CREATE POLICY "client_read_own_org" ON public.{table}
  FOR SELECT TO authenticated
  USING (
    organisation_id IN (
      SELECT organisation_id FROM user_org_access
      WHERE user_id = auth.uid()
    )
  );
```

**Org-scoped tables** (client gets SELECT):
projects, invoices, invoice_items, deals, proposals, contracts, tasks, deliveries, time_entries, activities, contacts, forms, form_responses, portal_messages, purchase_orders, comments, project_updates, sessions, session_agenda_items

**Admin/team only** (no client access):
automations, automation_logs, rate_cards, services, organisations (clients read their own org via user_org_access join)

#### 1.3 Storage Isolation

Directory structure enforced by RLS:
```
documents/{organisation_id}/projects/
documents/{organisation_id}/invoices/
documents/{organisation_id}/contracts/
```

Policies:
- Admin/team: full access to all paths
- Client: SELECT only on `documents/{their_org_id}/**`

Replace current blanket `bucket_id = 'documents'` policy.

#### 1.4 Audit Columns

Add to all core tables:
```sql
updated_by uuid REFERENCES auth.users(id),
updated_at timestamptz DEFAULT now()
```

Database trigger on UPDATE auto-sets `updated_by = auth.uid()` and `updated_at = now()`.

---

### Phase 2: Auth & Session Hardening

#### 2.1 Role-Aware Auth Context

Extend `useAuth` hook:
```typescript
interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;  // role, org_id, full_name
  loading: boolean;
  isAdmin: boolean;
  isTeam: boolean;
  isClient: boolean;
  signOut: () => Promise<void>;
}
```

Profile fetched from `user_profiles` on login, cached. Role booleans derived. This is UI convenience — RLS is the security boundary.

#### 2.2 Route Protection

Three route groups:
- **Admin routes:** User management, automations, rate cards, services
- **Team routes:** Everything except user management
- **Client routes:** Portal view, their projects (read), their invoices (read), forms

`<RequireRole roles={['admin','team']}>` wrapper redirects unauthorized users. UX only, not a security boundary.

#### 2.3 Session Configuration

- JWT expiry: 1 hour (explicit)
- Refresh token rotation: enabled
- Refresh token reuse interval: 10 seconds
- Refresh failure: sign out + redirect to login (no broken state)

#### 2.4 Auth Flow Hardening

- Fixed redirect URL (no dynamic redirect params)
- Remove dev auto-signup from Auth.tsx
- Email confirmation required for client portal users
- New users created via admin invite only

---

### Phase 3: Error Handling & Observability

#### 3.1 Error Handling Pattern

Shared `handleSupabaseError()` utility:
- Maps known Supabase error codes to friendly messages
- Unknown errors → "Something went wrong. Please try again."
- No raw `error.message` ever reaches the UI in production
- Consistent toast notifications via Sonner

#### 3.2 Mutation Confirmation

- Disable optimistic updates on all mutations
- Loading state while mutation in flight
- UI updates only after server confirmation
- Failure: error toast + form stays open with user's data
- Success: invalidate React Query cache, refresh from server

#### 3.3 Audit Display

- Detail pages show "Last updated by [name] on [date]"
- No full audit log UI yet — data queryable in database

#### 3.4 Console Cleanup

- Vite production config: `esbuild: { drop: ['console'] }`
- One-line change, strips all console.* from production builds
- Dev builds retain console output

---

### Phase 4: Codebase Cleanup

#### 4.1 Dependency Audit

- Run `npm audit --fix`
- Update Supabase client to latest
- Remove `lovable-tagger` dev dependency

#### 4.2 CORS Lockdown

- Edge functions: `Access-Control-Allow-Origin` set to production domain only
- `ai-assistant` and `sync-*` functions validate JWT in Authorization header

#### 4.3 Environment Validation

- Startup check in `main.tsx` fails fast if required env vars are missing/malformed
- Prevents app loading with broken Supabase connection

---

## Success Criteria

- [ ] No table has a `USING (true)` RLS policy
- [ ] Client user cannot access data outside their organisation (verified by test)
- [ ] Client user cannot write to any table (verified by test)
- [ ] Storage objects scoped to organisation paths
- [ ] All mutations confirm server-side before UI update
- [ ] No raw error messages visible in production UI
- [ ] No console.log output in production build
- [ ] Edge functions reject non-allowed origins
- [ ] Refresh token rotation enabled
- [ ] `npm audit` returns 0 critical/high vulnerabilities
- [ ] Audit columns present on all core tables

## Non-Goals (for this phase)

- Full event sourcing / audit log UI
- Rate limiting
- Multi-tenancy
- Feature work or new pages
- Test coverage (comes in next phase)
