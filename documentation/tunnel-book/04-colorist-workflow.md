# 04 — Colorist Workflow

How a Tunnel grade is structured — working spaces, the fixed clip-level node tree, post-clip patterns, groups, and the PowerGrades library.

**The principle:** A grade should read the same way to any colorist who opens it. Tunnel's value is consistency across colorists and across projects, not the local optimization of any one grade. The fixed clip-level node tree is where that consistency is enforced. Per-shot creative work happens *inside* the fixed structure, not by reshaping it.

---

## Why structure matters

A grade that only makes sense to the colorist who built it is a key-person dependency. The point of the fixed node tree, the disciplined separation of pre-clip / clip-level / post-clip, and the documented look-file patterns is that a second colorist can sit down, follow the structure, and either continue the work or revise it without a phone call.

This is craft, not bureaucracy. The conventions below come from what good colorists at Tunnel already do — the Book just makes them explicit so they don't have to be re-derived by every new hire.

---

## The Two Working Spaces

Tunnel grades in either **DWG** or **camera color space**. The choice is workload-driven, not arbitrary.

| Working space | When | Why |
|---|---|---|
| **DaVinci Wide Gamut Intermediate (DWG)** | Long-form, HDR-first projects (OTT episodics, features, Hotstar / Netflix / Prime deliveries) | Wide gamut working space; clean HDR delivery; trim-pass discipline depends on a uniform working space across the timeline |
| **Camera color space** (Arri LogC, S-Log3, RedWideGamut/Log3G10, etc.) | Most commercials, SDR-only deliveries | Some looks develop more naturally in camera log; the DWG conversion isn't always worth it for a 30s deliverable |

Both are legitimate Tunnel practice. The choice is made at project kickoff and noted in `notes.md`. **Mid-project switches are not a thing** — pick the working space at the start, commit, and document.

---

## Group Pre-Clip — CST Only

Group Pre-Clip is **exclusively** for the input transform (camera RAW → DWG, when needed). Nothing else.

- No white balance.
- No exposure.
- No scene-level primary.
- No look development.

If you find yourself adding creative nodes in Group Pre-Clip, you've broken the convention. Stop, move the work to the clip-level fixed tree, and clear the Pre-Clip back to CST-only (or empty).

### When Group Pre-Clip is empty

When working in camera color space (commercials / SDR), Group Pre-Clip is typically empty. The conform may have already handled clip-level color management settings, and there's no input transform needed at the group level.

When working in DWG, Group Pre-Clip carries the camera-native → DWG CST *only if* the conform did not already place clips into DWG via Resolve's color management. If the conform handled it correctly, Group Pre-Clip is empty.

### Anti-patterns

- **Adding "just a quick exposure tweak" to Group Pre-Clip.** It's never just a quick tweak. Move it to the clip-level fixed tree.
- **Mixing input transforms with creative work.** Breaks trim-pass discipline irrecoverably.

---

## Clip-Level — The Fixed Node Tree

This is Tunnel's canonical clip-level structure. Every shot in every long-form grade follows this tree. Deviation is a structural error, not a creative choice.

### The tree

```
Linear chain:
   01 NR        →  02 EXP     →  03 CON     →  04 LINEAR B... → 05 SUB SAT  →  06 BAL
   (Noise Red)     (Exposure)    (Contrast)     [PROPOSAL —      (Subtractive    (Balance)
                                                 confirm full     Saturation)
                                                 label]

Parallel branch (out of 06 BAL, into Layer Mixer):
   07
   08              →  Layer Mixer (likely node 11)  →  12 PHS  →  14  →  13 T BLEND
   09                                                  [PROPOSAL —  [PROPOSAL —    (Texture
   10 HL PUNCH                                          confirm      confirm        Blend)
   (Highlight Punch)                                    meaning]     purpose]
```

### What each section is for

