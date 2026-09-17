# 06 — Mastering

How a final-approved grade becomes the canonical master that every client deliverable is built from.

**The principle:** A delivery is never built from "the project that's open right now." It is built from a frozen archive master. The master is the source of truth — once exported and signed off, it is the studio's record of the title in that output space, and any per-client package is a derivation of it. The cost of skipping the master step is silent drift between deliveries that look identical to us and aren't identical to the client's QC.

---

## What the master is for

Mastering is the once-per-title work that sits between the colorist's final approval and any per-client packaging. It produces a small, fixed set of archive masters — one per output space — from which all deliveries (Hotstar IMP, Netflix IMF, theatrical DCP, web mezzanine, ad H.264 set) are derived without ever opening the original Resolve project again.

Three things follow from this principle, and they shape the rest of the chapter:

1. **Master is display-referred, not scene-referred.** Tunnel archives in ProRes 4444 XQ in the *output* space. We accept that re-deriving a different output later is not free — it is a re-grade decision, not a re-encode. This is intentional. Display-referred masters preserve trim-pass intent that DWG archives don't.
2. **Audio and captions belong to the deliverable, not the master.** Tunnel's masters are picture-only ProRes archives. Audio is muxed at the IMF / DCP / mezzanine packaging step, never baked into the master.
3. **One master per output space, never one master "with optional flags."** HDR is its own master. SDR is its own master. Theatrical P3-D65 is its own master. There is no "master with HDR enabled."

---

## Archive Masters — one per output space

Every long-form title produces, at minimum, the masters required by its delivery scope. Commercials and web-only titles produce a subset.

| Output space | Format | Color space / encoding | When produced |
|---|---|---|---|
| **HDR (long-form)** | ProRes 4444 XQ | PQ Rec.2020, target peak `[PROPOSAL]` 1000 nits | Once HDR grade is approved |
| **SDR (long-form)** | ProRes 4444 XQ | Rec.709 Gamma 2.4 | After DV trim pass; derived from HDR via the trim |
| **Theatrical** | ProRes 4444 XQ | P3-D65 `[PROPOSAL]` (DCDM derived from this) | After theatrical trim pass on DCI-calibrated monitor |
| **Commercial / web (SDR)** | ProRes 4444 XQ | Rec.709 Gamma 2.4/2.2| The dominant ad master format |
| **Commercial / web (HDR)** | ProRes 4444 XQ | PQ Rec.2020 | Rare, but exists for hero ad campaigns |

**Storage:** every archive master lives in `/07_Renders/Masters/` in the project folder, with a strict filename pattern:

```
[ProjectName]_[OutputSpace]_master_v[NN].mov
e.g.  HotstarTitleX_HDR_PQ2020_master_v01.mov
       HotstarTitleX_SDR_Rec709_master_v01.mov
```

**Versioning:** masters version up the same way XMLs do. A re-grade after delivery requires a new master with bumped version, logged in the master log (see *Hooks for future tooling*). Never overwrite a previous master.

---

## HDR Mastering (long-form)

The HDR master is graded first and is the canonical creative. SDR and DV are derived from it.

### Output pipeline

- **Working space:** DaVinci Wide Gamut Intermediate timeline.
- **Output transform:** CST node at the end of the node tree → PQ Rec.2020.
- **Target peak:** `[PROPOSAL]` 1000 nits unless the client spec mandates otherwise (Hotstar v1.3 confirms; other clients to be added per spec).
- **Monitoring chain:** DeckLink 4K Extreme 12G → FSI XMP, with HDR mode (PQ Rec.2020) verified before every session. Wrong-mode monitoring is the single most expensive HDR error and is invisible until QC.

### Static metadata

Every HDR master carries ST.2084 static metadata:

- **MaxCLL** — measured at master export, not nominal. Use Resolve's HDR analysis or an external scope; record the actual measured value.
- **MaxFALL** — same.
- **Mastering display primaries and white point** — Rec.2020 primaries, D65 white, master display peak per FSI calibration.

These values are written into the IMF/MXF wrapper at delivery time, not into the ProRes archive. The master log (see below) is where we record them per master.

### Anti-patterns specific to HDR mastering

