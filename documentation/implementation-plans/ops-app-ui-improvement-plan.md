# Studio Tunnel (Ops App) — UI Improvement Plan

**Scope:** `apps/ops-app` (React 19 + Vite, Tailwind + a custom CSS-variable design system)
**Method:** Code review only — could not obtain authenticated screenshots (Firebase login blocks unauthenticated/automated access). Findings are grounded in `index.css`, `App.jsx` (3,339 lines), `App.css`, `pages/DashboardTab.jsx`, and all files in `src/components/` (`StudioBookings.jsx`, `TeamChat.jsx`, `ProjectDirectory.jsx`, `ProjectTracker.jsx`, `SOPGuides.jsx`, `ITTasks.jsx`, `NtfyModal.jsx`, `RecycleBin.jsx`, `StagingPopup.jsx`, `SyncBoard.jsx`, `TeamNotepad.jsx`), plus the rendered login screen.
**Date:** 2026-09-01

---

## The good news first

`index.css` already defines a real, well-thought-out design system: CSS custom properties for color/radius/shadow, and reusable classes (`.st-card`, `.btn` + variants, `.badge` + variants, `.nav-item`, `.modal-sheet`, `.tab-group`, `.empty-state`, `.avatar`, `.stat-card`). The login screen that uses it (screenshot below) looks clean, cohesive, and on-brand.

The core problem this plan addresses: **that design system is barely used.** Most of the app's ~8,800 lines were written with hand-rolled Tailwind utility classes (`slate-800`, `indigo-600`, `amber-500`, `emerald-400`...) instead of the tokens already sitting in `index.css`. That's the single biggest lever for a visibly better, more consistent UI — and it's mostly mechanical work, not new design.

| Design-system class | Files actually using it (of 15 in `src/`) |
|---|---|
| `.st-card` | 1 |
| `.btn-primary` | 2 |
| `.badge` | 5 |
| `.modal-sheet` | 1 |
| `.empty-state` | 3 |
| `.st-input` | 1 |
| `.nav-item` | 2 |

---

## Priority 1 — Quick wins (low effort, high visible impact)

### 1.1 Delete dead code: `pages/DashboardTab.jsx`
`App.jsx` never imports `DashboardTab` — grep for `DashboardTab` in `App.jsx` returns nothing. Its exact JSX is duplicated inline at `App.jsx:1766-1895` instead. Anyone editing the dashboard today is editing the wrong file 50% of the time.
**Action:** delete `pages/DashboardTab.jsx`, or wire it up and delete the inline duplicate in `App.jsx`. Either way, stop maintaining two copies.

### 1.2 Replace `window.confirm()` with the app's own modal
Five places bypass the entire design system for a raw browser dialog — jarring against a dark, branded UI, unstylable, and blocks the JS thread:
- [App.jsx:1066](apps/ops-app/src/App.jsx:1066) — "FORCE FINISH ACTIVE TASK?"
- [components/TeamNotepad.jsx:82](apps/ops-app/src/components/TeamNotepad.jsx:82) — "Delete this template?"
- [components/RecycleBin.jsx:42](apps/ops-app/src/components/RecycleBin.jsx:42) — permanent delete
- [components/ITTasks.jsx:169](apps/ops-app/src/components/ITTasks.jsx:169) — mark complete
- [components/ITTasks.jsx:179](apps/ops-app/src/components/ITTasks.jsx:179) — delete task

Meanwhile `App.jsx` *also* has a homegrown "arm-then-confirm" pattern (`armedDeleteId` state + `.btn-danger-armed` pulse class) used elsewhere, and a fourth pattern for QC/project actions. **Four different confirmation UX patterns in one app.**
**Action:** build one `<ConfirmDialog>` component on top of `.modal-sheet`, and one `useArmedAction()` hook for the inline arm-then-confirm case (used on rows where a modal would be overkill). Replace all five `window.confirm()` calls and audit for other ad-hoc confirms.

### 1.3 Fix hardcoded WhatsApp brand colors
[components/TeamNotepad.jsx:159-209](apps/ops-app/src/components/TeamNotepad.jsx:159) hardcodes `#128C7E` / `#25D366` directly in Tailwind arbitrary-value classes (`bg-[#128C7E]/20`, `fill-[#25D366]`, `shadow-[#25D366]/10`, etc.), six occurrences. These don't respond to any future theme change and don't match the token-driven approach everywhere else.
**Action:** add `--whatsapp` / `--whatsapp-dim` custom properties to `index.css` (or accept these two as an intentional exception and document why), then reference the variable, not the literal hex.