| Section | Purpose |
|---|---|
| `01 NR` | Noise reduction first, before any creative grade — clean signal in, less amplification of grain in later stages |
| `02 EXP` | Exposure — primary correction for under/over |
| `03 CON` | Contrast — log-curve handling for the shot |
| `04 LINEAR B...` | `[PROPOSAL — confirm full label and intent: Linear Balance or Linear Boost]` |
| `05 SUB SAT` | Subtractive Saturation — pre-balance saturation handling |
| `06 BAL` | Balance — final primary balance before secondaries |
| `07–10 (parallel)` | Secondaries: qualifier work, windows, tracked corrections. `10 HL PUNCH` reserved for highlight pop |
| Layer Mixer | Combines the parallel branches into a single signal |
| `12 PHS` | `[PROPOSAL — confirm meaning and intent of the PHS node]` |
| `14` | `[PROPOSAL — confirm purpose; sits between PHS and T BLEND]` |
| `13 T BLEND` | Texture Blend — last clip-level node, output of the clip-level tree |

> **Action item for Yash:** Confirm the meaning of `04 LINEAR B...`, `12 PHS`, and node `14`. Once confirmed, this section moves from `[PROPOSAL]` to fully canonical.

### Discipline rules

1. **Don't reorder the linear chain.** NR before EXP, CON before LINEAR B, etc. The order matters because each node operates on the output of the previous.
2. **Don't skip nodes.** If a shot doesn't need exposure correction, leave node 02 disabled but present. The visual structure of the tree is part of its value — every clip looks the same to the next colorist who opens it.
3. **Don't add nodes inside the fixed chain.** New work goes into the parallel branch (07, 08, 09 for additional secondaries) or into a colorist-discretionary slot if the project genuinely needs one (proposed, not yet documented).
4. **Don't bypass the layer mixer.** The mixer is part of the tree's contract.

### Anti-patterns

- **Reshaping the fixed tree because a shot is "different".** The tree handles every shot Tunnel grades. If a shot truly doesn't fit, the answer is a documented exception in `notes.md`, not a freelance restructure.
- **Disabled nodes left without intent.** A disabled node communicates "this stage is unused for this shot" — fine. A disabled node *with stale settings inside* is a future trap.
- **Adding nodes after `13 T BLEND`.** T BLEND is the clip-level output. Anything after belongs at Group Post-Clip.

---

## Group Post-Clip — Two Canonical Patterns

Group Post-Clip is where the look lives, where the output transform sits (sometimes), and where texture is applied. Tunnel uses **one of two patterns** per project.

### Pattern A — Look file with embedded CST

When the project's look strategy uses FilmBox (or another look tool that contains its own DWG → Rec.709 / Rec.2020 conversion internally), the look file *is* the post-clip stage.

```
Group Post-Clip:
   [Look file (e.g. FilmBox) — contains its own CST out internally]
```

The output transform is **inside** the look file. Group Post-Clip is essentially a single node carrying the look. No additional CST out is added at the timeline level.

**When this is right:** when the project's look is FilmBox-driven and you want the look's bundled tone-mapping behavior.

### Pattern B — Look file or overall look + CST out + texture

When the look is built from PowerGrades or in-tree look development (not a single bundled tool with its own CST), the post-clip structure is explicit:

```
Group Post-Clip:
   [Look file or overall look decisions]   →   CST out (DWG → PQ Rec.2020 / Rec.709 G2.4)   →   Texture (grain / halation)
```

The CST out is at the **timeline level**, locked, applied uniformly across every shot. Texture sits after the CST so it's applied in display space (which is where film grain actually behaves correctly).

**When this is right:** when the look is custom-built, when texture needs to be display-referred, when the project may need to switch output spaces (HDR ↔ SDR) without rebuilding the look.

### Choosing between A and B

| Use Pattern A when... | Use Pattern B when... |
|---|---|
| The look is FilmBox-driven (or equivalent) | The look is custom-built from PowerGrades / in-tree |
| You want the bundled tone-mapping behavior | You want explicit control over the output transform |
| The project is single-output (no HDR/SDR re-derivation expected) | The project needs HDR ↔ SDR re-derivation, or precise texture-in-display-space behavior |

