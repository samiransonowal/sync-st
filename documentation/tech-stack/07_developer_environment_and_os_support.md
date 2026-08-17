# 07 — Cross-Platform Developer Environment & OS Matrix

## Overview

**`ST-IN-gen`** is designed to run and be developed seamlessly across diverse operating systems used in modern post-production, VFX, software development, and accounting environments.

Whether developing locally on **Windows 11**, **macOS**, standard **Debian/Ubuntu Linux**, or **Rocky Linux / RHEL / AlmaLinux** (the motion picture and visual effects industry platform standard), the toolchain is lightweight, standardized, and verifiable with a single command.

---

## 🛠️ Automated Workstation Diagnostic

To verify whether your workstation has all prerequisites configured to edit and deploy the project with **Antigravity IDE** or **VS Code**, run:

```bash
# Via Python directly (works on all operating systems):
python scripts/check_dev_environment.py

# Or via npm shortcut:
npm run check-env
```

### What It Validates:
1. **Python 3.8+** & `pyyaml` module (used for static schemas and integrity suites).
2. **Node.js (v18+)** & **NPM** (used for Clasp engine and environment switching).
3. **Git & User Identity** (`user.name` and `user.email`).
4. **Google Clasp CLI** (`@google/clasp`) for Google Apps Script deployment.
5. **Google Cloud SDK** (`gcloud` CLI) for service account tokens & IAM.
6. **Codebase & Secrets Integrity** (presence of `engine/google-apps-script/` and config templates).

---

## 💻 OS Compatibility & Installation Matrix

### 1. 🪟 Windows 11 / Windows 10
* **Package Manager:** `winget` (built-in) or `choco`
* **Prerequisites Installation:**
  ```powershell
  winget install Python.Python.3.11
  winget install OpenJS.NodeJS.LTS
  winget install Git.Git
  pip install pyyaml
  ```

### 2. 🍎 macOS (Apple Silicon M1/M2/M3 & Intel)
* **Package Manager:** Homebrew (`brew`)
* **Prerequisites Installation:**
  ```bash
  brew install python@3.11 node@18 git
  pip3 install pyyaml
  ```

### 3. 🐧 Debian / Ubuntu Linux
* **Package Manager:** `apt`
* **Prerequisites Installation:**
  ```bash
  sudo apt update
  sudo apt install -y python3 python3-pip python3-yaml git curl
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt install -y nodejs
  ```

### 4. 🏔️ Rocky Linux 8/9 / RHEL / AlmaLinux (Film & VFX Studio Standard)
*Film and VFX facilities strictly standardize on Rocky Linux / RHEL adhering to the VFX Reference Platform (CY2024 / CY2025).*
* **Package Manager:** `dnf`
* **Prerequisites Installation:**
  ```bash
  sudo dnf install -y git python3.11 python3.11-pip python3-pyyaml
  sudo dnf module enable nodejs:18 -y
  sudo dnf install -y nodejs
  ```

---

## 🎨 Antigravity IDE & VS Code Setup

Recommended extensions for optimal developer experience:
- **Google Apps Script / Clasp** (`google.clasp`)
- **Python** (`ms-python.python`)
- **YAML Language Support** (`redhat.vscode-yaml`)
- **Prettier Code Formatter** (`esbenp.prettier-vscode`)
- **GitLens / Built-in Source Control**
