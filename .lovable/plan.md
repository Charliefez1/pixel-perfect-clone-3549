

## Fix: Create Missing `StatusBadge` Component

The site won't load because multiple pages import `@/components/ui/StatusBadge`, but this file doesn't exist, causing build failure.

### Plan
Create `src/components/ui/StatusBadge.tsx` — a simple component that renders a styled badge based on a `status` string prop. It should:

- Accept a `status` prop (string)
- Map common statuses (draft, sent, paid, overdue, active, completed, cancelled, pending, in_progress, etc.) to appropriate badge variants/colors
- Use the existing `Badge` component from `@/components/ui/badge` as the base
- Export as a named export `StatusBadge`

**Single file to create**: `src/components/ui/StatusBadge.tsx`

No other changes needed — all imports across the codebase already reference this path.