Decision is made at project kickoff and documented in `notes.md`. Mid-project switches are expensive — pick a pattern, commit, document.

### Anti-patterns

- **Mixing patterns within one project.** Some shots Pattern A, others Pattern B = silent inconsistency. Pick one per project.
- **Pattern A with an additional timeline-level CST out.** Double-conversion. The look file already handled the output; adding a CST after collapses the look's tone mapping.
- **Pattern B without locking the CST at the timeline level.** A per-clip CST in Pattern B defeats the whole point — re-derivation becomes shot-by-shot work.
- **Texture before the CST out (in Pattern B).** Texture (especially grain) needs to be applied in display space to behave correctly. Texture-in-DWG looks wrong on the FSI.

---

## Group Discipline

Groups are the unit of consistency in a long-form grade. Use them for long-form. Don't use them for ads.

### When to group

- **Long-form (episodic, feature, anything > ~10 minutes):** always group. Per scene is the default.
- **Per character:** acceptable for character-driven scenes (interviews, monologues) where character-consistency matters more than scene-consistency.
- **Per location:** for multi-scene shoots in the same physical space, where the location's character drives the look.

### When *not* to group

- **Ads** (single-cut commercials, ~30s–60s). Per-shot is fine.
- **Title sequences, end credits, montages.** Self-contained creative units; group only if they share a treatment.

### Group naming convention

```
[ProjectCode]_S[NN]_[ShortDescription]
e.g.  TitleX_S03_BeachExterior
       TitleX_S04_HotelInteriorNight
```

Numbered in shooting / scene order. Description is for human navigation; the number is the primary identifier.

### Group cap

`[PROPOSAL]` Soft cap of 30 groups per long-form project. Beyond that, split into multiple Resolve projects per episode/reel rather than one mega-project. Confirm or override at next monthly review.

### Anti-patterns

- **One group per shot.** Defeats grouping. If shots don't share enough to be grouped, don't group them.
- **Groups created retroactively.** Group at the start of the grade. Retrofitting groups forces a re-grade.
- **Groups named "Group 1", "Group 2".** Always descriptive.

---

## HDR Grading Craft (DWG workflow)

How HDR grading actually happens at Tunnel — the principles the fixed tree exists to support.

### Working space and monitoring

- **Working space:** DWG timeline.
- **Monitor:** FSI XMP, calibrated to PQ Rec.2020 at the target peak (`[PROPOSAL]` 1000 nits unless client spec mandates otherwise).
- **Output path:** DeckLink 4K Extreme 12G → FSI XMP, with HDR mode (PQ Rec.2020) verified at the start of every session. The single most expensive HDR session error is grading on a mis-calibrated or wrong-mode monitor and not noticing until QC.

### Target nit discipline

Tunnel's HDR creative target is `[PROPOSAL]` 1000 nits. This means:

- **Specular highlights** (sun glints, practical bulbs at full brightness) sit at the target peak. Not above; the trim pass and SDR derivation in [06-mastering.md](06-mastering.md) assume they don't exceed.
- **Diffuse white** (a clean white shirt in daylight) sits at ~200–300 nits. Tunnel default; some looks justify pushing higher, but document the exception in `notes.md`.
- **Skin tones** sit at 60–120 nits depending on key. Don't push faces into the highlight range to "make HDR pop" — the trim pass will fight you.
- **Shadows** retain detail down to ~0.05 nits with the FSI's contrast handling. Crushing below 0 nits is a delivery failure, not a creative choice.

### Highlight roll-off

`[PROPOSAL]` Tunnel's default highlight roll-off philosophy: gentle compression starting at ~600 nits, hard stop at the target peak. Implemented inside the look file (Pattern A) or via a Group Post-Clip node before the CST out (Pattern B). Confirm or override.

### Skin tone management at HDR

HDR exposes skin imperfections that SDR hid. Tunnel's discipline:

