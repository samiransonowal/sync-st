#!/usr/bin/env python3
"""
ST-IN-gen — Cross-Platform Developer Environment Diagnostic
Script: scripts/check_dev_environment.py

Verifies local developer workstation readiness across:
- Windows 10/11
- macOS (Apple Silicon & Intel)
- Debian / Ubuntu Linux
- Rocky Linux / RHEL / CentOS Stream / AlmaLinux (VFX & Film Studio Platform)

Zero external dependencies (uses standard Python 3 libraries only).
"""

import os
import sys
import platform
import subprocess
import shutil
import re
from pathlib import Path

# Ensure UTF-8 output on Windows terminal
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Terminal colors (fallback safely if unsupported)
USE_COLOR = sys.stdout.isatty() and platform.system() != 'Windows' or (
    platform.system() == 'Windows' and int(platform.version().split('.')[0]) >= 10
)

GREEN = '\033[92m' if USE_COLOR else ''
YELLOW = '\033[93m' if USE_COLOR else ''
RED = '\033[91m' if USE_COLOR else ''
CYAN = '\033[96m' if USE_COLOR else ''
BOLD = '\033[1m' if USE_COLOR else ''
RESET = '\033[0m' if USE_COLOR else ''


def get_os_flavor():
    system = platform.system()
    if system == "Windows":
        return "Windows", f"Windows {platform.release()} ({platform.version()})"
    elif system == "Darwin":
        return "macOS", f"macOS {platform.mac_ver()[0]} ({platform.machine()})"
    elif system == "Linux":
        try:
            if os.path.exists("/etc/os-release"):
                with open("/etc/os-release", "r") as f:
                    content = f.read()
                if "Rocky Linux" in content:
                    return "Rocky Linux", "Rocky Linux (VFX Platform Standard)"
                elif "Red Hat" in content or "RHEL" in content:
                    return "RHEL", "Red Hat Enterprise Linux"
                elif "AlmaLinux" in content:
                    return "AlmaLinux", "AlmaLinux"
                elif "Ubuntu" in content:
                    return "Ubuntu", "Ubuntu Linux"
                elif "Debian" in content:
                    return "Debian", "Debian Linux"
        except Exception:
            pass
        return "Linux", f"Linux ({platform.release()})"
    return system, system


def run_cmd_direct(cmd_list):
    try:
        res = subprocess.run(
            cmd_list,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=5
        )
        return res.returncode == 0, res.stdout.strip()
    except Exception as e:
        return False, str(e)


