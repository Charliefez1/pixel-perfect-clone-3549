
# Projects & Tasks Enhancement Plan for NDG Hub

## Summary of Requirements

Based on your voice description and the technical specifications, here's what needs to be built:

### 1. Workshop Quantity Tracking on Deals
NDG needs to track how many workshops of each type are included in a deal:
- **Aware** workshops (count)
- **Champion** workshops (count)  
- **Manager** workshops (count)
- **Leader** workshops (count)
- **Bespoke** workshops (count + custom title/description)

This enables deals ranging from 1 workshop to 60+ workshops with mixed types.

### 2. Project Templates by Size
Three template tiers with different task complexity:
- **Small** (single workshop): Contract signing → PO → Prep meeting → Logistics → Delivery → Feedback
- **Medium** (multi-session): Above + Multiple delivery phases + Interim reviews
- **Large** (full programme): Complete NEURO methodology tasks across all 5 phases

### 3. Activity Tracking for Companies/Contacts
Auto-updating activity timeline similar to Clarify AI:
- Email sent/received timestamps
- Meeting records from calendar
- Manual activity logging
- "Last contacted" auto-updates
- Days since last contact indicator

### 4. Speech-to-Text / Text-to-Speech
Voice input capability throughout the platform:
- Dictate notes on deals, deliveries, contacts
- Play back notes via TTS
- Voice command support

### 5. Multiple AI Agents (Lovable AI)
Specialized agents for different workflows:
- **Sales AI**: Deal analysis, follow-up suggestions, proposal drafting
- **Project Management AI**: Task prioritization, deadline tracking, resource allocation
- **Insights AI**: Pipeline analytics, satisfaction trends, revenue forecasting
- **Business Manager AI**: Overall strategic recommendations combining all data

### 6. Automations & Workflows
NDG-specific automation rules:
- Deal won → auto-create project with correct template
- Template selection based on workshop count (1-2=small, 3-10=medium, 10+=large)
- Feedback form auto-send 48hrs post-delivery
- Overdue task escalation notifications

---

## Technical Implementation Plan

### Database Changes

**New columns on `deals` table:**
```sql
workshops_aware integer DEFAULT 0
workshops_champion integer DEFAULT 0
workshops_manager integer DEFAULT 0
workshops_leader integer DEFAULT 0
workshops_bespoke integer DEFAULT 0
bespoke_details jsonb DEFAULT '[]' -- [{title, description}]
total_workshops integer GENERATED AS (aware + champion + manager + leader + bespoke)
package_size text GENERATED -- 'small', 'medium', 'large' based on total
```

**Updated `templates` table:**
- Add `package_size` column (small/medium/large)
- Seed 3 templates per service type (workshop_small, workshop_medium, workshop_large)

**New `activities` table** (separate from activity_log):
```sql
activities (
  id uuid PK
  organisation_id uuid FK
  contact_id uuid FK  
  deal_id uuid FK
  type text -- email_sent, email_received, call, meeting, note
  subject text
  body text
  source text -- manual, gmail_sync, calendar_sync
  activity_date timestamptz
  created_at timestamptz
)
```

### Files to Create

1. **`src/components/deals/WorkshopQuantityEditor.tsx`**
   - Grid of workshop type inputs with counts
   - Bespoke section with add/remove custom workshops
   - Auto-calculates totals and package size

2. **`src/components/ai/AIChatPanel.tsx`**
   - Slide-over AI assistant panel
   - Context-aware (knows current entity being viewed)
   - Multiple agent modes (Sales, PM, Insights, Business)

3. **`src/components/ai/VoiceInput.tsx`**
   - Microphone button for speech-to-text
   - Uses ElevenLabs or browser API
   - Speaker button for text-to-speech playback

4. **`src/components/activity/ActivityTimeline.tsx`**
   - Chronological activity feed for any entity
   - Filter by activity type
   - Manual activity logging form

5. **`supabase/functions/ai-assistant/index.ts`**
   - Edge function connecting to Lovable AI
   - Different system prompts per agent type
   - Context injection from database

