# 03 — Markers & Clip Colours

The studio's shared visual language. If you change these, nobody else's timeline makes sense.

**Scope:** This applies to every Resolve project opened at Tunnel, regardless of client, colorist, or job size. Consistency across projects is more important than local optimization within one project.

---

## Principles

1. **Timeline markers are for process state.** They tell you what needs to happen, or what has happened, at a given point on the timeline.
2. **Clip colours are for clip state.** They tell you something about the clip itself — its status, its origin, or a flag against it.
3. **Fewer is better.** We cap timeline markers at 5 meanings. If you find yourself needing a 6th, first see whether an existing one covers it. If not, propose an addition via the Book, not on the timeline.
4. **Never use markers or clip colours for personal notes.** Use the Notes field on the clip, or a comment in the project's `notes.md`. Markers are shared language; personal shorthand breaks the contract.

---

## Timeline Markers

Timeline markers sit on the timeline ruler and apply to a timecode range. They are visible to everyone who opens the project. Use them for things the next person opening the timeline needs to know.

| Colour | Meaning | Who places it | When it clears |
|---|---|---|---|
| **Green** | VFX shot — awaiting or in-progress | Conformist / Assistant | When final VFX is conformed and the shot is approved |
| **Red** | Conform issue or matte issue — needs attention | Assistant / Conformist / Colorist | When the issue is resolved; escalate if unresolved at session start |
| **Blue** | `[PROPOSAL]` Client note or revision request | Assistant (after Frame.io review) | When the note is addressed and pushed for review |
| **Yellow** | `[PROPOSAL]` Colorist flag — revisit this shot | Colorist | When the colorist removes it |
| **Cyan** | `[PROPOSAL]` Technical QC flag — legal levels, frame issue, audio sync | QC / DIT | When cleared in QC |

> **Note on proposals:** Green and Red are canonical — in active, documented use. Blue / Yellow / Cyan are the proposed fill for the remaining colours based on what the studio actually does informally. Review these at the next team sync and either ratify, modify, or drop. The goal is all 5 colours carrying clear, universally understood meaning by end of the ratification.

### Marker notes (the text field inside the marker)

Every marker must have a note. A marker with no note is noise. Minimum content:

- **Green (VFX):** Shot code if known, or `VFX pending — [brief desc]`
- **Red (Conform/Matte):** What's wrong. One line. `Missing 4f at 01:04:22 — reel 2 XML v3` is useful. `problem` is not.
- **Blue (Client note):** Paste the note verbatim from Frame.io or client email. Attribution optional but helpful.
- **Yellow (Colorist flag):** Free-form, but written for future-you when you come back to the shot.
- **Cyan (QC flag):** Describe the technical issue and the check that failed.

### Duration of markers

- Point markers (1 frame) for single-shot issues.
- Range markers for anything spanning multiple shots or a scene.
- Never use a marker to cover the whole timeline — that's a project-level note, belongs in `notes.md`.

---

## Clip Colours

Clip colours tint the clip block itself. They encode **issue state** of the clip.

| Colour | Meaning | Typical usage |
|---|---|---|
| **Orange** | `[PROPOSAL]` Flagged — something is wrong or uncertain with this clip | Wrong source, suspect metadata, ambiguous handle length |
| **Brown** | `[PROPOSAL]` On hold — clip is correct but waiting on an external dependency | Awaiting VFX, awaiting client approval, awaiting replacement plate |
| **Teal** | `[PROPOSAL]` Locked — do not re-conform or replace this clip without explicit approval | Hero VFX shots post-approval, client-approved versions |
| **Chocolate** | `[PROPOSAL]` Offline / missing media | Source not yet on server, or source has been archived |
| *(no colour)* | Normal state | Default. No flag, no hold, no lock. |

> **Note on proposals:** You confirmed clip colours encode issue type (flagged / on-hold / locked). The four above are the proposed concrete mapping. The mapping plus a 4th state (offline/missing) covers the common cases. Ratify or adjust at team sync.

### Clip colour rules

1. **At most one colour per clip.** If a clip is both flagged and on-hold, the more urgent state wins. Use the clip Notes field to record the other state.
2. **Clip colour reflects *current* state.** When the issue resolves, the colour clears. A clip that was once flagged but is now fine is not coloured.
3. **Lock colour (Teal) is asymmetric.** Any colorist can apply it. Only the lead colorist or CEO can remove it.

---

## Anti-patterns (things we don't do)

- **Using marker colour to mean "this colorist's preference"** — markers are studio-level, not personal. Colorists use Resolve's personal keyword/favourites system if they need private tagging.
- **Leaving markers on the timeline after the issue is resolved** — the Book assumes markers reflect current state. A timeline full of stale Greens tells the next person nothing.
- **Using clip colour for "this looks nice" or aesthetic annotations** — clip colour is state, not taste. Aesthetic notes go in the Notes field or a reference bin.
- **Mixing marker conventions mid-project** — if you inherit a project from another studio with a different convention, either (a) remap everything to Tunnel conventions in the first hour, or (b) document the inherited convention in a project-level `notes.md` and flag the exception. Do not silently carry foreign conventions.

---

## Onboarding drill

For a new hire: open any live Tunnel project and read every marker and clip colour on the first 10 minutes of timeline. Write down what you think each one means. Compare against this document. Discuss any mismatches with your onboarding partner.

This takes 15 minutes and reveals more about studio literacy than any quiz.

---

*Canonical entries agreed: [DATE TBD]. Proposals pending ratification: Blue, Yellow, Cyan markers; Orange, Brown, Teal, Chocolate clip colours. Owner: [TBD].*
