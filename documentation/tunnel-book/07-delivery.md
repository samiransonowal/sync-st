# 07 — Delivery

How a frozen archive master becomes a packaged, validated, signed-off delivery to a specific client.

**The principle:** A delivery is never authored — it is *derived*. Picture comes from the archive master ([06-mastering.md](06-mastering.md)), audio comes from the sound vendor, captions come from the captioning vendor, and the chapter's job is to specify exactly how those pieces are assembled per client. If the spec lives in a Drive folder of old emails or in someone's head, this chapter has failed.

---

## What this chapter is for

Every active client gets a section. Each section answers four questions:

1. What is the deliverable shape? (IMF / DCP / mezzanine + per-platform encodes)
2. What master is the source?
3. What are the literal spec values? (filename, frame rate, loudness, slate, captions)
4. How do we validate before upload?

When Tunnel onboards a new client, you create the section *before* the first delivery, even if it's a `[PROPOSAL]` stub — because the act of writing the section forces the spec questions to surface while there's still time to ask the client.

---

## Common pre-flight (independent of client)

Every delivery, every client, every format starts here. No exceptions.

- [ ] Master is frozen and QC'd per [06-mastering.md](06-mastering.md). The master log entry exists and is signed off.
- [ ] Client has approved the master on Frame.io (or equivalent client review surface). Approval is captured as a written comment in `notes.md`, not a verbal "yeah looks good."
- [ ] Per-client section in this chapter exists and is current. If it isn't, stop and write it before continuing.
- [ ] All `[PROPOSAL]` placeholders in the per-client section are resolved for *this* delivery, even if not yet ratified for the chapter.
- [ ] Audio received from sound vendor in the spec format. Audio out of spec is a stop, not a fix-in-delivery.
- [ ] Captions / subtitles received from caption vendor in the spec format. Same rule.

If any of the above fails, you don't have a delivery yet. You have a delivery problem, and the right move is to escalate, not to package something half-spec and hope.

---

## Sign-off chain `[PROPOSAL]`

| Step | Role | Authority |
|---|---|---|
| 1 | Conformist / associate | Builds the delivery package from the frozen master. Runs first-pass QC on the package itself (file integrity, filename, slate). |
| 2 | Lead conformist | Final QC pass. Runs platform-specific validation tooling (Photon for IMF, DCP-O-Matic test for DCP). Signs validation. |
| 3 | Lead colorist | Verifies the master version used matches the approved master. Signs creative. |
| 4 | | **First delivery to a new client only.** Final ship authorization. After the first delivery is accepted, repeat deliveries follow the 1–3 chain without CEO sign-off. |

Status: `[PROPOSAL]` on the four-step chain — particularly the CEO-only-on-first-delivery rule. Ratify or modify at the next monthly review.

---

## Delivery Log

Every project that produces a delivery gets a `delivery-log.md` at the project root. Same shape as `xml-log.md` and (proposed) `master-log.md`.

### Template

```markdown
# Delivery Log — [Project Name]

## [Client] — [Title / Episode] — Delivered [date]
- Format: [IMF App2 / DCP / H.264 mezzanine + 16:9 + 9:16 + 1:1 / etc.]
- Master used: [filename and version from master log]
- Validation: [Photon report path / DCP-O-Matic test result / etc.]
- Uploaded via: [Aspera / Hotstar Pulse / Frame.io / direct S3 / WeTransfer / etc.]
- Upload completed: [date / time]
- Client acknowledgement: [date / received-by]
- QC issues raised by client: [none / list with resolution]
- Built by: [name]
- Signed off by: [conformist, colorist, CEO if applicable]
- Archive triggered: [date — LTO move from /04_Online]
```

### Rules for the log

1. **One entry per delivered package.** A project that ships HDR + SDR + DCP gets three entries, one per package, even if they go on the same day.
2. **Entries are written *before* upload, not after.** The "upload completed" and "acknowledgement" fields are filled in as those events happen. Writing post-hoc is how the log goes wrong.
3. **Client QC issues are logged with resolution.** If Hotstar rejects v01 and accepts v02, both entries exist. The reject reason is the most valuable forensic data the studio accumulates.
4. **Archive trigger is logged.** LTO move from `/04_Online` is the formal end of the project's online life. Logging it prevents accidental re-use of the project folder.

---

## Per-client sections

### Hotstar (Disney+ Hotstar)

