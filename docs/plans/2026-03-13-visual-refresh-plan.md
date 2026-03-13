# NDG Hub Visual Refresh — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform NDG Hub from its Lovable-scaffolded aesthetic to a distinctive, production-grade design system with configurable accent colors (5 swatches) and light/dark/system mode support.

**Architecture:** CSS variable-based theming. A `ThemeProvider` React context reads/writes two Supabase `profiles` columns (`theme_accent`, `theme_mode`). The provider sets `data-accent` and `class` (dark) attributes on `<html>`, which cascade through CSS variables to all components. No component-level theme logic — everything flows through the token system.

**Tech Stack:** React 18, TypeScript, Tailwind CSS (class-based dark mode), Supabase (Postgres + RLS), shadcn/ui, Fontshare (Satoshi + General Sans), CSS custom properties.

**Design doc:** `docs/plans/2026-03-13-visual-refresh-design.md`

---

## Task 1: Database Migration — Add Theme Columns

**Files:**
- Create: `supabase/migrations/20260313100000_add_theme_preferences.sql`

**Step 1: Write the migration**

```sql
-- Add theme preference columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS theme_accent text NOT NULL DEFAULT 'steel'
    CHECK (theme_accent IN ('sky', 'steel', 'mint', 'amber', 'purple')),
  ADD COLUMN IF NOT EXISTS theme_mode text NOT NULL DEFAULT 'system'
    CHECK (theme_mode IN ('light', 'dark', 'system'));

-- Allow users to update their own theme preferences
-- (RLS already restricts profiles to own row via Phase 1 security policies)
```

**Step 2: Verify migration syntax**

Run: `cat supabase/migrations/20260313100000_add_theme_preferences.sql`
Expected: Valid SQL with CHECK constraints

**Step 3: Update TypeScript types manually**

Modify: `src/integrations/supabase/types.ts` — Add `theme_accent` and `theme_mode` to the profiles type.

In the `profiles` → `Row` type, add:
```typescript
theme_accent: string
theme_mode: string
```

In `Insert`, add:
```typescript
theme_accent?: string
theme_mode?: string
```

In `Update`, add:
```typescript
theme_accent?: string
theme_mode?: string
```

**Step 4: Commit**

```bash
git add supabase/migrations/20260313100000_add_theme_preferences.sql src/integrations/supabase/types.ts
git commit -m "feat: add theme_accent and theme_mode columns to profiles"
```

---

## Task 2: Font Loading — Satoshi + General Sans

**Files:**
- Modify: `index.html`
- Modify: `src/index.css` (font imports section only)

**Step 1: Add Fontshare CSS links to index.html**

In `index.html`, inside `<head>`, add before `</head>`:

```html
<link href="https://api.fontshare.com/v2/css?f[]=satoshi@500,700&display=swap" rel="stylesheet">
<link href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600&display=swap" rel="stylesheet">
```

**Step 2: Remove old font imports from index.css**

Remove these lines from the top of `src/index.css`:
```css
@import "@fontsource/plus-jakarta-sans/400.css";
@import "@fontsource/plus-jakarta-sans/500.css";
@import "@fontsource/plus-jakarta-sans/600.css";
@import "@fontsource/plus-jakarta-sans/700.css";
@import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans&display=swap");
@import url("https://fonts.googleapis.com/css2?family=JetBrains+Mono&display=swap");
```

Keep `@tailwind base; @tailwind components; @tailwind utilities;` as-is.

**Step 3: Update body font-family in index.css**

In the `body` rule (around line 173), change:
```css
font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
```
to:
```css
font-family: 'General Sans', system-ui, -apple-system, sans-serif;
```

In the `h1, h2, h3, h4, h5, h6` rule, change:
```css
font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
```
to:
```css
font-family: 'Satoshi', system-ui, -apple-system, sans-serif;
```

**Step 4: Update tailwind.config.ts font families**