### 1.4 Fix forced horizontal scroll on mobile dashboard panels
[pages/DashboardTab.jsx:41-43](apps/ops-app/src/pages/DashboardTab.jsx:41) sets `minWidth: '420px'` on a panel that's otherwise full-width, and line 105 sets `min-w-[500px]` on another — both inside `overflow-x: auto` wrappers, so on a phone (< 420px viewport) the user is forced to scroll sideways to read a *single-column list of cards*, which shouldn't need a fixed min-width at all. Remember: `DashboardTab.jsx` is currently dead (see 1.1) but its logic is duplicated live in `App.jsx` around the same lines — the same min-width forcing applies there.
**Action:** drop the `min-width` constraints on these two panels; let cards wrap/stack naturally. Reserve `overflow-x: auto` + `min-width` for genuinely tabular content (this pattern is used correctly elsewhere, e.g. `SOPGuides.jsx` and `ProjectDirectory.jsx` tables).

### 1.5 Add a real initial-load state
`Loader2` is imported in `App.jsx` but the grep shows it's not driving any app-wide loading UI. Firestore's `onSnapshot` listeners populate `tasks`, `projects`, etc. asynchronously after login — until the first snapshot arrives, empty-state messages like *"All active tasks are currently assigned"* or *"No stale tasks"* render because the arrays are legitimately `[]`, not because there's actually nothing there. Users see a false "all clear" for a second or two on every login.
**Action:** track a single `isInitialSyncComplete` boolean (flip it once all `collections.forEach` listeners have fired at least once), and gate the dashboard/empty-states behind it with a loading skeleton or spinner.

---

## Priority 2 — Design system adoption (medium effort, compounding impact)

### 2.1 Migrate hand-rolled cards/buttons/badges to the existing classes
Systematically replace `bg-slate-800/50 rounded-2xl border border-slate-700/50` (and its many close variants) with `.st-card` / `.st-card-lg`; replace one-off `bg-indigo-600 hover:bg-indigo-500 rounded-xl ... text-xs font-black tracking-widest` buttons with `.btn .btn-primary` (+ `.btn-sm` where needed); replace inline status pills with `.badge` + the existing `.badge-accent/-online/-warn/-danger/-neutral` variants.
**Where it's worst:** `pages/DashboardTab.jsx` / its `App.jsx` duplicate (see 1.1), `StudioBookings.jsx` (1,343 lines, almost entirely hand-rolled), `ProjectDirectory.jsx`, `ProjectTracker.jsx`.
**Suggested approach:** do this file-by-file, starting with the dashboard (highest-traffic screen), not as one giant PR. Each file's diff should be visually a no-op or an improvement — the tokens already match the existing hand-rolled palette closely (e.g. `indigo-600` ≈ `--accent`), so this is a low-risk mechanical pass, easiest to verify with side-by-side screenshots per file.

### 2.2 Establish a z-index scale
Current values found: `0`, `2`, `40`, `60`, `70`, `300`, plus a dynamically computed one in `StudioBookings.jsx:968`. No shared constant, no documented stacking order (toast vs modal vs bottom-nav vs sticky headers). This is a bug waiting to happen — a new modal added at `z-index: 50` could silently render under the bottom nav (`z-index: 60`+ implied) or over a toast.
**Action:** add a documented scale to `index.css` as custom properties, e.g.:
```css
--z-sticky: 10;
--z-bottom-nav: 50;
--z-modal-overlay: 200;
--z-toast: 250;
--z-staging-popup: 300;
```
Then replace every hardcoded `zIndex`/`z-[N]` with the matching variable.

### 2.3 Split `App.jsx` (3,339 lines) into components
The app already has the right instinct — `StudioBookings`, `TeamChat`, `SyncBoard`, `ProjectDirectory` etc. are separate files — but `App.jsx` still inlines large chunks directly: the dashboard body (~130 lines, duplicated dead code per 1.1), 4+ full-screen modals (add/edit project, assign staff, SOP breakdown, QC/WhatsApp dispatch), and the entire login screen.
**Action, in order of payoff:**
1. Extract each modal (`AddProjectModal`, `EditProjectModal`, `AssignStaffModal`, `QcDispatchModal`, `SOPModal`) into `src/components/modals/`. They're the most self-contained and lowest-risk to pull out.
2. Extract `<LoginScreen>` — it's pure presentation, easy win.
3. Wire the real dashboard (fixing 1.1 in the process) into its own file.