> **Status:** Section structure canonical. Literal spec values flagged `[PROPOSAL — from v1.3]` need to be filled from the live Hotstar Content Guide v1.3 by the lead conformist before the first delivery. Once filled and validated against an accepted delivery, the values become canonical and the section is fully ratified.

#### Deliverable shape

| Component | Source | Notes |
|---|---|---|
| Picture (HDR) | HDR archive master ([06-mastering.md](06-mastering.md)) | PQ Rec.2020, wrapped as J2K MXF inside IMF |
| Picture (SDR) | SDR archive master | Rec.709 G2.4, derived from DV trim |
| Dolby Vision | DV XML from DV trim pass | L1 + L2 metadata, sidecar |
| Audio | Sound vendor, IMF-ready WAV/MXF | 5.1 + 2.0 fold-down `[PROPOSAL — from v1.3]`. Loudness `[PROPOSAL — from v1.3, typically -24 LKFS]` |
| Captions / subtitles | Caption vendor | IMSC1 sidecar `[PROPOSAL — from v1.3]` |
| Slate | Conformist | Format `[PROPOSAL — from v1.3]`. Head slate, tail slate, or both per spec. |

#### IMP packaging

- **Authoring tool:** Resolve native IMF export → packaged as IMP.
- **Application:** IMF App2 / App2e `[PROPOSAL — confirm from v1.3]`.
- **CPL / OPL / AssetMap:** Resolve generates. Verify all asset references resolve before packaging.
- **Supplemental delivery:** for re-cut episodes or fixed shots, supplemental CPL referencing original IMP `[PROPOSAL — confirm Hotstar accepts supplementals or requires full re-deliveries]`.

#### Filename convention `[PROPOSAL — from v1.3]`

Pattern to be filled from v1.3 spec. Common Hotstar shapes look like:

```
[ShowCode]_[Season]_[Episode]_[Language]_[AspectRatio]_[FrameRate]_[ColorSpace]_[Version].mxf
```

Confirm the exact shape required and any case-sensitivity rules. Hotstar QC rejects on filename mismatches — this is not a free-form field.

#### Frame rate `[PROPOSAL — from v1.3]`

Typically 23.98 or 25 depending on title origin. Confirm per project at kickoff and capture in `notes.md` before mastering, not at delivery.

#### Validation

1. **Photon validation** before any upload. No IMP leaves Tunnel without a Photon-clean report. Report saved to `/08_Delivery/Hotstar/[date]_photon_report.txt`.
2. **In-package smoke test:** play first 30s and last 30s of the IMP through a reference IMP player (Easy IMF Player or similar `[PROPOSAL — confirm Tunnel's tool]`) to catch wrap-level issues Photon doesn't surface.
3. **Filename + asset reference cross-check** before zipping the IMP folder.

#### Upload

`[PROPOSAL — Aspera Connect to Hotstar Pulse, or whatever the current Hotstar intake is. Confirm.]`

#### Reject patterns to watch for

To be populated after first delivery as Hotstar's QC report comes in. Initial guesses to validate against:

- Filename / case-sensitivity mismatches
- Audio channel mapping or loudness
- Caption sync drift > spec tolerance
- ST.2086 metadata missing or nominal
- DV XML L6 metadata missing

---

### Netflix `[PROPOSAL]`

> **Status:** Stub. Section to be filled when the first Netflix delivery is in flight. Do not treat as canonical. Do not deliver to Netflix using only this stub — write the section first.

Plan-of-record fields (to be confirmed against Netflix Content Hub spec):

- Format: IMF App2e expected; Netflix is stricter on App version than Hotstar.
- Picture: HDR PQ Rec.2020 + SDR Rec.709 + DV XML.
- Audio: per Netflix Production Audio Specification — discrete tracks, strict loudness.
- Captions: per Netflix TTML / IMSC1 spec.
- Validation: Netflix runs its own intake validation; Photon-clean is necessary but not sufficient.
- Filename: per Netflix spec, strict.
- Upload: Backlot / Content Hub.

Open questions for first Netflix kickoff:

1. Whether Netflix requires Tunnel to onboard as an authorized post vendor before delivery.
2. Whether Netflix accepts supplemental CPLs or requires full re-deliveries.
3. Audio format from sound vendor — Netflix is more demanding than Hotstar.

---

### Prime Video `[PROPOSAL]`

> **Status:** Stub. To be filled when the first Prime Video delivery is in flight.

Plan-of-record fields (to be confirmed against Amazon MGM Studios delivery spec):

