/**
 * THE TUNNEL KNOWLEDGE DATABASE
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for Tunnel AI search & answer engine.
 * All entries are derived from The Tunnel Book (github.com/ytunnel/Tunnel-Book)
 * and Studio Tunnel SOPs.
 *
 * Each article is independently searchable and citeable.
 * Phase 2: This database is passed as context to the Gemini API proxy.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import ch01Raw from './tunnel-book/01-data-and-ingest.md?raw';
import ch02Raw from './tunnel-book/02-timeline-prep.md?raw';
import ch03Raw from './tunnel-book/03-markers-and-colours.md?raw';
import ch04Raw from './tunnel-book/04-colorist-workflow.md?raw';
import ch05Raw from './tunnel-book/05-conform-and-revisions.md?raw';
import ch06Raw from './tunnel-book/06-mastering.md?raw';
import ch07Raw from './tunnel-book/07-delivery.md?raw';
import ch10Raw from './tunnel-book/10-contributing.md?raw';
import ch00Raw from './tunnel-book/00-Notes.md?raw';
import readmeRaw from './tunnel-book/README.md?raw';

export const TUNNEL_KB = [

  // ────────────────────────────────────────────────────────
  // THE TUNNEL BOOK — CHAPTER 01: DATA & INGEST
  // ────────────────────────────────────────────────────────
  {
    id: 'tb-01-storage-pools',
    chapterCode: '01',
    chapterTitle: 'Data & Ingest',
    category: 'Storage & Servers',
    title: 'Storage Pool Structure & What Goes Where',
    tags: ['storage', 'pools', 'truenas', 'color01', 'opt_med', 'output', 'cache', 'Z:', 'O:', 'Y:', 'I:', 'server', 'nas', 'san', 'ingest', 'pool routing', '10g', 'switch', 'network'],
    summary: 'Tunnel runs three storage pools. Raw camera trims go to color01 (Z:). Optimised media goes to opt_med (O:). Grade renders and delivery masters go to output (Y:). The local I:/cache drive is scratch only — never shared, never permanent.',
    canonicalRules: [
      'Raw camera trims → color01 (Z:) under DATA/.../TRIMS/',
      'Optimised media → opt_med (O:) — Resolve reads/writes directly here, no local staging',
      'Grade renders and delivery masters → output (Y:) under DATA/.../RENDERS/',
      'Local I:/cache is Resolve render/gallery cache — local scratch only, NOT the same as opt_med',
      'Pool choice is a performance decision, not just organizational — wrong pool = contention for everyone on the 10G switch',
      'opt_med is at ~87% full (1.05 TB free). Never let projects sit on it past delivery.',
      'color01 is ~71.9% full (28 TiB free). output has the most headroom (75 TiB free).',
    ],
    quickRef: {
      type: 'table',
      headers: ['Pool', 'Mount', 'Role', 'Current Usage'],
      rows: [
        ['color01', 'Z:', 'Raw trims (active project media)', '71.9% full — 28 TiB free'],
        ['opt_med', 'O:', 'Optimised media (shared studio)', '~87% full — 1.05 TB free ⚠️'],
        ['output', 'Y:', 'Renders & delivery masters', '24.4% full — 75 TiB free'],
        ['cache (I:)', 'I:', 'Local Resolve scratch only', 'Not shared, can be wiped anytime'],
      ]
    },
    rawContent: ch01Raw,
  },

  {
    id: 'tb-01-folder-structure',
    chapterCode: '01',
    chapterTitle: 'Data & Ingest',
    category: 'Storage & Servers',
    title: 'Folder Structure & Naming Conventions on color01',
    tags: ['folder', 'naming', 'structure', 'path', 'color01', 'date folder', 'colorist folder', 'category', 'advertisement', 'long format', 'music video', 'SAMIRAN', 'SUJITH', 'YASH', 'project folder', 'DD-MM-YY'],
    summary: 'On color01, the canonical folder path is: DATA / [DD-MM-YY] / [Colorist] / [Category] / PROJECT / [ProjectName] / [subfolders]. The CHCEK subfolder typo is a known issue — propose a fix, don\'t quietly rename it.',
    canonicalRules: [
      'Date folder: DD-MM-YY format (e.g. 19-08-26)',
      'Colorist folder: SAMIRAN / SUJITH / YASH / OTHER/BACKUP',
      'Category folder: ADVERTISEMENT / LONG FORMAT / MUSIC VIDEO — flag if nothing fits, don\'t force-fit',
      'Project subfolders: TRIMS, GRABS, OFFLINE_XML, PREVIEW, RENDERS, CHCEK (known typo for CHECK), VFX',
      'VFX media goes in VFX/ — not TRIMS/',
      'Project folder naming is [PROPOSAL] — a short Client_Project handle is recommended but not yet ratified',
    ],
    rawContent: ch01Raw,
  },

  {
    id: 'tb-01-trim-protocol',
    chapterCode: '01',
    chapterTitle: 'Data & Ingest',
    category: 'Storage & Servers',
    title: 'Trim Protocol — Ingesting Raw Camera Media',
    tags: ['trim', 'ingest', 'camera card', 'verify', 'clip count', 'card format', 'copy', 'source', 'protocol', 'checklist'],
    summary: 'Copy raw trims to color01 Z:/DATA/.../TRIMS/. Always verify clip count and total duration against the source card before formatting. Never clear a card on assumption.',
    canonicalRules: [
      'Confirm destination pool before copying — raw trims go to color01 (Z:), never opt_med or output',
      'Locate or create: date folder → colorist folder → category folder → project folder → subfolders',
      'Copy to TRIMS/ — never move directly off a card without a verified copy landing first',
      'Verify clip count and total duration on color01 match the camera card before that card is formatted',
      'Emergency ingest (card needed on set same day) is allowed — must be flagged in notes.md immediately',
      'Trims are often irreplaceable — the verify step is the one that matters most',
    ],
    rawContent: ch01Raw,
  },

  {
    id: 'tb-01-optmed-management',
    chapterCode: '01',
    chapterTitle: 'Data & Ingest',
    category: 'Storage & Servers',
    title: 'Optimised Media Management & Clearing Protocol',
    tags: ['opt_med', 'optimised media', 'clearing', 'delivery', 'capacity', '87%', 'full', 'data conform', 'clean up', 'storage management'],
    summary: '[PROPOSAL] Data/conform clears a project\'s optimised media from opt_med once that project has delivered. Delivery is the trigger — not a capacity threshold, not a calendar.',
    canonicalRules: [
      '[PROPOSAL] Optimised media lives on opt_med for the duration a project is actively worked',
      '[PROPOSAL] Data/conform clears a project\'s opt_med on delivery — delivery is the trigger',
      'Clearing = removing optimised media only (RENDERS/TRIMS on color01/output follow their own retention)',
      'If opt_med is approaching capacity with no clear delivery trigger, flag in #debrief — don\'t delete without confirming project status',
      'opt_med is at ~87% full — the most contention-sensitive pool with the least headroom',
    ],
    rawContent: ch01Raw,
  },

  // ────────────────────────────────────────────────────────
  // THE TUNNEL BOOK — CHAPTER 02: TIMELINE PREP
  // ────────────────────────────────────────────────────────
  {
    id: 'tb-02-track-layers',
    chapterCode: '02',
    chapterTitle: 'Timeline Prep',
    category: 'Conform & QC',
    title: 'Video Track (Layer) Convention — V1 through V5',
    tags: ['track', 'layer', 'V1', 'V2', 'V3', 'V4', 'V5', 'video track', 'timeline', 'VFX', 'conform', 'online', 'offline', 'plate', 'VFX replacement', 'conform layer', 'layering'],
    summary: 'Every Tunnel timeline uses the same vertical track structure. V1 = editorial source, V2 = VFX plates sent out, V3 = VFX received back, V4 = titles/burn-ins/overlays, V5+ = colorist discretion.',
    canonicalRules: [
      'V1 — Original edit clip (offline conformed to online, or online source). The editorial intent foundation.',
      'V2 — Clips scanned for VFX / plates sent out. Only populated when a plate was sent to a VFX vendor.',
      'V3 — Clips received from VFX (final or in-progress). Replaces V1/V2 visually when present.',
      'V4 — Titles, burn-ins, graphic overlays. Usually empty during grade.',
      'V5+ — Reserved for colorist use (split grades, local regions). Colorist discretion only.',
      'Conformist places VFX replacement on V3. Plate stays on V2. Original editorial stays on V1.',
      'Multiple XML passes must NOT destroy V2/V3 — re-conforming V1 must never touch V2 or V3.',
    ],
    quickRef: {
      type: 'table',
      headers: ['Track', 'Contents', 'Who Manages'],
      rows: [
        ['V1', 'Original editorial source (conformed)', 'Conformist'],
        ['V2', 'VFX plates sent to vendor', 'Conformist / Assistant'],
        ['V3', 'VFX received from vendor', 'Conformist / Assistant'],
        ['V4', 'Titles, burn-ins, overlays', 'Conformist'],
        ['V5+', 'Split grades, local regions', 'Colorist only'],
      ]
    },
    rawContent: ch02Raw,
  },

  {
    id: 'tb-02-xml-handling',
    chapterCode: '02',
    chapterTitle: 'Timeline Prep',
    category: 'Conform & QC',
    title: 'XML Handling & Handoff Checklist',
    tags: ['XML', 'conform', 'handoff', 'checklist', 'assistant', 'colorist', 'handoff checklist', 'conform checklist', 'notes.md', 'missing media', 'chocolate', 'Frame.io', 'offline media'],
    summary: 'Before handing off to the colorist, the assistant confirms: V1/V2/V3 layering is correct, all markers are current, clip colours are accurate, notes.md exists, XML log is current, missing media is marked chocolate, and the project opens cleanly on a second machine.',
    canonicalRules: [
      'Every structural decision must be either a Tunnel documented default, or flagged in notes.md with a reason',
      'Handoff checklist: V1/V2/V3 correct, markers current, clip colours reflect state, notes.md exists, XML log current, missing media marked chocolate, Frame.io link in notes.md',
      'Verify project opens on a second machine before declaring it ready — this catches 80% of path errors',
      'The colorist should not be finding conform errors — if they are, the handoff was incomplete',
      'notes.md is the project\'s mini-Book: read it before opening Resolve on any project',
    ],
    rawContent: ch02Raw,
  },

  // ────────────────────────────────────────────────────────
  // THE TUNNEL BOOK — CHAPTER 03: MARKERS & CLIP COLOURS
  // ────────────────────────────────────────────────────────
  {
    id: 'tb-03-timeline-markers',
    chapterCode: '03',
    chapterTitle: 'Markers & Clip Colours',
    category: 'Colorist Standards',
    title: 'Timeline Marker Colour System',
    tags: ['marker', 'colour', 'color', 'green', 'red', 'blue', 'yellow', 'cyan', 'VFX', 'conform issue', 'matte', 'client note', 'QC', 'Frame.io', 'revision', 'DaVinci Resolve', 'resolve marker'],
    summary: 'Timeline markers use a 5-colour system. Green = VFX shot (canonical). Red = conform/matte issue (canonical). Blue, Yellow, Cyan are proposals pending ratification. Every marker must have a note — a marker with no text is noise.',
    canonicalRules: [
      'Green marker = VFX shot awaiting or in-progress (Canonical). Placed by Conformist/Assistant. Clears when final VFX is conformed and approved.',
      'Red marker = Conform issue or matte issue needs attention (Canonical). Clears when issue is resolved. Escalate if unresolved at session start.',
      'Blue marker = [PROPOSAL] Client note or revision request from Frame.io. Placed by Assistant.',
      'Yellow marker = [PROPOSAL] Colorist flag — revisit this shot. Placed and cleared by Colorist.',
      'Cyan marker = [PROPOSAL] Technical QC flag — legal levels, frame issue, audio sync. Placed by QC/DIT.',
      'Every marker must have a note. A marker with no note is noise.',
      'Green note: Shot code or "VFX pending — [brief desc]"',
      'Red note: What is wrong. One line. "Missing 4f at 01:04:22 — reel 2 XML v3" is useful. "problem" is not.',
      'Point markers for single-shot issues. Range markers for multi-shot or scene spans.',
      'Never use a marker to cover the whole timeline — that is a project-level note for notes.md.',
    ],
    quickRef: {
      type: 'table',
      headers: ['Colour', 'Meaning', 'Who Places', 'Status'],
      rows: [
        ['🟢 Green', 'VFX shot — awaiting or in-progress', 'Conformist / Assistant', 'Canonical'],
        ['🔴 Red', 'Conform / matte issue — needs attention', 'Assistant / Conformist / Colorist', 'Canonical'],
        ['🔵 Blue', 'Client note or revision request', 'Assistant (after Frame.io)', '[PROPOSAL]'],
        ['🟡 Yellow', 'Colorist revisit flag', 'Colorist', '[PROPOSAL]'],
        ['🩵 Cyan', 'Technical QC flag', 'QC / DIT', '[PROPOSAL]'],
      ]
    },
    rawContent: ch03Raw,
  },

  {
    id: 'tb-03-clip-colours',
    chapterCode: '03',
    chapterTitle: 'Markers & Clip Colours',
    category: 'Colorist Standards',
    title: 'Clip Colour System — Issue State Encoding',
    tags: ['clip colour', 'clip color', 'orange', 'brown', 'teal', 'chocolate', 'locked', 'flagged', 'on hold', 'offline', 'missing media', 'VFX approved', 'clip state', 'resolve clip'],
    summary: '[PROPOSAL] Clip colours encode issue state of the clip. Orange = flagged/uncertain, Brown = on hold for external dependency, Teal = locked (lead colorist or CEO to unlock), Chocolate = offline/missing media. No colour = normal state.',
    canonicalRules: [
      '[PROPOSAL] Orange clip = Flagged — something wrong or uncertain (wrong source, suspect metadata, ambiguous handles)',
      '[PROPOSAL] Brown clip = On hold — clip correct but waiting on external dependency (VFX, client approval, replacement plate)',
      '[PROPOSAL] Teal clip = Locked — do not re-conform or replace without explicit approval. Only lead colorist or CEO can remove.',
      '[PROPOSAL] Chocolate clip = Offline / missing media — source not yet on server or has been archived',
      'No colour = normal, default state',
      'At most one colour per clip. More urgent state wins. Record the other state in clip Notes field.',
      'Clip colour reflects current state — clear the colour when the issue resolves.',
      'Do not use clip colour for aesthetic notes or personal preference.',
    ],
    rawContent: ch03Raw,
  },

  // ────────────────────────────────────────────────────────
  // THE TUNNEL BOOK — CHAPTER 04: COLORIST WORKFLOW
  // ────────────────────────────────────────────────────────
  {
    id: 'tb-04-working-spaces',
    chapterCode: '04',
    chapterTitle: 'Colorist Workflow',
    category: 'Colorist Standards',
    title: 'Working Spaces — DWG vs Camera Color Space',
    tags: ['working space', 'DWG', 'DaVinci Wide Gamut', 'DaVinci Wide Gamut Intermediate', 'camera color space', 'LogC', 'S-Log3', 'RedWideGamut', 'HDR', 'SDR', 'OTT', 'episodic', 'commercial', 'ad', 'kickoff', 'color management'],
    summary: 'Tunnel grades in either DWG (DaVinci Wide Gamut Intermediate) or camera color space. DWG is for long-form, HDR-first OTT projects. Camera space is for commercials and SDR-only. The choice is made at project kickoff — no mid-project switches.',
    canonicalRules: [
      'DWG (DaVinci Wide Gamut Intermediate): use for long-form, HDR-first projects (OTT episodics, features, Hotstar/Netflix/Prime deliveries)',
      'Camera color space (Arri LogC, S-Log3, RedWideGamut/Log3G10 etc.): use for commercials and SDR-only deliveries',
      'Working space choice is made at project kickoff and noted in notes.md',
      'Mid-project working space switches are not a thing — pick at the start, commit, document',
      'Both are legitimate Tunnel practice — the choice is workload-driven, not arbitrary',
    ],
    rawContent: ch04Raw,
  },

  {
    id: 'tb-04-pre-clip',
    chapterCode: '04',
    chapterTitle: 'Colorist Workflow',
    category: 'Colorist Standards',
    title: 'Group Pre-Clip — CST Only Rule',
    tags: ['pre-clip', 'group pre-clip', 'CST', 'color space transform', 'input transform', 'creative grade', 'exposure', 'white balance', 'DWG', 'camera raw', 'node', 'anti-pattern', 'trim pass'],
    summary: 'Group Pre-Clip is exclusively for the input transform (camera RAW → DWG). No white balance, no exposure, no creative nodes — nothing else. When working in camera color space (commercials/SDR), Group Pre-Clip is typically empty.',
    canonicalRules: [
      'Group Pre-Clip is exclusively for the input transform (camera RAW → DWG when needed)',
      'No white balance in Pre-Clip',
      'No exposure in Pre-Clip',
      'No scene-level primary in Pre-Clip',
      'No look development in Pre-Clip',
      'If you are adding creative nodes in Group Pre-Clip, you have broken the convention — stop, move the work to the clip-level fixed tree, and clear Pre-Clip back to CST-only',
      'Camera color space projects (commercials/SDR): Pre-Clip is typically empty',
      'DWG projects: Pre-Clip carries camera-native → DWG CST only if the conform did not already handle it',
      '"Just a quick exposure tweak" in Pre-Clip breaks trim-pass discipline irrecoverably',
    ],
    rawContent: ch04Raw,
  },

  {
    id: 'tb-04-fixed-node-tree',
    chapterCode: '04',
    chapterTitle: 'Colorist Workflow',
    category: 'Colorist Standards',
    title: 'Clip-Level Fixed Node Tree — Canonical Structure',
    tags: ['node tree', 'node', 'clip level', 'fixed tree', 'NR', 'noise reduction', 'EXP', 'exposure', 'CON', 'contrast', 'SUB SAT', 'BAL', 'balance', 'HL PUNCH', 'highlight punch', 'T BLEND', 'texture blend', 'layer mixer', 'parallel', 'resolve nodes'],
    summary: 'Tunnel uses a fixed clip-level node tree on every long-form grade: 01 NR → 02 EXP → 03 CON → 04 LINEAR B → 05 SUB SAT → 06 BAL, then parallel branch 07–10 into Layer Mixer → 12 PHS → 14 → 13 T BLEND. Do not reorder, skip, or reshape.',
    canonicalRules: [
      '01 NR — Noise Reduction first, before any creative grade',
      '02 EXP — Exposure: primary correction for under/over',
      '03 CON — Contrast: log-curve handling',
      '04 LINEAR B... — [PROPOSAL pending Yash confirmation of full label]',
      '05 SUB SAT — Subtractive Saturation',
      '06 BAL — Balance: final primary balance before secondaries',
      '07–10 parallel branch — Secondaries, qualifiers, windows, tracked corrections. 10 HL PUNCH = highlight pop',
      'Layer Mixer — combines parallel branches',
      '12 PHS — [PROPOSAL pending confirmation]',
      '13 T BLEND — Texture Blend: last clip-level node. Nothing comes after T BLEND at clip level.',
      'Do NOT reorder the linear chain',
      'Do NOT skip nodes — leave disabled but present if a stage is unused',
      'Do NOT add nodes after 13 T BLEND (post-clip work goes at Group Post-Clip)',
      'Every shot in every long-form grade follows this tree — deviation is a structural error, not a creative choice',
    ],
    rawContent: ch04Raw,
  },

  {
    id: 'tb-04-post-clip-patterns',
    chapterCode: '04',
    chapterTitle: 'Colorist Workflow',
    category: 'Colorist Standards',
    title: 'Group Post-Clip — Pattern A & Pattern B',
    tags: ['post-clip', 'group post-clip', 'look file', 'FilmBox', 'CST out', 'texture', 'grain', 'halation', 'output transform', 'DWG', 'Rec.709', 'PQ', 'Rec.2020', 'HDR', 'SDR', 'look', 'display referred', 'trim pass', 'pattern A', 'pattern B'],
    summary: 'Group Post-Clip uses one of two patterns per project. Pattern A: look file with embedded CST (e.g. FilmBox). Pattern B: look + explicit CST out + texture. Pick at kickoff, document in notes.md, no mid-project switches.',
    canonicalRules: [
      'Pattern A: Look file (e.g. FilmBox) contains its own DWG → Rec.709/Rec.2020 conversion internally. No additional CST out added.',
      'Pattern B: Look or PowerGrades → CST out (DWG → PQ Rec.2020 / Rec.709 G2.4) → Texture (grain/halation). CST is at timeline level, locked.',
      'Use Pattern A when: look is FilmBox-driven, single-output project, no HDR/SDR re-derivation expected',
      'Use Pattern B when: custom-built look from PowerGrades, project needs HDR↔SDR re-derivation, precise texture-in-display-space behavior needed',
      'Texture goes AFTER the CST out (in Pattern B) — texture-in-DWG looks wrong on the FSI',
      'Decision made at project kickoff, documented in notes.md',
      'Do NOT mix patterns within one project',
      'Do NOT add a CST out after a Pattern A look file — that is double-conversion',
    ],
    rawContent: ch04Raw,
  },

  {
    id: 'tb-04-groups',
    chapterCode: '04',
    chapterTitle: 'Colorist Workflow',
    category: 'Colorist Standards',
    title: 'Group Structure & Naming Conventions',
    tags: ['group', 'groups', 'scene', 'per scene', 'per character', 'per location', 'long form', 'commercial', 'ad', 'group naming', 'group cap', 'resolve group', '30 groups'],
    summary: 'Use groups for long-form projects (per scene by default). Do not use groups for ads. Group naming: [ProjectCode]_S[NN]_[ShortDescription]. Soft cap of 30 groups per long-form project.',
    canonicalRules: [
      'Long-form (episodic, feature, >~10 min): always group. Per scene is the default.',
      'Ads (single-cut commercials): per-shot is fine — do not group',
      'Group naming: [ProjectCode]_S[NN]_[ShortDescription] — e.g. TitleX_S03_BeachExterior',
      '[PROPOSAL] Soft cap of 30 groups per long-form project. Beyond 30, split into multiple Resolve projects per episode/reel.',
      'Do NOT create groups retroactively — group at the start of the grade',
      'Do NOT name groups "Group 1", "Group 2" — always descriptive',
    ],
    rawContent: ch04Raw,
  },

  // ────────────────────────────────────────────────────────
  // THE TUNNEL BOOK — CHAPTER 05: CONFORM & REVISIONS
  // ────────────────────────────────────────────────────────
  {
    id: 'tb-05-xml-log',
    chapterCode: '05',
    chapterTitle: 'Conform & Revisions',
    category: 'Conform & QC',
    title: 'The XML Log — Multi-XML Conform Protocol',
    tags: ['XML log', 'xml-log.md', 'conform log', 'multi-XML', 'diff', 'revision', 're-conform', 'version', 'v01', 'v02', 'v03', 'silent error', 'notes.md', 'conformist', 'log entry'],
    summary: 'Every project that receives more than one XML gets an xml-log.md at the project root. Every XML is treated as a diff. Log before, during, and after — never post-hoc. Verbal notifications are not accepted.',
    canonicalRules: [
      'Every XML is a diff — make the diff visible to yourself, the colorist, and future team members',
      'Every project receiving >1 XML gets xml-log.md at the project folder root',
      'xml-log.md is referenced from notes.md',
      'One log entry per XML — never skip one even if the XML turned out to be a duplicate',
      'Never overwrite XML files — rename with the next version suffix. Never delete old XMLs.',
      'Log entry must include: version, date, sender, original filename, diff vs previous, action taken, flags, who conformed',
      'Write the log DURING the conform, not after — memory is unreliable',
      'Notify the colorist in writing with a link to the log — verbal notification is not accepted',
      'If the colorist is mid-session, hold the re-conform until they reach a stopping point',
    ],
    rawContent: ch05Raw,
  },

  {
    id: 'tb-05-relink-diff-technique',
    chapterCode: '05',
    chapterTitle: 'Conform & Revisions',
    category: 'Conform & QC',
    title: 'Relink Diff Technique & Structural Sanity Checks',
    tags: ['relink', 'diff', 'conform workflow', 'duplicate timeline', 'structural check', 'total duration', 'reel count', 'event count', 'frame', '1 frame', 'conform technique', 'V2 V3 preserve'],
    summary: 'Tunnel\'s standard multi-XML diff technique: duplicate the live timeline, import new XML as a separate timeline, relink, observe what comes up offline vs. relinks. Always run 4 structural sanity checks: total duration, reel count, event count, first/last shot.',
    canonicalRules: [
      'Duplicate the live timeline before starting. Label it [ProjectName]_conform_v[N]_diff.',
      'Import new XML as a NEW timeline — not overwriting the live one',
      'Relink the new timeline. What relinks cleanly = unchanged. What comes offline = different take, source, or new shot.',
      'Always verify: total duration matches editor\'s reference QT within 1 frame',
      'Always verify: reel count matches',
      'Always verify: event count per reel matches editor\'s reference',
      'Always verify: first and last shot of each reel visually match editor\'s reference',
      'If any structural check fails — stop conforming. Escalate to lead conformist/colorist if reason unclear within 15 minutes.',
      'Apply changes to the LIVE timeline only after Steps 2 and 3 are complete',
      'Preserve V2 and V3 — re-conforming V1 must NOT touch V2 or V3',
    ],
    rawContent: ch05Raw,
  },

  // ────────────────────────────────────────────────────────
  // THE TUNNEL BOOK — CHAPTER 06: MASTERING
  // ────────────────────────────────────────────────────────
  {
    id: 'tb-06-archive-masters',
    chapterCode: '06',
    chapterTitle: 'Mastering',
    category: 'Conform & QC',
    title: 'Archive Master Standards — Format, Naming & Storage',
    tags: ['master', 'archive master', 'ProRes 4444 XQ', 'ProRes', 'HDR', 'SDR', 'PQ', 'Rec.2020', 'Rec.709', 'Gamma 2.4', 'P3-D65', 'theatrical', 'master naming', 'filename', 'versioning', 'Renders/Masters', 'display referred'],
    summary: 'Archive masters are display-referred ProRes 4444 XQ files, one per output space. HDR = PQ Rec.2020 1000 nits [PROPOSAL]. SDR = Rec.709 Gamma 2.4. Naming: [ProjectName]_[OutputSpace]_master_v[NN].mov. Never overwrite a previous master.',
    canonicalRules: [
      'Masters are display-referred (output space), not scene-referred (DWG)',
      'One master per output space — HDR is its own master, SDR is its own, Theatrical P3-D65 is its own',
      'Format: ProRes 4444 XQ',
      'HDR (long-form): PQ Rec.2020, target peak [PROPOSAL] 1000 nits',
      'SDR (long-form): Rec.709 Gamma 2.4 — derived from DV trim pass',
      'Theatrical: P3-D65 [PROPOSAL] — derived after trim pass on DCI-calibrated monitor',
      'Commercial/web SDR: ProRes 4444 XQ, Rec.709 Gamma 2.4/2.2',
      'Storage path: /07_Renders/Masters/ in the project folder',
      'Naming: [ProjectName]_[OutputSpace]_master_v[NN].mov — e.g. HotstarTitleX_HDR_PQ2020_master_v01.mov',
      'Masters version up — never overwrite a previous master. Re-grade = new version with bumped number.',
      'Audio and captions belong to the deliverable, not the master — masters are picture-only ProRes archives',
    ],
    quickRef: {
      type: 'table',
      headers: ['Output Space', 'Format', 'Encoding', 'When'],
      rows: [
        ['HDR (long-form)', 'ProRes 4444 XQ', 'PQ Rec.2020, 1000 nits [PROPOSAL]', 'After HDR grade approved'],
        ['SDR (long-form)', 'ProRes 4444 XQ', 'Rec.709 Gamma 2.4', 'After DV trim pass'],
        ['Theatrical', 'ProRes 4444 XQ', 'P3-D65 [PROPOSAL]', 'After theatrical trim on DCI monitor'],
        ['Commercial / web', 'ProRes 4444 XQ', 'Rec.709 Gamma 2.4/2.2', 'Dominant ad master format'],
      ]
    },
    rawContent: ch06Raw,
  },

  // ────────────────────────────────────────────────────────
  // THE TUNNEL BOOK — CHAPTER 07: DELIVERY
  // ────────────────────────────────────────────────────────
  {
    id: 'tb-07-preflight',
    chapterCode: '07',
    chapterTitle: 'Delivery',
    category: 'Conform & QC',
    title: 'Delivery Pre-Flight Checklist & Sign-Off Chain',
    tags: ['delivery', 'pre-flight', 'checklist', 'sign off', 'approval', 'Frame.io', 'audio', 'captions', 'QC', 'escalate', 'half-spec', 'client', 'delivery log'],
    summary: 'Every delivery starts with the common pre-flight checklist — no exceptions. Master must be frozen and QC\'d. Client must have approved in writing. Audio and captions must be in spec. If any check fails, stop and escalate.',
    canonicalRules: [
      'Master must be frozen and QC\'d. The master log entry must exist and be signed off.',
      'Client must have approved the master on Frame.io (or equivalent). Approval must be a written comment in notes.md — not a verbal "yeah looks good."',
      'Per-client section in Chapter 07 must exist and be current before proceeding',
      'Audio received from sound vendor in spec format — audio out of spec is a STOP, not a fix-in-delivery',
      'Captions received from caption vendor in spec format — same rule',
      'If any pre-flight check fails: escalate, do not package and hope',
      '[PROPOSAL] 4-step sign-off: 1) Conformist builds & first QC. 2) Lead conformist final QC & Photon. 3) Lead colorist signs creative. 4) CEO sign-off for first delivery to new client only.',
      'Delivery log (delivery-log.md): one entry per delivered package, written before upload',
    ],
    rawContent: ch07Raw,
  },

  {
    id: 'tb-07-hotstar',
    chapterCode: '07',
    chapterTitle: 'Delivery',
    category: 'Conform & QC',
    title: 'Hotstar (Disney+ Hotstar) Delivery Spec',
    tags: ['Hotstar', 'Disney+', 'IMF', 'IMP', 'IMF App2', 'J2K', 'MXF', 'Dolby Vision', 'DV XML', 'L1', 'L2', 'IMSC1', 'captions', 'Aspera', 'Photon', 'validation', 'filename', 'delivery'],
    summary: 'Hotstar deliveries are IMF App2 packages. Picture: J2K MXF from HDR archive master (PQ Rec.2020) + SDR (Rec.709). Audio: 5.1 + fold-down [PROPOSAL from v1.3]. Validate with Photon before any upload. Filename format from v1.3 spec — case-sensitive.',
    canonicalRules: [
      'Picture (HDR): from HDR archive master, PQ Rec.2020, J2K MXF inside IMF',
      'Picture (SDR): from SDR archive master, Rec.709 G2.4',
      'Dolby Vision: DV XML sidecar, L1+L2 metadata from DV trim pass',
      'Audio: [PROPOSAL from v1.3 — 5.1 + 2.0 fold-down, loudness -24 LKFS]',
      'Captions: IMSC1 sidecar [PROPOSAL from v1.3]',
      'Authoring tool: Resolve native IMF export',
      'Validation: Photon report before ANY upload. No IMP leaves Tunnel without Photon-clean report.',
      'Smoke test: play first and last 30s through reference IMP player before upload',
      'Filename: [ShowCode]_[Season]_[Episode]_[Language]_[AspectRatio]_[FrameRate]_[ColorSpace]_[Version].mxf — case-sensitive, confirm exact pattern from v1.3 spec',
      'Upload: [PROPOSAL — Aspera Connect to Hotstar Pulse, confirm current intake method]',
      'Reject pattern to watch: filename/case mismatches, audio channel mapping, caption sync drift, ST.2086 metadata missing',
    ],
    rawContent: ch07Raw,
  },

  // ────────────────────────────────────────────────────────
  // THE TUNNEL BOOK — CHAPTER 10: CONTRIBUTING
  // ────────────────────────────────────────────────────────
  {
    id: 'tb-10-governance',
    chapterCode: '10',
    chapterTitle: 'Contributing to The Tunnel Book',
    category: 'Studio SOPs & Facility',
    title: 'Tunnel Book Governance — Status System & Change Intake',
    tags: ['contributing', 'governance', 'status', 'canonical', 'proposal', 'deprecated', 'weekly review', 'Friday', 'monthly review', 'debrief', 'WhatsApp', '#debrief', '#propose', 'intake', 'ratification', 'change process'],
    summary: 'Every entry is Canonical (no marker), [PROPOSAL] (pending ratification at weekly review), or [DEPRECATED] (kept for reference, scheduled for removal). Changes flow through: #debrief → weekly Friday review → drafting as [PROPOSAL] → primary reviewer → ratification trio signoff → merged.',
    canonicalRules: [
      'Canonical entries: agreed, documented, enforced. No marker.',
      '[PROPOSAL]: suggested convention awaiting team consensus. Discuss at weekly review before treating as settled.',
      '[DEPRECATED]: no longer in use, kept for reference, scheduled for removal at the next monthly review.',
      'Anyone can submit a proposal — no Git literacy required. Submit to #debrief WhatsApp with #propose tag.',
      'Weekly review: Fridays, ~20 minutes. Monthly diff review: first Monday of each month.',
      'Change path: end-of-shift observation → #debrief (daily) → weekly review (Friday) → drafted as [PROPOSAL] → primary reviewer → ratification trio signoff → merged',
      'A Book that changes without discipline is worse than nothing — it looks authoritative but isn\'t.',
    ],
    rawContent: ch10Raw,
  },

  // ────────────────────────────────────────────────────────
  // STUDIO TUNNEL SOPs — FACILITY & OPERATIONS
  // ────────────────────────────────────────────────────────
  {
    id: 'sop-studio-layout',
    chapterCode: 'SOP',
    chapterTitle: 'Studio SOPs & Facility',
    category: 'Studio SOPs & Facility',
    title: 'Studio Layout — Rooms & Capabilities',
    tags: ['studio', 'layout', 'room', 'suite', 'Studio 01', 'Studio 02', 'Studio 03', 'Studio 04', 'assist studio', 'data conform', 'conform', 'HDR', 'SDR', '5.1', 'stereo', 'mastering'],
    summary: 'Studio Tunnel has 4 grading suites, 1 assist studio, and 1 data/conform room. Studio 01 is the primary HDR+SDR+5.1 suite. Studio 03 handles mastering. Max 6 people can work simultaneously across all rooms.',
    canonicalRules: [
      'Studio 01: GRADE — HDR + SDR + 5.1 (primary suite)',
      'Studio 02: GRADE — SDR + Stereo',
      'Studio 03: MASTERING & GRADE — SDR + HDR + Stereo',
      'Studio 04: GRADE & FINISHING — SDR + Stereo',
      'Assist Studio: COLOR GRADE — Assist 1 + Assist 2 / Conform 2',
      'Data & Conform: CONFORM 1',
      'Max 6 individuals simultaneously: 2 grade studios, 1 multipurpose room, 2 assist systems, 1 conform system',
    ],
    quickRef: {
      type: 'table',
      headers: ['Room', 'Spec', 'Primary Use'],
      rows: [
        ['Studio 01', 'HDR + SDR + 5.1', 'Primary grade & client sessions'],
        ['Studio 02', 'SDR + Stereo', 'Grade'],
        ['Studio 03', 'SDR + HDR + Stereo', 'Mastering & grade'],
        ['Studio 04', 'SDR + Stereo', 'Grade & finishing'],
        ['Assist Studio', 'Assist 1 + Assist 2 / Conform 2', 'Assist & secondary conform'],
        ['Data & Conform', 'Conform 1', 'Primary conform & data work'],
      ]
    },
    rawContent: '',
  },

  {
    id: 'sop-project-lifecycle',
    chapterCode: 'SOP',
    chapterTitle: 'Studio SOPs & Facility',
    category: 'Studio SOPs & Facility',
    title: 'Project Lifecycle — 8 Stages',
    tags: ['project', 'lifecycle', 'intake', 'briefing', 'media prep', 'creative execution', 'client review', 'revisions', 'delivery', 'archival', 'stages', 'workflow'],
    summary: 'Every project at Studio Tunnel follows 8 stages: Project Intake → Internal Briefing → Media Prep → Creative Execution → Client Review → Revisions → Final Delivery → Archival.',
    canonicalRules: [
      '01 — Project Intake: client booking, project details, PO verification',
      '02 — Internal Briefing: team assignment, suite allocation, kickoff',
      '03 — Media Prep: ingest, trim protocol, timeline prep, conform',
      '04 — Creative Execution: grading session, node tree, group structure',
      '05 — Client Review: Frame.io upload, notes logging, revision markers',
      '06 — Revisions: re-conform if needed, XML log update, colorist revision session',
      '07 — Final Delivery: master frozen, pre-flight checklist, package, Photon validate, upload',
      '08 — Archival: delivery log closed, opt_med cleared, LTO archive triggered',
    ],
    rawContent: '',
  },

  // ────────────────────────────────────────────────────────
  // THE TUNNEL BOOK — README / OVERVIEW
  // ────────────────────────────────────────────────────────
  {
    id: 'tb-readme',
    chapterCode: '00',
    chapterTitle: 'The Tunnel Book',
    category: 'Studio SOPs & Facility',
    title: 'About The Tunnel Book — Purpose, Structure & Status System',
    tags: ['tunnel book', 'about', 'overview', 'single source of truth', 'living document', 'canonical', 'proposal', 'deprecated', 'structure', 'chapters'],
    summary: 'The Tunnel Book is the single source of truth for how work gets done at Tunnel. It is a living document — everything here reflects current practice. If something you do at the studio isn\'t in here, either it needs to be added or what you\'re doing needs to change.',
    canonicalRules: [
      'Read it on your first day. All of it.',
      'Reference it during work — Chapter 03 (Markers) and Chapter 07 (Delivery Checklists) are meant to be open on a second screen.',
      'Contribute to it — every correction you give or receive on the floor is a candidate Book entry.',
      'The Book and the work stay in sync. If they diverge, one of them needs to change.',
    ],
    rawContent: readmeRaw,
  },

  {
    id: 'tb-00-notes',
    chapterCode: '00',
    chapterTitle: 'Tunnel Book Notes',
    category: 'Studio SOPs & Facility',
    title: 'Floor Notes & Pending Proposals',
    tags: ['notes', 'QC', 'export QC', 'two personnel', 'calibrated monitor', 'apple device', 'QC sign off', 'QC by'],
    summary: '[PROPOSAL] All exports must be QC\'d by 2 personnel on a calibrated monitor or Apple device. QC sign-off requires a note on the first marker with: QC by, date, time.',
    canonicalRules: [
      '[PROPOSAL] All exports must be QC\'d by 2 personnel',
      '[PROPOSAL] QC must be done on a calibrated monitor or Apple device',
      '[PROPOSAL] Once QC done, said personnel adds a note on the first mark: QC by [name], date, time',
    ],
    rawContent: ch00Raw,
  },
];

// ────────────────────────────────────────────────────────
// CATEGORY METADATA
// ────────────────────────────────────────────────────────
export const CATEGORIES = [
  { id: 'all', label: 'All Chapters', icon: '📖' },
  { id: 'Storage & Servers', label: 'Storage & Servers', icon: '🗄️' },
  { id: 'Colorist Standards', label: 'Colorist Standards', icon: '🎨' },
  { id: 'Conform & QC', label: 'Conform & QC', icon: '✅' },
  { id: 'Studio SOPs & Facility', label: 'Studio SOPs & Facility', icon: '🏢' },
];

// ────────────────────────────────────────────────────────
// SUGGESTED PROMPTS FOR THE AI ASSISTANT
// ────────────────────────────────────────────────────────
export const SUGGESTED_PROMPTS = [
  { icon: '🗄️', text: 'Where should I save raw camera trims?' },
  { icon: '🎬', text: 'What are the timeline track layer conventions?' },
  { icon: '🔴', text: 'What does a red marker mean?' },
  { icon: '🟢', text: 'What does a green marker mean?' },
  { icon: '🎨', text: 'What can go in Group Pre-Clip?' },
  { icon: '📹', text: 'When do I use DWG vs camera color space?' },
  { icon: '📦', text: 'How should archive masters be named?' },
  { icon: '⚠️', text: 'How full is opt_med right now?' },
  { icon: '📋', text: 'What is the delivery pre-flight checklist?' },
  { icon: '🗂️', text: 'What is the conform diff technique?' },
];