This isn't just tidiness — a 3,339-line file is where the four-different-confirm-patterns and one-off-styling problems above *come from*: nobody can see the whole picture, so each new feature reinvents a pattern instead of reusing one.

### 2.4 Split `StudioBookings.jsx` (1,343 lines)
Covers at least 3 distinct calendar/list views plus its own modal, all in one file with no internal component boundaries. Same rationale as 2.3: split by view (e.g. `BookingCalendarView`, `BookingListView`, `BookingModal`) so each is independently testable/reviewable.

---

## Priority 3 — Accessibility (medium effort, currently near-zero coverage)

The codebase has **1 `aria-label`** across ~8,800 lines and 15 files, and no `role="alert"` / `aria-live` anywhere — including on the toast component ([App.jsx:1166-1193](apps/ops-app/src/App.jsx:1166)), which means screen-reader users get no announcement when a toast appears (success/error confirmations after every action — clock in/out, task assignment, delete, etc.).

Concrete gaps:
- **Icon-only buttons** (close `<X>` icons, at minimum 4 instances found via grep, likely more via emoji/glyph close buttons) have no `aria-label` — a screen reader announces nothing useful ("button" with no name).
- **~10 modals** across the app (`.modal-sheet` usage, plus the 4+ inline ones in `App.jsx`) have no focus trap and no Escape-to-close — keyboard users can tab out of an open modal into the page behind it, and there's no consistent way to dismiss without a mouse.
- **Toast notifications** have no `role="alert"`/`aria-live="polite"` — announced to nobody but sighted users.
- **Status indicators** (task phase, online/offline presence) lean on color alone in places (`.online-dot`, colored badges) without a redundant text/icon cue in every instance — worth auditing case by case since some already pair color with text.

**Action:**
1. Add `aria-label` to every icon-only interactive element (start with modal close buttons — cheap, mechanical, catches the worst offenders).
2. Add `role="alert"` + `aria-live="polite"` to the toast container.
3. Add a shared `useFocusTrap` / `useEscapeToClose` hook, applied when modals get extracted into components (2.3) — natural to do at the same time.

---

## Priority 4 — Consistency polish (small items, do alongside the above)

- **Empty states:** `.empty-state` class exists but is used in only 3 of 13+ places that can render "no data" — the rest use ad-hoc `<p className="text-slate-500 italic">No X found.</p>` (e.g. [pages/DashboardTab.jsx:107](apps/ops-app/src/pages/DashboardTab.jsx:107)). Standardize on `.empty-state` everywhere, ideally with a consistent icon (the class already has `.empty-state-icon`).
- **Login screen** ([App.jsx:1292](apps/ops-app/src/App.jsx:1292) onward): solid as-is. Two small gaps worth a look — no "Forgot password" affordance (grep found none), and error feedback goes through the general toast rather than an inline field-level error, which is a reasonable choice but worth confirming is intentional given the form has no other inline validation.
- **Stat cards / badges:** `DashboardTab`'s stat row correctly uses `.stat-card`/`.stat-value`, but the very next section abandons it for hand-rolled markup — a good example of "the pattern exists, just isn't followed through the same screen."

---

## Suggested sequencing

| Phase | Items | Why this order |
|---|---|---|
| **1 (this week)** | 1.1–1.5 | Each is small, independently shippable, immediately visible, and several (1.1, 1.3, 1.4) are outright bugs, not style opinions. |
| **2 (next)** | 2.2 (z-index), 3.1–3.2 (aria-label + toast a11y) | Cheap, mechanical, low regression risk. |
| **3** | 2.3 (split App.jsx: modals first) | Unblocks everything downstream — once modals are components, 1.2's `<ConfirmDialog>` and 3.3's focus-trap hook drop in cleanly. |
| **4** | 2.1 (design-token migration), 2.4 (split StudioBookings) | Larger, file-by-file, do opportunistically whenever a file is already being touched for a feature — don't block feature work for a big-bang rewrite. |

---

## Caveat

This review couldn't see the authenticated app running (dashboard, bookings calendar, chat, kanban board in real use) — only the code and the public login screen. The structural/consistency findings above are reliable (verified by direct grep, not just the source read), but there may be additional in-context UX issues (information density on real data, actual calendar usability, mobile gesture conflicts) that only show up with live screenshots. Worth a follow-up visual pass once you can share screenshots or grant access.
