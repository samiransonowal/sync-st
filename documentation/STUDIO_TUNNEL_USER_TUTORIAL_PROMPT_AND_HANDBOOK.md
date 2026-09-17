# STUDIO TUNNEL — WEB APP MASTER TRAINING MANUAL & PROMPT

> **Instructions for Claude:**
> You are an expert video producer, technical writer, and post-production workflow consultant. Using the comprehensive information below, generate:
> 1. **A Complete Video Tutorial Script & Storyboard** (Scene-by-scene breakdown with visual instructions, screen recording cues, callouts, and conversational, engaging voiceover narration).
> 2. **A Polished, Ready-to-Print PDF User Manual & SOP Handbook** formatted with clean tables, step-by-step workflows, role-based cheat sheets, and troubleshooting tips.

---

## 📌 Executive Summary & System Overview

- **Application Name**: Studio Tunnel Operations & Workflow Sync (`SYNC_ST`)
- **Web App URL**: `https://sync.studiotunnel.com`
- **Application Type**: Progressive Web App (PWA) with real-time Firebase backend, Google Sheets, BigQuery data warehouse synchronization, and ntfy.sh instant lock-screen push notifications.
- **Target Audience**:
  - Executive Leadership (CEO / COO)
  - Line Producers (Production Department)
  - Colorists (Sr. Colorists & Colorists)
  - Assistant Colorists
  - Conformists & Floor Managers

---

## 👥 Studio Roster & User Codes Directory

| User Code | Full Name | Primary Role | Room / Dept | Registered Email |
| :--- | :--- | :--- | :--- | :--- |
| **`u1`** | **Yash Soni** | Sr. Colorist / CEO | Studio 01 | `yash@studiotunnel.com` |
| **`u3`** | **Samiran Sonowal** | Colorist / COO | Studio 03 | `samiran@studiotunnel.com` |
| **`u2`** | **Sujith Vijayan** | Sr. Colorist | Studio 02 | `sujith@studiotunnel.com` |
| **`u4`** | **Manoj Sahu** | Colorist | Studio 03 | `contactmanojsahu@gmail.com` |
| **`u11`** | **Altamash Ansari** | Line Producer | Production Office | `tamash@studiotunnel.com` |
| **`u0_b`** | **Prakash Jaiswal** | Line Producer | Production Office | `prakash@studiotunnel.com` |
| **`u10`** | **Arjun Kohli** | Assistant Colorist | Assist Studio | `arjun@studiotunnel.com` |
| **`u6`** | **Ayush Dalvi** | Assistant Colorist | Assist Studio | `ayush@studiotunnel.com` |
| **`u9`** | **Vijay Nool** | Assistant Colorist | Assist Studio | `vijay@studiotunnel.com` |
| **`u5`** | **Golu Saha** | Conformist / Floor Mgr | Data & Conform | `golu@studiotunnel.com` |
| **`u12`** | **Aaditya Kamble** | Conformist | Data & Conform | `aaditya@studiotunnel.com` |

---

## 📱 Module 1: Mobile App Installation (PWA)

### 🍏 iOS (iPhone / iPad — Safari)
1. Open **Safari** and navigate to `https://sync.studiotunnel.com`.
2. Tap the **Share Icon** (square with an arrow pointing upward at the bottom bar).
3. Scroll down the actions sheet and tap **"Add to Home Screen"**.
4. Confirm the title as **"Studio Tunnel"** and tap **Add** in the top right corner.
5. The web app is now installed on your home screen and operates in full-screen standalone mode with zero browser address bars.

### 🤖 Android (Google Chrome)
1. Open **Chrome** and navigate to `https://sync.studiotunnel.com`.
2. Tap the **three-dot menu (⋮)** in the top right corner (or tap the bottom *Add Studio Tunnel to Home screen* prompt).
3. Select **"Install app"** or **"Add to Home screen"**.
4. Tap **Install** to confirm.
5. The app will be added to your home screen and app drawer.

---

## 🔔 Module 2: Account Login & ntfy Push Notifications Setup

### 1. First-Time Password Setup & Login
1. On the web app sign-in screen, tap **"First time? Click here to set up password"**.
2. Enter your designated **User Code** (e.g. `u11`, `u10`, `u5`, `u1`) or registered studio email.
3. Choose a secure password and click **Register Account**.
4. Log in using your User Code/Email and password.

