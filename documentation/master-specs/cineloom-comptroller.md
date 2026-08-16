---
name: "cineloom-comptroller"
description: "Run the Cineloom Postworks books: match bank credits to ACCOUNTS invoices, rebuild the chase list, sync results back to the ACCOUNTS sheet via the Apps Script bridge, generate and route invoices when a new job lands in ACCOUNTS, and email the weekly report. Use when asked to reconcile the books, update the chase list, check pending payments, sync the sheets, generate or send an invoice, or run the accounts job."
---

# Cineloom Comptroller — Postworks books & invoicing

Cineloom Postworks Pvt Ltd is a video post-production studio. This skill covers two
jobs that share the same ACCOUNTS sheet as their source of truth:

1. **Reconciliation** — matching bank money to invoices, producing the chase list,
   and syncing results back into the ACCOUNTS Google Sheet. (Weekly / on request.)
2. **Invoice generation** — as soon as a new job entry lands in ACCOUNTS, generating
   that invoice's PDF and routing it for sending. (Event-driven, per new row.)

## People

| Who | Email | Role |
| --- | --- | --- |
| Samiran | samiran@studiotunnel.com | Owner. All escalations go here, and only here. |
| Yash | yash@studiotunnel.com | Receives the weekly report only. Never escalations. |
| Line Producer | *varies per job — read from the PROJECT TRACKER row* | The invoice draft's default addressee. Forwards the invoice to the client themselves. |

Samiran, Yash, and Studio Tunnel credits in the bank are **loans, never sales**.

## The ownership rule — the thing that makes this work

No field has two writers. Never resolve a conflict; there should never be one.

| Data | Sole owner | Everyone else |
| --- | --- | --- |
| Invoice no, client, description, amount, colorist, date | Samiran, in PROJECT TRACKER → ACCOUNTS A–R via IMPORTRANGE | read-only |
| Bank credits/debits | HDFC statement | read-only |
| Payment Status, Amount Received, TDS, Pending, Remark | **The bot** | read-only |
| Invoice Generated, Invoice PDF Link, Invoice Draft Status *(new — confirm exact column letters with Samiran)* | **The bot** | read-only |
| Corrections (settle, write off, merge names) | Samiran, via dashboard or chat | bot applies |

If Samiran disagrees with a payment figure, he files a correction — he does not
edit the cell. Never suggest hand-editing the payment columns.

## Hard rules

- **Never write to ACCOUNTS columns A–R.** They are IMPORTRANGE formulas.
- **Never write to PROJECT TRACKER.** Ever.
- **Never write to the colorist filter tabs** (SUJITH / YASH / SAMIRAN / OTHERS).
- **Never email a client — for any reason, including invoices.** Chase emails and
  invoice emails alike are drafted for a human to send, never sent by the bot.
- **Never auto-forward an invoice past the draft stage.** The bot's job ends at
  producing the PDF and the draft email; Samiran or the Line Producer decides when
  and whether it goes out.
- **Never write off, reclassify, or merge a client without explicit confirmation.**
- **Never bypass the verification gate.** If `bot_results.json` was deleted by a
  failed check, that is the system working. Diagnose, don't work around.

## The artefacts

| Thing | Where | Purpose |
| --- | --- | --- |
| ACCOUNTS sheet | Google Sheets | Master invoice table. A–R from IMPORTRANGE; payment + invoice-status columns written by the bot. |
| PROJECT TRACKER | Google Sheets | Where Samiran (via the Line Producer) enters jobs. Upstream of everything. Read-only to the bot. |
| `_bot/CineloomBridge.gs` | Drive + installed in ACCOUNTS | Apps Script. Push/pull between sheet and bot, and hosts the invoice-PDF generator function *(confirm exact function name with Samiran — e.g. `generateInvoicePDF()`)*. |
| `_bot/reconcile.py` | Drive | The reconciliation engine. |
| `_bot/credit_overrides.csv` | Drive | Forces a bank credit's classification. |
| `_bot/invoice_writeoffs.csv` | Drive | Zeroes an invoice's open balance. |
| `_bot/name_canon_map.json` | Drive | Collapses spelling variants of one client. |
| `_bot/ACCOUNTS_live.csv` | Drive | Written by the bridge. The bot's invoice input. |
| `_bot/bot_results.json` | Drive | Written by the engine. The bridge's input. |
| `books.json` | INVOICES/ | Feeds the Cineloom Books dashboard. |
| `CINELOOM_BOOKS_AND_CHASE_LIST.xlsx` | INVOICES/ | Human-readable workbook. |
| Invoice PDFs | INVOICES/generated/ *(placeholder path — confirm with Samiran)* | One PDF per invoice, named `<InvNo>_<Client>.pdf`. Also the Drive fallback location when a PDF is too large to attach directly. |

Drive folder id for `_bot`: `1xwpPb8E9W9FkrHv08wothB_Pt0U9TTod`

## Invoice generation — event-driven, on every new ACCOUNTS row

Triggered whenever a new job entry appears in ACCOUNTS via the PROJECT TRACKER
IMPORTRANGE (columns A–R). This runs independently of the weekly reconciliation —
don't wait for the next scheduled run to generate an invoice.

1. **Detect the new row.** Compare the current ACCOUNTS A–R range against the last
   processed state (tracked in the new Invoice Generated column). Only rows without
   an Invoice Generated flag are candidates — never regenerate an invoice that
   already has one, even if the source row changes; that's a correction, not a new job.