- Don't grade skin into the highlight range, even if the scene visually permits it.
- Use a skin qualifier (from the PowerGrades library) as a starting point in the parallel branch (nodes 07–09), then refine per shot.
- Validate skin on the FSI in HDR mode *and* in SDR-emulated mode (if the monitor supports). The SDR check catches over-saturated skin that the HDR view conceals.

### Shadow detail at HDR

The FSI XMP permits shadow detail at extremely low nit levels. Use it. But:

- **Don't grade for the FSI alone.** Most viewers see HDR on lower-contrast displays where deep shadows turn black. Validate shadow detail on a secondary display before locking.
- **Shadow detail is a creative choice, not a default.** Some scenes want crushed blacks for atmosphere. Grade intentionally.

---

## SDR / Commercials Grading Craft (camera color space workflow)

Most ads are SDR-only and graded directly in camera color space.

- **Working space:** camera native (Arri LogC, S-Log3, RedWideGamut/Log3G10, etc.) — do *not* convert to DWG unless the project specifically calls for it.
- **Monitor:** FSI XMP in SDR mode (Rec.709 G2.4, 100 nits typical).
- **Node tree:** the same fixed clip-level tree applies. NR → EXP → CON → LINEAR B → SUB SAT → BAL → parallel → mixer → PHS → 14 → T BLEND. Even for ads.
- **Output:** Pattern A or Pattern B post-clip, with the look file or CST handling camera-log → Rec.709 G2.4 conversion at the end.
- **Groups:** typically not used for short-form ads.
- **Per-platform reformat:** if the brief requires 1:1 / 9:16 reformats, plan for them at the grade stage. See [07-delivery.md](07-delivery.md) for reformat discipline.

### Anti-patterns

- **Converting an ad to DWG just because long-form does.** Pick the working space deliberately, not by default.
- **Skipping the FSI calibration check on a 30s ad because "it's just an ad".** Same calibration discipline as long-form.
- **Reshaping the fixed clip-level tree for ads.** The tree applies to every Tunnel grade.

---

## Theatrical Grade — Currently Outsourced

Tunnel does **not** do theatrical color grading in-house at present. Theatrical projects are sent to **NY DI** (a separate facility with projection capability and Resolve Studio).

### Current handoff

1. Tunnel completes the HDR or DWG creative grade per the project's primary deliverable spec.
2. The graded master (or project file with all grade data) is handed to NY DI.
3. NY DI handles the theatrical trim on their projection setup.
4. NY DI delivers the theatrical-graded master back, or directly outputs the DCP per project arrangement.

The exact handoff format (project file vs rendered master, who owns the DCP authoring) is `[PROPOSAL]` — confirm and document per project. Most projects: Tunnel hands the project file, NY DI returns the theatrical-graded master, Tunnel does DCP authoring per [06-mastering.md](06-mastering.md). Exceptions captured in `notes.md`.

### `[PROPOSAL]` In-house theatrical (future state)

Bringing theatrical grading in-house requires:

- Calibrated theatrical projection (DLP cinema or theatrical-spec OLED reference).
- Calibration discipline matching FSI standards.
- Distributor relationships that accept Tunnel-graded theatrical masters.
- Lead colorist competence in P3-D65 trim work distinct from HDR/SDR.

Defer until business case justifies the capital and operational lift. Not on near-term roadmap.

---

## Versions `[PROPOSAL]`

> **Status:** Tunnel does not currently use Resolve's Versions feature. This section is `[PROPOSAL]` — a suggested future-state convention to support trim-pass discipline and revision tracking. Discuss at next monthly review.

### Why consider adopting

The mastering chapter ([06-mastering.md](06-mastering.md)) describes a workflow where the DV trim is a derivation of the HDR creative, and the SDR master is rendered from that trim. Without Versions:

- The DV trim overwrites the HDR creative on the same clip, or lives in a separate timeline (ad hoc).
- Reverting from a DV trim back to the HDR creative requires either undo history (unreliable) or a separate timeline (project bloat).
- Comparing a client-feedback revision against the previous grade requires manual project duplication.

Versions solve all three cleanly.

### Proposed convention (if adopted)

| Version label | Meaning |
|---|---|
| `v01_main` | The primary HDR creative grade |
| `v02_main` | A new primary grade after significant revision |
| `v01_clientfeedback` | A round of revisions in response to client notes |
| `v01_DVtrim` | The DV trim pass version (per [06-mastering.md](06-mastering.md)) |
| `v01_SDRtrim` | SDR derivation version (if preserved separately) |

### Open questions before adoption

1. Whether all colorists are willing to adopt — Versions is a workflow change, not a tool change.
2. Whether the project-bloat cost (every clip carries multiple grades) is acceptable.
3. Active-version locking convention — how the lead colorist signals which version is active per delivery.

### `[PROPOSAL]` decision target

Discuss at next monthly review. Either ratify with the proposed convention, modify, or formally drop the proposal and document why.

---

## Remote Grades `[PROPOSAL]`

> **Status:** Tunnel does not currently use Remote Grades. This section is `[PROPOSAL]` — a suggested future-state for projects with recurring shots across timelines.

### Why consider adopting

For ads with multiple cuts that share hero shots, or long-form with shots that recur across episodes (recap intros, flashbacks), Remote Grades let one grade propagate across timelines without manual copy-paste.

### Open questions before adoption

1. Whether Tunnel's project structure (one Resolve project per title) actually has the recurring-shot pattern that justifies Remote Grades.
2. Re-conform behavior — Remote Grades survive XML re-conforms when source is unchanged but not when source changes; the conformist would need to flag re-source events explicitly.
3. Conflict with `notes.md`-driven exception handling.

### `[PROPOSAL]` decision target

Defer until at least one project demonstrates the recurring-shot pattern in production. If it never comes up, formally drop the proposal.

---

## PowerGrades Library

Tunnel's shared library of reusable grades, looks, and tools.

### Location

`[PROPOSAL]` Server path: `/Tunnel_Shared/PowerGrades/` — confirm or override per Tunnel's actual server layout.

```
/Tunnel_Shared/PowerGrades/
    /00_Looks/                  # Full creative looks
    /01_Technical/              # Gamma adjustments, halation, grain, vignettes
    /02_Tools/                  # Qualifier starting points, tracker setups
    /03_PerClient/              # Client-specific looks (Hotstar default look, etc.)
    /99_Experimental/           # Not for production use; sandbox
```

### Naming convention

```
[Category]_[Name]_[Author]_[Version].drx
e.g.  Look_FilmEmulationKodak_AS_v02.drx
       Tech_HighlightRolloff_PB_v01.drx
       Tool_SkinQualifier_Default_v01.drx
```

`[PROPOSAL]` Confirm naming — particularly whether author initials or full name, and whether version is per-PowerGrade or aligned to a release schedule.

### Contribution rules `[PROPOSAL]`

| Action | Authority |
|---|---|
| Add to `99_Experimental/` | Any colorist |
| Promote from Experimental to a category folder | Lead colorist sign-off |
| Edit an existing PowerGrade in production categories | Original author + lead colorist |
| Delete a PowerGrade | Lead colorist + CEO |

### When to use library vs ad hoc

- **Use library** when the look or technical correction is one Tunnel applies repeatedly (Hotstar default look, halation preset, standard skin qualifier as a starting point).
- **Build ad hoc** for project-specific creative looks. If reusable across two or three projects, propose promotion at the weekly review.

### Anti-patterns

- **Personal stash in the library.** Personal looks live in the colorist's local Resolve database, not on the server.
- **Production PowerGrades that aren't versioned.** A PowerGrade edited in place breaks every project that referenced it.
- **Letting Experimental rot.** End of every quarter, lead colorist sweeps `99_Experimental/` — promote keepers, delete the rest.

---