### Files to Modify

1. **`src/components/dialogs/CreateDealDialog.tsx`**
   - Add WorkshopQuantityEditor section
   - Auto-calculate deal value based on workshop counts × rate card
   
2. **`src/pages/Deals.tsx`**
   - Show workshop breakdown on cards
   - Package size badge (S/M/L)

3. **`src/pages/Projects.tsx`**
   - Link to originating deal with workshop details
   - Show inherited template tasks

4. **`src/pages/Clients.tsx`** & **`src/pages/Contacts.tsx`**
   - Add activity timeline tab
   - "Last contacted" indicator with staleness warning

5. **`src/components/layout/AppSidebar.tsx`**
   - Add AI Assistant toggle button

6. **Database trigger `handle_deal_won()`**
   - Update to select template based on package_size
   - Create correct number of delivery records for multi-workshop deals

### Template Structure

**Small Workshop Template** (1-2 sessions):
1. Contract signing (+0d)
2. PO creation (+1d)
3. Prep meeting (+3d)
4. Logistics scheduling (+5d)
5. Materials prep (+7d)
6. Delivery (+14d)
7. Feedback collection (+16d)

**Medium Programme Template** (3-10 sessions):
- All of Small, plus:
- Session scheduling (multiple)
- Interim check-ins
- Module reviews

**Large Programme Template** (10+ sessions):
- Full NEURO methodology:
  - **N**eeds assessment phase
  - **E**ngage stakeholder mapping
  - **U**nderstand current state audit
  - **R**ealise delivery phases
  - **O**ngoing review and optimization

---

## AI Agent Architecture

```
┌─────────────────────────────────────────────────────┐
│                BUSINESS MANAGER AI                  │
│        (Combines insights from all agents)          │
└─────────────────────────────────────────────────────┘
         ▲              ▲              ▲
         │              │              │
┌────────┴──────┐ ┌────┴─────┐ ┌──────┴───────┐
│   SALES AI   │ │  PM AI   │ │ INSIGHTS AI  │
│ Deal follow- │ │ Task     │ │ Analytics    │
│ ups, proposal│ │ priority,│ │ trends,      │
│ drafting     │ │ deadlines│ │ forecasting  │
└──────────────┘ └──────────┘ └──────────────┘
```

Each agent has:
- Specialized system prompt with NDG context
- Access to relevant database tables
- Structured output for actionable suggestions

---

## Implementation Phases

**Phase 1: Workshop Tracking** (~2 hours)
- DB migration for workshop columns
- WorkshopQuantityEditor component
- Update CreateDealDialog and deal cards

**Phase 2: Activity System** (~2 hours)
- Activities table + RLS
- ActivityTimeline component
- Integration in Clients/Contacts/Deals detail panels

**Phase 3: Enhanced Templates** (~1.5 hours)
- Add package_size to templates
- Seed S/M/L templates for each service type
- Update trigger to use package_size

**Phase 4: AI Agents** (~3 hours)
- Edge function for Lovable AI
- AIChatPanel with agent modes
- Context injection system

**Phase 5: Voice I/O** (~1.5 hours)
- VoiceInput component
- TTS playback for notes
- Integration across note fields

---

## UI Preview: Deal Workshop Section

```text
┌─────────────────────────────────────────────┐
│ Workshop Configuration                       │
├─────────────────────────────────────────────┤
│  Aware          [2]   Champion      [1]     │
│  Manager        [3]   Leader        [0]     │
│  Bespoke        [1]                         │
│  ┌──────────────────────────────────────┐   │
│  │ + Gen Z in the Workplace (custom)    │   │
│  └──────────────────────────────────────┘   │
├─────────────────────────────────────────────┤
│  Total: 7 workshops  │  Package: MEDIUM     │
└─────────────────────────────────────────────┘
```

This plan delivers the core functionality you described: flexible workshop configuration, smart templates, activity tracking, and AI assistance tailored to NDG's neurodiversity consultancy workflow.