2. **Confirm the row has everything needed.** Invoice no, client, description,
   amount, colorist, and date must all be present. If anything is missing, don't
   generate — flag it in the batched escalation instead (see Escalation).
3. **Generate the PDF** by calling the existing Apps Script invoice generator in
   `_bot/CineloomBridge.gs`, passing the row data. Don't rebuild invoice formatting
   logic independently — the generator is the single source of truth for what an
   invoice looks like.
4. **Check the PDF size.** If it's small enough to email directly, attach it to the
   draft. If it's too large for a normal email attachment, upload it to the
   `INVOICES/generated/` Drive folder instead and put a shareable link in the draft
   body in place of the attachment. *(Confirm the exact size cutoff with Samiran —
   Gmail's own attachment ceiling is roughly 25MB, but he may want a lower bar.)*
5. **Draft — never send — the routing email.** Addressed to that job's Line
   Producer (read from the PROJECT TRACKER row), with the PDF attached or linked.
   Subject and body should make clear this is ready to forward to the client as-is.
   If the row has no identifiable Line Producer, address the draft to Samiran instead
   and say why.
6. **Mark the row.** Set Invoice Generated = done and record the PDF link, so the
   next detection pass skips it. Leave Invoice Draft Status for whoever reviews the
   draft to mark as sent — the bot does not set this itself.
7. **Report in chat** what was generated and who each draft is addressed to.

## The support files — schemas and order

Applied in this order inside `reconcile.py`:

1. `name_canon_map.json` — `{"variant name": "canonical name"}`. Applied to invoice
   `Party Name` **after** the source column is materialised (getting this backwards
   silently discards every merge — it was a real bug), and to credit `Client`
   after classification.
2. `credit_overrides.csv` — `Date, Narration_contains, Amount, Class, Client, Note`.
   `Class` ∈ CLIENT / LOAN / INTERNAL / GATEWAY / RESOLVED.
3. `invoice_writeoffs.csv` — `InvNo, Client, Amount, Reason`.

**Always write these with Python's `csv` module, never string concatenation.**
Free-text Note/Reason fields contain commas and will break `pd.read_csv` otherwise.
This has bitten twice.

## Allocation logic

10% TDS assumed on every bill. `Base = Total ÷ 1.18`, `Expected = Total − 0.10 × Base`.
Payments are pooled per client and applied **oldest invoice first**. Surplus beyond
all open invoices is reported as client surplus, not revenue.

## Procedure — weekly reconciliation

1. **Check for replies** to any escalation email; apply what Samiran decided.
2. **Get the bank statement.** Needs to span the full invoice date range — a
   partial statement makes everything look unpaid. If it's short, stop and ask.
3. **Confirm the invoice source.** Prefer `ACCOUNTS_live.csv`. If it's over 48h old
   the engine warns — that means the Apps Script trigger has stopped, and it should
   be reported to Samiran rather than silently working around with a manual export.
4. **Process the dashboard change queue** — any `dashboard_changes_*.json` in `_bot`.
   Translate each into the right support file, then move the file to `_bot/processed/`.
   Change types: `mark_paid`, `add_note`, `flag_fix`, `unidentified_resolve`
   (with `resolution` ∈ assign_client / mark_loan / ignore).
5. **Run the engine**: `python3 reconcile.py <input_dir> <output.xlsx>`
6. **Read the verification output.** Ten checks. If any FAIL, `bot_results.json` is
   deleted automatically — do not proceed, escalate instead.
7. **Pull into ACCOUNTS** via the bridge. Ask Samiran to run *Cineloom Bot → Preview
   what pull would change* first if anything about the run was unusual.
8. **Refresh the dashboard** from the new `books.json`.
9. **Email the report** to Samiran and Yash: invoice count, total billing, revenue
   per colorist, cash received, total outstanding, and the top overdue accounts.
10. **Report in chat** — what changed, what needs a decision.

## Escalation

To Samiran only, batched into one email, never Yash. Include what the bot saw, what
it did or didn't do, and the safe default it chose. Escalate for: a failed
verification check, a stale bridge export, invoices with no date, invoices in the
bank data but absent from ACCOUNTS, a credit that can't be attributed to any client,
anything that would need a write-off, a new ACCOUNTS row missing fields needed to
invoice it, and a new row with no identifiable Line Producer.

## Finding classifier errors — the tie-audit method

The classifier matches bank narration to clients by token overlap after stripping
generic words (PRIVATE, LIMITED, FILMS, MEDIA, PRODUCTION, ENTERTAINMENT, etc.).
Two failure classes, and they need opposite treatment:

**Dangerous — two genuinely different clients tie.** e.g. "Sunshine Motion Pictures"
vs "Eternal Sunshine Media" both reduce to `{SUNSHINE}`. The tie-break is alphabetical
and arbitrary, so money silently lands on the wrong client. Fix with an explicit
`credit_overrides.csv` row. **Never auto-merge these.**

**Safe — one client spelled several ways.** e.g. "Ryde Studio" / "RYDE STUDIOS".
Merge via `name_canon_map.json`. This changes attribution only, never totals —
verify that by comparing aggregate owed before and after.

**Also watch:** client names built entirely from generic vocabulary tokenise to the
empty set and always land in UNIDENTIFIED. "MA & TH ENTERTAINMENT NETWORK" is the
known case. These need a `credit_overrides.csv` row; don't try to fix the tokenizer.

To run the audit: for every credit, score it against all clients, and flag any where
the top two scores are equal. Then classify each hit into the two categories above.