## Anti-patterns (cross-cutting)

- **Per-clip output CST in Pattern B.** The CST out is timeline-level, locked. Per-clip CSTs are silent drift.
- **Mixing Pattern A and Pattern B within one project.** Pick one at kickoff, commit.
- **Reshaping the fixed clip-level tree.** The tree is canonical. Per-shot creative work happens inside the structure.
- **Creative work in Group Pre-Clip.** Pre-Clip is CST-only. Move it.
- **DWG for ads by default.** Camera color space is the right call for most SDR work.
- **Grading without verifying monitor mode.** Wrong-mode monitoring is invisible until QC.
- **Texture before the CST out (Pattern B).** Texture is display-referred.
- **In-house theatrical without the calibration discipline to back it.** Currently outsourced to NY DI for good reason.
- **Adding to PowerGrades library without sign-off.** Library is shared. Edits propagate.
- **Treating `[PROPOSAL]` Versions/Remote Grades as canonical because the chapter mentions them.** They aren't in use; the sections are explicit future-state proposals.

---

## Hooks for future tooling

- **Project-level node tree validator.** Bot opens the `.drp` (or queries Resolve via API) and verifies: clip-level tree matches the fixed structure (NR → EXP → CON → LINEAR B → SUB SAT → BAL → parallel → mixer → PHS → 14 → T BLEND). Flags violations to the lead colorist.
- **Group Pre-Clip purity check.** Bot verifies Group Pre-Clip contains only CST nodes (or is empty). Flags anything else.
- **Pattern A vs Pattern B classifier.** Bot reads the post-clip structure and classifies the project as A or B; flags if `notes.md` declares one but the project structure says the other.
- **PowerGrades library audit.** Bot scans `/Tunnel_Shared/PowerGrades/` for unversioned files, files in `99_Experimental/` older than 90 days, naming convention violations.
- **Calibration log.** Daily check of FSI calibration status. Bot prompts the first colorist of the day, captures the response.
- **NY DI handoff log.** Per-theatrical-project entry capturing what was sent to NY DI, when, in what format, and what came back. Eventually feeds the master log.

All of these are cheap to build once the conventions are enforced consistently across projects.

---

## Onboarding drill

For a new assistant or associate colorist:

1. Open three live Tunnel long-form projects (different colorists, different shows). For each: identify the working space (DWG vs camera), the clip-level tree (verify it matches the fixed tree), the post-clip pattern (A or B), and the group convention. Compare against this chapter. Flag mismatches with your onboarding partner.
2. Take a graded short film (~5 minutes). Re-grade it from scratch using the fixed clip-level tree, in the working space the project specifies. Have the result reviewed by the lead colorist.
3. Pick one PowerGrade from the library and trace its origin: who built it, when, for what project, and how it differs from the next-most-similar PowerGrade.

This drill takes 1–2 days and reveals studio fluency more reliably than any quiz. The third item (PowerGrade origin trace) is the most diagnostic — it tests library navigation, not just usage.

---

*Owner: Lead colorist · Cross-references: [02-timeline-prep.md](02-timeline-prep.md), [03-markers-and-colours.md](03-markers-and-colours.md), [06-mastering.md](06-mastering.md), [07-delivery.md](07-delivery.md) · Status: Canonical on the two-working-space model, Group Pre-Clip purity (CST-only), the fixed clip-level node tree shape, the two post-clip patterns, group-discipline rules, theatrical-currently-outsourced-to-NY-DI. `[PROPOSAL]` on: literal node labels for `04 LINEAR B...`, `12 PHS`, and node `14`; HDR target peak (1000 nits default); highlight roll-off philosophy; group cap (30 per long-form); PowerGrades server path, taxonomy, naming, and contribution authority; entire Versions section (suggested future state); entire Remote Grades section (suggested future state); in-house theatrical (deferred future state); NY DI handoff format details. Primary reviewer: CEO / lead colorist (per [10-contributing.md](10-contributing.md)).*
