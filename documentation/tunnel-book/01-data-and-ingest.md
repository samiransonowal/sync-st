# 01 — Data & Ingest

How media gets onto the server, where it lives, and how the pools stay usable for everyone sharing them.

**The principle:** Every file has exactly one correct pool and one correct place in the folder tree the moment it's ingested. If you're not sure where something goes, stop and ask before you copy — moving it later is expensive, and a file in the wrong pool can slow down or drop frames for everyone else on the switch.

---

## What Goes Where

The one table to have open if you're not sure where something lands. Detail and reasoning for each row is in the sections below.

| Media type | Destination | Notes |
|---|---|---|
| Raw camera trims | `color01` (`Z:`) → `DATA/.../TRIMS/` | Active project media, ingested off the card. See [Trim Protocol](#trim-protocol). |
| Optimised media | `opt_med` (`O:`) | Resolve reads and writes optimised media **directly on `opt_med`** — there's no local staging step first. See [Optimised Media Management](#optimised-media-management). |
| Resolve render / gallery cache | `I:` / `cache` (local to this workstation) | Local-only scratch space — not shared, not backed up, not part of pool routing, and **not the same thing as optimised media on `opt_med`.** If this drive is wiped, nothing project-critical is lost; Resolve just has to rebuild cache. |
| Grade renders / delivery masters | `output` (`Y:`) → `DATA/.../RENDERS/` | See [Server & Pool Structure](#server--pool-structure). |

### Why this matters

The single most common mix-up for anyone new is treating the local `I:/cache` drive as if it's the same thing as `opt_med`, because both are "the fast SSD thing Resolve uses." They're not related: `opt_med` is shared studio media that other people's sessions depend on; `I:/cache` is private scratch space for this workstation's Resolve instance and can be cleared at any time without asking anyone.

---

## Server & Pool Structure

Tunnel runs three storage pools. They are deliberately separate — not partitions of one big pool — because having multiple machines read and write the same pool at once over the studio's 10G switch causes contention: dropped frames on playback, slow ingest, sluggish scrubbing. Splitting by role keeps read-heavy and write-heavy traffic off each other.

| Pool | Role | Host | Specs | Mount (grading workstation) |
|---|---|---|---|---|
| **color01** | Raw trims — active project media | TrueNAS (`truenas.local`) | 12-wide RAIDZ2, ~99.7 TiB usable · 71.9% full (71.67 TiB used / 28.07 TiB available) | `Z:` |
| **opt_med** | Optimised media, shared across the studio | Separate device (`192.168.100.7`) | 8 TB share · ~87% full (6.95 TB used / 1.05 TB available) | `O:` |
| **output** | Renders and final delivery | TrueNAS (`truenas.local`) | 9-wide RAIDZ2, ~99.6 TiB usable · 24.4% full (24.35 TiB used / 75.27 TiB available) | `Y:` |

Local drives on the grading workstation (never a substitute for the pools above — nothing project-critical lives here permanently):

| Drive | Purpose | Specs |
|---|---|---|
| `C:` | OS | — |
| `D:` / `TUNNEL_IT` | Local utility | 223 GB |
| `I:` / `cache` | Resolve render/gallery cache — local scratch only, **not** optimised media | 1.81 TB |

### Why this matters

- **Pool choice is a performance decision, not just an organisational one.** Putting raw trims on `opt_med` or renders on `color01` doesn't just look wrong in the folder tree — it puts read/write traffic on a pool sized and provisioned for a different job, and on the shared switch that traffic competes with everyone else's.
- **`opt_med` is the one pool everyone touches simultaneously.** It's shared across the whole studio by design. That makes it the most contention-sensitive pool and the one most likely to fill without anyone noticing — see [Optimised Media Management](#optimised-media-management) below.
- **`output` has the most headroom (75.27 TiB available) for a reason.** Renders and delivery masters are the least reusable, hardest-to-regenerate-cheaply files in the pipeline. Don't let `color01` capacity pressure (71.9% full) tempt anyone into using `output` as overflow for trims.

### The failure mode we're preventing

Someone ingests to whichever pool has a free-looking drive letter, or copies proxies onto `color01` because "it's got space." Three months later: `color01` is unexpectedly full, playback is choppy because two machines are hammering the same pool for unrelated tasks, and nobody can say why without digging through folders pool-by-pool.

### Exceptions

None documented. If a project genuinely needs to break pool routing (e.g. an emergency where the correct pool is offline), log it in the project's `notes.md` and flag it at the next `#debrief` so it doesn't become a silent habit.

---

## Access Control

`color01` and `output` use **per-user ACLs**, not role-based groups. `everyone` is set to **No Access** by default — nobody gets a pool by virtue of their job title. Access is granted individually, person by person, project by project as needed.

### Why this matters

At current headcount, per-person grants are simpler to audit than groups — you can look at one user and see exactly what they can touch, rather than tracing group membership. It also means access naturally expires: nobody inherits a stale permission because they were once added to a group for one project.

### The failure mode we're preventing

Someone gets folder-level access "just to be safe" or because it's faster than a scoped grant, and that access outlives the reason it was given. No-access-by-default plus explicit per-person grants means the only way this happens is someone actively granting it — which is the point.

### Exceptions

None. If the studio outgrows per-person grants, that's a `[PROPOSAL]` for a future weekly review, not a default to drift into project by project.

---

## Folder Structure

**As it exists on disk today (canonical):**

```
DATA/[date]/[colorist]/[category]/PROJECT/[project name]/
    CHCEK/          # [sic] — flagged, not corrected here. Fix via a Book proposal, not a silent rename.
    GRABS/          # Client-provided reference stills / grabs
    OFFLINE_XML/    # XMLs from the editor, pre-conform — see 02-timeline-prep.md
    PREVIEW/        # Review renders / preview media, internal or client-facing
    RENDERS/        # Grade output
    TRIMS/          # Raw camera trims ingested for this project
    VFX/            # Plates out / VFX in
```

| Level | Values seen | Notes |
|---|---|---|
| `[date]` | e.g. `19-08-26` (DD-MM-YY) | Ingest date, not shoot date |
| `[colorist]` | `SAMIRAN`, `SUJITH`, `YASH`, or `OTHER/BACKUP` | Fixed set; `OTHER/BACKUP` is the catch-all for anything outside the active colorist rotation |
| `[category]` | `ADVERTISEMENT`, `LONG FORMAT`, `MUSIC VIDEO` | No confirmed catch-all category yet for work that doesn't fit these three — flag it rather than guessing which bucket it belongs in |
| `PROJECT/[project name]` | e.g. `1A` | Free text today; no enforced pattern |

**`[PROPOSAL]` — target structure**, documented in [02-timeline-prep.md](02-timeline-prep.md) and not yet how the server is actually organised:

```
/[ClientName]/[ProjectName]/
    /01_Source/       # Raw camera originals, archived read-only
    /02_Offline/       # Offline reference media + offline QT from editor
    /03_XMLs/          # Every XML received, versioned
    /04_Online/        # Conformed online media (trimmed, ready for grade)
    /05_VFX/
        /Plates_Out/
        /VFX_In/
    /06_Resolve/
    /07_Renders/
    /08_Delivery/
    /notes.md
```

This chapter treats the on-disk, date-first structure as canonical because it's what the studio actually does today. The client/project-first numbered scheme is the direction the studio wants to move toward, not a description of current practice — per the Book's own ratification criteria, aspirational structure doesn't get to be canonical just because it's tidier. Until this is ratified, **`02-timeline-prep.md`'s folder structure section is inconsistent with this chapter** and should be reconciled — see the note at the end of this chapter.

### Why this matters

New hires and anyone jumping onto an unfamiliar project need one predictable path to a project's media, without asking around. Date-first also matches how ingest actually happens — media arrives on a given day, gets assigned to whoever's grading it, and gets categorised — so the structure mirrors the real order of operations instead of an idealised one.

### The failure mode we're preventing

Two structures both being "sort of" true — one in the Book, one on disk — means nobody trusts either, and everyone re-derives the actual path by asking a colleague or poking around in Explorer. That's the exact silent-error pattern [02-timeline-prep.md](02-timeline-prep.md) calls out for timelines, and it applies just as much to folders.

### Exceptions

`OTHER/BACKUP` under `[colorist]` and any category that doesn't cleanly fit `ADVERTISEMENT` / `LONG FORMAT` / `MUSIC VIDEO` are the two known soft spots in this scheme. When a project doesn't fit, don't force it into the nearest bucket — flag it in `#debrief` so the category list can be extended deliberately instead of by accretion.

---

## Optimised Media Management

`opt_med` is shared across the entire studio and currently has no clearing policy — which is how it ended up at ~87% full (6.95 TB used / 1.05 TB available) with no documented trigger for anyone to do anything about it.

**`[PROPOSAL]`** — this protocol is new; it is not yet an established, ratified practice:

1. Optimised media for a project lives on `opt_med` (`O:`) for the duration that project is actively being worked.
2. **Data/conform clears a project's optimised media from `opt_med` once that project has delivered.** Delivery is the trigger — not a capacity threshold, and not a calendar cadence. If it's delivered, it comes off `opt_med`.
3. Clearing means removing the optimised media, not the project's other folders (`RENDERS`, `TRIMS`, etc., which live on `color01` / `output` and follow their own retention).
4. If `opt_med` is approaching capacity and no recently-delivered project accounts for it, that's a signal to check for projects sitting idle post-delivery — flag it in `#debrief` rather than deleting anything without confirming project status first.

### Why this matters

`opt_med` is the pool with the least headroom by a wide margin (1.05 TB available vs. tens of TiB on the other two) and the most simultaneous readers. A pool this tight, this shared, and this undocumented is the most likely of the three to cause a studio-wide slowdown with no clear owner to fix it.

### The failure mode we're preventing

`opt_med` fills mid-project because optimised media from projects that delivered weeks ago was never cleared, and nobody owned clearing it. The person who hits the wall is whoever's ingesting or optimising media that day — someone with no connection to the projects actually taking up the space.

### Exceptions

None yet. If a project needs its optimised media retained past delivery (e.g. pending revisions expected imminently), note the reason and expected clear date in the project's `notes.md` so it doesn't get silently swept — and so it doesn't silently linger either.

---

## Trim Protocol

Numbered steps for ingesting raw trims onto the server:

1. **Confirm the destination pool before copying anything.** Raw trims go to `color01` (`Z:`). Never `opt_med` — that pool is for optimised media only — and never `output`, which is renders and delivery only.
2. **Locate or create the date folder** under `DATA/` on `color01` for today's ingest date (`DD-MM-YY`).
3. **Locate or create the colorist folder** — `SAMIRAN`, `SUJITH`, `YASH`, or `OTHER/BACKUP` if the project isn't yet assigned to one of the active colorists.
4. **Locate or create the category folder** — `ADVERTISEMENT`, `LONG FORMAT`, or `MUSIC VIDEO`. If nothing fits, flag it (see [Exceptions](#exceptions-1) above) rather than picking the closest match.
5. **Locate or create `PROJECT/[project name]`**, and the standard subfolders inside it (`TRIMS`, `GRABS`, `OFFLINE_XML`, `PREVIEW`, `RENDERS`, `CHCEK`, `VFX`) if this is a new project.
6. **Copy trims into `TRIMS/`.** Never move directly off the source card/drive without a verified copy landing first.
7. **Verify before clearing the source.** Confirm clip count and total duration on `color01` match the camera card/drive before that card is formatted or returned. This is the single check that catches a bad or partial ingest before it's unrecoverable.
8. **Route VFX media through `VFX/`**, not `TRIMS/`. Plates going out and shots coming back follow the V1/V2/V3 layering convention in [02-timeline-prep.md](02-timeline-prep.md) once they reach the timeline.

### Why this matters

Trims are the one category of media in this pipeline that's frequently irreplaceable if lost before the source card is cleared — camera originals aren't sitting anywhere else. Getting the pool and the verification step right at ingest is cheap; re-shooting or explaining a gap in delivered footage is not.

### The failure mode we're preventing

A card gets cleared on the assumption the copy "probably went fine," and a gap in trims surfaces weeks later during conform or grade — at which point there's no source left to re-ingest from.

### Exceptions

Emergency ingests where a card must be cleared before a full verification pass (e.g. reused card needed on set same day) are allowed, but must be flagged in the project's `notes.md` immediately, not after the fact.

---

## Naming Conventions

| Element | Convention | Example | Status |
|---|---|---|---|
| Date folder | `DD-MM-YY` | `19-08-26` | Canonical |
| Colorist folder | `SAMIRAN` / `SUJITH` / `YASH` / `OTHER/BACKUP` | — | Canonical |
| Category folder | `ADVERTISEMENT` / `LONG FORMAT` / `MUSIC VIDEO` | — | Canonical (no catch-all yet — see above) |
| Project folder | Free text | `1A` | `[PROPOSAL]` — no enforced pattern exists today; a short client+project handle (e.g. `[Client]_[Project]`) is worth proposing at a weekly review so project folders are identifiable without opening them |
| `CHCEK` subfolder | — | — | Known typo, likely should read `CHECK`. Not corrected here — see note below |

A note on `CHCEK`: this Book documents current practice, including its rough edges. Renaming it silently in this chapter (or on disk) would be exactly the kind of undocumented change [10-contributing.md](10-contributing.md) warns against. If it should be `CHECK`, that's a one-line proposal — submit it rather than having it drift into "everyone just knows it's a typo."

---

## Ingest Checklist

Before a card or drive is cleared:

- [ ] Trims copied to `color01` (`Z:`), not `opt_med` or `output`
- [ ] Date / colorist / category / project folders correct — none created speculatively in the wrong branch
- [ ] Clip count and total duration on server verified against the source card/drive
- [ ] VFX-bound media routed to `VFX/`, not `TRIMS/`
- [ ] Any category or colorist that didn't fit the standard folders flagged in `#debrief`, not force-fit
- [ ] Project's `notes.md` started (or updated) if this is a new project or an emergency-ingest exception applies

---

## Anti-patterns

- **Ingesting to whichever pool has visible free space** — pool choice is about role and contention, not which drive letter looks emptiest.
- **Clearing a card on the assumption the copy worked** — verify clip count and duration first, every time. This is the step people skip when rushed, and it's the one that matters most.
- **Letting optimised media outlive project delivery on `opt_med`** — the shared pool with the least headroom is the last place to let files linger past their reason for being there.
- **Force-fitting a project into the nearest category or colorist folder** — flag the gap instead of quietly picking the closest match; that's how the folder scheme silently drifts.
- **Granting broad or "just in case" access on `color01` / `output`** — per-person, per-reason grants only. `everyone` stays No Access.
- **Treating the on-disk structure and the numbered scheme in `02-timeline-prep.md` as both simultaneously canonical** — only one is, until the `[PROPOSAL]` above is ratified. Don't let people default to whichever one they personally prefer.

---

*Owner: [TBD] · Status: Canonical on pool topology, mount points, ACL model, and the on-disk date/colorist/category/project folder structure. `[PROPOSAL]` on: the numbered `/[ClientName]/[ProjectName]/` scheme as a future target, the `opt_med` clearing protocol (Data/conform clears on delivery), and a project-folder naming pattern. Cross-references: [02-timeline-prep.md](02-timeline-prep.md), [05-conform-and-revisions.md](05-conform-and-revisions.md), [10-contributing.md](10-contributing.md)*
