

## Pass 2: Subtask UI & Task Views in ProjectDetail

### Current State
- **`/tasks` page**: Already fully implemented with all 4 views (board, list, timeline, calendar), subtask expand/collapse, indentation, "Add Subtask" action, and subtask count badges. No changes needed here.
- **ProjectDetail tasks tab** (lines 730-782): Only has **list** and **board** views via simple toggle buttons. No subtask support (doesn't filter by parent_task_id, no expand/collapse). The board view (`TaskBoard` component, lines 974-1034) is a basic grid with no subtask awareness.

### Changes Required

**1. Enhance ProjectDetail Tasks Tab (lines 730-782)**
- Replace the simple list/board toggle with `ViewToggle` component supporting all 4 modes: list, board, timeline, calendar
- Add `taskView` state to support `"list" | "board" | "timeline" | "calendar"`
- In list view: separate parent tasks from subtasks, add expand/collapse chevrons, indented subtask rows, "Add Subtask" inline input (matching the `/tasks` page pattern)
- In board view: show subtask counts on cards
- Add timeline and calendar views reusing the same `TimelineView` and `CalendarView` patterns from `/tasks`

**2. Extract Shared Task View Components**
To avoid duplicating ~250 lines of timeline/calendar code, extract into reusable components:
- `src/components/tasks/TaskTimelineView.tsx` — extracted from Tasks.tsx TimelineView
- `src/components/tasks/TaskCalendarView.tsx` — extracted from Tasks.tsx CalendarView
- `src/components/tasks/TaskListView.tsx` — the list view with subtask expand/collapse
- Import these in both `/tasks` and ProjectDetail

**3. Update ProjectDetail State**
- Add `expandedParents`, `addingSubtaskFor`, `subtaskTitle` state variables
- Add `parentTasks` / `subtasksByParent` memo derivations filtered to project
- Wire `useCreateTask` for subtask creation

**4. Files Modified**
- `src/pages/ProjectDetail.tsx` — enhanced tasks tab with 4 views + subtask UI
- `src/components/tasks/TaskTimelineView.tsx` — new shared component
- `src/components/tasks/TaskCalendarView.tsx` — new shared component  
- `src/components/tasks/TaskListView.tsx` — new shared component
- `src/pages/Tasks.tsx` — refactored to import shared components (reduces file size)

No database changes needed — `parent_task_id` column already exists.