### 2. Lock-Screen Push Notifications via ntfy
The studio uses **ntfy.sh** for instant, battery-efficient lock-screen alerts without needing email clutter.

1. **Install the free app**:
   - iOS: [App Store - ntfy](https://apps.apple.com/app/ntfy/id1625396347)
   - Android: [Google Play - ntfy](https://play.google.com/store/apps/details?id=io.heckel.ntfy)
2. **Subscribe to your Personal Topic**:
   - Open ntfy ➔ Tap **`+` (Subscribe)**.
   - Enter your personal channel: **`studio-tunnel-<user_code>`**
   - *Examples*:
     - Altamash (`u11`): `studio-tunnel-u11`
     - Arjun (`u10`): `studio-tunnel-u10`
     - Golu (`u5`): `studio-tunnel-u5`
     - Sujith (`u2`): `studio-tunnel-u2`
3. **Subscribe to Studio Department Channels**:
   - 🎬 **Production & QC Feed**: `studio-tunnel-qc` *(Artist render submissions & client revisions)*
   - 📅 **Studio Operations & Bookings**: `studio-tunnel-ops` *(Suite bookings & session updates)*
   - 💬 **Team Chat**: `studio-tunnel-team` *(Studio-wide announcements)*
4. **Test the Alert**:
   - Click the **Bell (🔔)** icon in the top header of the web app.
   - Tap **"Send Test"** next to your channel to trigger an immediate verification chime on your device.

---

## 📅 Module 3: Line Producer SOP — Studio Bookings & Scheduling

Line Producers manage room allocations across **Studio 01**, **Studio 02**, **Studio 03**, and **Studio 04**.

### Step-by-Step Booking Workflow:
1. Navigate to the **Studio Bookings** tab (`Bookings` / 📅).
2. Use **Schedule View (Room by Room)** or **Week View** to check available grading suites.
3. Click the **`+ NEW BOOKING`** button.
4. Complete the booking modal:
   - **Studio Suite**: Studio 01, Studio 02, Studio 03, or Studio 04.
   - **Date & Timings**: Select calendar date, Start Time, and End Time.
   - **Client Info**: Production House name, Project Name/Code, Director/DOP, agency details.
   - **Assigned Colorist**: Choose the designated Colorist (Yash, Sujith, Samiran, or Manoj).
   - **Session Status**: Confirmed, Tentative (Pencil), or Hold.
5. Click **Create Booking**.
   - Triggers an instant broadcast to `studio-tunnel-ops` and the assigned colorist.
6. **Actions Available on Bookings**:
   - **Interchange / Swap (⇄)**: Drag-and-drop any booking card onto another card (or click the **⇄** icon) to interchange suites and timings simultaneously — the first booking picks up the second booking's suite & time, and vice versa!
   - **Relocate to Studio**: Drag any booking into an open room column (e.g. Studio 04) or select from the interchange dialog to instantly move rooms while keeping your current timing.
   - **Edit (✏️)**: Reschedule dates, update client contacts, or change suites.
   - **Duplicate (📋)**: Clone recurring multi-day project sessions.
   - **Move to Vault (🗑️)**: Soft-delete/archive cancelled sessions.

---

## 📋 Module 4: Line Producer SOP — Creating & Assigning Pipeline Tasks

Tasks move through 4 standardized stages: **Conform ➔ Assist ➔ Grade ➔ Delivery Sync**.

### Creating & Dispatching Tasks:
1. Open the **Tasks** tab (`Kanban` / `Pipeline Board`).
2. Click **`+ ADD NEW TASK`**.
3. Fill out the task card:
   - **Task Title**: Clear deliverable (e.g. *Master XML Conform V2*, *Framing & Prep*, *Hero Grade Pass*, *Final ProRes Master Export*).
   - **Link to Project**: Select active project from dropdown.
   - **Starting Phase**: Conform, Assist, Grade, or Delivery Sync.
   - **Assign To**: Select team member. *(Tip: The `(IN)` tag indicates artists currently clocked in)*.
   - **Instructions / Brief**: Enter framing charts, XML paths, LUT notes, and reference links.
4. Click **CREATE TASK**.
   - The card appears instantly on the live Kanban board.
   - An automated push notification (`studio-tunnel-<user_code>`) pings the assigned artist's phone.
5. **Reassigning Tasks**:
   - Click the **Reassign (👤+)** button on any card to hand off work to the next pipeline stage.

---

## ⏱️ Module 5: Artist SOP (Conformist, Assistant Colorist, Colorist) — Live Time Tracking & QC Handover

Accurate time logs guarantee real-time visibility for Line Producers and sync directly with studio billing and BigQuery metrics.

### Daily Artist Workflow:
1. **Clock In**: Tap **Clock In** upon arriving on shift.
2. **Open Workspace**: Go to **Tasks** or **My Workspace** to view your active tasks.
3. **Start Task Timer (▶️ COMMENCE)**:
   - As soon as you open the project in DaVinci Resolve / Baselight / Avid, click the **Start Timer (▶️)** button on the task card.
   - The card illuminates **green with an active pulse dot**, actively logging session minutes.
4. **Submitting for QC (Link 🔗 button)**:
   - When a review cut or export is ready, click the **Link (🔗)** icon on the card.
   - Paste the Frame.io or Google Drive review link with revision notes and submit.
   - An immediate high-priority alert pings Line Producers on `studio-tunnel-qc`.
5. **Finishing / Advancing Task (Done ✅ button)**:
   - When the phase is complete, click **Mark Done (✅)**.
   - The timer automatically stops, logs exact active duration, updates Google Sheets & BigQuery, and advances the workflow.

---

## 🎬 VIDEO SCRIPT & STORYBOARD OUTLINE (For Claude Video Generation)

### Video Specs:
- **Title**: Studio Tunnel Web App — Complete Onboarding & Workflow Tutorial
- **Target Length**: ~4 to 5 Minutes
- **Tone**: Sleek, professional, modern, upbeat, tailored for high-end film & commercial post-production.

#### Scene Breakdown:
1. **Scene 1: Introduction & PWA Mobile Installation** (0:00 – 1:00)
   - Visual: Split-screen showing iOS Safari & Android Chrome adding the app to home screen with smooth UI animations.
   - Voiceover: Welcome to Studio Tunnel Sync, overview of full-screen web app installation on iPhone and Android.
2. **Scene 2: User Login & Instant Push Notifications (ntfy)** (1:00 – 2:00)
   - Visual: Logging in with User Code (`u1`, `u11`, `u10`, `u5`), downloading ntfy, subscribing to topics, triggering the test bell ping.
   - Voiceover: Explaining the roster user codes, setting up ntfy personal and ops channels, and receiving instant lock-screen alerts.
3. **Scene 3: Line Producer Masterclass — Bookings & Task Dispatch** (2:00 – 3:15)
   - Visual: Line Producer creating a suite booking in Studio 01, switching to Kanban board, adding a task, assigning to an artist with `(IN)` status.
   - Voiceover: How Line Producers control suite occupancy and assign pipeline tasks with automated notifications.
4. **Scene 4: Artist Masterclass — Timer Tracking & QC Submission** (3:15 – 4:30)
   - Visual: Conformist/Assistant clicking Start Timer (card turns glowing green), DaVinci Resolve footage B-roll, clicking Link icon to submit QC cut to LP, marking Done.
   - Voiceover: Starting active timers, seamless handovers across Conform, Assist, and Grade, and instant QC submission.
5. **Scene 5: Summary & Studio Best Practices** (4:30 – 5:00)
   - Visual: Summary checklist graphic with studio logo and support contact.
   - Voiceover: Final wrap-up on keeping ntfy alerts enabled and maintaining live time tracking.

---

## 📄 PDF HANDBOOK EXPORT STRUCTURE (For Claude PDF Generation)
- **Cover Page**: Studio Tunnel branding, document version, revision date.
- **Section 1**: Welcome & System Overview.
- **Section 2**: Team Directory & User Code Matrix.
- **Section 3**: Mobile Installation Quick-Start (iOS & Android).
- **Section 4**: Push Notifications (ntfy) Configuration SOP.
- **Section 5**: Line Producer Booking & Task Management Guide.
- **Section 6**: Artist Time Tracking & QC Submission Standard Operating Procedure.
- **Section 7**: Troubleshooting & FAQ Matrix.
