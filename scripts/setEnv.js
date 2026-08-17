// scripts/setEnv.js
// Helper script that prepares the .clasp.json file for the correct Apps Script project
// based on the current Git branch and injects the appropriate DRY_RUN_MODE flag.

const fs = require('fs');
const path = require('path');

// The JSON string containing script IDs must be provided via an environment variable.
// Example: '{"dev":"1AbcDefGhiJkLmNoPqrStU","test":"2Xyz...","prod":"3Pqr..."}'
const scriptIdsJson = process.env.SCRIPT_IDS_JSON;
if (!scriptIdsJson) {
  console.error('ERROR: SCRIPT_IDS_JSON env var is not set.');
  process.exit(1);
}
let scriptIds;
try {
  scriptIds = JSON.parse(scriptIdsJson);
} catch (e) {
  console.error('ERROR: Failed to parse SCRIPT_IDS_JSON as JSON');
  process.exit(1);
}

// Determine the current branch. GitHub Actions provides GITHUB_REF like "refs/heads/dev".
const gitRef = process.env.GITHUB_REF || '';
const branch = gitRef.replace('refs/heads/', '').trim();
if (!branch) {
  console.error('ERROR: GITHUB_REF env var is missing.');
  process.exit(1);
}

const scriptId = scriptIds[branch];
if (!scriptId) {
  console.error(`ERROR: No scriptId configured for branch "${branch}"`);
  process.exit(1);
}

// Prepare the .clasp.json content.
const claspConfig = {
  scriptId,
  rootDir: './engine/google-apps-script'
};

const claspPath = path.resolve(__dirname, '../.clasp.json');
fs.writeFileSync(claspPath, JSON.stringify(claspConfig, null, 2));
console.log(`Wrote .clasp.json for branch "${branch}" with scriptId ${scriptId}`);

// Update DRY_RUN_MODE in 0_Config.gs
const configPath = path.resolve(__dirname, '../engine/google-apps-script/0_Config.gs');
let configContent = fs.readFileSync(configPath, 'utf8');
const dryRunValue = (branch === 'prod') ? 'false' : 'true';
configContent = configContent.replace(/const DRY_RUN_MODE = (true|false);/, `const DRY_RUN_MODE = ${dryRunValue};`);
fs.writeFileSync(configPath, configContent);
console.log(`Set DRY_RUN_MODE = ${dryRunValue} in 0_Config.gs`);
