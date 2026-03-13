# NDG Hub Visual Refresh — Design Document

**Date:** 2026-03-13
**Branch:** `design/visual-refresh-v1`
**Status:** Approved

---

## 1. Overview

Full visual refresh of NDG Hub from its current Lovable-scaffolded aesthetic to a distinctive, production-grade design system with multi-theme support. Inspired by Leadly (warm dark), Noetics (clean light), and ClickUp (accent color picker).

**Key differentiator:** Configurable accent color system tailored for a neurodiversity platform where sensory preferences vary significantly.

---

## 2. Theme Architecture

### 2.1 System Design

CSS variable-based accent color system with light/dark mode toggle.

```
User preference = accent_color × mode
                  (5 options)    (light | dark | system)
```

Stored in Supabase `profiles` table:
- `profiles.theme_accent` — one of: `sky`, `steel`, `mint`, `amber`, `purple`
- `profiles.theme_mode` — one of: `light`, `dark`, `system`

**Default for new users:** `steel` + `system`

### 2.2 Mode Palettes

#### Light Mode

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#F1F1F1` | Page background |
| `--foreground` | `#1a1a1a` | Primary text |
| `--card` | `#ffffff` | Card surfaces |
| `--card-foreground` | `#1a1a1a` | Card text |
| `--muted` | `#e5e5e3` | Muted backgrounds |
| `--muted-foreground` | `#6b6b6b` | Secondary text |
| `--border` | `#dcdcd8` | Borders, dividers |
| `--input` | `#dcdcd8` | Input borders |
| `--ring` | `var(--accent)` | Focus rings |
| `--sidebar` | `#ffffff` | Sidebar background |
| `--sidebar-foreground` | `#1a1a1a` | Sidebar text |
| `--sidebar-border` | `#e8e8e4` | Sidebar dividers |

#### Dark Mode

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#545454` | Page background |
| `--foreground` | `#ffffff` | Primary text |
| `--card` | `#636363` | Card surfaces |
| `--card-foreground` | `#ffffff` | Card text |
| `--muted` | `#4a4a4a` | Muted backgrounds |
| `--muted-foreground` | `#b0b0b0` | Secondary text |
| `--border` | `rgba(255,255,255,0.12)` | Borders, dividers |
| `--input` | `rgba(255,255,255,0.12)` | Input borders |
| `--ring` | `var(--accent)` | Focus rings |
| `--sidebar` | `#4a4a4a` | Sidebar background |
| `--sidebar-foreground` | `#ffffff` | Sidebar text |
| `--sidebar-border` | `rgba(255,255,255,0.10)` | Sidebar dividers |

### 2.3 Accent Swatches

5 accent colors, each generating 4 CSS variables:

| Name | Hex | HSL | Character |
|------|-----|-----|-----------|
| **Sky** | `#a8d4eb` | `200, 65%, 79%` | Light, airy, calming |
| **Steel** | `#5ea6cc` | `200, 49%, 58%` | Confident, professional |
| **Mint** | `#88d4ab` | `148, 47%, 68%` | Fresh, natural, friendly |
| **Amber** | `#d4910a` | `40, 90%, 44%` | Warm, energetic, bold |
| **Purple** | `#7f77f1` | `245, 82%, 71%` | Creative, modern, vibrant |

Each swatch generates:

```css
--accent: <hsl>;                    /* primary accent */
--accent-foreground: <contrast>;    /* text on accent bg */
--accent-muted: <hsl at 15% opacity>; /* hover/active backgrounds */
--accent-hover: <hsl shifted>;      /* button hover state */
```

### 2.4 Semantic Colors (Fixed Across Themes)

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--destructive` | `#dc2626` | `#ef4444` | Errors, delete actions |
| `--success` | `#16a34a` | `#22c55e` | Completed, positive |
| `--warning` | `#d97706` | `#f59e0b` | Caution, pending |
| `--info` | `#0284c7` | `#38bdf8` | Informational |

---

## 3. Typography

### 3.1 Font Stack

| Role | Font | Source | Weights |
|------|------|--------|---------|
| **Headings** | Satoshi | fontshare.com (free commercial) | 500, 700 |
| **Body/UI** | General Sans | fontshare.com (free commercial) | 400, 500, 600 |
| **Monospace** | JetBrains Mono | (already installed) | 400 |

### 3.2 Type Scale

| Class | Font | Size | Weight | Usage |
|-------|------|------|--------|-------|
| `.text-page-title` | Satoshi | 28px | 700 | Page headings |
| `.text-section-title` | Satoshi | 16px | 500 | Card/section headings |
| `.text-body` | General Sans | 14px | 400 | Body text |
| `.text-body-medium` | General Sans | 14px | 500 | Emphasized body |
| `.text-label` | General Sans | 12px | 500 | Form labels |
| `.text-caption` | General Sans | 12px | 400 | Captions, muted |
| `.text-overline` | General Sans | 11px | 500 | Uppercase labels, tracked |

