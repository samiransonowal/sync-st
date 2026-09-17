# 10 — Contributing to the Book

How the Book changes. Who proposes, who reviews, who ratifies, and the rituals that keep it alive.

**The principle:** A knowledge base that doesn't change is wrong within 6 months. A knowledge base that changes without discipline is worse than nothing — it looks authoritative but isn't. This chapter is the machinery that keeps the Book honest: every change is proposed, every proposal is reviewed, every ratification is traceable, and stale content is killed rather than quietly left to rot.

---

## Status system (refresher)

Every entry in the Book is one of three states. Full definitions in [README.md](README.md).

| State | Marker | Meaning |
|---|---|---|
| Canonical | *(none)* | Agreed, documented, enforced. This is how we work. |
| Proposal | `[PROPOSAL]` | Suggested convention. Discuss at weekly review before treating as settled. |
| Deprecated | `[DEPRECATED]` | No longer in use, kept for reference, scheduled for removal at the next monthly review. |

A change to the Book is either (a) a new entry (defaults to `[PROPOSAL]` unless ratified in-session), (b) a ratification of an existing `[PROPOSAL]` into canonical, (c) an edit to canonical content (triggers re-ratification if the meaning changes, not if only the wording improves), or (d) a deprecation.

---

## How a change enters the Book

### The intake path

```
end-of-shift observation
  → #debrief (daily)
    → weekly review (Friday)
      → drafted as Book entry, marked [PROPOSAL]
        → primary reviewer first-pass
          → ratification trio signoff
            → merged, [PROPOSAL] marker removed
```

Each arrow is a real step with a real owner. Skipping a step is how silent errors enter the Book itself.

### Intake channel `[PROPOSAL]`

Proposals are submitted to Tunnel Bot via WhatsApp. Bot captures to a proposal queue that the weekly review reads. Anyone on the team can submit — no Git literacy required.

**Interim (until bot is live):** Proposals land in the `#debrief` WhatsApp channel with a `#propose` tag. Facilitator transcribes tagged messages into the weekly review doc. Remove this section once Tunnel Bot intake is shipped.

The team is not expected to write Markdown or open PRs. The bot (or the facilitator, interim) is the interface between studio-floor observation and Book-formatted text.

### Daily debrief

End of shift, every team member drops one line in `#debrief` about anything worth remembering from the day. Not a Book entry — raw signal. Most lines won't make it into the Book. That's fine. The point is that nothing worth remembering is lost in transit between Tuesday and Friday.

Format: free-form. A stale VFX handle length, a conform gotcha, a client note that caught someone off guard, an anti-pattern someone spotted themselves doing. One line. No ceremony.

### Weekly review (Fridays, 20 minutes)

The keystone ritual. If this lapses for 3 weeks, the Book dies.

| Role | Who | Responsibility |
|---|---|---|
| Facilitator | Rotating — weekly | Reads the debrief queue, proposes which entries become Book candidates, captures outcomes |
| Attendees | Whole team on shift | Discuss candidates, flag mismatches with existing Book, push back on generic advice |
| Output | — | Each candidate is either: drafted as `[PROPOSAL]` entry, dropped with reason, or parked with a specific follow-up |

Facilitator rotation is deliberate — the ritual has to outlive any one person.

Agenda (20 min, not flexible):
- 5 min — read the week's debrief queue aloud
- 10 min — discuss candidates, decide fate of each
- 5 min — facilitator captures outcomes, sets next week's facilitator

If a candidate needs more than 3 minutes of discussion, park it for the monthly review or a separate working session. The weekly isn't the place to argue a big change — it's the place to catch small ones before they rot.

### Monthly diff review (first Monday, 45 minutes)

Whole team reads the previous month's Book diffs. Every merged change. Not a vote — a calibration. Purpose is ensuring everyone is actually aware of how the Book has evolved.

Agenda:
- 10 min — skim the month's merged diffs together
- 20 min — discuss the two or three that matter most
- 10 min — review the standing `[PROPOSAL]` list: ratify, modify, or kill anything older than 60 days
- 5 min — review the `[DEPRECATED]` list, remove what's past its scheduled removal

