/**
 * scripts/setEnv.js
 * 
 * Dynamic environment configuration & .clasp.json generator for sync-st CI/CD.
 * Resolves active Git branch to isolated Apps Script project IDs and BigQuery datasets.
 */

const fs = require('fs');
const path = require('path');

const branch = process.env.GITHUB_REF_NAME || 'dev';
console.log(`[CI/CD] Active Git Branch: ${branch}`);

let scriptIds = {};
if (process.env.SCRIPT_IDS_JSON) {
  try {
    scriptIds = JSON.parse(process.env.SCRIPT_IDS_JSON);
  } catch (err) {
    console.warn('[CI/CD] Warning: Could not parse SCRIPT_IDS_JSON secret.', err.message);
  }
}

const targetScriptId = scriptIds[branch] || scriptIds['dev'] || null;

if (targetScriptId) {
  const claspConfig = {
    scriptId: targetScriptId,
    rootDir: path.join(__dirname, '../engine/google-apps-script')
  };

  fs.writeFileSync(path.join(__dirname, '../.clasp.json'), JSON.stringify(claspConfig, null, 2));
  console.log(`[CI/CD] ✅ Generated .clasp.json for branch '${branch}' (Script ID: ${targetScriptId})`);
} else {
  console.log(`[CI/CD] ℹ️ No Apps Script ID mapped for branch '${branch}' in SCRIPT_IDS_JSON.`);
  console.log('[CI/CD] ℹ️ Skipping .clasp.json generation (Clasp deployment will be bypassed).');
}

console.log('[CI/CD] Environment resolution completed successfully.');
