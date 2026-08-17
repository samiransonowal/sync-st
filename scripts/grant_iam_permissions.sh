#!/usr/bin/env bash
# ============================================================================
# ST-IN-gen — GCP IAM Access Delegation Helper
# Script: scripts/grant_iam_permissions.sh
# Grants Project Editor, BigQuery Admin, and BigQuery Job User permissions
# to Samiran Sonowal (samiran@studiotunnel.com) under GCP project st-in-gen.
# ============================================================================

set -e

PROJECT_ID="st-in-gen"
TARGET_EMAIL="samiran@studiotunnel.com"
MEMBER="user:${TARGET_EMAIL}"

echo "==========================================================================="
echo "🚀 ST-IN-gen — GCP IAM Access Delegation Script"
echo "==========================================================================="
echo "📁 GCP Project : ${PROJECT_ID}"
echo "👤 Target User : ${TARGET_EMAIL}"
echo "==========================================================================="

if [ -d "$HOME/google-cloud-sdk/bin" ]; then
    export PATH="$HOME/google-cloud-sdk/bin:$PATH"
fi

if ! command -v gcloud &> /dev/null; then
    echo "⚠️ Google Cloud SDK (gcloud CLI) is not installed or not in PATH."
    echo "   Please execute the following commands in GCP Cloud Shell or terminal:"
    echo ""
    echo "   gcloud projects add-iam-policy-binding ${PROJECT_ID} --member=\"${MEMBER}\" --role=\"roles/editor\""
    echo "   gcloud projects add-iam-policy-binding ${PROJECT_ID} --member=\"${MEMBER}\" --role=\"roles/bigquery.admin\""
    echo "   gcloud projects add-iam-policy-binding ${PROJECT_ID} --member=\"${MEMBER}\" --role=\"roles/bigquery.jobUser\""
    exit 0
fi

echo "🔐 Granting roles/editor..."
gcloud projects add-iam-policy-binding "${PROJECT_ID}" --member="${MEMBER}" --role="roles/editor"

echo "🔐 Granting roles/bigquery.admin..."
gcloud projects add-iam-policy-binding "${PROJECT_ID}" --member="${MEMBER}" --role="roles/bigquery.admin"

echo "🔐 Granting roles/bigquery.jobUser..."
gcloud projects add-iam-policy-binding "${PROJECT_ID}" --member="${MEMBER}" --role="roles/bigquery.jobUser"

echo ""
echo "✨ [SUCCESS] All GCP IAM permissions granted to ${TARGET_EMAIL}!"