The 60-day rule matters. A `[PROPOSAL]` that has sat unratified for two monthly reviews is a signal the team doesn't actually agree on it. Force the decision.

---

## Review & ratification

### Primary reviewer (per chapter)

Every chapter has a primary reviewer. Not an owner — the canonical owner of every chapter is the CEO until explicitly delegated. Primary reviewer is a first-pass role: reads the proposal, checks tone and cross-references, flags anything off, forwards to the ratification trio.

| Chapter | Primary reviewer |
|---|---|
| `01-data-and-ingest.md` | Lead data — TBD named |
| `02-timeline-prep.md` | Lead conformist — TBD named |
| `03-markers-and-colours.md` | Lead conformist — TBD named |
| `04-colorist-workflow.md` | CEO / senior colorist |
| `05-conform-and-revisions.md` | Lead conformist — TBD named |
| `06-delivery.md` | Associate on live delivery rotation — TBD named |
| `07-client-communication.md` | Associate / account lead — TBD named |
| `10-contributing.md` | CEO |
| `11-ladder.md` | CEO + co-founder |

Primary reviewers are named at the bottom of each chapter. Named individuals, not roles — "Lead conformist" means nothing if three conformists think the other two are covering it.

### Ratification trio `[PROPOSAL]`

A `[PROPOSAL]` becomes canonical when ratified by **CEO + co-founder + CTO**.

Open question for the monthly review: does ratification require all three (unanimous), or two of three with no explicit veto? Default proposal: **two of three, no explicit veto**. Ratify or modify at the next monthly review.

Ratification criteria — the trio is checking for these, not wordsmithing:

1. **Tunnel-specific, not generic.** If the rule could appear in a generic post-production blog, it doesn't belong in the Book. Specifics or cut.
2. **Matches how we actually work.** Not aspirational. If the team doesn't already do it or isn't ready to commit to doing it from today, it's not canonical — it's a `[PROPOSAL]` or a deferred change.
3. **Anti-pattern section is honest.** Every chapter has a "things we don't do" section. New rules should say what the bad version looks like. If you can't name the failure mode, you haven't thought about the rule hard enough.
4. **Cross-references resolve.** Any link to another chapter actually points somewhere useful.
5. **No personal shorthand.** The Book is shared language. Idiolect belongs in a colorist's own notes.

---

## Write access

| Action | Who |
|---|---|
| Submit proposal (via bot / WhatsApp) | Anyone on the team |
| Transcribe proposal into Markdown draft | Facilitator (rotating) or primary reviewer |
| Merge `[PROPOSAL]` entry (not yet canonical) | Primary reviewer for that chapter |
| Ratify to canonical (remove `[PROPOSAL]` marker) | Ratification trio |
| Merge `[DEPRECATED]` transition | Ratification trio |
| Hot-fix a factually broken line in canonical content | CEO or CTO, with a note in the next weekly review |

Hot-fix authority exists because the Book will occasionally have a literal error — a wrong timecode, a broken link, a dead client name — that nobody benefits from leaving in place until Friday. Hot-fixes are for factual errors, never for changing meaning. Anything that changes what the Book says someone should *do* goes through the normal flow.

---

## Forcing function

The weekly review is the single point of failure. Protecting it:

1. **Tunnel Bot nudge.** Bot pings the week's facilitator Friday morning with a link to the debrief queue. If no review happens, bot re-pings Monday morning with both the facilitator and the CEO copied. If a second week is missed, bot flags to the ratification trio — this is the point where the Book is actively decaying and someone has to own the recovery.
2. **Interim:** Calendar invite with the whole team, facilitator named in the invite title each week. CEO manually re-invites if the invite gets declined without a replacement.
3. **Recovery protocol.** If the review lapses for 3 weeks, the next monthly review spends its full 45 minutes clearing the backlog. No exceptions, no rescheduling.

---

## Anti-patterns

