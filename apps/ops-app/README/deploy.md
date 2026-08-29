# Firebase Deployment Workflow (Studio Tunnel)

This guide outlines the mandatory workflow for deploying updates to **Studio Tunnel**. To maintain system stability, **never deploy directly to production.**

All changes must follow this verified sequence:

---

## 🏗️ 1. Localhost Development & Testing

Before any deployment, ensure your changes work perfectly on your local machine.

1. **Start the local environment:**

   ```powershell
   npm run dev
   ```

2. **Verify UI & Logic:** Test all features locally using your browser.

3. **Perform Production Build:** Ensure the build compiles without errors.

   ```powershell
   npm run build
   ```

---

## 🧪 2. Push to Preview Channel (Sandbox)

Once local testing is complete, you **must** deploy to a "Preview Channel" to test in a hosted environment before affecting the live site.

1. **Deploy to a unique channel:**

   firebase hosting:channel:deploy v107

   *Replace `v107` with any unique identifier (e.g., `feature-xyz`).*

2. **Verify the hosted version:** Open the **Channel URL** provided in the terminal (e.g., `https://studio-tunnel--v107-xxxx.web.app`).

3. **Iterate & Update:** If you find bugs, fix them locally, run `npm run build`, and redeploy to the SAME channel:

   firebase hosting:channel:deploy v107

### 🌟 Isolated Sandbox Project: `sandbox-tunnel`
To ensure complete database and storage isolation, preventing any test data from contaminating live production databases, sandboxing has been transitioned to a **dedicated, separate Firebase project**:
* **Sandbox Environment URL**: `https://sandbox-tunnel.web.app`
* **Purpose**: Serves as a persistent, fully isolated sandbox for all technical staging, feature validations, and testing.
* **Key Benefits**: 
  - **Data Isolation**: Completely decoupled from production Firestore and Firebase Storage, guaranteeing that testing activities never affect real business records.
  - **No Expiry**: Because it is hosted as a dedicated, primary site in its own Firebase project, the sandbox URL is permanent and never expires.

---

## 🚀 3. Promote to Production

Only after you have thoroughly tested and verified your changes on the **Preview Channel**, you can promote that specific "cloned" version to the live site.

**Promotion Command:**

firebase hosting:clone studio-tunnel:v107 studio-tunnel:live

*This instantly makes the verified preview version live at `https://studio-tunnel.web.app`.*

---

## 🔐 4. STORAGE & PERMISSIONS (CORS)

If image attachments show "CORS Errors" on localhost, you must apply the CORS configuration to your bucket.

1. **Ensure you have `cors.json` in the root.**
2. **Apply CORS via Google Cloud CLI (gsutil):**

   ```powershell
   gsutil cors set cors.json gs://studio-tunnel.firebasestorage.app
   ```

3. **Deploy Security Rules:** To update Firestore or Storage rules, run:

   ```powershell
   firebase deploy --only firestore:rules,storage
   ```

---

## ⚠️ Important Rules

1. **NO DIRECT PUSH**: Do not run `firebase deploy` or `firebase deploy --only hosting`. These commands skip the validation phase and are strictly prohibited for production updates.
2. **DATABASE NOTICE**: While your Front-End (UI) is sandboxed in preview, they still connect to the **production Firestore database**. Any data changes you make in a preview link will affect the live system records.
3. **CREDENTIALS**: If you encounter an "Authentication Error," run:

   ```powershell
   firebase login --reauth
   ```

---

## ⏪ 5. Restoring Older Versions

If a breaking change makes it to production, you can immediately roll back using either Firebase (for instant hosted rollback) or Git (for code rollback).

### **Instant Firebase Rollback (Hosted Site)**

1. Go to the **Firebase Console** -> **Hosting**.
2. Scroll to **Release History**.
3. Find the previous stable version, click the **three dots**, and select **Rollback**.
4. The live site will instantly revert to this version without needing a code build.

### **Git Code Reversion (Local Development)**

To properly fix the code so your local branch matches the stable state:

1. Find the stable commit hash:

   ```powershell
   git log --oneline
   ```

2. Revert the bad commit (creates a new commit that undoes the changes):

   ```powershell
   git revert <bad-commit-hash>
   ```

   **OR** reset entirely (WARNING: This deletes local changes):

   ```powershell
   git reset --hard <stable-commit-hash>
   ```

3. Commit, rebuild (`npm run build`), and redeploy via preview channel before promoting to live again.