- Format: IMF expected; Amazon's exact App version per spec.
- Picture: per spec.
- Audio + captions: per spec.
- Validation: Amazon's intake QC; specifics TBD.
- Filename: per spec.
- Upload: Amazon-specified channel, typically S3 or Aspera.

Open questions to surface at first Prime kickoff before any work begins.

---

### Theatrical / DCP `[PROPOSAL]`

> **Status:** First theatrical DCP delivery in flight. Section will move to canonical once the first delivery is accepted by the distributor / lab.

#### Deliverable shape

| Component | Source | Notes |
|---|---|---|
| Picture | Theatrical archive master (P3-D65 ProRes 4444 XQ per [06-mastering.md](06-mastering.md)) | Encoded to JPEG2000 via DCP-O-Matic |
| Audio | Sound vendor | 5.1 / 7.1 at 48kHz, separate WAV/MXF tracks |
| Subtitles | Caption vendor | SMPTE timed text (XML) sidecar, or burned-in if specified |
| Encryption | Distributor | KDM held by distributor; Tunnel produces unencrypted DCP unless told otherwise |

#### Authoring

DCP-O-Matic (primary). Resolve native DCP `[PROPOSAL — define decision rule, possibly quick unencrypted shorts]`.

#### Frame rate

- 24fps default for theatrical.
- 25fps when distributor specifies (some Indian theatrical contexts) `[PROPOSAL — confirm Tunnel's standing default and exception rule per distributor]`.

#### Package contents

- CPL (Composition Playlist)
- PKL (Packing List)
- AssetMap
- VOLINDEX
- Audio tracks (separate per channel layout)
- Subtitle XML if applicable
- KDM (only if encrypted; held by distributor)

#### Validation

1. **DCP-O-Matic verification step** before zipping the DCP folder.
2. **Test playback** in DCP-O-Matic Player or equivalent `[PROPOSAL — confirm Tunnel's verification player]` before handoff.
3. **Distributor / lab verification** at their end after delivery.
4. **Test screening** when feasible — a DCP that has never been projected on a real cinema screen has not been validated. For first-time distributor relationships, push for a test screening before the public premiere.

#### Handoff

`[PROPOSAL — physical drive (eSATA / CRU) shipped to lab vs cloud upload, depending on distributor preference. Define Tunnel default and per-distributor exceptions.]`

---

### Web / Commercials

Tunnel's most frequent delivery rhythm. Different from long-form: many short deliverables per project, rapid turnaround, minimal QC ceremony per deliverable but rigorous adherence to the per-platform spec.

#### Deliverable shape

| Component | Source | Notes |
|---|---|---|
| Client master | Commercial archive master (ProRes 4444 XQ Rec.709 per [06-mastering.md](06-mastering.md)) | Re-wrapped as ProRes 422 HQ for client mezzanine |
| Per-platform encodes | Client master | Derived per platform spec |

#### Per-platform encodes

| Platform | Format | Aspect | Notes |
|---|---|---|---|
| YouTube / web | H.264 MP4 | 16:9 1080p / 4K | Bitrate per platform recommendation |
| Instagram feed | H.264 MP4 | 1:1 1080×1080 | Reformat from 16:9, title-safe verified |
| Instagram reels / TikTok | H.264 MP4 | 9:16 1080×1920 | Reformat from 16:9, action-safe verified |
| OTT pre-roll | H.264 MP4 | 16:9 1080p | Per OTT platform spec, often shorter cutdowns |
| Broadcast | ProRes 422 HQ or per spec | 16:9 1080p / SD letterbox | Per channel spec, captions if specified |

#### Frame rate

- 25fps for Indian-domestic ads.
- 23.98fps for international / Western markets.

Confirm per project at kickoff. Don't assume.

#### Loudness `[PROPOSAL]`

Tunnel default placeholders:

- Web (YouTube, social): -16 LKFS
- OTT pre-roll: -24 LKFS
- Broadcast: -24 LKFS or per channel spec

Confirm or override per project. Loudness is the second-most-common reason ad deliveries get bounced (after filename).

#### Filename `[PROPOSAL]`

Tunnel default for ad mezzanine and per-platform encodes — define convention. Common pattern:

```
[Brand]_[Campaign]_[Cut]_[Aspect]_[Length]_[FrameRate]_v[NN].mp4
e.g. Brand_Campaign_HeroCut_16x9_30s_25fps_v01.mp4
```

#### Delivery channel

