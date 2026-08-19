// scripts/setEnv.js
// Prepares .clasp.json and configures 3-tier environment parameters (Dev, Test, PML)
// in engine/google-apps-script/0_Config.gs based on the active Git branch.

const fs = require('fs');
const path = require('path');

// Map branch names to 3-tier environment metadata
const TIER_MAPPING = {
  dev: {
    tier: 'DEV',
    dryRun: 'true',
    datasetId: 'st_fin_com_prog_dev',
    title: 'ST-IN-gen-dev'
  },
  test: {
    tier: 'TEST',
    dryRun: 'true',
    datasetId: 'st_fin_com_prog_test',
    title: 'ST-IN-gen-test'
  },
  pml: {
    tier: 'PML',
    dryRun: 'false',
    datasetId: 'st_fin_com_prog_pml',
    title: 'ST-IN-gen-pml'
  },
  main: {
    tier: 'PML',
    dryRun: 'false',
    datasetId: 'st_fin_com_prog_pml',
    title: 'ST-IN-gen-pml'
  }
};

// Determine the current branch (from GITHUB_REF, explicit TARGET_BRANCH, or git)
let branch = (process.env.TARGET_BRANCH || '').trim();
if (!branch) {
  const gitRef = process.env.GITHUB_REF || '';
  branch = gitRef.replace('refs/heads/', '').trim();
}
if (!branch) {
  try {
    const { execSync } = require('child_process');
    branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
  } catch (e) {
    branch = 'dev'; // Default fallback
  }
}

const tierConfig = TIER_MAPPING[branch.toLowerCase()] || TIER_MAPPING.dev;
console.log(`[setEnv] Active Branch: "${branch}" -> Environment Tier: ${tierConfig.tier} (${tierConfig.title})`);

// 1. Configure .clasp.json if SCRIPT_IDS_JSON is available
const scriptIdsJson = process.env.SCRIPT_IDS_JSON;
if (scriptIdsJson) {
  try {
    const scriptIds = JSON.parse(scriptIdsJson);
    const scriptId = scriptIds[branch] || scriptIds[tierConfig.tier.toLowerCase()] || scriptIds.prod || scriptIds.main;
    if (scriptId) {
      const claspConfig = {
        scriptId,
        rootDir: './engine/google-apps-script'
      };
      const claspPath = path.resolve(__dirname, '../.clasp.json');
      fs.writeFileSync(claspPath, JSON.stringify(claspConfig, null, 2));
      console.log(`[setEnv] Wrote .clasp.json for branch "${branch}" with scriptId: ${scriptId}`);
    } else {
      console.warn(`[setEnv] No specific scriptId found in SCRIPT_IDS_JSON for branch "${branch}".`);
    }
  } catch (e) {
    console.warn(`[setEnv] Failed to parse SCRIPT_IDS_JSON: ${e.message}`);
  }
} else {
  console.log('[setEnv] SCRIPT_IDS_JSON env var not set. Skipping .clasp.json generation.');
}

// 2. Inject environment constants into engine/google-apps-script/0_Config.gs
const configPath = path.resolve(__dirname, '../engine/google-apps-script/0_Config.gs');
if (fs.existsSync(configPath)) {
  let configContent = fs.readFileSync(configPath, 'utf8');

  // Update ACTIVE_ENV
  configContent = configContent.replace(/ACTIVE_ENV:\s*['"][A-Z]+['"]/, `ACTIVE_ENV: '${tierConfig.tier}'`);

  // Update DRY_RUN_MODE
  configContent = configContent.replace(/var DRY_RUN_MODE = (true|false);/, `var DRY_RUN_MODE = ${tierConfig.dryRun};`);

  // Update BIGQUERY_DATASET_ID
  configContent = configContent.replace(/var BIGQUERY_DATASET_ID = ['"][^'"]+['"];/, `var BIGQUERY_DATASET_ID = '${tierConfig.datasetId}';`);

  fs.writeFileSync(configPath, configContent);
  console.log(`[setEnv] Updated 0_Config.gs: ACTIVE_ENV='${tierConfig.tier}', DRY_RUN_MODE=${tierConfig.dryRun}, BIGQUERY_DATASET_ID='${tierConfig.datasetId}'`);
} else {
  console.error(`[setEnv] Config file not found at: ${configPath}`);
}
