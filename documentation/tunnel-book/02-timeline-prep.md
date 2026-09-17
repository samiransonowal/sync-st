# 02 — Timeline Prep

How a timeline is built before the colorist sits down.

**The principle:** The colorist should be able to open the project and start grading without having to reconstruct the editor's or conformist's logic. Every structural decision on the timeline should be either (a) Tunnel's documented default, or (b) flagged in the project's `notes.md` with a reason.

---

## Layer (Video Track) Convention

Every Tunnel timeline uses the same vertical structure. This is the single most important convention in this document — inconsistent layering is where silent errors live.

| Track | Contents | Notes |
|---|---|---|
| **V1** | Original edit clip (offline source conformed to online, or online source directly) | The foundation layer. This is the editorial intent. |
| **V2** | Clips scanned for VFX — plates sent out | Only populated when a plate was sent to a VFX vendor. Enables colorist to see what the pre-VFX state was. |
| **V3** | Clips received from VFX — final or in-progress | Replaces V1/V2 visually when present. Clip colour reflects state (see [03-markers-and-colours.md](03-markers-and-colours.md)). |
| **V4** | Titles, burn-ins, graphic overlays (if any) | Used only for HDR/SDR delivery masters where overlay grading differs. Usually empty during grade. |
| **V5+** | Reserved for colorist use (split grades, local regions) | Colorist discretion. Not managed by assistant/conformist. |

### Why this matters

When a VFX replacement comes in, the conformist places it on V3. The plate stays on V2. The original editorial clip stays on V1. This means:

- **History is preserved visually.** The colorist can toggle track enable to compare original vs VFX at any moment.
- **Multiple XML passes don't destroy earlier state.** A new XML overwriting V1 doesn't touch V2 or V3 — so prior conform work isn't silently lost.
- **Debugging is fast.** If a shot looks wrong, you can see at a glance whether it's the plate, the VFX, or the original clip that's the problem.

### The failure mode we're preventing

Right now, layering is inconsistent across colorists and projects. This means:

- New hires have no reliable mental model of what lives on which track.
- XML conforms from different vendors land differently depending on who's conforming.
- A colorist opening a project from another colorist has to re-derive the structure.

The cost of enforcing V1/V2/V3 is maybe 30 minutes per project for the conformist. The cost of not enforcing it is hours of silent debugging across the studio's lifetime.

### Exceptions

There are real projects where this won't fit cleanly — heavy mograph-driven ads, multi-cam concerts, stock-heavy assembly edits. In those cases:

1. Use the V1/V2/V3 convention where it applies.
2. Document the project-specific layering in `notes.md` at the root of the Resolve project folder.
3. Flag the exception in the kickoff handoff to the colorist.

---

## XML Handling

### The one-XML case

Standard flow:

1. Receive XML from editor.
2. Conform against online media on the server.
3. Populate V1 with conformed clips.
4. Verify: duration matches offline reference, no gaps, no duplicate events, all handles present.
5. Mark any missing media with **chocolate clip colour** and log in `notes.md`.
6. Hand off to colorist with a one-line summary in the project notes.

### The multi-XML case (the common case)

This is where silent errors multiply. Protocol:

1. **Every XML gets a version suffix.** `ProjectName_v01.xml`, `v02.xml`, etc. Original filename from editor goes in `notes.md`. Never overwrite the previous XML.
2. **Every XML gets a diff entry in the project's XML log.** See [05-conform-and-revisions.md](05-conform-and-revisions.md) for the full protocol. Minimum content: what changed vs. previous XML, shots affected, anything flagged.
3. **Never conform silently.** Even if the diff is trivial (one shot swap), the log entry is mandatory. The 2 minutes it takes is the price of not having a silent error surface 3 weeks later in delivery.
4. **The colorist is informed of every re-conform.** Slack/Tunnel Bot message with the diff summary. Not "new XML conformed" — actually summarize what changed.

### What to check on every XML

- **Duration.** Total timeline duration matches the editor's reference. If off by a single frame, stop and investigate.
- **Reel count and order.** Same number of reels, same sequence.
- **Handle lengths.** Tunnel default: minimum 12 frames each side on online clips. Flag anything shorter.
- **Speed ramps and retimes.** Preserved correctly; check at least 2 random samples per reel.
- **Audio.** Even though audio isn't our primary responsibility, track layout and sync should be sanity-checked — a sync drift usually means the XML is bad.

---

## File & Folder Structure

Each project on the server follows:

```
/[ClientName]/[ProjectName]/
    /01_Source/              # Raw camera originals, archived read-only
    /02_Offline/             # Offline reference media + offline QT from editor
    /03_XMLs/                # Every XML received, versioned
    /04_Online/              # Conformed online media (trimmed, ready for grade)
    /05_VFX/
        /Plates_Out/         # Plates sent to VFX (goes on V2)
        /VFX_In/             # Received VFX shots (goes on V3)
    /06_Resolve/             # Resolve project file, backups
    /07_Renders/             # Grade outputs
    /08_Delivery/            # Final deliverables per client spec
    /notes.md                # Project-level notes, exceptions, XML log reference
```

`notes.md` is the project's mini-Book. It captures project-specific deviations from studio defaults. New assistants read the project's `notes.md` before opening Resolve.

---

## Handoff Checklist (Assistant → Colorist)

Before a project is declared "ready for grade," the assistant confirms:

- [ ] V1/V2/V3 layering is correct and consistent across the whole timeline
- [ ] All markers on the timeline are current (stale markers cleared)
- [ ] Clip colours reflect current state (no leftover flags from prior passes)
- [ ] `notes.md` exists and summarizes any project-specific deviations
- [ ] XML log is current (if project has received multiple XMLs)
- [ ] Missing media is marked (chocolate clip colour) and flagged in `notes.md`
- [ ] Frame.io link present in `notes.md` if client review is set up
- [ ] Project opens cleanly on a second machine (no missing media errors) — **verify this, don't assume**

The last point — opening on a second machine — catches 80% of path errors before they become the colorist's problem. 2 minutes of verification saves 20 minutes of session disruption.

---

## Anti-patterns

- **Dropping everything on V1** — collapses the V1/V2/V3 history and makes VFX iteration expensive. Always layer.
- **Conforming a new XML over the old one without a log entry** — this is the single most common source of silent error at the studio. Log every XML.
- **Using the colorist as a conform QC step** — the colorist should not be finding conform errors. If they are, the handoff was incomplete.
- **"I'll fix it during the session"** — the session is for grading, not conforming. Prep the timeline properly before the colorist sits down.

---

*Owner: [TBD] · Cross-references: [03-markers-and-colours.md](03-markers-and-colours.md), [05-conform-and-revisions.md](05-conform-and-revisions.md)*
