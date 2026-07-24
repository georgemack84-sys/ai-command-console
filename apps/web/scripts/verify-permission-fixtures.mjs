import { spawnSync } from 'node:child_process';

const fixtures = [
  'direct-literal.ts',
  'concatenation.ts',
  'template.ts',
  'unsafe-assertion.ts',
  'double-cast.ts',
  'local-map.ts',
  'route-metadata.ts',
  're-export.ts',
  'bracket-bypass.ts',
];
for (const fixture of fixtures) {
  const path = `tests/architecture/fixtures/permission-failing/${fixture}`;
  const result = spawnSync(
    process.execPath,
    ['scripts/validate-permission-governance.mjs', `--path=${path}`],
    { encoding: 'utf8' },
  );
  if (result.status === 0) {
    console.error(`Expected ${path} to fail permission governance.`);
    process.exit(1);
  }
}
console.log('Expected permission-governance violations were detected.');
