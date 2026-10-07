const { spawnSync } = require('node:child_process');
const { loadCandidate } = require('./qualification-candidate.cjs');

function evaluate(candidate, secretSafe) {
  const reasons = [];
  if (candidate.unexpected.length) reasons.push('unexpected paths');
  if (candidate.unknown.length) reasons.push('unknown paths');
  if (candidate.pendingCommands.length) reasons.push('pending verification');
  if (!secretSafe) reasons.push('secret safety failed');
  return { qualified: reasons.length === 0, reasons };
}
function qualify(id) {
  const candidate = loadCandidate(id);
  const secretCheck = spawnSync('node', ['scripts/validate-secrets.cjs'], { encoding: 'utf8' });
  return { candidate, ...evaluate(candidate, secretCheck.status === 0) };
}
module.exports = { evaluate, qualify };
