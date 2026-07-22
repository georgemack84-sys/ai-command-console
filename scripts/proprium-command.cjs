#!/usr/bin/env node

const { spawnSync } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const compose = ['compose', '-f', 'docker-compose.proprium.yml'];
const command = process.argv[2] ?? 'help';
const commandArguments = process.argv.slice(3);
const executable = (name) => process.platform === 'win32' && name === 'npm' ? 'npm.cmd' : name;

function run(name, args, options = {}) {
  const result = spawnSync(executable(name), args, { cwd: root, stdio: 'inherit', ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function runIn(directory, name, args) {
  run(name, args, { cwd: path.join(root, directory) });
}

async function checkHealth() {
  for (const url of ['http://localhost:8080/api/v1/health/live', 'http://localhost:8080/api/v1/health/ready', 'http://localhost:3000/health']) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}.`);
    console.log(`${url} is healthy.`);
  }
}

async function main() {
  switch (command) {
    case 'bootstrap':
      run('npm', ['ci']);
      runIn('apps/web', 'npm', ['ci']);
      run('dotnet', ['restore', 'services/api/Proprium.sln']);
      return;
    case 'dev':
      run('docker', [...compose, 'up', '--build', '--detach', '--wait']);
      return;
    case 'stop':
      run('docker', [...compose, 'down']);
      return;
    case 'build':
      runIn('apps/web', 'npm', ['run', 'build']);
      run('dotnet', ['build', 'services/api/Proprium.sln', '--configuration', 'Release']);
      return;
    case 'test':
      runIn('apps/web', 'npm', ['test']);
      run('dotnet', ['test', 'services/api/Proprium.sln', '--configuration', 'Release', '--filter', 'Category!=Integration']);
      return;
    case 'lint':
      run('npm', ['run', 'validate:repository']);
      runIn('apps/web', 'npm', ['run', 'lint']);
      run('dotnet', ['format', 'services/api/Proprium.sln', '--verify-no-changes']);
      return;
    case 'format':
      runIn('apps/web', 'npm', ['run', 'format']);
      run('dotnet', ['format', 'services/api/Proprium.sln']);
      return;
    case 'migrate':
      run('docker', [...compose, 'up', '--build', '--exit-code-from', 'database-migrations', 'database-migrations']);
      return;
    case 'reset-db':
      if (!commandArguments.includes('--force')) {
        throw new Error('reset-db removes the named Proprium PostgreSQL volume. Re-run with --force to confirm.');
      }
      run('docker', [...compose, 'down', '--volumes']);
      run('docker', [...compose, 'up', '--build', '--detach', '--wait']);
      return;
    case 'health':
      await checkHealth();
      return;
    case 'help':
      console.log('Commands: bootstrap, dev, stop, build, test, lint, format, migrate, reset-db, health');
      console.log('Use make <command> or .\\scripts\\proprium.ps1 <command>. reset-db requires --force outside Make.');
      return;
    default:
      throw new Error(`Unknown command: ${command}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