- **Laundering a `[PROPOSAL]` as canonical** — writing a rule and quietly leaving the marker off to sneak it through. The `[PROPOSAL]` marker isn't an admission of uncertainty, it's an honesty contract. Skip it and the whole status system rots.
- **Merging without ratification because "we all agreed in the session"** — if the trio didn't sign off, it isn't canonical. Same rule for proposals discussed at weekly review and not formally ratified. Write it down or it didn't happen.
- **Skipping the weekly review "just this once"** — the review is short on purpose. A missed weekly compounds into a missed monthly into a dead Book. Run the review with two people if that's what's available; don't skip it.
- **Treating the debrief channel as a to-do list** — debrief is raw observation, not a queue of required Book edits. Most lines won't become entries. Don't force them to.
- **Adding rules without subtracting them** — every new canonical rule increases the cognitive load of the Book. Before adding one, ask whether an existing entry already covers it or could be extended. Smaller Book, better Book.
- **Writing rules for aspirational behavior** — "the colorist always checks X" when in reality the colorist never does this is worse than silence. Canonical content describes what the studio actually does. Aspirations go in `[PROPOSAL]` with a ratification target date.
- **Using the Book to settle arguments on the floor** — the Book is the record of decisions already made. Mid-session is the wrong time to litigate canonical rules. Log it in `#debrief`, discuss Friday.

---

## How to propose a change (everyone)

1. Send a WhatsApp message to Tunnel Bot describing the change. One or two sentences. Interim: post to `#debrief` with `#propose`.
2. That's it. Facilitator will pick it up Friday.

If you feel strongly about a proposal, come to the weekly review and defend it. If you don't feel strongly, don't — the weekly review will still decide.

## How to review a proposal (primary reviewers)

Checklist before forwarding to the ratification trio:

- [ ] Principle statement at the top, one or two sentences
- [ ] Tables and checklists over prose where possible
- [ ] Anti-pattern section present and honest
- [ ] Cross-references to related chapters included and resolving
- [ ] `[PROPOSAL]` marker on anything not yet ratified
- [ ] Owner and status line at the bottom
- [ ] Tone matches existing chapters (direct, specific, opinionated)
- [ ] No generic advice that could apply to any post house

If any item fails, send back to the drafter with the specific issue. Don't fix it yourself — the drafter learns by iterating.

## How to ratify (trio)

See the five ratification criteria above. Ratification is not proofreading. The trio is checking that the rule is correct, specific to Tunnel, and honestly described. Wordsmithing is the primary reviewer's job.

---

## Hooks for future tooling

- **Tunnel Bot proposal intake.** `/propose [text]` via WhatsApp, captured to a queue the facilitator reads Friday. Bot assigns a monotonic proposal ID for tracking.
- **Standing `[PROPOSAL]` query.** "What proposals are open and how old are they?" — bot reads the Book, grep for `[PROPOSAL]`, returns with first-seen date per entry.
- **Weekly digest.** Bot generates a Friday-morning digest of the week's `#debrief` messages, tagged and deduplicated, for the facilitator to work from.
- **Ratification log.** A `RATIFIED.md` or in-chapter changelog noting when each canonical entry was ratified and by whom. Feeds the monthly review's `[PROPOSAL]`-age check.
- **Proposal expiry.** Bot flags any `[PROPOSAL]` older than 60 days for forced decision at the next monthly review.

All of these are cheap to build once the Book's Markdown structure is stable. Keep the status markers and frontmatter consistent across chapters and this becomes mostly grep.

---

## Onboarding drill

New hire's first contribution to the Book: submit one proposal within the first two weeks. Pass/fail is "did you submit anything?" — quality of the proposal is not graded. The point is to prove the intake channel works end-to-end for the person who just joined, while their eyes are still fresh enough to see what the rest of us have stopped seeing.

---

*Owner: CEO · Primary reviewer: CEO · Ratification trio: CEO + co-founder + CTO · Status: Canonical on rituals (daily debrief, Friday review, monthly diff review), status system, and write-access matrix. `[PROPOSAL]` on: Tunnel Bot intake mechanism (pending bot build), ratification quorum (unanimous vs two-of-three), per-chapter primary reviewer assignments (names TBD), 60-day proposal expiry rule. Review at first monthly diff review after bot launch.*
