import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const packageRoot = resolve(dirname(scriptPath), '..');
const dependencyCruiserCli = resolve(
  packageRoot,
  'node_modules/dependency-cruiser/bin/dependency-cruise.mjs',
);

export function runDependencyCruiser(arguments_, options = {}) {
  const environment = { ...process.env };
  delete environment.npm_config_prefix;
  delete environment.NPM_CONFIG_PREFIX;
  delete environment.npm_config_global;
  delete environment.NPM_CONFIG_GLOBAL;

  return spawnSync(process.execPath, [dependencyCruiserCli, ...arguments_], {
    cwd: packageRoot,
    env: environment,
    ...options,
  });
}

if (process.argv[1] === scriptPath) {
  const result = runDependencyCruiser(process.argv.slice(2), {
    stdio: 'inherit',
  });
  process.exit(result.status ?? 1);
}
