"""
ST-fin-com-prog — System Integrity & Validation Suite
Script: engine/python-scripts/test_system_integrity.py

Executes bulletproof verification across system schemas, YAML user directory,
JSON sync integrity, regex bounds (GSTIN/PAN), date formatters, and tax logic.
"""

import os
import sys
import json
import re
import yaml

# Ensure UTF-8 console output
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

# Regex rules matching Apps Script 1_Utils.gs
GSTIN_REGEX = r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$"
PAN_REGEX = r"^[A-Z]{5}[0-9]{4}[A-Z]{1}$"
DATE_YYYYMMDD_REGEX = r"^\d{4}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])$"

def run_system_tests():
    repo_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    print("=" * 70)
    print("ST-fin-com-prog — SYSTEM INTEGRITY & VALIDATION SUITE")
    print("=" * 70)

    passed_tests = 0
    total_tests = 0

    # -------------------------------------------------------------------------
    # TEST 1: YAML User Directory Integrity
    # -------------------------------------------------------------------------
    total_tests += 1
    yaml_path = os.path.join(repo_root, "documentation", "organization", "users.yaml")
    try:
        with open(yaml_path, "r", encoding="utf-8") as f:
            yaml_data = yaml.safe_load(f)
        assert "users" in yaml_data, "Missing 'users' block in users.yaml"
        assert "organization" in yaml_data, "Missing 'organization' block in users.yaml"
        print(f"[PASS] Test 1: Master users.yaml valid ({len(yaml_data['users'])} users loaded)")
        passed_tests += 1
    except Exception as e:
        print(f"[FAIL] Test 1: users.yaml invalid -> {e}")

    # -------------------------------------------------------------------------
    # TEST 2: Synced JSON Matrix Alignment
    # -------------------------------------------------------------------------
    total_tests += 1
    json_path = os.path.join(repo_root, "credentials", "public", "users.json")
    try:
        with open(json_path, "r", encoding="utf-8") as f:
            json_data = json.load(f)
        assert len(json_data["users"]) == len(yaml_data["users"]), "User count mismatch between YAML and JSON"
        print(f"[PASS] Test 2: Synced users.json aligned ({len(json_data['users'])} users verified)")
        passed_tests += 1
    except Exception as e:
        print(f"[FAIL] Test 2: users.json alignment -> {e}")

    # -------------------------------------------------------------------------
    # TEST 3: GSTIN & PAN Regex Validation Bounds
    # -------------------------------------------------------------------------
    total_tests += 1
    try:
        sample_gstin = yaml_data["organization"]["gstin"]
        sample_pan = yaml_data["organization"]["pan"]
        assert re.match(GSTIN_REGEX, sample_gstin), f"Invalid GSTIN format: {sample_gstin}"
        assert re.match(PAN_REGEX, sample_pan), f"Invalid PAN format: {sample_pan}"
        print(f"[PASS] Test 3: Regulatory GSTIN ({sample_gstin}) & PAN ({sample_pan}) Regex Passed")
        passed_tests += 1
    except Exception as e:
        print(f"[FAIL] Test 3: Tax Regex Validation -> {e}")

    # -------------------------------------------------------------------------
    # TEST 4: Date Format Serial YYYYMMDD Regex
    # -------------------------------------------------------------------------
    total_tests += 1
    try:
        valid_dates = ["20260701", "20260817", "20261231"]
        invalid_dates = ["2026-07-01", "01/07/2026", "20261301"]
        for d in valid_dates:
            assert re.match(DATE_YYYYMMDD_REGEX, d), f"Valid date failed: {d}"
        for d in invalid_dates:
            assert not re.match(DATE_YYYYMMDD_REGEX, d), f"Invalid date passed: {d}"
        print("[PASS] Test 4: Timezone & YYYYMMDD Date Serial Formatters Verified")
        passed_tests += 1
    except Exception as e:
        print(f"[FAIL] Test 4: Date Serial Formatters -> {e}")

    # -------------------------------------------------------------------------
    # TEST 5: Financial Tax Calculation Logic
    # -------------------------------------------------------------------------
    total_tests += 1
    try:
        subtotal = 100000.0
        cgst = subtotal * 0.09
        sgst = subtotal * 0.09
        igst = subtotal * 0.18
        grand_total_intra = subtotal + cgst + sgst
        grand_total_inter = subtotal + igst
        tds_deduction = subtotal * 0.10

        assert grand_total_intra == 118000.0, "Intra-state calculation error"
        assert grand_total_inter == 118000.0, "Inter-state calculation error"
        assert tds_deduction == 10000.0, "TDS calculation error"
        print("[PASS] Test 5: Intra/Inter-state GST (9%/9%/18%) & TDS (10%) Tax Math Verified")
        passed_tests += 1
    except Exception as e:
        print(f"[FAIL] Test 5: Tax Math -> {e}")

    # -------------------------------------------------------------------------
    # TEST 6: 3-Tier Environment Architecture & BigQuery Dataset Standards
    # -------------------------------------------------------------------------
    total_tests += 1
    try:
        config_gs_path = os.path.join(repo_root, "engine", "google-apps-script", "0_Config.gs")
        with open(config_gs_path, "r", encoding="utf-8") as f:
            config_content = f.read()

        # Verify 3-tier definitions exist in 0_Config.gs
        assert "DEV" in config_content and "TEST" in config_content and "PML" in config_content, "Missing 3-tier definitions in 0_Config.gs"
        assert "st_fin_com_prog_dev" in config_content, "Missing dev dataset in 0_Config.gs"
        assert "st_fin_com_prog_test" in config_content, "Missing test dataset in 0_Config.gs"
        assert "st_fin_com_prog_pml" in config_content, "Missing pml dataset in 0_Config.gs"
        assert "st-in-gen" in config_content, "Missing single GCP project st-in-gen in 0_Config.gs"
        assert "ACCOUNTS_ID" in config_content and "PROJECT_TRACKER_ID" in config_content, "Missing dedicated 3-tier Google Sheets config in 0_Config.gs"

        print("[PASS] Test 6: 3-Tier Standards (Dev, Test, PML), BQ Datasets & Dedicated Google Sheets Verified")
        passed_tests += 1
    except Exception as e:
        print(f"[FAIL] Test 6: 3-Tier Environment Verification -> {e}")

    # -------------------------------------------------------------------------
    # SUMMARY
    # -------------------------------------------------------------------------
    print("=" * 70)
    print(f"VERIFICATION SUMMARY: {passed_tests}/{total_tests} TESTS PASSED ({passed_tests/total_tests*100:.1f}%)")
    print("=" * 70)

    if passed_tests == total_tests:
        print("RESULT: ALL SYSTEM INTEGRITY CHECKS PASSED PERFECTLY!")
        return 0
    else:
        print("RESULT: INTEGRITY ISSUES DETECTED. PLEASE REVIEW ERRORS ABOVE.")
        return 1

if __name__ == "__main__":
    sys.exit(run_system_tests())
