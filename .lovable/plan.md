

## Plan: Apply This Project's Design System to NDG Hub Work

**Goal**: Replace the styling in "NDG Hub Work" (the screenshot app) with the design system from this project (the reference/inspiration).

### What Changes

The two projects share the same font stack (Satoshi/General Sans/JetBrains Mono) and similar architecture, but differ in these key areas:

**1. CSS Variables (`src/index.css`)**
- Replace NDG Hub Work's token system with this project's richer system including:
  - Multi-accent swatch system (sky, steel, mint, amber, purple) with `data-accent` attribute
  - Semantic tokens: `--background-elevated`, `--foreground-subtle`, `--accent-muted`, `--accent-hover`
  - Status colors: `--success`, `--warning`, `--info` with foreground pairs
  - Cognitive state colors, pipeline stage colors, priority colors
  - Motion tokens (`--duration-fast/normal/slow`)
  - Dark mode via `.dark` class instead of `[data-theme="dark"]`
  - Custom scrollbar and focus-visible styles

**2. Tailwind Config (`tailwind.config.ts`)**
- Add missing color mappings: `background.elevated`, `foreground.subtle`, `accent.muted`, `accent.hover`, `primary.hover`, `success`, `warning`, `info`
- Switch `darkMode` from `["selector", '[data-theme="dark"]']` to `["class"]`
- Add `transitionDuration` tokens and `borderRadius.xl`

**3. Layout Shell (`AppShell.tsx` → `AppLayout.tsx` pattern)**
- Replace `SidebarProvider`-based shell with this project's simpler flex layout using a custom `AppSidebar` + `MobileNav`
- Or keep `SidebarProvider` but apply this project's styling tokens

**4. Sidebar (`AppSidebar.tsx`)**
- Apply this project's styling: border-left active indicator, brand avatar at top, ⌘K search, section labels (MENU/WORKSPACE/ADMIN), AI Assistant + Settings at bottom, collapse toggle
- Update nav groups to match NDG Hub Work's routes but with this project's visual treatment

**5. UI Components**
- **Card**: Add `rounded-xl`, `transition-shadow duration-normal hover:shadow-md`
- **Badge**: Add `success`, `warning`, `info`, `outline` variants
- **Button**: Apply this project's focus ring styling and variant classes

**6. Page Components**
- Copy `PageHeader.tsx` and `ViewToggle.tsx` patterns (search bar, filter button, icon-based view toggles)

### Implementation Steps

1. **Replace `src/index.css`** in NDG Hub Work with this project's version (adapting any NDG Hub Work-specific tokens like `--surface`, `--text-2`, `--text-3` as aliases)
2. **Replace `tailwind.config.ts`** with this project's version
3. **Update `AppSidebar.tsx`** styling to match this project's active states, layout, and visual treatment
4. **Update `AppShell.tsx`** layout structure and dark mode toggle mechanism
5. **Update UI primitives**: `card.tsx`, `badge.tsx`, `button.tsx` with this project's versions
6. **Copy over** `PageHeader.tsx`, `ViewToggle.tsx` components
7. **Update ThemeProvider** to use `.dark` class instead of `[data-theme="dark"]`

### Important Note

Since I can only edit **this** project (the reference), I cannot directly modify NDG Hub Work. The implementation approach would be:
- I prepare all the files here as a reference
- You then switch to NDG Hub Work and ask me to apply these changes there

**Or** — if you open NDG Hub Work in Lovable, I can make the changes directly in that project.

### Scope
~7 files to update in NDG Hub Work. No database or backend changes needed — this is purely frontend styling.