---

## 4. Component Design

### 4.1 Cards

- `border-radius: 14px`
- Padding: `20px`
- Light: white surface, `0 1px 3px rgba(0,0,0,0.04)` shadow
- Dark: `#636363` surface, `1px solid rgba(255,255,255,0.08)` border
- Hover: border transitions to `var(--accent-muted)` (150ms)

### 4.2 Sidebar

- Collapsible (icon-only when collapsed)
- Section dividers with uppercase labels: MENU, WORKSPACE (like Noetics)
- Active item: left border in accent color + accent-muted background
- User avatar + name at top
- Settings pinned to bottom
- Light mode: white sidebar. Dark mode: `#4a4a4a` sidebar

### 4.3 Dashboard Greeting

- Date line: "Thu, 13 Mar" in caption style
- Greeting: "Good morning, Charlie" in page-title style (Satoshi 700)
- Subtitle: "How can I help you today?" in muted text
- Quick action pills: "Ask AI", "New Project", "Daily Brief" — accent-colored

### 4.4 Status Badges

Consistent pill shape across all pages:
- Small colored dot (6px) + text
- Rounded full pill shape
- Semantic colors: green for done, amber for in-progress, red for overdue, gray for draft

### 4.5 Avatar Stacks

- 28px circles, overlapping by 8px
- 2px border matching card background color
- "+3" overflow counter in muted pill
- Used on: project cards, task rows, meeting entries

### 4.6 Data Tables

- No alternating row colors
- Subtle bottom border per row (`var(--border)`)
- Hover: accent-muted background
- Sticky header row
- Clean, generous row height (48px)

### 4.7 Buttons

- Primary: accent background, accent-foreground text, 8px radius
- Secondary: transparent, border, foreground text
- Ghost: no border, muted hover background
- All: 500 weight General Sans, 14px

---

## 5. Motion

- **Page transitions:** Fade-in + 8px upward slide, 200ms ease-out
- **Card hover:** Border color 150ms, subtle shadow lift
- **Sidebar hover:** Background 100ms ease
- **Theme switch:** `transition: background-color 0.3s, color 0.3s, border-color 0.3s`
- **Dashboard greeting:** Staggered entrance — date (0ms), name (100ms), subtitle (200ms), actions (300ms)
- **Restrained approach** — work tool, not marketing site

---

## 6. Settings UI — Theme Picker

Located in Settings page under "Appearance" section:

```
┌─────────────────────────────────────────┐
│  Appearance                             │
│                                         │
│  Mode                                   │
│  ┌──────┐ ┌──────┐ ┌────────┐          │
│  │Light │ │ Dark │ │ System │          │
│  └──────┘ └──────┘ └────────┘          │
│                                         │
│  Accent Color                           │
│  ● ● ● ● ●                             │
│  Sky Steel Mint Amber Purple            │
│  (selected has checkmark overlay)       │
│                                         │
│  Preview updates live as you pick       │
└─────────────────────────────────────────┘
```

- Swatches are 32px circles with the accent color as background
- Selected swatch shows a white checkmark (dark accents) or dark checkmark (light accents)
- Changes apply instantly (optimistic UI), saved to Supabase on change
- Falls back to Steel + System if no preference stored

---

## 7. Database Changes

Add columns to `profiles` table:

```sql
ALTER TABLE profiles
  ADD COLUMN theme_accent text NOT NULL DEFAULT 'steel'
    CHECK (theme_accent IN ('sky', 'steel', 'mint', 'amber', 'purple')),
  ADD COLUMN theme_mode text NOT NULL DEFAULT 'system'
    CHECK (theme_mode IN ('light', 'dark', 'system'));
```

---

## 8. File Impact Summary

| Area | Files | Scope |
|------|-------|-------|
| **CSS tokens** | `src/index.css` | Full rewrite of `:root` and `.dark` variables |
| **Tailwind config** | `tailwind.config.ts` | Update font families, extend theme |
| **Font loading** | `index.html` or font imports | Add Satoshi + General Sans |
| **Theme provider** | New: `src/providers/ThemeProvider.tsx` | Context for accent + mode |
| **Theme hook** | New: `src/hooks/useTheme.ts` | Read/write theme preferences |
| **Settings page** | `src/pages/Settings.tsx` or new section | Theme picker UI |
| **Sidebar** | `src/components/layout/AppSidebar.tsx` | Restyle with sections, accent active |
| **Dashboard** | `src/pages/Dashboard.tsx` | Greeting, layout refresh |
| **All cards** | Various page components | Apply new card tokens |
| **Migration** | `supabase/migrations/` | Add theme columns to profiles |
| **Supabase types** | `src/integrations/supabase/types.ts` | Regenerate after migration |
