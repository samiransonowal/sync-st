# STEM User Registry – Google Sheet

- **Sheet ID**: `1xVpbcCqfEG9S1A8wmL_J_LurltL41I9Lgyj78LB1PAA`
- **URL**: https://docs.google.com/spreadsheets/d/1xVpbcCqfEG9S1A8wmL_J_LurltL41I9Lgyj78LB1PAA/edit
- **Purpose**: Central registry of STEM users (students, mentors, volunteers). It will be consulted later for:
  - Auto‑populating client information when a user is also a STEM participant.
  - Generating bulk reports / analytics on STEM programme invoicing.
- **Access**: The sheet is currently shared with the `studio-tunnel.com` domain (view‑only). When production code needs read‑only access, a **service‑account** with the `https://www.googleapis.com/auth/spreadsheets.readonly` scope should be used. **Security review required** before any credentials are added to the repo.
- **Next steps**:
  1. Store the Sheet ID in the Apps Script config (see `0_Config.gs`).
  2. Add a service‑account JSON file to `credentials/private/` (git‑ignored) and reference it via Apps Script Properties Service.
  3. Document the credential rotation process in `documentation/organization/credentials_policy.md`.
