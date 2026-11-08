#!/usr/bin/env node

/**
 * Resolve the marketing version for a store release.
 *
 * - RELEASE_VERSION set: use it as given ("3" -> 3.0.0, "2.1" -> 2.1.0).
 * - Otherwise: next patch after the highest of the `v*` git tags and version.json.
 *
 * Writes the result into version.json (CI working copy only, never committed)
 * and, under GitHub Actions, to $GITHUB_OUTPUT as `version` and `tag`.
 *
 * Usage: RELEASE_VERSION=2.1.0 node scripts/resolve-release-version.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const VERSION_FILE = path.join(__dirname, '..', 'version.json');

/** "v2.1" / "2.1.0" / "3" -> [2, 1, 0]; null if not a plain numeric version. */
function parseVersion(raw) {
  const match = /^v?(\d+)(?:\.(\d+))?(?:\.(\d+))?$/.exec(String(raw).trim());
  if (!match) {
    return null;
  }
  return [match[1], match[2] || '0', match[3] || '0'].map(Number);
}

function compareVersions(a, b) {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) {
      return a[i] - b[i];
    }
  }
  return 0;
}

const format = (v) => v.join('.');

function releasedVersionsFromTags() {
  let output;
  try {
    output = execFileSync('git', ['tag', '--list', 'v*'], { encoding: 'utf8' });
  } catch (error) {
    console.error('ERROR: could not list git tags:', error.message);
    process.exit(1);
  }
  return output.split('\n').map(parseVersion).filter(Boolean);
}

function main() {
  const dryRun = process.argv.includes('--dry-run');
  const versionData = JSON.parse(fs.readFileSync(VERSION_FILE, 'utf8'));

  const known = releasedVersionsFromTags();
  const fileVersion = parseVersion(versionData.version);
  if (fileVersion) {
    known.push(fileVersion);
  }
  const latest = known.sort(compareVersions).pop() || [0, 0, 0];

  const requested = (process.env.RELEASE_VERSION || '').trim();
  let next;
  if (requested) {
    next = parseVersion(requested);
    if (!next) {
      console.error(`ERROR: "${requested}" is not a version. Use MAJOR[.MINOR[.PATCH]], e.g. 2.1.0 or 3.`);
      process.exit(1);
    }
    if (compareVersions(next, latest) <= 0) {
      console.warn(`WARNING: ${format(next)} is not above the latest known version ${format(latest)}.`);
      console.warn('The App Store rejects versions at or below one that is already live.');
    }
    console.log(`Using requested version ${format(next)} (latest known: ${format(latest)}).`);
  } else {
    next = [latest[0], latest[1], latest[2] + 1];
    console.log(`No version requested: ${format(latest)} -> ${format(next)}.`);
  }

  const version = format(next);
  if (!dryRun) {
    versionData.version = version;
    fs.writeFileSync(VERSION_FILE, JSON.stringify(versionData, null, 2) + '\n');
  }

  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `version=${version}\ntag=v${version}\n`);
  }
}

main();
