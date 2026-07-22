import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const run = spawnSync(
  process.execPath,
  [
    fileURLToPath(
      new URL(
        '../node_modules/dependency-cruiser/bin/dependency-cruise.mjs',
        import.meta.url,
      ),
    ),
    '--config',
    '.dependency-cruiser.cjs',
    '--output-type',
    'err',
    'src/test/architecture-fixtures',
  ],
  { encoding: 'utf8' },
);
const output = `${run.stdout}\n${run.stderr}`;
if (
  run.status === 0 ||
  !output.includes('architecture-fixture-must-not-import-route')
) {
  console.error(output);
  throw new Error(
    'Architecture violation fixture did not fail with the expected rule.',
  );
}
console.log('Architecture violation fixture failed as expected.');
