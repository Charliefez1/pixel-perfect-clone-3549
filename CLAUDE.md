# CLAUDE.md — Project Instructions

## Project Overview

This is a React + TypeScript single-page application built with Vite, using shadcn/ui components, Tailwind CSS for styling, Supabase for backend, and React Router for navigation.

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build**: Vite 5 with SWC (via @vitejs/plugin-react-swc)
- **Styling**: Tailwind CSS 3 with tailwindcss-animate, PostCSS, HSL CSS custom properties
- **UI Components**: shadcn/ui (Radix UI primitives + Tailwind)
- **Routing**: React Router v6
- **State/Data**: TanStack React Query, React Hook Form + Zod validation
- **Backend**: Supabase (auth, database, realtime)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Testing**: Vitest + @testing-library/react + jsdom
- **Linting**: ESLint 9 with TypeScript and React plugins

## Commands

```bash
npm run dev          # Start dev server on port 8080
npm run build        # Production build
npm run build:dev    # Development build
npm run lint         # Run ESLint
npm run test         # Run tests (vitest run)
npm run test:watch   # Run tests in watch mode
```

## Project Structure

```
src/
├── components/
│   ├── ui/              # shadcn/ui base components (DO NOT modify without good reason)
│   ├── layout/          # Layout components (sidebar, header, etc.)
│   ├── projects/        # Project-related feature components
│   ├── tasks/           # Task-related feature components
│   ├── invoices/        # Invoice-related feature components
│   ├── documents/       # Document-related feature components
│   ├── sessions/        # Session-related feature components
│   ├── dialogs/         # Dialog/modal components
│   ├── activity/        # Activity feed components
│   └── ai/              # AI-related feature components
├── pages/               # Route page components
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions (cn, utils)
├── integrations/
│   └── supabase/        # Supabase client, types, hooks
├── test/                # Test setup files
├── App.tsx              # Root component with router
├── main.tsx             # Entry point
└── index.css            # Global styles and Tailwind directives
```

## Path Aliases

- `@/*` maps to `./src/*` (configured in tsconfig.json and vite.config.ts)
- Always use `@/` imports for project files: `import { Button } from "@/components/ui/button"`

## Code Style & Conventions

### TypeScript

- Use TypeScript for all new files (`.ts`/`.tsx`)
- Define interfaces for component props (prefer `interface` over `type` for object shapes)
- Use explicit return types on exported functions and hooks
- Leverage Zod schemas for runtime validation alongside TypeScript types
- Use `@/` path alias for all imports — never use relative paths like `../../`

### React Patterns

- Use functional components exclusively — no class components
- Prefer named exports over default exports for components
- Use React hooks for state and side effects; extract reusable logic into custom hooks in `src/hooks/`
- Keep components focused — extract sub-components when a file exceeds ~150 lines
- Memoize expensive computations with `useMemo` and callbacks with `useCallback` only when there's a measurable need
- Use React Router's `useNavigate`, `useParams`, `useSearchParams` for navigation
- Wrap data fetching in TanStack React Query hooks (`useQuery`, `useMutation`)
- Handle loading and error states explicitly in every data-fetching component

### Component Patterns (shadcn/ui)

- Use existing `src/components/ui/` components — do not create custom versions of components that already exist
- Follow shadcn/ui composition patterns: `<Card><CardHeader><CardTitle>` etc.
- Use `class-variance-authority` (cva) for component variant definitions
- Use `cn()` from `@/lib/utils` to merge Tailwind classes (never concatenate class strings manually)
- Use Radix UI primitives via shadcn/ui for accessible interactive components (dialogs, dropdowns, tooltips, etc.)

### Styling (Tailwind CSS)

- Use Tailwind utility classes exclusively — no custom CSS unless absolutely unavoidable
- Use the project's CSS custom properties for colors: `bg-primary`, `text-muted-foreground`, etc.
- Follow mobile-first responsive design: `base` → `sm:` → `md:` → `lg:` → `xl:`
- Use the project's spacing scale consistently — avoid arbitrary values like `p-[13px]`
- Dark mode is supported via class strategy — always consider both light and dark variants
- Use `tailwind-merge` (via `cn()`) to handle class conflicts when composing styles

### Design System & UI/UX Principles

- **Consistency**: Reuse existing components and design tokens — don't introduce new colors, spacing, or typography outside the established system
- **Hierarchy**: Use clear visual hierarchy with proper heading levels, font weights, and spacing
- **Accessibility**: Ensure all interactive elements have proper ARIA labels, keyboard navigation, and focus indicators
- **Feedback**: Provide clear loading states, error messages, and success confirmations (use `sonner` for toasts)
- **Responsiveness**: All layouts must work on mobile (320px+), tablet, and desktop viewports
- **Motion**: Use `tailwindcss-animate` utilities for micro-interactions; keep animations subtle and purposeful
- **Typography**: Use Plus Jakarta Sans (primary font) consistently; respect the type scale defined in Tailwind config

### Forms

- Use React Hook Form + Zod for all forms
- Define Zod schemas alongside form components
- Use shadcn/ui form components: `<Form>`, `<FormField>`, `<FormItem>`, `<FormLabel>`, `<FormMessage>`
- Show inline validation errors below fields
- Disable submit buttons during submission; show loading state

### Data Fetching

- Use TanStack React Query for all server state
- Define query keys consistently — use arrays: `["projects", projectId]`
- Use `useMutation` with `onSuccess` invalidation for writes
- Supabase client is configured in `src/integrations/supabase/`

### Testing

- Write tests in `src/**/*.test.tsx` or `src/**/*.spec.tsx`
- Use `@testing-library/react` with `render`, `screen`, `userEvent`
- Test user-visible behavior, not implementation details
- Run `npm run test` to execute all tests
- Test setup is in `src/test/setup.ts`

### Error Handling

- Use Error Boundaries for component-level error catching
- Show user-friendly error messages — never expose raw error objects or stack traces
- Log errors for debugging but present graceful fallbacks to users
- Handle Supabase errors consistently — check for `error` in responses

## Code Review Checklist

When reviewing or writing code, verify:

1. **Correctness**: Logic is sound, edge cases handled, no regressions
2. **Types**: TypeScript types are accurate and helpful, no unnecessary `any`
3. **Performance**: No unnecessary re-renders, expensive ops are memoized where needed
4. **Accessibility**: Interactive elements have labels, keyboard support, proper ARIA
5. **Security**: No XSS vectors, user input is validated, Supabase RLS is respected
6. **Consistency**: Follows existing patterns in the codebase, uses established utilities
7. **Tests**: New functionality has tests, existing tests still pass

## Architecture Guidelines

- **Feature-based organization**: Group related components, hooks, and utilities by feature domain
- **Single Responsibility**: Each module/component should have one clear purpose
- **DRY but not premature**: Extract shared logic only after it's used in 3+ places
- **Composition over inheritance**: Build complex UIs by composing smaller components
- **Colocation**: Keep related code close together (tests next to source, types next to usage)
- **Separation of concerns**: Keep data fetching in hooks, presentation in components, validation in schemas

## Do NOT

- Do not modify `src/components/ui/` base components unless fixing a bug or adding a missing variant
- Do not install new dependencies without justification — prefer existing libraries
- Do not use `any` type — use `unknown` and narrow with type guards if the type is truly unknown
- Do not write inline styles — use Tailwind classes
- Do not commit `.env` files or hardcoded secrets
- Do not use `index.ts` barrel exports excessively — they can cause circular dependencies and bundle size issues