def main():
    os_category, os_desc = get_os_flavor()
    repo_root = Path(__file__).resolve().parent.parent

    print(f"{BOLD}{CYAN}{'=' * 75}{RESET}")
    print(f"{BOLD}{CYAN}🚀 ST-IN-gen — LOCAL DEVELOPER ENVIRONMENT DIAGNOSTIC{RESET}")
    print(f"{BOLD}{CYAN}   Studio Tunnel Invoice Generator & Financial Comptroller Engine{RESET}")
    print(f"{BOLD}{CYAN}{'=' * 75}{RESET}")
    print(f"💻 Detected Host OS: {BOLD}{os_desc}{RESET}")
    print(f"📁 Repository Root:  {repo_root}\n")

    results = []
    remediation_steps = []

    # -------------------------------------------------------------------------
    # 1. Python 3 & Pip Check
    # -------------------------------------------------------------------------
    py_ver = sys.version_info
    py_str = f"{py_ver.major}.{py_ver.minor}.{py_ver.micro}"
    if py_ver.major == 3 and py_ver.minor >= 8:
        results.append(("Python 3 (>= 3.8)", "PASS", f"v{py_str} ({sys.executable})"))
    else:
        results.append(("Python 3 (>= 3.8)", "FAIL", f"Found v{py_str} (Python 3.8+ required)"))
        if os_category == "Windows":
            remediation_steps.append("Install Python: winget install Python.Python.3.11")
        elif os_category == "macOS":
            remediation_steps.append("Install Python: brew install python@3.11")
        elif os_category in ["Rocky Linux", "RHEL", "AlmaLinux"]:
            remediation_steps.append("Install Python: sudo dnf install python3.11 python3.11-pip")
        else:
            remediation_steps.append("Install Python: sudo apt update && sudo apt install python3 python3-pip")

    # Check PyYAML
    try:
        import yaml
        results.append(("Python PyYAML Module", "PASS", "Installed & importable"))
    except ImportError:
        results.append(("Python PyYAML Module", "FAIL", "Missing PyYAML package"))
        if os_category in ["Rocky Linux", "RHEL", "AlmaLinux"]:
            remediation_steps.append("Install PyYAML: sudo dnf install python3-pyyaml OR pip3 install pyyaml")
        elif os_category in ["Ubuntu", "Debian"]:
            remediation_steps.append("Install PyYAML: sudo apt install python3-yaml OR pip3 install pyyaml")
        else:
            remediation_steps.append("Install PyYAML: pip install pyyaml")

    # -------------------------------------------------------------------------
    # 2. Node.js & NPM Check
    # -------------------------------------------------------------------------
    node_bin = shutil.which("node")
    if node_bin:
        ok, node_out = run_cmd_direct([node_bin, "--version"])
        m = re.search(r"v(\d+)\.", node_out)
        major = int(m.group(1)) if m else 0
        if major >= 18:
            results.append(("Node.js (>= 18.x)", "PASS", f"{node_out} ({node_bin})"))
        else:
            results.append(("Node.js (>= 18.x)", "WARN", f"{node_out} (Node 18+ recommended)"))
    else:
        results.append(("Node.js (>= 18.x)", "FAIL", "Not found in system PATH"))
        if os_category == "Windows":
            remediation_steps.append("Install Node.js: winget install OpenJS.NodeJS.LTS")
        elif os_category == "macOS":
            remediation_steps.append("Install Node.js: brew install node@18")
        elif os_category in ["Rocky Linux", "RHEL", "AlmaLinux"]:
            remediation_steps.append("Install Node.js: sudo dnf module enable nodejs:18 -y && sudo dnf install nodejs -y")
        else:
            remediation_steps.append("Install Node.js: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt install -y nodejs")

    npm_bin = shutil.which("npm") or shutil.which("npm.cmd")
    if npm_bin:
        ok, npm_out = run_cmd_direct([npm_bin, "--version"])
        results.append(("NPM Package Manager", "PASS", f"v{npm_out}"))
    else:
        results.append(("NPM Package Manager", "FAIL", "Not found in system PATH"))

    # -------------------------------------------------------------------------
    # 3. Git & User Identity Check
    # -------------------------------------------------------------------------
    git_bin = shutil.which("git")
    if git_bin:
        ok, git_out = run_cmd_direct([git_bin, "--version"])
        results.append(("Git Version Control", "PASS", f"{git_out}"))
        _, git_user = run_cmd_direct([git_bin, "config", "user.name"])
        _, git_email = run_cmd_direct([git_bin, "config", "user.email"])
        if git_user and git_email:
            results.append(("Git User Identity", "PASS", f"{git_user} <{git_email}>"))
        else:
            results.append(("Git User Identity", "WARN", "git user.name / user.email not configured"))
            remediation_steps.append("Configure Git Identity: git config --global user.name 'Samiran Sonowal' && git config --global user.email 'samiran@studiotunnel.com'")
    else:
        results.append(("Git Version Control", "FAIL", "Git not found in system PATH"))
        if os_category == "Windows":
            remediation_steps.append("Install Git: winget install Git.Git")
        elif os_category == "macOS":
            remediation_steps.append("Install Git: brew install git")
        elif os_category in ["Rocky Linux", "RHEL", "AlmaLinux"]:
            remediation_steps.append("Install Git: sudo dnf install git -y")
        else:
            remediation_steps.append("Install Git: sudo apt install git -y")

    # -------------------------------------------------------------------------
    # 4. Google Clasp (@google/clasp) Check
    # -------------------------------------------------------------------------
    clasp_bin = shutil.which("clasp") or shutil.which("clasp.cmd")
    if clasp_bin:
        ok, clasp_out = run_cmd_direct([clasp_bin, "--version"])
        results.append(("Google Clasp CLI", "PASS", f"v{clasp_out} ({clasp_bin})"))
    else:
        # Check node_modules local clasp
        local_clasp = repo_root / "node_modules" / ".bin" / ("clasp.cmd" if platform.system() == "Windows" else "clasp")
        if local_clasp.exists():
            ok, clasp_out = run_cmd_direct([str(local_clasp), "--version"])
            results.append(("Google Clasp CLI", "PASS", f"v{clasp_out} (Local node_modules)"))
        else:
            results.append(("Google Clasp CLI", "WARN", "Not installed (Will run after `npm ci`)"))
            remediation_steps.append("Install Clasp locally: npm ci (or globally: npm install -g @google/clasp)")

    # -------------------------------------------------------------------------
    # 5. Google Cloud SDK (gcloud CLI - Optional)
    # -------------------------------------------------------------------------
    gcloud_bin = shutil.which("gcloud") or shutil.which("gcloud.cmd")
    if gcloud_bin:
        ok, gcloud_out = run_cmd_direct([gcloud_bin, "--version"])
        first_line = gcloud_out.split('\n')[0] if gcloud_out else "Installed"
        results.append(("Google Cloud SDK (gcloud)", "PASS", f"{first_line}"))
    else:
        results.append(("Google Cloud SDK (gcloud)", "WARN", "Optional (Used for advance GCP IAM management)"))

    # -------------------------------------------------------------------------
    # 6. Project Files & Directory Structure Check
    # -------------------------------------------------------------------------
    gas_dir = repo_root / "engine" / "google-apps-script"
    if gas_dir.exists() and (gas_dir / "0_Config.gs").exists() and (gas_dir / "constants.gs").exists():
        results.append(("Apps Script Codebase", "PASS", "Found engine/google-apps-script/*.gs"))
    else:
        results.append(("Apps Script Codebase", "FAIL", "Missing engine/google-apps-script/ files"))

    sec_env = repo_root / "credentials" / "private" / "secrets.env"
    if sec_env.exists():
        results.append(("Local Secrets (secrets.env)", "PASS", "Found credentials/private/secrets.env"))
    else:
        results.append(("Local Secrets (secrets.env)", "WARN", "Missing private secrets.env (Copy from credentials/public/*.env.example)"))

    # -------------------------------------------------------------------------
    # Render Diagnostic Results
    # -------------------------------------------------------------------------
    pass_count = sum(1 for _, status, _ in results if status == "PASS")
    warn_count = sum(1 for _, status, _ in results if status == "WARN")
    fail_count = sum(1 for _, status, _ in results if status == "FAIL")

    for name, status, detail in results:
        if status == "PASS":
            badge = f"{GREEN}[PASS]{RESET}"
        elif status == "WARN":
            badge = f"{YELLOW}[WARN]{RESET}"
        else:
            badge = f"{RED}[FAIL]{RESET}"
        print(f" {badge} {name:<28} : {detail}")

    print(f"\n{BOLD}{'=' * 75}{RESET}")
    print(f"{BOLD}DIAGNOSTIC SUMMARY:{RESET} {GREEN}{pass_count} Passed{RESET} | {YELLOW}{warn_count} Warnings{RESET} | {RED}{fail_count} Failed{RESET}")
    print(f"{BOLD}{'=' * 75}{RESET}")

    if fail_count == 0:
        print(f"\n{GREEN}{BOLD}✨ CONGRATULATIONS! Your system is 100% READY for Antigravity / VS Code development on {os_category}!{RESET}\n")
    else:
        print(f"\n{RED}{BOLD}⚠️ ACTION REQUIRED: Follow the commands below for your OS ({os_category}):{RESET}")
        for idx, step in enumerate(remediation_steps, 1):
            print(f"  {idx}. {step}")
        print()

    return 0 if fail_count == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
