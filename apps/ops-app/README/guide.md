# Studio Tunnel: Application Philosophy & Logic

## Our Vision

**Studio Tunnel** is built with a singular mission: to eliminate the friction in high-end post-production workflows. We provide a single "source of truth" that bridges the gap between creative colorists, meticulous conformists, and strategic line producers.

## Core Pillars

### 1. The Real-Time Pulse

Unlike static spreadsheets, Studio Tunnel is a living organism. When a task status changes, the entire team knows instantly. This real-time synchronization (powered by Firebase) ensures that no project stalls due to communication lag.

### 2. High-Octane Energetic Workflow

The "Control Center" is designed for action. It's not just a dashboard; it's a mission control. We prioritize visibility for:

- **Bottlenecks**: Immediately identifying unassigned or stalled tasks.
- **Active Capacity**: Knowing exactly who is clocked in and what they are working on.
- **Deliverables**: A relentless focus on the "Delivered" state.

### 3. Integrated Intelligence

By using AI (Gemini) to generate daily briefings, we provide colorists with a filtered, actionable view of their day. This reduces cognitive load, allowing creatives to focus on their art rather than their schedule.

### 4. Direct Communication
 
Automated executive reports and push notifications ensure that critical alerts—like weekly billing summaries or payment follow-up lists—reach the team directly without requiring constant manual checks.

## Key Workflow Logic

1. **Project Life Cycle**: Projects move from **Active** to **Archived**.
2. **Task Pipeline**: Tasks flow through specialized stages: `Conform` → `Assist` → `Grade` → `Delivery Sync`.
3. **The "Line Producer" Advantage**: Admins have an bird's-eye view, enabling rapid staff allocation and bottleneck resolution.
4. **Submission Bridge**: Colorists submit links directly through the app, which are instantly reviewed and logged, maintaining a robust paper trail for every deliverable.
5. **Version Transparency**: Every architectural shift and feature update is logged in our real-time **Release Portal**, ensuring the team is always aware of the system's evolution.
6. **Unified Settings Identity**: All personnel and security configurations—including HR and Leave requests—are consolidated into a single "Settings" portal for zero-distraction sidebar operation.
7. **Administrative Control**: Admins have the power to "Force Finish" or "Reassign" stale tasks that are bottlenecking the pipeline, ensuring zero stagnation.
8. **IT & Systems Dispatching**: A dedicated "network" center for CTOs and Lead Colorists to delegate technical task tickets (hardware, networking, and software fixes) with built-in deadline tracking, file attachments, and edit capabilities.

---

## 🚀 Version History Highlights

### v1.1.1: Studio Bookings Week Grid & Mobile Limits

- **Interactive Week Grid**: The Studio Bookings module now displays a fully fluid visual calendar grid natively.
- **Overlap Resolution Engine**: Engineered an offset algorithm to position overlapping identical-time appointments side-by-side cleanly.
- **Mobile 4-Day Canvas**: Built a responsive window-listener to snap the Week grid strictly to a much larger 4-day zoomed view on mobile devices.
- **Global Nav Optimization**: Stripped redundant chat/clock widgets from the global top header to free up desktop vertical viewport space.

### v1.1.0: Vault & Recovery Protocol

- **Vault & Recovery Hub**: Introduced a dedicated archive interface for managing historic finished bookings and restoring deleted items.
- **Smart Booking Revival**: Users can now revive old bookings, complete with validation to ensure no bookings are revived into the past.
- **Recycle Bin Restoration**: Deleted bookings are stored safely and can be restored back to the pipeline instantly.
- **Timeline Integrity**: Guardrails added to enforce parameter modifications (Room, Time, Date, Artist) when reviving an entry.

### v1.0.9: Studio Booking Reliability & Custom UX

- **Custom Delete UX**: Introduced a high-fidelity, branded modal for booking cancellations to replace native browser dialogs.
- **Project Mapping Fix**: Standardized project data lookups using name/client fields to ensure match with Firestore schema.
- **ID Resolution**: Implemented automatic projectId lookup for new bookings, ensuring proper relational integrity.
- **Sync Reliability**: Fixed a bug where `syncToGoogleSheets()` was called without the required booking payload for updates.
- **Runtime Stability**: Resolved critical blank-page component crashes caused by redundant state declarations.
- **Sticky Modal Fix**: Optimized component timing to ensure the save modal closes instantly upon successful database receipt, regardless of external sync latency.

### v1.0.8: Sync Board Modularization & Task ID System

- **SyncBoard Component**: Extracted the full Kanban board, New Task modal, and Edit Task modal from `App.jsx` into a self-contained `SyncBoard.jsx` component.
- **Task ID System**: Introduced auto-sequential `T-#####` (5-digit zero-padded) unique identifiers for all pipeline tasks — assigned silently on load, visible as badges on each card.
- **Data Restoration**: Fixed a stage-mapping bug causing 0 tasks in Delivery Sync; all 93 tasks now display correctly (Conform: 7, Assist: 35, Grade: 42, Delivery Sync: 9).
- **Icon-Only Action Row**: Edit, Reassign, Mark Done, and Delete actions are now a compact single-row icon strip with tooltips on each task card.
- **Edit Task Parity**: Edit Task modal now includes all fields from New Task (Title, Project, Description, Phase, Assignee).

### v1.0.7: Studio Bookings & UI Accessibility

- **UI Accessibility**: Migrated all icons to high-contrast variants (non-black) for maximum visibility across all modules.
- **Isolated Component Architecture**: Extracted `StudioBookings.jsx` and `TeamNotepad.jsx` from the monolithic `App.jsx`, reducing main logic core by ~1000 lines.
- **Enhanced Studio Bookings**: Fully functional **Week View** with 7-day schedule rendering and integrated historical/future navigation.
- **Release Metadata Shift**: Extracted the hardcoded `APP_RELEASES` manifest array from `App.jsx` into `src/data/releases.js` to ensure zero core-rendering disturbances when updating documentation.
- **Smart BID Tracking**: Automated Booking ID tagging (e.g., `BID-X1Y2Z3`) for precise database referencing.
- **System Reliability**: Resolved `showBookingModal` and `formatTime` ReferenceErrors that caused login crashes.

## 🚀 Next Version Roadmap (v1.2.0)

We are committed to continuous evolution. Our next milestone focuses on structural integrity and cognitive optimization:

- **Modular OOP Architecture**: Transitioning remaining components to a strictly modular, Object-Oriented approach for better scalability.
- **Granular Module Breakdown**: Decomposing monolithic components into small, manageable, and highly reusable "logic chunks."
- **Standardized Naming Conventions**: Enforcing strict rules and regulations for variable, function, and component naming to ensure a self-documenting codebase.
- **Cognitive Load Optimization**: Refining the UI/UX and sidebar navigation to reduce mental friction, ensuring the most critical tasks are always the least effortful to find.
