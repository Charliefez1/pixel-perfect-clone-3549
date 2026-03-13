

## Fix: Two Build Errors Preventing Site Load

### Error 1: `useAuth.tsx` — `role` column doesn't exist on `profiles`
The `profiles` table has no `role` column. Roles are stored in the `user_roles` table. The fix:
- Remove `role, organisation_id` from the profiles SELECT query
- Instead, do a second query to `user_roles` to fetch the user's role
- Update the `UserProfile` type to remove `organisation_id` (it doesn't exist on profiles either) or keep it optional
- Alternatively, join `user_roles` via a separate lookup after fetching the profile

**Approach**: After fetching the profile, query `user_roles` for the user's role. Merge into the returned profile object.

**File**: `src/hooks/useAuth.tsx` (lines 35-44)
- Change SELECT to: `"id, user_id, display_name, email, avatar_url"`
- After profile fetch, query `user_roles` table: `select('role').eq('user_id', userId).single()`
- Combine into the UserProfile object with role defaulting to `'client'`

**File**: `src/types/auth.ts`
- Remove `organisation_id` from `UserProfile` (or keep as optional) since it's not on the profiles table

### Error 2: `useDeliveries.ts` — `forms` join type mismatch
The `deliveries` table has no direct FK to `forms`, so `forms(title)` returns an array `{ title: string }[]` instead of a single object `{ title: string }`.

**File**: `src/hooks/useDeliveries.ts` (line 41)
- Change `forms?: { title: string } | null` to `forms?: { title: string }[] | null`

Both fixes are small and will unblock the build immediately.