In `tailwind.config.ts`, change the `fontFamily.sans` array:
```typescript
sans: [
  'General Sans',
  'ui-sans-serif',
  'system-ui',
  'sans-serif',
],
```

Add a new `heading` family:
```typescript
heading: [
  'Satoshi',
  'ui-sans-serif',
  'system-ui',
  'sans-serif',
],
```

Keep `mono` as-is (JetBrains Mono is loaded via the existing Google Fonts link — re-add if removed):
```html
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono&display=swap" rel="stylesheet">
```

**Step 5: Verify fonts load**

Run: `npm run dev`
Open browser, inspect `<body>` computed font. Expected: "General Sans"
Inspect any `<h1>`. Expected: "Satoshi" (after Task 3 applies heading classes)

**Step 6: Commit**

```bash
git add index.html src/index.css tailwind.config.ts
git commit -m "feat: switch fonts to Satoshi (headings) + General Sans (body)"
```

---

## Task 3: CSS Variables Rewrite — Full Token System

**Files:**
- Modify: `src/index.css` (full rewrite of `:root` and `.dark` blocks, plus accent data attributes)

**Step 1: Replace the entire `:root` block**

Replace the `@layer base { :root { ... } }` section with the new light mode tokens. The new `:root` becomes the light mode default:

```css
@layer base {
  :root {
    /* Core palette — Light Mode */
    --background: 0 0% 94.5%;
    --background-elevated: 0 0% 100%;
    --background-subtle: 0 0% 92%;
    --foreground: 0 0% 10%;
    --foreground-muted: 0 0% 42%;
    --foreground-subtle: 0 0% 58%;

    --card: 0 0% 100%;
    --card-foreground: 0 0% 10%;

    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 10%;

    --primary: var(--accent);
    --primary-hover: var(--accent-hover);
    --primary-foreground: var(--accent-foreground);

    --secondary: 0 0% 96%;
    --secondary-foreground: 0 0% 10%;

    --muted: 60 3% 89%;
    --muted-foreground: 0 0% 42%;

    --accent: 200 49% 58%;
    --accent-foreground: 0 0% 100%;
    --accent-muted: 200 49% 58% / 0.12;
    --accent-hover: 200 49% 50%;

    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;

    --success: 142 76% 36%;
    --success-foreground: 0 0% 100%;

    --warning: 38 92% 50%;
    --warning-foreground: 0 0% 9%;

    --info: 199 89% 48%;
    --info-foreground: 0 0% 100%;

    --border: 60 4% 85%;
    --input: 60 4% 85%;
    --ring: var(--accent);

    /* Radius scale */
    --radius: 0.5rem;
    --radius-sm: 6px;
    --radius-md: 8px;
    --radius-lg: 14px;
    --radius-xl: 16px;

    /* Shadow scale */
    --shadow-sm: 0 1px 3px rgba(0,0,0,0.04);
    --shadow-md: 0 4px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04);
    --shadow-lg: 0 12px 32px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04);

    /* Motion */
    --duration-fast: 100ms;
    --duration-normal: 200ms;
    --duration-slow: 300ms;

    /* Sidebar — Light */
    --sidebar-background: 0 0% 100%;
    --sidebar-foreground: 0 0% 10%;
    --sidebar-primary: var(--accent);
    --sidebar-primary-foreground: var(--accent-foreground);
    --sidebar-accent: var(--accent-muted);
    --sidebar-accent-foreground: 0 0% 10%;
    --sidebar-border: 60 5% 90%;
    --sidebar-ring: var(--accent);

    /* Cognitive state colors */
    --state-clear: 142 71% 45%;
    --state-stretched: 38 92% 50%;
    --state-overloaded: 25 95% 53%;
    --state-critical: 0 84% 60%;

    /* Pipeline stage colors */
    --stage-lead: 210 60% 55%;
    --stage-qualified: 190 60% 50%;
    --stage-proposal: 45 90% 55%;
    --stage-negotiation: 30 90% 55%;
    --stage-verbal: 142 71% 45%;
    --stage-won: 142 60% 40%;
    --stage-lost: 0 60% 50%;

    /* Priority colors */
    --priority-critical: 0 84% 60%;
    --priority-high: 25 95% 53%;
    --priority-medium: 38 92% 50%;
    --priority-low: 0 0% 64%;
  }
```

