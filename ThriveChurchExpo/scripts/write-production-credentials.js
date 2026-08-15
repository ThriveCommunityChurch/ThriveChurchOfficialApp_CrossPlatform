#!/usr/bin/env node

/**
 * Materialize Production Credentials in CI
 *
 * Reads the production credentials payload from an environment variable and
 * writes it to disk so that app.config.js (and generate-firebase-configs.js)
 * can resolve normally on a CI runner and on the EAS build worker.
 *
 * Environment:
 *   THRIVE_CREDENTIALS_PRODUCTION  Required. Either raw JSON or base64-encoded
 *                                  JSON matching credentials.template.json.
 *
 * Writes:
 *   credentials.production.json  Used when APP_ENV=production (load-credentials.js)
 *   credentials.json             Legacy path read by generate-firebase-configs.js
 *
 * Both files are gitignored. Nothing here is ever committed.
 *
 * Usage: node scripts/write-production-credentials.js
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');
const PRODUCTION_FILE = path.join(PROJECT_ROOT, 'credentials.production.json');
const LEGACY_FILE = path.join(PROJECT_ROOT, 'credentials.json');

const ENV_VAR = 'THRIVE_CREDENTIALS_PRODUCTION';

/**
 * Accept either raw JSON or base64-encoded JSON so the secret can be stored
 * in whichever form is convenient. Base64 is recommended: it survives copy/paste
 * and GitHub's secret redaction without newline mangling.
 */
function parsePayload(raw) {
  const trimmed = raw.trim();

  // Raw JSON
  if (trimmed.startsWith('{')) {
    return JSON.parse(trimmed);
  }

  // Base64-encoded JSON
  const decoded = Buffer.from(trimmed, 'base64').toString('utf8');
  return JSON.parse(decoded);
}

function main() {
  const raw = process.env[ENV_VAR];

  if (!raw || raw.trim() === '') {
    console.error(`\nERROR: ${ENV_VAR} is not set.\n`);
    console.error('Add the production credentials as a repository secret:');
    console.error('   base64 -w0 credentials.production.json   # Linux');
    console.error('   base64 -i credentials.production.json    # macOS');
    console.error(`\nThen store the output as the ${ENV_VAR} secret.\n`);
    console.error('See docs/CI_CD_RELEASE.md for the full secret list.\n');
    process.exit(1);
  }

  let credentials;
  try {
    credentials = parsePayload(raw);
  } catch (error) {
    console.error(`\nERROR: ${ENV_VAR} is not valid JSON (or base64-encoded JSON).\n`);
    console.error('Error details:', error.message);
    process.exit(1);
  }

  // Fail loudly rather than shipping a build wired to a placeholder.
  const placeholders = findPlaceholders(credentials);
  if (placeholders.length > 0) {
    console.error('\nERROR: Production credentials still contain template placeholders:\n');
    placeholders.forEach((field) => console.error(`   - ${field}`));
    console.error('\nReplace them with real values and update the secret.\n');
    process.exit(1);
  }

  if (credentials.environment !== 'production') {
    console.warn(
      `Warning: credentials.environment is "${credentials.environment}", expected "production".`
    );
  }

  const serialized = JSON.stringify(credentials, null, 2) + '\n';

  fs.writeFileSync(PRODUCTION_FILE, serialized, 'utf8');
  fs.writeFileSync(LEGACY_FILE, serialized, 'utf8');

  console.log('Production credentials written:');
  console.log(`   ${PRODUCTION_FILE}`);
  console.log(`   ${LEGACY_FILE}`);
}

/**
 * Walk the credentials object looking for values still carrying the
 * template's placeholder markers.
 */
function findPlaceholders(credentials) {
  const found = [];

  const walk = (value, keyPath) => {
    if (typeof value === 'string') {
      if (value.includes('YOUR_') || value.includes('REPLACE_WITH_')) {
        found.push(keyPath);
      }
      return;
    }

    if (value && typeof value === 'object') {
      Object.entries(value).forEach(([key, child]) => {
        walk(child, keyPath ? `${keyPath}.${key}` : key);
      });
    }
  };

  walk(credentials, '');
  return found;
}

main();
