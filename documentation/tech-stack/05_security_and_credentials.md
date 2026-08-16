# 05 — Security & Credentials Technical Choice

## Overview

Security architecture enforces strict separation of public repository specs from private credentials.

---

## Security Model

1. **Strict `.gitignore` Separation:**
   - Private secrets (`credentials/private/secrets.env`) are strictly ignored by Git. They never reach GitHub.

2. **Public Configuration Template:**
   - `credentials/public/credentials.env.example` is committed to Git to allow co-developers to set up local environments safely.

3. **GCP & OAuth 2.0 Credentials:**
   - GCP Admin Account: `lab@studiotunnel.com`
   - OAuth 2.0 Client ID & Secret generated under GCP Project `st-in-gen` (`972643538415`).

4. **Organization Directory Matrix:**
   - Master Directory: `framework/documentation/users.yaml`
   - Synced Public Matrix: `credentials/public/users.json`
   - Auto-sync script: `framework/sync_users.py`