- **Writing nominal MaxCLL/MaxFALL values** ("1000 / 400 — looks right"). Measure every time. Hotstar QC catches false metadata.
- **Mastering with the FSI in SDR mode and forgetting.** Triple-check the monitor mode before any HDR session. Stick a coloured tab on the monitor's mode indicator if it helps.
- **Re-grading inside the IMF authoring tool to "fix HDR levels".** If it needs fixing, fix the master.

---

## Dolby Vision Trim Pass

Tunnel-licensed, in-house, single-trim-drives-both-derivatives.

### The flow (canonical)

1. **HDR grade is locked.** Trim pass starts only after creative sign-off on the HDR master.
2. **Optional overall timeline-level adjustment.** A global L2 trim applied across the whole timeline if the SDR derivation needs a baseline shift before per-shot work — for example, an overall lift of mid-tones if the HDR is highlight-heavy. This is a Tunnel-specific call; document the decision in `notes.md`.
3. **Per-shot DV trim with content mapping.** Trim each shot's L1/L2 metadata against the SDR target on the FSI in SDR mode (or sidecar SDR monitor). Content mapping per Dolby's analysis is the starting point; manual override per shot where the algorithm misreads.
4. **DV XML export from the same trim.** Resolve native DV export — `[PROPOSAL]` confirm whether Tunnel uses the internal Resolve CM Engine end-to-end or routes through CMU for any portion. License is held; authoring is in-house either way.
5. **SDR master rendered from the same trim.** ProRes 4444 XQ in Rec.709 G2.4. This is the SDR archive master — not a separate grade.

### What lives where

| Artifact | Format | Storage |
|---|---|---|
| DV XML (L1 + L2 metadata, per shot) | XML | `/07_Renders/Masters/DV/[ProjectName]_DV_v[NN].xml` |
| DV trim project state | Resolve project (snapshot) | `/06_Resolve/snapshots/[date]_DV_trim_locked/` |
| SDR archive master (derived) | ProRes 4444 XQ | `/07_Renders/Masters/[ProjectName]_SDR_Rec709_master_v[NN].mov` |

### Anti-patterns

- **Grading SDR independently of HDR.** Tunnel does not parallel-grade — SDR is a derivation. If a creative call requires SDR to deviate from the HDR creative beyond what content mapping + trim can achieve, that is a separate creative decision and gets logged in `notes.md` with sign-off.
- **Trim pass on the HDR monitor in SDR-emulated mode without verifying the emulation matches a true SDR display.** Always trim against a calibrated SDR target.
- **Exporting the SDR master before locking the DV XML.** The XML is the source of truth for the trim; the SDR render must come from the same trim, in the same session, no exceptions.

---

## IMF / IMP Authoring `[PROPOSAL]`

> **Status:** Entire section is `[PROPOSAL]` until Tunnel completes its first end-to-end IMF delivery (Hotstar, in flight as of `[date TBD]`). Ratification target: post-first-Hotstar-delivery debrief. Update this section with what actually worked, what broke, and what to do differently next time.

### Plan of record (for first Hotstar delivery)

