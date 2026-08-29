export const APP_RELEASES = [
  {
    id: 'v1.1.3',
    title: 'Staging Isolation & Billing Cost Compiler',
    date: '2026-05-30 22:50:00',
    updates: {
      tech: [
        'Dual-Environment Aliasing: Configured distinct target environments in .firebaserc for secure sandbox-tunnel deployment.',
        'Relational Project Code Lookup: Integrated regex-based project-code parsing inside StudioBookings save logic, decoupling project references from flat naming.',
        'Automatic Project Autocomplete: Extended search datalist to merge code-to-name tags ([Code] - [Name]) during schedule creation.'
      ],
      feature: [
        'Department Billing Compiler: Added an interactive cost accounting panel inside the Project Tracker, aggregating total active hours dynamically by Conform, Assist, Grading, and Delivery departments.',
        'Custom Hourly Multipliers: Provided real-time adjustable input fields to edit department hourly rates on the fly with instantaneous subtotal and grand total billing recalculations.',
        'Invoice Copy Exporter: Added one-click copy button to export a highly detailed, beautifully formatted billing brief directly to clipboard.',
        'Ubiquitous Code Badges: Displayed elegant project code indicators next to titles across week views, monthly calendars, schedules, and vault logs.'
      ]
    }
  },
  {
    id: 'v1.1.2',
    title: 'Role Capability Matrix & User Archival',
    date: '2026-05-30 21:50:00',
    updates: {
      tech: [
        'Modularization: Ported the users module out of App.jsx into a dedicated component src/components/users.js.',
        'Declarative Permission Matrix: Created role capability specifications mapping granular permissions to roles, replacing binary isAdmin validations.',
        'Clean User Archival: Implemented isArchived: true flags for departed users and filtered them out dynamically from active listings.',
        'Renamed operational roles: Updated Prakash and Vaibhav to Production Department, and Jay to IT Admin.',
        'Staff attendance alignment: Refactored shift lists to filter by precise roles, keeping IT Admin and Production Department off staff tracking lists.',
        'Isolated Sandbox Project: Transitioned to a dedicated sandbox project (sandbox-tunnel.web.app) for total database and environment isolation.',
        'Sidebar Reordering: Positioned the Tasks (formerly SYNC) tab at the second row in the workspace sidebar.'
      ],
      feature: [
        'Role Capability Matrix: Operational managers (Production Department) can run bookings, leaves, tracker, and attendance, but technical IT configurations are now strictly reserved for IT Admin.',
        'Clean Login Screen: Departed staff (Vaibhav Sorte, Atharva Patil, Akilan) are hidden from the login grid and assignment selects, while historical data remains intact.',
        'New Staff Member: Added Tamash Ansari under the Production Department role.',
        'Optimized lists: Resource matrix and team active panels now exclusively show active personnel.',
        'Tasks Workspace Navigation: Renamed the "SYNC" pipeline tab to "Tasks" and placed it in the second position in the sidebar for optimal daily workspace flow.'
      ]
    }
  },
  {
    id: 'v1.1.1',
    title: 'Studio Bookings Week Grid & Mobile Optimization',
    date: '2026-04-16 23:30:00',
    updates: {
      tech: [
        'Grid Architecture: Ported dynamic visual Grid system natively into StudioBookings module, removing old List prototype.',
        'Collision Engine: Engineered time-calculation offset algorithm to mathematically position overlapping appointments side-by-side.',
        'Responsive Limits: Built mobile window-listener to snap Week Grid strictly to a 4-day view on phones and a 7-day view on desktop.',
        'Global Nav Optimization: Stripped non-essential chat and clock widgets from global main top header to free up vertical viewport.'
      ],
      feature: [
        'Interactive Week View: The Studio Bookings module now displays a fully fluid visual calendar grid.',
        'Overlap Resolution: You can now clearly read multiple studio bookings clashing in the exact same hour block.',
        'Mobile 4-Day Canvas: Phones compress the week view down to a much larger and readable 4-day canvas.',
        'Cleaner Layouts: Top ribbon elements have been hidden to prioritize your workspace.'
      ]
    }
  },
  {
    id: 'v1.1.0',
    title: 'Vault & Recovery Protocol',
    date: '2026-04-15 17:00:00',
    updates: {
      tech: [
        'Validation Logic: Enforced strict parameter modification checks (Room, Time, Date, or Artist) during booking revival.',
        'Timeline Integrity: Implemented preventative safeguards against reviving active bookings into past dates/times.',
        'Component State: Centralized Vault & Recovery UI into the Studio Bookings module with seamless view toggling.'
      ],
      feature: [
        'Vault & Recovery Hub: Introduced a dedicated archive interface for historic finished bookings and deleted item tracking.',
        'Smart Booking Revival: One-click revival for old auto-archived bookings with forced schedule reconfiguration for expired dates.',
        'Recycle Bin Restoration: Deleted bookings can now be immediately restored back into the active pipeline.'
      ]
    }
  },
  {
    id: 'v1.0.9',
    title: 'Studio Booking Reliability & Custom UX',
    date: '2026-04-07 13:08:00',
    updates: {
      tech: [
        'Native Dialog Bypass: Replaced window.confirm with a custom DeleteConfirmationModal component for consistent cross-environment behavior.',
        'Project Mapping Fix: Standardized project data lookups using name/client fields to match Firestore schema.',
        'ID Resolution: Implemented automatic projectId lookup for new bookings, ensuring proper relational integrity.',
        'Google Sheets Sync Logic: Fixed a bug where syncToGoogleSheets() was called without the required booking payload.',
        'Runtime Stability: Eliminated a duplicate const declaration that caused component-level crashes.',
        'Modal Timing Fix: Moved setShowBookingModal(false) prior to external sync calls to ensure UI responsiveness even if network calls delay.'
      ],
      feature: [
        'Custom Delete UX: Introduced a high-fidelity, branded modal for booking cancellations.',
        'Reliable Save: New and edited bookings now persist correctly with all project metadata and automatic sync.',
        'Sticky Modal Resolution: Fixed an issue where the save modal would occasionally hang after a successful submission.'
      ]
    }
  },
  {
    id: 'v1.0.8',
    title: 'Sync Board Modularization & Task ID System',
    date: '2026-04-07 01:38:00',
    updates: {
      tech: [
        'Component Modularization: Extracted full Kanban board, New Task, and Edit Task modals from App.jsx into self-contained SyncBoard.jsx component.',
        'Task ID System: Introduced auto-sequential T-##### (5-digit zero-padded) unique identifiers for all pipeline tasks.',
        'Auto-Migration: App.jsx runs a silent background migration on load, upgrading all existing tasks (including legacy short-format IDs) to the new T-##### standard.',
        'Data Integrity: Task filtering in SyncBoard is now case-insensitive and maps legacy status variants (Delivery, Drive Sync) to the unified "Delivery Sync" column.',
        'Stage Alignment: Synchronized WORKFLOW_STAGES constant across App.jsx and SyncBoard.jsx to ensure consistent pipeline structure.',
        'Firestore Schema: taskId field added to all task documents; new tasks receive IDs at creation time via getNextTaskId() helper in SyncBoard.jsx.'
      ],
      feature: [
        'Task ID Badges: Every task card now shows a T-##### badge in the top-right corner for quick reference and tracking.',
        'Cleaner Card Layout: Removed redundant stage label (CONFORM/ASSIST/GRADE) from task cards — the column header already provides this context.',
        'Icon-Only Action Row: Task action buttons (Edit, Reassign, Mark Done, Delete) are now a single-row icon strip with tooltips, freeing significant card space.',
        'Edit Task Parity: Edit Task modal now includes all fields available in New Task (Title, Project, Description, Phase, Assignee).',
        'Renamed Delivery Action: "Mark as Delivered" button renamed to "Mark Done" for clarity.',
        'Data Restoration: Fixed a stage mismatch that caused the Delivery Sync column to show 0 tasks — all 93 pipeline tasks are now correctly displayed (Conform: 7, Assist: 35, Grade: 42, Delivery Sync: 9).'
      ]
    }
  },
  {
    id: 'v1.0.7',
    title: 'Studio Bookings & UI Accessibility',
    date: '2026-03-22 05:45:00',
    updates: {
      tech: [
        'Bugfix: Eradicated showBookingModal ReferenceError causing total login crashes.',
        'Bugfix: Resolved formatTime undefined variable that broke the My Tasks workspace.',
        'Bugfix: Fixed Studio Bookings "Week View" data rendering logic.',
        'CSS Optimization: Migrated muted `text-slate-500` icon classes to high-contrast variants.',
        'Contrast Audit: Enhanced visibility for offline status indicators and action icons.',
        'Component Modularization: Extracted `TeamNotepad.jsx` and `StudioBookings.jsx` for optimized performance.'
      ],
      feature: [
        'UI Accessibility: All icons across Studio Bookings, Team Chat, and Notepad are now non-black for maximum visibility.',
        'Week View: Fully functional 7-day schedule view with historical and future navigation.',
        'Action Icons: Improved clarity for Edit, Duplicate, and Delete buttons in all modules.',
        'Login Fix: Resolved blank white page bug for all user profiles.',
        'BID Tracking: Automated unique ID assignment for all production bookings.'
      ]
    }
  },
  {
    id: 'v1.0.6',
    title: 'Visual Timelines & Synchronized Docs',
    date: '2026-03-21 15:30:00',
    updates: {
      tech: [
        'Component Modularization: Extracted SOP & Guides into isolated `SOPGuides.jsx`.',
        'Markdown Integration: Implemented `react-markdown` with customized Tailwind formatting for unified documentation.',
        'Systems Architecture: Introduced `ITTasks.jsx` with full CRUD for technical ticket management.'
      ],
      feature: [
        'Visual Shifts: Replaced flat table with a 24-hour visual timeline with granular grid lines.',
        'Synchronized Guides: App documentation stays perfectly in sync with codebase README files.',
        'IT Dispatch Hub: Exclusive ticketing system with editing, attachment support, and enhanced input accessibility.',
        'Unified Pipeline: Merged Delivery and Drive Sync into a single consolidated board column.'
      ]
    }
  },
  {
    id: 'v1.0.5',
    title: 'Interactive SOP & Security Hub',
    date: '2026-03-21 11:50:00',
    updates: {
      tech: [
        'Component Modularization: Extracted Recycle Bin from main App core into separate component.',
        'UX Refinement: Repositioned administrative tools to secondary priority in navigation.'
      ],
      feature: [
        'Persistent Recycle Bin: Tasks are now manageable from a dedicated sub-view for improved performance.',
        'Nav Hierarchy: Sidebar navigation optimized for production workflow focus.'
      ]
    }
  },
  {
    id: 'v1.0.4',
    title: 'Communication & Asset Hub',
    date: '2026-03-20 20:20:00',
    updates: {
      tech: [
        'Storage System: Initialized Firebase Storage for secure asset distribution.',
        'File Handling: Implemented 10MB upload limit and progress monitoring.',
        'Interactive Chat: Added emoji selection engine to team communication.'
      ],
      feature: [
        'Unread Tracking: Smart badges for total unread messages and personal mentions.',
        'Priority Navigation: Moved Team Chat to the very top for instant access.',
        'Header Shortcut: Integrated a quick-access Chat icon in the top header.',
        'Asset Sharing: Ability to attach files and screenshots directly to group chat.',
        'Emoji Picker: One-click emoji insertion for faster team expression.'
      ]
    }
  },
  {
    id: 'v1.0.3',
    title: 'Control Center Power & Search Engine',
    date: '2026-03-20 20:00:00',
    updates: {
      tech: [
        'Search Engine: Implemented real-time filtering for Release Documentation.',
        'Stale Task Logic: Added automated identification of assigned tasks from previous days.',
        'Version Sync: Restructured sidebar header for foolproof branding and versioning.',
        'Permissions Update: Jay Dantara is confirmed as the Project Editor on Firebase Hosting.',
        'Lint Compliance: Standardized guide.md for MD022, MD032, and MD030.'
      ],
      feature: [
        'Force Finish: Admins can manually deliver stalled tasks via the Control Center.',
        'Quick Reassign: Added side-by-side reassignment capability for stale tasks.',
        'Release Search: Search updates by keyword, tech category, or version number.',
        'Branding Fix: Restored original logo and integrated clickable version badge.'
      ]
    }
  },
  {
    id: 'v1.0.2',
    title: 'Deployment Security & Workflow Standard',
    date: '2026-03-20 13:03:00',
    updates: {
      tech: [
        'Verified Deployment Engine: Implemented mandatory Preview-before-Production hosting workflow.',
        'Deployment Documentation: Created exhaustive guide for sandboxed testing and cloning.',
        'Version Sync: Updated package and internal manifest to v1.0.2 across all modules.'
      ],
      feature: [
        'Sandboxed Testing: Enabled unique preview channels for feature verification without live site impact.',
        'Promotion Pipeline: Added "Clone" mechanism for non-destructive production updates.',
        'Authentication Shield: Enforced re-authentication layer for Firebase CLI operations.'
      ]
    }
  },
  {
    id: 'v1.0.1',
    title: 'Version Control & UX Refinement',
    date: '2026-03-20 12:00:00',
    updates: {
      tech: [
        'Git Implementation: Initialized local Git repository with formal documentation hierarchy.',
        'Profile Architecture: Implemented Base64 image processing for local-to-cloud profile picture sync.',
        'Documentation v1: Published core Philosophy, Tech-Stack, and Quick Start guides.'
      ],
      feature: [
        'Unified Settings Portal: Restructured Profile, Security, and HR into a multi-section hub.',
        'Functional HR Integration: Implemented Automated Leave Requests with a dashboard-style UI.',
        'Visual Identity: Added Display Picture support and interactive sidebar user context.',
        'Optimized Navigation: Horizontal sidebar header and accordion-style release documentation.'
      ]
    }
  },
  {
    id: 'v1.0.0',
    title: 'The Genesis Update',
    date: '2026-03-20 11:34:00',
    updates: {
      tech: [
        'Initial Git configuration with versioning standards.',
        'Published Philosophy Guide, Tech-Stack Explainer, and Quick Start Guide.'
      ],
      feature: [
        "Real-time Pipeline Tracking (Firebase Integration)",
        "EPISODIC Hub for Long Formats (Series/Features)",
        "AI Studio Manager (Gemini Daily Briefings)",
        "Automated Cloud Notification Engine",
        "Multi-User PIN Authentication System",
        "Live Staff Presence & Shift Logging",
        "Project Directory & Archive System"
      ]
    }
  }
];