**Step 2: Replace the `.dark` block**

```css
  .dark {
    --background: 0 0% 33%;
    --background-elevated: 0 0% 39%;
    --background-subtle: 0 0% 29%;
    --foreground: 0 0% 100%;
    --foreground-muted: 0 0% 69%;
    --foreground-subtle: 0 0% 55%;

    --card: 0 0% 39%;
    --card-foreground: 0 0% 100%;

    --popover: 0 0% 39%;
    --popover-foreground: 0 0% 100%;

    --primary: var(--accent);
    --primary-hover: var(--accent-hover);
    --primary-foreground: var(--accent-foreground);

    --secondary: 0 0% 37%;
    --secondary-foreground: 0 0% 100%;

    --muted: 0 0% 29%;
    --muted-foreground: 0 0% 69%;

    --destructive: 0 72% 51%;
    --destructive-foreground: 0 0% 100%;

    --success: 142 71% 45%;
    --success-foreground: 0 0% 100%;

    --warning: 38 92% 50%;
    --warning-foreground: 0 0% 9%;

    --info: 199 89% 48%;
    --info-foreground: 0 0% 100%;

    --border: 0 0% 41%;
    --input: 0 0% 41%;
    --ring: var(--accent);

    --sidebar-background: 0 0% 29%;
    --sidebar-foreground: 0 0% 100%;
    --sidebar-primary: var(--accent);
    --sidebar-primary-foreground: var(--accent-foreground);
    --sidebar-accent: var(--accent-muted);
    --sidebar-accent-foreground: 0 0% 100%;
    --sidebar-border: 0 0% 35%;
    --sidebar-ring: var(--accent);
  }
```

**Step 3: Add accent swatch selectors**

After the `.dark` block, before the closing `}` of `@layer base`, add:

```css
  /* Accent color swatches */
  [data-accent="sky"] {
    --accent: 200 65% 79%;
    --accent-foreground: 200 65% 15%;
    --accent-muted: 200 65% 79% / 0.15;
    --accent-hover: 200 65% 70%;
  }

  [data-accent="steel"] {
    --accent: 200 49% 58%;
    --accent-foreground: 0 0% 100%;
    --accent-muted: 200 49% 58% / 0.12;
    --accent-hover: 200 49% 50%;
  }

  [data-accent="mint"] {
    --accent: 148 47% 68%;
    --accent-foreground: 148 47% 12%;
    --accent-muted: 148 47% 68% / 0.15;
    --accent-hover: 148 47% 58%;
  }

  [data-accent="amber"] {
    --accent: 40 90% 44%;
    --accent-foreground: 0 0% 100%;
    --accent-muted: 40 90% 44% / 0.12;
    --accent-hover: 40 90% 38%;
  }

  [data-accent="purple"] {
    --accent: 245 82% 71%;
    --accent-foreground: 0 0% 100%;
    --accent-muted: 245 82% 71% / 0.12;
    --accent-hover: 245 82% 62%;
  }
```

**Step 4: Update typography utilities**

Update the typography utility classes at the bottom of `src/index.css`:

```css
@layer utilities {
  .text-page-title {
    font-family: 'Satoshi', system-ui, sans-serif;
    @apply text-[28px] font-bold tracking-tight;
  }

  .text-section-title {
    font-family: 'Satoshi', system-ui, sans-serif;
    @apply text-base font-medium;
  }

  .text-body-medium {
    @apply text-sm font-medium;
  }

  .text-label {
    @apply text-xs font-medium;
  }

  .text-caption {
    @apply text-xs text-muted-foreground;
  }

  .text-overline {
    @apply text-[11px] font-medium uppercase tracking-widest;
  }
}
```

