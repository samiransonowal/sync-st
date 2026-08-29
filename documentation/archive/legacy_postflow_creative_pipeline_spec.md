# 🏛️ Archive: Legacy PostFlow Creative Pipeline & Prototype Specifications

> **Archive Date:** August 29, 2026  
> **Status:** ARCHIVED / REFERENCE ONLY  
> **Original Module:** `apps/frontend/` (PostFlow Studio Prototype)  
> **Reason for Archival:** Cleaned up from active production codebase to eliminate confusion between live financial/operational tools (Google Sheets, GAS, Fast Logger) and unbuilt future creative media pipeline features.

---

## 📖 Overview of Archived Concepts

The **PostFlow Studio** concept was an experimental front-end architecture designed to explore an all-in-one post-production operating system combining aspects of **Frame.io**, **ShotGrid**, and **Monday.com**.

While the financial and operational booking engine is actively connected to Google Sheets (`Atomic_Task_Logs`, `Project_Billing_Ledger`) and Google Apps Script, the creative media pipeline features remained front-end UI simulations. This document preserves the full functional specifications, data models, and architectural intent of those components for future development.

---

## 🧩 Archived Component Specifications

### 1. `AdPipelineTracker.jsx` (10-Step Commercial Post Pipeline & Review Suite)
- **File Size:** ~113 KB (1,867 lines)
- **Purpose:** A linear 10-step ad-film post-production workflow tracker with an integrated DaVinci Resolve/Premiere-style in-browser Review Suite.
- **The 10-Step Lifecycle:**
  1. **Project Registration:** Capture commercial details, brand, producer, and all 18 HOD contacts.
  2. **Script & PPM Input:** Planned Gemini LLM document parser to analyze shooting scripts/PPM decks and extract deliverable formats (60s TVC, 30s Master, 15s Cutdown, 7s Bumper), scene counts, VFX plate requirements, brand color codes, and VO profiles.
  3. **DIT Operations:** Checksum hash logger (Silverstack / ShotPut Pro xxHash64 / MD5) and proxy transcode status (ProRes Proxy / DNxHR).
  4. **Footage Shipping:** Physical SSD/drive courier manifest tracking ID logger and high-speed data transfer (Aspera / Signiant / MASV) status tracker.
  5. **Offline Edit:** Narrative cut assembly tracker (Rough Cut, Fine Cut, Picture Lock) and A/B camera take switcher.
  6. **Audio Suite:** Sound design track-laying, Foley FX, interactive music stem trial player (Drums, Bass, Melody, Full Mix), and regional VO take switcher.
  7. **Color Grade:** CDL / ShowLUT manager and live CSS filter look preview engine (Look 1: Rec.709, Look 2: Teal & Orange, Look 3: Golden Commercial, Look 4: High-Contrast Monochromatic).
  8. **VFX Pipeline:** Shot plate pull tracker with handle lengths (e.g., 8 frames) and color space tags (ACES AP1 Linear / EXR).
  9. **Online Studio:** Autodesk Flame conform checklist, logo packaging, graphic supers, and broadcast legalization QC.
  10. **Language Adapts:** Multi-aspect ratio matrix (16:9, 9:16, 1:1, 4:5) and regional dubbing/subtitle burns (Hindi, Tamil, Telugu, English).
- **Review Suite Specifications:**
  - 24fps keyboard-controlled scrubbing (Spacebar play/pause, Arrow key frame stepping).
  - SMPTE timecode calculation (`HH:MM:SS:FF`).
  - Dual source vs. program comparison monitors.
  - Timecoded client and director comment annotations.

---

### 2. `HODSync.jsx` (Department Status Matrix & Bottleneck Control Room)
- **Purpose:** Centralized real-time "Control Room" for Heads of Departments (Director, Editor, Colorist, VFX Lead, Post Producer).
- **Functionality:**
  - Department status matrix (DIT, Editorial, VFX, Audio, Color, Online).
  - Timecoded alert feed (e.g., `01:04:22:15 - Missing VFX plate for shot 040`).
  - Stage sign-off and bottleneck resolution dashboard.

---

### 3. `DitHub.jsx` (On-Set DIT Camera Take Logging Hub)
- **Purpose:** Direct on-set camera logging for Digital Imaging Technicians.
- **Functionality:**
  - Logs camera RAW/MXF clip names (`A001_C004_0724A1.MXF`).
  - Timecode Start/End records.
  - Scene, Shot, Take numbers, Sound Roll references, and Director circle takes (`isCircled: true`).

---

### 4. `PreEdit.jsx` (Ingestion Prep & Audio/Video Auto-Sync Engine)
- **Purpose:** Automated post-ingest preparation engine.
- **Functionality:**
  - Automated timecode-based matching between video clips and production audio rolls (`.WAV`).
  - Auto-generation of scene-wise project bins (`SC_12`, `SC_14`) with director clip markers in FCP7 XML format.

---

### 5. `NlePanel.jsx` (NLE Workflow Extension Simulation)
- **Purpose:** In-app simulation of an Adobe Premiere Pro (CEP/UXP) or DaVinci Resolve Workflow Integration extension.
- **Functionality:**
  - Passive session timer tracking active editor hours.
  - Direct timeline sync for client comments and marker notes targeted to Online Editor or Colorist.

---

### 6. `ConformHandover.jsx` (Picture Lock Finishing Prep & Burn-In Monitor)
- **Purpose:** Packaging conformed timelines once picture edit is locked.
- **Functionality:**
  - Translates Premiere XML timelines to DaVinci Resolve conform structures.
  - Simulates offline reference video exports with burned-in source clip names and Source/Record timecode overlays.

---

### 7. `VfxPipeline.jsx` (Timeline VFX Plate Pull Manager)
- **Purpose:** Automated plate pulling for VFX vendors.
- **Functionality:**
  - Reads timeline coordinates and cuts raw camera master clips with head/tail handles.
  - Enforces color space conversion to ACES AP1 Linear (EXR sequences).

---

### 8. `VfxTracker.jsx` (Long-Form Feature Film VFX Shot Grid)
- **Purpose:** ShotGrid/Shotgun style database for managing 500+ VFX shots across external vendors (ILM, Weta, Framestore, In-House).
- **Functionality:**
  - Sequence-level shot filtering (`SQ010`, `SQ020`).
  - Status lifecycle tracking (*Pending Plate, In Progress, Internal Review, Director Review, Final Approved*).
  - Real-time overall completion analytics widget.

---

### 9. `Dashboard.jsx` (Role-Based "Up Next" Task Queue)
- **Purpose:** Role-filtered dashboard allowing team members (Editor, Colorist, Director, Sound Designer, Producer) to view only tasks awaiting their action.

---

## 🚀 Architectural Blueprint for Future Implementation

If Studio Tunnel decides in the future to build out a real media processing and review platform, the following infrastructure must be provisioned:

1. **Media Storage & Transcoding:**
   - Google Cloud Storage (GCS) or AWS S3 for RAW/Proxy storage.
   - Cloud Run / AWS MediaConvert / FFmpeg worker cluster for automated ProRes Proxy & web MP4 transcode generation.
2. **Real-time Collaboration:**
   - WebSockets or Firestore real-time listeners for live timecoded client comments and multi-user cursor review.
3. **AI Document Processing:**
   - Live integration with Google Gemini 1.5 Pro / 2.0 Flash API via Cloud Functions for real PDF/PPM document parsing.
4. **NLE Plugins:**
   - Adobe Premiere Pro UXP plugin / DaVinci Resolve Python Studio API integration for direct timeline-to-cloud bidirectional marker sync.