- **Application:** IMF App2 / App2e per Hotstar Content Guide v1.3 — `[PROPOSAL]` confirm exact app spec from latest Hotstar sheet at delivery time.
- **Authoring tool:** Resolve native IMF export.
- **Picture:** HDR archive master (ProRes 4444 XQ PQ 2020) is the picture source. IMF wraps in J2K MXF.
- **Audio:** Received from sound mix vendor as discrete tracks. 5.1 + 2.0 fold-down per Hotstar v1.3 — `[PROPOSAL]` confirm channel mapping. Loudness target: `[PROPOSAL]` -24 LKFS or per spec.
- **Captions / subtitles:** IMSC1 sidecar tracks, muxed at IMP packaging. Received from vendor or generated per client spec.
- **Validation:** [Photon](https://github.com/Netflix/photon) (open-source IMF validator) before any handoff. No IMF leaves the studio unvalidated.
- **CPL / OPL / Asset Map:** Resolve generates; verify all references resolve before packaging the IMP.

### Things we don't yet know — open questions for the post-delivery debrief

1. Whether Resolve's IMF export handles the Hotstar v1.3 spec end-to-end without intermediate steps.
2. Whether Photon's validation surface matches Hotstar's intake QC 
3. Audio mux specifics — whether sound vendor delivers in IMF-ready WAV/MXF or whether Tunnel re-wraps.
4. Caption sync tolerance and validation tooling.
5. Whether the IMF supplemental delivery model (separate CPL for re-runs) is supported by Resolve or requires external tooling.

Each of these resolves into a canonical entry post-delivery.

### Anti-patterns (already known, even pre-delivery)

- **Authoring IMF from a live Resolve project instead of from the archive master.** The whole point of the archive master is that it's frozen. IMF picks up the master, not the project state.
- **Skipping Photon because "Resolve produced it cleanly."** Validate every time. Resolve's exporter and Hotstar's validator are not the same surface.
- **Treating IMF as a one-shot delivery.** The supplemental model (re-cut episodes, fixed shots, re-runs) means the IMF for a given title has a lifecycle. Plan for it from the first delivery.

---

## Theatrical / DCP

In-house DCP authoring. Trim pass on a DCI-calibrated monitor before encode.

### Output pipeline

- **Working space:** DWG timeline.
- **Theatrical trim pass:** DWG → P3-D65 CST. Trim per shot on a P3-D65-calibrated monitor (`[PROPOSAL]` confirm Tunnel's theatrical monitoring chain — FSI in P3-D65 mode or dedicated theatrical reference).
- **Theatrical archive master:** ProRes 4444 XQ in P3-D65. This is the master from which the DCP is derived.
- **DCP encode:** P3-D65 → DCI X′Y′Z′ (gamma 2.6) → JPEG2000.

### Authoring tool

**DCP-O-Matic** is Tunnel's primary DCP authoring tool. Resolve native DCP export is `[PROPOSAL]` reserved for [decision rule TBD — possibly quick-turnaround unencrypted shorts where DCP-O-Matic packaging time isn't worth it]. Confirm or write the rule.

### Frame rate

- **24fps** default for theatrical.

### DCP package contents

- CPL (Composition Playlist)
- PKL (Packing List)
- AssetMap
- VOLINDEX
- KDM (if encrypted — held by distributor / theatre, not Tunnel)
- Audio: 5.1 / 7.1 at 48kHz, separate WAV/MXF tracks
- Subtitles: SMPTE timed text (XML) sidecar, or burned-in (declared per project)

### DCDM intermediate

`[PROPOSAL]` Tunnel default: skip DCDM, encode J2K direct from the P3-D65 master via DCP-O-Matic. Confirm or capture the exception case.

### Anti-patterns

- **Using sRGB or "Rec.709 with brightness boost" as a stand-in for theatrical color.** P3-D65 is the trim space. Anything else is a guess.
- **Frame rate mismatch.** A 24fps DCP delivered to a 25fps distributor (or vice versa) is a re-encode at minimum. Confirm frame rate in the project kickoff, not at delivery.
- **DCP authored without a P3-D65 trim pass.** Even a quick theatrical deliverable gets a trim. The Rec.709 → X′Y′Z′ direct path is a delivery error, not a shortcut.

---

## Commercials / Web Mastering

Different rhythm from long-form. Same archive discipline.

### Archive master

- **Default:** ProRes 4444 XQ in Rec.709 Gamma 2.4. One archive master per cut.
- **HDR ad** (rare): ProRes 4444 XQ in PQ Rec.2020, same MaxCLL/MaxFALL discipline as long-form HDR.
- **Frame rate:** 25fps for Indian-domestic ads, 23.98 for international markets — confirmed per project at kickoff.

### Per-platform deliverables (derived from the master, not graded separately)

| Platform | Format | Notes |
|---|---|---|
| Client master | ProRes 422 HQ | Mezzanine for client's own re-encodes |
| YouTube / web | H.264 1080p / 4K | 16:9 |
| Instagram feed | H.264 1080×1080 | 1:1 reformat from 16:9 |
| Instagram reels / TikTok | H.264 1080×1920 | 9:16 reformat |
| Title-safe / action-safe | — | Honour during reformat, not as an afterthought |

### Loudness

`[PROPOSAL]` Tunnel default: -16 LKFS for web, -24 LKFS for broadcast. Per-platform override per project. Confirm at the next monthly review.

---

## Master-Level QC (Pre-Delivery)

Before any client package is built from a master, the master itself is QC'd. This QC is independent of and prior to the per-client QC in [07-delivery.md](07-delivery.md).

- [ ] Master plays back end-to-end on a second machine with no dropouts or codec errors
- [ ] Audio reference (if muxed for QC purposes) is in sync at the first and last shot of each reel
- [ ] Five hero shots colour-checked against the approved client review (Frame.io or vendor preview) on the FSI in the correct mode
- [ ] HDR master only: MaxCLL / MaxFALL measured and recorded in the master log
- [ ] DV trim only: validated in DV preview mode before XML export; XML exports cleanly from Resolve
- [ ] SDR derivation: spot-check 5 shots against the HDR creative on a calibrated SDR display
- [ ] Filename matches archive convention exactly
- [ ] Project `notes.md` updated with master version, date, exporter
- [ ] Master log entry written (see *Hooks for future tooling*)

A master that fails any of the above is not the master. Re-export and re-QC. Do not paper over master-level errors at the delivery stage.

---

## Anti-patterns

- **Building a delivery from the live Resolve project instead of from a frozen master.** The whole point of the master is that it doesn't change after sign-off. If you're opening the Resolve project to render the H.264 mezzanine, you've broken the chain.
- **Re-grading inside the delivery package.** A "small fix at delivery" is a new master. Bump the version, re-QC, log it.
- **Archiving in DWG to "future-proof".** Tunnel has chosen display-referred archives deliberately. DWG archives shift the trim-pass burden into the future. Don't relitigate this without taking it through the weekly review.
- **Skipping master-level QC because the colorist's session monitor looked fine.** Session monitoring and master QC are different surfaces. The session monitor is for grading; QC is for verifying the export.
- **Missing master log entries.** A master that wasn't logged is a master that doesn't exist for forensic purposes. Log every export, including aborted ones.
- **One master "with optional flags".** HDR and SDR are separate masters, not the same file with metadata switches.

---

## Hooks for future tooling

- **Master log per project (`master-log.md`).** Analogue of `xml-log.md`. Every master export logged with timestamp, version, output space, MaxCLL/MaxFALL (HDR), exporter, archive path, and any flags. Machine-readable so Tunnel Bot can answer "what's the latest HDR master for [project]?" or "what was MaxCLL on the v02 HDR master?"
- **Photon validation wrapper.** Bot command `/validate-imp [project]` runs Photon against the latest IMP and returns the report. Cheap once the IMF flow is canonical.
- **DCP-O-Matic batch job triggers.** Bot kicks off a DCP encode from a P3-D65 master with parameters from the project's `notes.md`.
- **Master QC checklist as bot interaction.** Bot walks the QC list, captures sign-off per item, writes the entry into the master log. Removes the "I forgot to write it down" failure.
- **Per-client delivery template generator.** Once `07-delivery.md` is canonical, bot can scaffold the per-client package folder and pre-fill metadata from the master log.

All of these are cheap to build once the master log format is stable. Format consistency across projects is the prerequisite.

---

## Onboarding drill

For a new associate or conformist moving toward mastering work: take a graded short film (one reel, ~10 minutes) and produce all five archive masters relevant to a Hotstar-style delivery — HDR, SDR (via DV trim), DV XML, theatrical P3-D65 (if applicable), and a web mezzanine. Run the master-level QC checklist on each. Walk through this chapter and [07-delivery.md](07-delivery.md) as you go. Have your masters validated against the QC list by the lead colorist before treating the drill as complete.

This drill takes a full day. It is the most reliable way to verify that someone has internalized the master-as-source-of-truth principle, because the moment they try to skip the master and go grade-direct-to-deliverable, the QC list catches it.

---

*Owner: Lead colorist (mastering authority) + lead conformist (packaging authority) — co-owned · Cross-references: [04-colorist-workflow.md](04-colorist-workflow.md), [05-conform-and-revisions.md](05-conform-and-revisions.md), [07-delivery.md](07-delivery.md) · Status: Canonical on archive master format, HDR mastering pipeline, DV trim flow, and DCP authoring discipline. `[PROPOSAL]` on entire IMF section (ratification target: post-first-Hotstar-delivery debrief), HDR target peak (1000 nits default), theatrical monitoring chain and DCDM default, DCP-O-Matic vs Resolve-native decision rule, theatrical frame rate default, web/broadcast loudness targets. Primary reviewer: Lead colorist — TBD named.*
