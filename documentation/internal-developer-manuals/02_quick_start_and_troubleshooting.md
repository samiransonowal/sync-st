# Studio Tunnel: Quick Start & Troubleshooting

## Initialization

To get the project running on a new machine:

1. **Clone the Repository**: Use `git clone` to get the latest version.

2. **Install Dependencies**: Open a terminal in the project directory and run:

   ```bash
   npm install
   ```

3. **Run Development Server**:

   ```bash
   npm run dev
   ```

4. **Local Access**: Open [http://localhost:5173](http://localhost:5173) in your browser.

5. **Release Portal**: Click the version number (e.g., `v1.0.3`) next to the logo in the sidebar to view the full changelog.

6. **Settings & Identity**: Use the gear icon or click your profile name at the bottom of the sidebar to manage your PIN, email, and display picture.

7. **HR & Leave**: Access the "Employment & HR" section at the top of the Settings page to view your allowance and submit new leave requests.

---

## Deployment (Firebase & Preview)

Updates to **Studio Tunnel** follow a strict safety workflow. **Directly pushing to the live site is prohibited.**

To deploy changes:

37: 1. **Read the mandatory workflow guide**: See [**`README/deploy.md`**](file:///d:/studio-tunnel_160326/studio-tunnel/README/deploy.md).

2. **Basic Summary**:
   - `npm run build`
   - `firebase hosting:channel:deploy <any-channel-id>`
   - Verify the preview link.
   - Promote to live: `firebase hosting:clone studio-tunnel:<channel-id> studio-tunnel:live`

---

## 🛠️ Debugging & Troubleshooting

### 1. "Vite is not recognized as an internal or external command"

**The Issue**: The `node_modules` folder isn't correctly linked.

**Fix**:

- Run `npm install` again.
- Alternatively, run it using `npx vite`.

### 2. PIN Login failing for a user

**The Issue**: The user profile might not have a PIN set in the `user_profiles` collection in Firebase.

**Fix**:

- Check the `USERS` list in `App.jsx` for the user's ID.
- Ensure the corresponding document exists in Firebase's `user_profiles` collection with a `pin` field (default is usually `0000`).

### 3. AI Daily Briefing not showing up

**The Issue**: The Gemini API key is missing or the request is failing.

**Fix**:

- Check the `generateAIBriefing` function in `App.jsx`.
- Ensure a valid `apiKey` is provided in the `url` string for the Gemini API call.

### 5. Localhost not loading at all

**The Issue**: The port (5173) might be in use or the development server crashed.

**Fix**:

- Check the terminal for errors.
- Try running Vite on a different port: `npm run dev -- --port 5174`.
- Confirm no other development servers are running.