Client-specified: WeTransfer for ad agencies, Frame.io for OTT pre-roll, direct S3 for some bigger clients. Per-client capture in the project's `notes.md`.

#### Reformat discipline

Reformats to 1:1 and 9:16 are not afterthoughts. Title-safe / action-safe must be honoured at the master grade stage if the brief specifies multi-aspect. If the master was graded only for 16:9 and a reformat is needed late, the reformat is a separate creative pass with sign-off — not a conformist's ad-hoc crop.

---

## Anti-patterns

- **Building from the live Resolve project instead of the frozen master.** Every entry in this chapter assumes the master is the source. Skip that and the whole pre-flight collapses.
- **"Verbal sign-off from the client over a call."** Doesn't exist as far as the delivery log is concerned. Get it in writing.
- **Filename inconsistency across deliverables to the same client.** One episode named correctly, the next with a typo. Hotstar will reject; Netflix will reject; the ad client will email at 11pm. Use the per-client filename pattern as a template, not a memory exercise.
- **Skipping platform-specific validation tooling because "Resolve produced it cleanly".** Resolve's exporter and the platform's intake validator are different surfaces. Photon, DCP-O-Matic verify, platform sandbox players — run them every time.
- **Treating loudness as "good enough".** Loudness rejections are common, surprising, and expensive to fix at delivery. Confirm and validate, every time.
- **Late Frame.io approval.** Building the delivery package while waiting for client sign-off is fine. Uploading the delivery before written sign-off is not.
- **Skipping the delivery log for "small" or "internal" deliverables.** A small delivery without a log is the one that confuses the studio six months later. No exceptions.
- **Re-grading inside the delivery package.** A "tiny fix at delivery" is a new master, a new master log entry, a new delivery log entry. The trim pass inside the H.264 encoder is how silent drift starts.

---

## Hooks for future tooling

- **Delivery log machine-readable** (per project), parallel to `xml-log.md` and `master-log.md`. Enables Tunnel Bot queries: "what's the delivery status for [project]?", "which Hotstar deliveries had QC issues last quarter?", "what was the reject reason on [project] v01?"
- **Per-client packaging templates.** Bot scaffolds the `/08_Delivery/[Client]/` folder structure and pre-fills filenames from the master log + per-client convention. Removes filename typos at the source.
- **Validation tooling wrappers.** `/validate-imp [project]` runs Photon and returns the report. `/validate-dcp [project]` runs DCP-O-Matic verify. Bot writes the validation result into the delivery log automatically.
- **Loudness measurement integration.** Bot measures the audio mux's integrated LKFS post-package and flags if outside per-client tolerance.
- **Archive trigger on acknowledgement.** Once a delivery log entry's "client acknowledgement" field is filled, bot can trigger LTO move from `/04_Online` automatically (with human confirmation).
- **Spec-sheet diffs.** Bot watches client spec sheets (Hotstar v1.3 → v1.4) and flags `[PROPOSAL]` placeholders in the chapter that need updating.

All of these are cheap to build once the per-client section format is stable across Hotstar, Netflix, Prime, theatrical, and web. Format consistency across clients is the prerequisite.

---

## Onboarding drill

For a new conformist or associate moving into delivery work: take an approved short-form ad (already mastered per [06-mastering.md](06-mastering.md)) and produce all required platform deliverables — client mezzanine, 16:9 web, 1:1 feed, 9:16 reels. Run filename and loudness validation. Populate a `delivery-log.md` entry with all fields completed. Have the entry reviewed by lead conformist before client send.

For someone moving into long-form delivery: shadow the lead conformist on a Hotstar IMP build end-to-end, including Photon validation and Aspera upload. Produce the delivery log entry yourself. Cannot be skipped — the failure modes in long-form delivery are different in kind, not just degree, from short-form, and shadowing is the only reliable way to internalize them.

---

*Owner: Lead conformist (delivery authority) + per-client primary reviewer (named once first delivery to that client is accepted) · Cross-references: [06-mastering.md](06-mastering.md), [05-conform-and-revisions.md](05-conform-and-revisions.md), [08-client-communication.md](08-client-communication.md) · Status: Canonical on common pre-flight, delivery log format, web/commercials section. `[PROPOSAL]` on entire sign-off chain (ratification target: post-first-Hotstar-delivery debrief), Hotstar literal spec values (fill from v1.3), Netflix and Prime sections (stubs until first delivery), theatrical section (stub until first DCP accepted), loudness defaults, filename conventions for web/commercials. Primary reviewer: Lead conformist — TBD named.*