**Step 5: Verify the build compiles**

Run: `npm run build`
Expected: No CSS compilation errors

**Step 6: Commit**

```bash
git add src/index.css
git commit -m "feat: rewrite CSS tokens for visual refresh — light/dark palettes + 5 accent swatches"
```

---

## Task 4: Tailwind Config — Accent Color Mapping

**Files:**
- Modify: `tailwind.config.ts`

**Step 1: Update the accent color mapping**

In `tailwind.config.ts`, update the `colors.accent` object:

```typescript
accent: {
  DEFAULT: 'hsl(var(--accent))',
  foreground: 'hsl(var(--accent-foreground))',
  muted: 'hsl(var(--accent-muted))',
  hover: 'hsl(var(--accent-hover))',
},
```

**Step 2: Add page-entrance animation keyframes**

In the `keyframes` section, add:

```typescript
'fade-in-up': {
  '0%': { opacity: '0', transform: 'translateY(8px)' },
  '100%': { opacity: '1', transform: 'translateY(0)' },
},
```

And in `animation`:
```typescript
'fade-in-up': 'fade-in-up 0.2s ease-out forwards',
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Success

**Step 4: Commit**

```bash
git add tailwind.config.ts
git commit -m "feat: extend Tailwind config with accent tokens and entrance animation"
```

---

## Task 5: ThemeProvider — React Context

**Files:**
- Create: `src/providers/ThemeProvider.tsx`

**Step 1: Create the ThemeProvider**

```typescript
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type AccentColor = "sky" | "steel" | "mint" | "amber" | "purple";
type ThemeMode = "light" | "dark" | "system";

interface ThemeContextType {
  accent: AccentColor;
  mode: ThemeMode;
  resolvedMode: "light" | "dark";
  setAccent: (accent: AccentColor) => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  accent: "steel",
  mode: "system",
  resolvedMode: "light",
  setAccent: () => {},
  setMode: () => {},
});

export const useTheme = () => useContext(ThemeContext);

