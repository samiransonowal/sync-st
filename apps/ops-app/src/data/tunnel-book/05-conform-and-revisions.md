# 05 — Conform & Revisions

How we handle XMLs, re-conforms, and the inevitable drift between editorial and our timeline.

**The principle:** Every XML is a diff. Our job is to make that diff visible — to ourselves, to the colorist, and to our future selves three weeks from now when the client asks "why does reel 2 look different from the v3 review?" A re-conform that nobody logged is a silent error waiting to surface at delivery.

---

## The cost of silent conforms

Right now, the default pattern at the studio is: receive XML, conform it, flag conflicts if anything breaks, move on. This works until it doesn't — and when it doesn't, the failure mode is expensive:

- A shot is replaced in XML v3 and nobody tells the colorist. The colorist's grade on the old shot is silently lost, or worse, applied to the wrong frames.
- A handle length shifts by 4 frames between XML v2 and v3. The assistant conforms, Resolve relinks cleanly, nobody notices. Three weeks later during final delivery, a pan during the handle extension reveals a dirty frame that was never graded.
- Editorial sends XML v4 which "just has a couple of extra shots," but also quietly re-orders reel 2. Conformist sees the new shots, conforms them, misses the re-order. Colorist grades the re-ordered reel assuming prior work is intact. Client sees the DPX review and something is off. Nobody can explain why.

None of these failures are theoretical. They are the predictable consequence of treating each XML as standalone rather than as a diff against the previous one.

The fix is not more careful conforming. The fix is making the diff itself a first-class artifact that survives the conform.

---

## The XML Log

Every project that receives more than one XML gets an XML Log. This lives at the root of the Resolve project folder as `xml-log.md`. It is referenced from `notes.md`.

### What the log contains

A running, timestamped record of every XML received, what changed vs. the previous version, and what action was taken. One entry per XML. Kept brief.

### Template

```markdown
# XML Log — [Project Name]

## v01 — Received [date] from [sender]
- Original filename: [editor's filename]
- Action: Initial conform. Timeline built on V1. [N] shots, [HH:MM:SS] duration.
- Flags: [e.g. 3 shots missing media — chocolate clip colour applied, logged in notes.md]
- Conformed by: [name]

## v02 — Received [date] from [sender]
- Original filename: [editor's filename]
- Diff vs v01: [one line summary]
- Detailed changes:
  - Reel 1, 00:02:14 — shot replaced (new take, 4f longer)
  - Reel 2, 00:14:03 — shot added between existing shots
  - Reel 3 — unchanged
- Action: Re-conformed affected shots only. V2/V3 layers preserved. Colorist notified via Slack [time].
- Flags: None
- Conformed by: [name]

## v03 — Received [date] from [sender]
- Original filename: [editor's filename]
- Diff vs v02: [one line summary]
- ...
```

### Rules for the log

