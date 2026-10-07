const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const repositoryRoot = join(__dirname, '..');
const ownershipPath = join(repositoryRoot, 'config', 'project-ownership.json');

function normalize(path) {
  return path.replaceAll('\\', '/').replace(/^\.\//, '');
}

function matches(path, pattern) {
  const expression = `^${pattern.replace(/[|\\{}()[\]^$+?.]/g, '\\$&').replaceAll('**', '\u0000').replaceAll('*', '[^/]*').replaceAll('\u0000', '.*')}$`;
  return new RegExp(expression).test(path);
}

function loadOwnership() {
  return JSON.parse(readFileSync(ownershipPath, 'utf8'));
}

function classifyPath(rawPath, ownership = loadOwnership()) {
  const path = normalize(rawPath);
  if (ownership.generated.some((pattern) => matches(path, pattern))) return 'GENERATED';
  if (ownership.temporary.some((pattern) => matches(path, pattern))) return 'TEMPORARY';
  return ownership.owners.find((owner) => owner.paths.some((pattern) => matches(path, pattern)))?.id ?? 'UNKNOWN';
}

function validateOwnership(ownership = loadOwnership()) {
  const errors = [];
  if (ownership.schemaVersion !== 1) errors.push('schemaVersion must be 1.');
  for (const field of ['generated', 'temporary', 'owners']) {
    if (!Array.isArray(ownership[field]) || ownership[field].length === 0) errors.push(`${field} must be a non-empty array.`);
  }
  const ids = new Set();
  for (const owner of ownership.owners ?? []) {
    if (!owner || typeof owner.id !== 'string' || !owner.id) errors.push('Each owner requires an id.');
    else if (ids.has(owner.id)) errors.push(`Owner ${owner.id} is duplicated.`);
    else ids.add(owner.id);
    if (!Array.isArray(owner?.paths) || owner.paths.length === 0 || owner.paths.some((pattern) => typeof pattern !== 'string' || !pattern)) errors.push(`Owner ${owner?.id ?? '<unknown>'} requires non-empty path patterns.`);
  }
  for (const id of ['NURU', 'PROPRIUM_API', 'PROPRIUM_WEB', 'SHARED_PLATFORM']) if (!ids.has(id)) errors.push(`Required owner ${id} is missing.`);
  const anchors = { 'src/nuru/vault-contracts.ts': 'NURU', 'app/api/nuru/agents/route.ts': 'NURU', 'services/api/Proprium.sln': 'PROPRIUM_API', 'apps/web/package.json': 'PROPRIUM_WEB', '.next-production/BUILD_ID': 'GENERATED', '.codex-worktrees/example/trace.log': 'TEMPORARY', 'unclassified/file.txt': 'UNKNOWN' };
  for (const [path, expected] of Object.entries(anchors)) {
    const actual = classifyPath(path, ownership);
    if (actual !== expected) errors.push(`${path} classifies as ${actual}, expected ${expected}.`);
  }
  return errors;
}

module.exports = { classifyPath, loadOwnership, normalize, validateOwnership };