function getSystemMode(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveMode(mode: ThemeMode): "light" | "dark" {
  return mode === "system" ? getSystemMode() : mode;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [accent, setAccentState] = useState<AccentColor>("steel");
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [resolvedMode, setResolvedMode] = useState<"light" | "dark">(getSystemMode());

  // Sync from profile on load
  useEffect(() => {
    if (profile) {
      const profileAccent = (profile as any).theme_accent as AccentColor | undefined;
      const profileMode = (profile as any).theme_mode as ThemeMode | undefined;
      if (profileAccent) setAccentState(profileAccent);
      if (profileMode) setModeState(profileMode);
    }
  }, [profile]);

  // Apply to DOM
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-accent", accent);

    const resolved = resolveMode(mode);
    setResolvedMode(resolved);

    if (resolved === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [accent, mode]);

  // Listen for system theme changes
  useEffect(() => {
    if (mode !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setResolvedMode(getSystemMode());
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [mode]);

  // Persist accent to Supabase
  const setAccent = useCallback(async (newAccent: AccentColor) => {
    setAccentState(newAccent);
    if (profile) {
      await supabase
        .from("profiles")
        .update({ theme_accent: newAccent })
        .eq("id", profile.id);
    }
  }, [profile]);

  // Persist mode to Supabase
  const setMode = useCallback(async (newMode: ThemeMode) => {
    setModeState(newMode);
    if (profile) {
      await supabase
        .from("profiles")
        .update({ theme_mode: newMode })
        .eq("id", profile.id);
    }
  }, [profile]);

  return (
    <ThemeContext.Provider value={{ accent, mode, resolvedMode, setAccent, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

**Step 2: Verify no import errors**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors related to ThemeProvider

**Step 3: Commit**

```bash
git add src/providers/ThemeProvider.tsx
git commit -m "feat: add ThemeProvider with accent + mode persistence to Supabase"
```

---

## Task 6: Wire ThemeProvider into App.tsx

**Files:**
- Modify: `src/App.tsx`

**Step 1: Add ThemeProvider import**

Add to imports:
```typescript
import { ThemeProvider } from "@/providers/ThemeProvider";
```

**Step 2: Wrap AppShell with ThemeProvider**

In the `App` component at the bottom of the file, wrap inside `AuthProvider`:

```typescript
const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider>
        <TooltipProvider>
          <ErrorBoundary>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppShell />
            </BrowserRouter>
          </ErrorBoundary>
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);
```

**Step 3: Also update the profile fetch in useAuth.tsx**

In `src/hooks/useAuth.tsx`, update the `fetchProfile` select to include the new columns:

Change:
```typescript
.select("id, user_id, display_name, email, role, organisation_id")
```
to:
```typescript
.select("id, user_id, display_name, email, role, organisation_id, theme_accent, theme_mode")
```

And update the `UserProfile` type in `src/types/auth.ts` (or wherever it's defined) to include:
```typescript
theme_accent?: string;
theme_mode?: string;
```

**Step 4: Verify app boots**

Run: `npm run dev`
Expected: App loads, defaults to Steel accent + System mode

**Step 5: Commit**

```bash
git add src/App.tsx src/hooks/useAuth.tsx src/types/auth.ts
git commit -m "feat: wire ThemeProvider into app shell and extend profile fetch"
```

---

## Task 7: Settings Page — Theme Picker UI

**Files:**
- Create: `src/components/settings/ThemePicker.tsx`
- Modify: `src/pages/Dashboard.tsx` or create `src/pages/Settings.tsx`

**Note:** There is no dedicated Settings page currently. We'll add a theme picker as a floating settings panel or integrate into an existing page. For now, create the component and mount it in the sidebar's settings section.

**Step 1: Create ThemePicker component**

```typescript
import { useTheme } from "@/providers/ThemeProvider";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const accents = [
  { id: "sky" as const, hex: "#a8d4eb", label: "Sky" },
  { id: "steel" as const, hex: "#5ea6cc", label: "Steel" },
  { id: "mint" as const, hex: "#88d4ab", label: "Mint" },
  { id: "amber" as const, hex: "#d4910a", label: "Amber" },
  { id: "purple" as const, hex: "#7f77f1", label: "Purple" },
];

const modes = [
  { id: "light" as const, label: "Light", icon: Sun },
  { id: "dark" as const, label: "Dark", icon: Moon },
  { id: "system" as const, label: "System", icon: Monitor },
];

export function ThemePicker() {
  const { accent, mode, setAccent, setMode } = useTheme();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-section-title mb-1">Appearance</h3>
        <p className="text-caption">Customize your workspace look and feel.</p>
      </div>

      {/* Mode toggle */}
      <div className="space-y-2">
        <label className="text-label text-foreground-muted">Mode</label>
        <div className="flex gap-2">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                mode === m.id
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "bg-muted text-foreground-muted hover:bg-muted/80"
              )}
            >
              <m.icon className="h-4 w-4" />
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Accent color picker */}
      <div className="space-y-2">
        <label className="text-label text-foreground-muted">Accent Color</label>
        <div className="flex gap-3">
          {accents.map((a) => (
            <button
              key={a.id}
              onClick={() => setAccent(a.id)}
              className="group flex flex-col items-center gap-1.5"
              title={a.label}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150",
                  "ring-2 ring-offset-2 ring-offset-background",
                  accent === a.id ? "ring-foreground scale-110" : "ring-transparent hover:ring-border"
                )}
                style={{ backgroundColor: a.hex }}
              >
                {accent === a.id && (
                  <Check
                    className="h-4 w-4"
                    style={{
                      color: ["sky", "mint"].includes(a.id) ? "#1a1a1a" : "#ffffff",
                    }}
                  />
                )}
              </div>
              <span className="text-[10px] text-foreground-muted group-hover:text-foreground transition-colors">
                {a.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Create a Settings page**

Create `src/pages/Settings.tsx`:

```typescript
import { ThemePicker } from "@/components/settings/ThemePicker";

export default function Settings() {
  return (
    <div className="p-6 max-w-2xl animate-fade-in-up">
      <h1 className="text-page-title mb-8">Settings</h1>
      <div className="bg-card rounded-[14px] p-6 shadow-sm border border-border">
        <ThemePicker />
      </div>
    </div>
  );
}
```

**Step 3: Add route in App.tsx**

Add the lazy import:
```typescript
const Settings = lazy(() => import("@/pages/Settings"));
```

Add route inside `<Route element={<ProtectedRoutes />}>`:
```typescript
<Route path="/settings" element={<Settings />} />
```

**Step 4: Add sidebar link**

In `src/components/layout/AppSidebar.tsx`, add a Settings nav item that links to `/settings` in the bottom section (near the existing Templates/Services items).

**Step 5: Verify picker works**

Run: `npm run dev`
Navigate to `/settings`. Click accent swatches — expect instant color change across all UI. Toggle light/dark/system — expect mode switch.

**Step 6: Commit**

```bash
git add src/components/settings/ThemePicker.tsx src/pages/Settings.tsx src/App.tsx src/components/layout/AppSidebar.tsx
git commit -m "feat: add Settings page with theme picker (accent color + light/dark/system)"
```

---

## Task 8: Sidebar Restyle

**Files:**
- Modify: `src/components/layout/AppSidebar.tsx`

**Step 1: Update sidebar section headers**

Replace any section header text rendering with uppercase overline-style labels:

For section dividers, use:
```tsx
<span className="text-overline text-sidebar-foreground/50 px-3">MENU</span>
```

And for the workspace section:
```tsx
<span className="text-overline text-sidebar-foreground/50 px-3">WORKSPACE</span>
```

**Step 2: Update active item styling**

For active sidebar items, apply accent left-border + accent-muted background:

```tsx
className={cn(
  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150",
  isActive
    ? "bg-accent-muted border-l-2 border-accent text-foreground font-medium"
    : "text-foreground-muted hover:bg-muted hover:text-foreground"
)}
```

**Step 3: Update sidebar background**

The sidebar should use `--sidebar-background` and `--sidebar-foreground` tokens (already mapped in CSS). Ensure the sidebar wrapper uses:
```tsx
className="bg-sidebar text-sidebar-foreground border-r border-sidebar-border"
```

**Step 4: Move Settings to bottom**

Ensure the Settings link is pinned at the bottom of the sidebar with a `Cog` icon from lucide-react.

**Step 5: Verify**

Run: `npm run dev`
Expected: Sidebar has uppercase section labels, accent-colored active states, correct light/dark backgrounds.

**Step 6: Commit**

```bash
git add src/components/layout/AppSidebar.tsx
git commit -m "feat: restyle sidebar with section labels, accent active states, and bottom-pinned settings"
```

---

## Task 9: Dashboard Greeting Refresh

**Files:**
- Modify: `src/pages/Dashboard.tsx`

**Step 1: Add greeting section**

At the top of the Dashboard page content (above stats cards), add a greeting block:

```tsx
function DashboardGreeting() {
  const { profile } = useAuth();

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const dateStr = now.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  const displayName = profile?.display_name || "there";

  return (
    <div className="space-y-1 mb-8">
      <p className="text-caption animate-fade-in-up" style={{ animationDelay: "0ms" }}>
        {dateStr}
      </p>
      <h1
        className="text-page-title animate-fade-in-up"
        style={{ animationDelay: "100ms" }}
      >
        {greeting}, {displayName}
      </h1>
      <p
        className="text-foreground-muted text-sm animate-fade-in-up"
        style={{ animationDelay: "200ms" }}
      >
        How can I help you today?
      </p>
    </div>
  );
}
```

**Step 2: Replace existing dashboard header with greeting**

Remove the old header bar/sticky section at the top of Dashboard and replace with `<DashboardGreeting />`.

**Step 3: Add quick action pills**

Below the greeting, add accent-colored action buttons:

```tsx
<div
  className="flex gap-2 mb-8 animate-fade-in-up"
  style={{ animationDelay: "300ms" }}
>
  {[
    { label: "Ask AI", icon: Sparkles },
    { label: "New Project", icon: Plus },
    { label: "Daily Brief", icon: FileText },
  ].map((action) => (
    <button
      key={action.label}
      className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent-muted text-accent-foreground text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-all duration-150"
    >
      <action.icon className="h-4 w-4" />
      {action.label}
    </button>
  ))}
</div>
```

Wire up the button clicks to existing handlers (AI panel, create project dialog, navigate to `/daily`).

**Step 4: Verify**

Run: `npm run dev`
Expected: Dashboard shows date, greeting with name, subtitle, and action pills. Staggered entrance animation.

**Step 5: Commit**

```bash
git add src/pages/Dashboard.tsx
git commit -m "feat: refresh dashboard with greeting section and quick action pills"
```

---

## Task 10: Card & Component Token Sweep

**Files:**
- Modify: Various page and component files

**Step 1: Global card style update**

Search for all components using `<Card>` from shadcn/ui. The shadcn Card component uses `bg-card text-card-foreground` by default, which will pick up our new tokens automatically.

Update the Card component's base styling if needed in `src/components/ui/card.tsx`:

```tsx
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-[14px] border border-border bg-card text-card-foreground shadow-sm",
        className
      )}
      {...props}
    />
  )
);
```

Key changes: `rounded-[14px]` (was `rounded-lg`), ensure `shadow-sm` is present.

**Step 2: Update button primary variant**

In `src/components/ui/button.tsx`, ensure the `default` variant uses accent tokens:

```tsx
default: "bg-primary text-primary-foreground hover:bg-primary-hover",
```

Since `--primary` now maps to `var(--accent)`, this works automatically.

**Step 3: Add theme transition to body**

In `src/index.css`, add to the `body` rule:

```css
transition: background-color 0.3s, color 0.3s;
```

**Step 4: Audit stat cards on Dashboard**

Review the stat cards in Dashboard.tsx. They should use `bg-card` backgrounds and `text-card-foreground` text. The accent-colored elements (like progress bars, highlights) should use `bg-accent` or `text-accent`.

**Step 5: Verify light and dark modes**

Run: `npm run dev`
Toggle between light/dark in Settings. Expected: Smooth 300ms transition. All cards, buttons, and text properly themed.

**Step 6: Commit**

```bash
git add src/components/ui/card.tsx src/components/ui/button.tsx src/index.css
git commit -m "feat: update card radius, button accent mapping, and theme transition"
```

---

## Task 11: Status Badges Standardization

**Files:**
- Create or modify: `src/components/ui/StatusBadge.tsx`

**Step 1: Create a reusable StatusBadge component**

```tsx
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  variant?: "success" | "warning" | "destructive" | "muted" | "info";
  className?: string;
}

const variantMap: Record<string, StatusBadgeProps["variant"]> = {
  completed: "success",
  done: "success",
  active: "success",
  "in-progress": "warning",
  "in progress": "warning",
  pending: "warning",
  overdue: "destructive",
  cancelled: "destructive",
  draft: "muted",
  planned: "info",
};

const dotColors: Record<NonNullable<StatusBadgeProps["variant"]>, string> = {
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
  muted: "bg-foreground-subtle",
  info: "bg-info",
};

export function StatusBadge({ status, variant, className }: StatusBadgeProps) {
  const resolved = variant || variantMap[status.toLowerCase()] || "muted";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium",
        "bg-muted text-foreground",
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", dotColors[resolved])} />
      {status}
    </span>
  );
}
```

**Step 2: Gradually replace inline badge implementations**

Search for status badge patterns across pages (Projects, Tasks, Invoices, Deliveries) and replace with `<StatusBadge>`. This is incremental — do the most-visible pages first (Projects, Tasks, Invoices).

**Step 3: Commit**

```bash
git add src/components/ui/StatusBadge.tsx
git commit -m "feat: add standardized StatusBadge component with semantic color dots"
```

---

## Task 12: Page-by-Page Visual Audit

**Files:**
- Modify: Multiple page files as needed

**Step 1: Audit each page for visual consistency**

Go through each of the 32 pages and verify:
1. Page title uses `.text-page-title` (Satoshi 700, 28px)
2. Section headers use `.text-section-title` (Satoshi 500, 16px)
3. Body text uses default font (General Sans 400, 14px)
4. Cards use `rounded-[14px]` and `shadow-sm`
5. Accent-colored interactive elements work in all 5 accent colors
6. Both light and dark modes render correctly

**Priority pages (do these first):**
1. Dashboard
2. Projects + ProjectDetail
3. Tasks
4. Invoices
5. Clients + ClientDetail
6. Contacts

**Step 2: Fix any hardcoded colors**

Search for hardcoded hex colors or HSL values in TSX files:
```bash
grep -rn '#[0-9a-fA-F]\{6\}' src/pages/ src/components/ --include="*.tsx" | head -30
```

Replace with token equivalents (`text-foreground`, `bg-card`, `border-border`, etc.).

**Step 3: Commit per batch**

```bash
git commit -m "feat: visual audit — update [PageName] pages to new design tokens"
```

Do 3-5 pages per commit.

---

## Task 13: Final Verification & Cleanup

**Files:**
- All modified files

**Step 1: Full build check**

Run: `npm run build`
Expected: Clean build, no errors

**Step 2: Visual QA matrix**

Test all 10 combinations (5 accents × 2 modes):
- Sky + Light, Sky + Dark
- Steel + Light, Steel + Dark
- Mint + Light, Mint + Dark
- Amber + Light, Amber + Dark
- Purple + Light, Purple + Dark

Check: Dashboard, sidebar, settings, projects page, invoices page.

**Step 3: Responsive check**

Verify sidebar collapse on mobile. Verify theme picker works on mobile.

**Step 4: Remove unused Plus Jakarta Sans packages**

```bash
npm uninstall @fontsource/plus-jakarta-sans
```

Update any remaining references.

**Step 5: Final commit**

```bash
git add -A
git commit -m "chore: visual refresh cleanup — remove old font packages, final QA fixes"
```

---

## Task Summary

| # | Task | Scope | Est. |
|---|------|-------|------|
| 1 | DB migration + types | 1 SQL file, 1 TS file | 5 min |
| 2 | Font loading | HTML + CSS + Tailwind | 10 min |
| 3 | CSS variables rewrite | index.css full rewrite | 15 min |
| 4 | Tailwind config updates | tailwind.config.ts | 5 min |
| 5 | ThemeProvider context | New provider | 15 min |
| 6 | Wire into App.tsx | App.tsx + useAuth | 5 min |
| 7 | Settings + ThemePicker | New page + component | 20 min |
| 8 | Sidebar restyle | AppSidebar.tsx | 15 min |
| 9 | Dashboard greeting | Dashboard.tsx | 15 min |
| 10 | Card/component sweep | UI primitives | 10 min |
| 11 | StatusBadge component | New component | 10 min |
| 12 | Page-by-page audit | 32 pages | 30 min |
| 13 | Final QA + cleanup | All files | 15 min |

**Total estimated: ~2.5 hours of implementation**