1. **One entry per XML. No exceptions.** Even if the XML is identical to the previous one (happens more often than you'd think — editor re-exports for a trivial reason), log it with "No effective changes, conformed for version parity."
2. **The diff summary is mandatory.** Not "minor changes." Not "a few shots." Actual shot-level summary. If you can't produce the summary, you haven't understood the XML yet — stop and understand it before conforming.
3. **The log is written at conform time, not after.** Writing later means writing from memory means writing wrong.
4. **Log before Slack.** Notify the colorist by linking to the log entry, not by summarizing in chat. This keeps the source of truth in one place and forces the log to actually exist.

---

## XML Naming & Storage

Every XML received goes into `/03_XMLs/` in the project folder with a Tunnel-side version suffix:

```
/03_XMLs/
    ProjectName_v01.xml           # Our v01 — first XML we received
    ProjectName_v01_original.xml  # Editor's original filename preserved as copy (optional but recommended)
    ProjectName_v02.xml
    ProjectName_v03.xml
```

**Never overwrite.** If the editor sends you a file with the same filename as a previous one, you rename ours with the next version number. Their filename goes in the log entry under "Original filename."

**Never delete.** Even if an XML turned out to be wrong and was superseded within an hour, keep it. Storage is free; forensic clarity six months later is priceless.

---

## The Conform Workflow

### Step 1 — Before you open Resolve

1. Drop the new XML into `/03_XMLs/` with the next version suffix.
2. Open the previous version alongside it in a text editor. XMLs are readable. Skim for obvious structural differences: reel count, total event count, any new reel names.
3. Check the log for the previous XML's entry. You're about to write the next one — you should know what state the project was in.

### Step 2 — The relink diff (the technique)

Tunnel's standard multi-XML diff technique. This is craft knowledge, documented here because it works and it's fast.

1. Duplicate the current live timeline. Label it `[ProjectName]_conform_v[N]_diff` where N is the new XML's version.
2. Import the new XML as a *new* timeline, not overwriting.
3. Relink the new timeline against our online media on the server.
4. **Observe what relinks cleanly and what comes up offline.**
   - Everything that relinks cleanly is unchanged or trimmed in-place (same source, possibly different in/out).
   - Everything that comes up offline is either a different take, a different source, or a new shot.
5. Compare in/out points for the clean-relinking clips:
   - Same in/out = unchanged.
   - Different in/out but same source = trim change. Usually safe to just reconform the trim.
   - Different source = different take or replacement. Reconform fully.

This technique catches ~90% of the diff without any scripting. The remaining 10% (re-orders, duplications, audio-only changes) is caught by the duration and event-count checks in Step 3.

### Step 3 — Structural sanity checks

Regardless of what the relink diff surfaces, always verify:

- **Total duration** matches editor's reference QT within 1 frame.
- **Reel count** matches.
- **Event count per reel** matches editor's reference, if available.
- **First and last shot of each reel** visually match editor's reference.

If any of these fail, stop conforming. Something structural has changed and a shot-by-shot relink is not enough — you need to understand *what* changed before proceeding. Escalate to the lead conformist or colorist if the reason isn't obvious within 15 minutes.

### Step 4 — Apply changes to the live timeline

Only after Steps 2 and 3 are complete. Apply the conform changes to the live timeline, not to the diff duplicate. The diff duplicate is your working copy — once the live timeline is updated, the diff can be deleted or archived.

**Preserve V2 and V3.** Re-conforming V1 must not touch V2 (plates sent to VFX) or V3 (VFX received). See [02-timeline-prep.md](02-timeline-prep.md) for layer conventions. This is the single most common source of silent error in multi-XML projects — overwriting V1 also nukes V2/V3 work if layering was sloppy on the last pass.

### Step 5 — Log and notify

1. Write the XML Log entry. Complete, not placeholder.
2. Update any affected markers (new Green markers for VFX shots added, Red markers cleared for conform issues resolved).
3. Notify the colorist with a link to the log entry. Slack / WhatsApp / Tunnel Bot — use whichever channel the colorist prefers, but the notification must contain a reference to the log, not a standalone summary.
4. If the colorist is mid-session, do not push the re-conform into the live project until they're at a stopping point. Hold and coordinate.

---

## Ads vs Long-Form

Slightly different rhythms.

### Ads (2+ XMLs, often for added shots)

- Diffs are usually additive — extra shots, extension of existing shots, alternate cuts for different markets.
- The log matters *more* here than in long-form, because ad cycles are fast and the same project might be re-conformed five times in a week. Without a log, the colorist loses track of which cut is "the current one."
- Consider numbering timelines visibly too: `Project_Hero_30s_v03_current` so the colorist can see at a glance which is live.

### Long-Form (2–4 XMLs per episode/reel)

- Diffs are usually corrective — VFX shot drops in, editorial catches a sync issue, a scene gets re-ordered.
- The V2/V3 layer discipline is critical here because VFX iteration is the whole point of the long-form conform cycle. If you're overwriting V1 and losing V2/V3 work, you'll feel it by the third XML.
- Final conform (the one before delivery) gets an extra check: open the Delivery chapter ([06-delivery.md](06-delivery.md)) and verify the conform state matches delivery requirements (handle lengths, resolution, frame rate).

---

## Anti-patterns

- **"Just re-conform everything, safer that way."** No. Re-conforming everything loses your grade history unless your Remote Grades are bulletproof, and even then it destroys the diff trail. Re-conform only what changed.
- **"I'll log it after the session."** You won't. The log exists because memory is unreliable, and writing from memory after the fact produces a log that's worse than no log — it looks authoritative but isn't.
- **"The editor said it's just a few shots."** Trust but verify. Editors are smart and well-intentioned; they also sometimes forget that their "minor fix" re-ordered reel 2. Always run the relink diff.
- **"Nothing changed in the XML."** Maybe. Still log it. Version parity with editorial matters for delivery paperwork and for your own sanity six weeks later.
- **Notifying the colorist verbally only.** Verbal-only notifications are how this whole silent-error pattern started. Written, linked to the log, always.

---

## Per-project quick reference

At the top of every `notes.md`, include:

```markdown
## XML status
- Latest XML: v[N] received [date]
- XML log: [./xml-log.md](./xml-log.md)
- Last conform: [date] by [name]
- Colorist notified: [date/time]
```

This block is how a colorist or second conformist picks up the project cold and knows immediately where it stands.

---

## Hooks for future tooling

The log format above is deliberately structured so that it's machine-readable. A future Tunnel Bot query like "what's the latest XML for [project]?" or "what changed in the last conform on [project]?" is a straightforward extension — the log is the data source, the bot is the query layer. Keep the log format consistent across projects and this becomes possible without any additional work.

---

*Owner: [lead conformist TBD] · Cross-references: [02-timeline-prep.md](02-timeline-prep.md), [03-markers-and-colours.md](03-markers-and-colours.md), [06-delivery.md](06-delivery.md) · Status: Canonical on core protocol; XML Log template open for refinement in first month of use.*
