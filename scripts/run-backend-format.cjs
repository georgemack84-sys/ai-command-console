const { spawnSync } = require('node:child_process');
const { join } = require('node:path');

const repositoryRoot = join(__dirname, '..');
const solution = join(repositoryRoot, 'services', 'api', 'Proprium.sln');
const verify = process.argv.includes('--check');
const commonArguments = [
  solution,
  '--no-restore',
  '--verbosity',
  'minimal',
];

if (verify) commonArguments.push('--verify-no-changes');

for (const arguments_ of [
  ['format', 'whitespace', ...commonArguments],
  ['format', 'style', ...commonArguments, '--severity', 'error'],
]) {
  const result = spawnSync('dotnet', arguments_, {
    cwd: repositoryRoot,
    stdio: 'inherit',
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
