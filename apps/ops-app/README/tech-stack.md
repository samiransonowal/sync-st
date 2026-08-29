# Studio Tunnel: Tech Stack (No-Coder Friendly Explainer)

## The Core Foundations

### 1. React (The "Architect")

React is the framework that handles how the application looks and feels. It manages all the complex "states"—like knowing which user is logged in, which tab you're viewing, and what tasks are in your queue. It's the "brain" that orchestrates the UI's behavior.

### 2. Vite (The "Fast-Forward" Button)

Vite is the tool we use to build and run the code efficiently. It's why the app loads so fast during development. It "bundles" all the code into a format your web browser can understand.

### 3. Firebase (The "Heart and Memory")

Firebase is a service provided by Google that serves as our database and "real-time" engine.

- **Why it's cool**: When a Colorist marks a task as "Delivered", the Line Producer's screen updates *instantly* without them having to refresh the page. This "Real-time sync" is what makes Studio Tunnel feel alive.

### 4. Tailwind CSS (The "Painter")

Tailwind is a library we use for styling. It allows us to create the sleek, modern, "dark-mode" premium aesthetic of Studio Tunnel quickly and consistently. It ensures buttons, cards, and text all look professional across the entire app.

### 5. Gemini AI (The "Digital Assistant")

We've integrated Google's **Gemini AI** directly into the app.

- **What it does**: It looks at the current project bookings and tasks and writes a custom, friendly, "Good Morning" briefing for each staff member. It's like having a mini-producer who's always up to speed.

### 6. Cloud Notifications & Reminders (The "Courier")

Automated notifications keep the team in sync.

- **What it does**: When a new project is booked or an executive report is published, automated background routines dispatch scheduled alerts to keep everyone aligned.

### 7. Capacitor (The "Interpreter")

Capacitor is a "bridge" that allows this web-based application to run on **iOS (iPhones)** and **Android** devices. It "wraps" our website into a mobile app so you can install it on your phone just like any other application.

### 8. Lucide React (The "Icon Set")

This is a modern library of icons (the little pictures like the Dashboard icon, Task checkmark, etc.). It keeps the app looking clean and visually intuitive.

### 9. Git (The "Historian")

Git is our version control system. It records every change made to the application, allowing us to maintain a transparent, audit-ready history of all feature updates and technical improvements.

### 10. Identity Hub (Base64 Image Sync)

We use a unique Base64-to-Firestore synchronization method for Display Pictures.

- **How it works**: When you upload a photo, the app converts it into a high-quality data string (Base64) and saves it directly to your profile. This allows instant visual identification across all team-facing modules without relying on slow external storage buckets.
