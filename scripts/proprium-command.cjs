#!/usr/bin/env node

const { spawnSync } = require('node:child_process');
const { existsSync } = require('node:fs');
const path = require('node:path');

const repositoryRoot = path.resolve(__dirname, '..');
const frontendRoot = path.join(repositoryRoot, 'apps', 'web');
const backendSolution = path.join('services', 'api', 'Proprium.sln');
const compose = ['compose', '-f', 'docker-compose.proprium.yml'];
function invocation(name, args) {
  if (process.platform === 'win32' && name === 'npm') {
    const npmCli =
      process.env.npm_execpath ??
      path.join(
        path.dirname(process.execPath),
        'node_modules',
        'npm',
        'bin',
        'npm-cli.js',
      );
    if (existsSync(npmCli)) {
      return { name: process.execPath, args: [npmCli, ...args] };
    }
  }
  return { name, args };
}

const processStep = (
  label,
  name,
  args,
  cwd = repositoryRoot,
  environment,
) => ({
  label,
  process: { name, args, cwd, environment },
});
const commandStep = (label, command) => ({ label, command });

const commands = new Map([
  [
    'validate repo',
    {
      description: 'Validate repository structure and policy.',
      steps: [
        processStep('Repository structure and policy', 'npm', [
          'run',
          'validate:repository',
        ]),
        processStep('Developer documentation contract', 'npm', [
          'run',
          'validate:documentation',
        ]),
        processStep('Day 5 baseline and Week 2 admission', 'npm', [
          'run',
          'validate:baseline',
        ]),
      ],
    },
  ],
  [
    'validate documentation',
    {
      description: 'Validate the developer documentation contract.',
      steps: [
        processStep('Developer documentation contract', 'npm', [
          'run',
          'validate:documentation',
        ]),
      ],
    },
  ],
  [
    'validate qualification',
    {
      description: 'Validate the Day 5 qualification evidence package.',
      steps: [
        processStep('Day 5 qualification evidence', 'npm', [
          'run',
          'validate:qualification',
        ]),
      ],
    },
  ],
  [
    'validate baseline',
    {
      description: 'Validate the frozen Day 5 baseline and Week 2 admission.',
      steps: [
        processStep('Day 5 baseline and Week 2 admission', 'npm', [
          'run',
          'validate:baseline',
        ]),
      ],
    },
  ],
  [
    'validate frontend',
    {
      description: 'Run the complete frontend source-validation stack.',
      steps: [
        processStep('Frontend source validation', 'npm', [
          'run',
          'validate:frontend',
        ], frontendRoot),
      ],
    },
  ],
  [
    'validate ui-foundation',
    {
      description: 'Validate design tokens, themes, and Storybook parity.',
      steps: [
        processStep(
          'Frontend UI foundation',
          'npm',
          ['run', 'validate:ui-foundation'],
          frontendRoot,
        ),
      ],
    },
  ],
  [
    'validate components',
    {
      description: 'Validate reusable component APIs, styling, and stories.',
      steps: [
        processStep(
          'Frontend core components',
          'npm',
          ['run', 'validate:components'],
          frontendRoot,
        ),
      ],
    },
  ],
  [
    'validate shell',
    {
      description: 'Validate the responsive application-shell contract.',
      steps: [
        processStep(
          'Frontend responsive shell',
          'npm',
          ['run', 'validate:shell'],
          frontendRoot,
        ),
      ],
    },
  ],
  [
    'validate overlays',
    {
      description: 'Validate reusable overlay interaction contracts.',
      steps: [
        processStep(
          'Frontend overlay foundation',
          'npm',
          ['run', 'validate:overlays'],
          frontendRoot,
        ),
      ],
    },
  ],
  [
    'validate route-states',
    {
      description: 'Validate route loading, recovery, and absence contracts.',
      steps: [
        processStep(
          'Frontend route-state UX',
          'npm',
          ['run', 'validate:route-states'],
          frontendRoot,
        ),
      ],
    },
  ],
  [
    'validate test-classification',
    {
      description: 'Verify backend test category and filter contracts.',
      steps: [
        processStep('Backend test classification', 'npm', [
          'run',
          'validate:backend-test-classification',
        ]),
      ],
    },
  ],
  [
    'validate backend',
    {
      description: 'Run all infrastructure-independent backend validation.',
      steps: [
        processStep('Backend formatting', 'npm', [
          'run',
          'backend:format:check',
        ]),
        processStep('Backend compiler policy', 'npm', [
          'run',
          'validate:backend-compiler',
        ]),
        processStep('Release build and analyzers', 'dotnet', [
          'build',
          backendSolution,
          '--configuration',
          'Release',
          '--no-restore',
          '--nologo',
          '--verbosity',
          'minimal',
        ]),
        processStep('Backend architecture', 'npm', [
          'run',
          'validate:backend-architecture',
        ]),
        commandStep(
          'Backend test classification',
          'validate test-classification',
        ),
      ],
    },
  ],
  [
    'validate docker',
    {
      description: 'Validate Compose configuration and application image builds.',
      steps: [
        processStep('Compose configuration', 'docker', [...compose, 'config', '--quiet']),
        processStep('Application image builds', 'docker', [...compose, 'build']),
      ],
    },
  ],
  [
    'validate openapi',
    {
      description: 'Generate and validate the canonical OpenAPI contract.',
      steps: [
        processStep('OpenAPI generation and validation', 'npm', [
          'run',
          'validate:openapi',
        ]),
      ],
    },
  ],
  [
    'validate',
    {
      description: 'Run every infrastructure-independent validation gate.',
      steps: [
        commandStep('Repository validation', 'validate repo'),
        commandStep('Frontend validation', 'validate frontend'),
        commandStep('Backend validation', 'validate backend'),
      ],
    },
  ],
  [
    'format frontend',
    {
      description: 'Apply canonical frontend formatting.',
      steps: [
        processStep('Format frontend', 'npm', ['run', 'format'], frontendRoot),
      ],
    },
  ],
  [
    'format backend',
    {
      description: 'Apply canonical backend formatting.',
      steps: [
        processStep('Format backend', 'npm', ['run', 'backend:format']),
      ],
    },
  ],
  [
    'format check',
    {
      description: 'Verify frontend and backend formatting without writes.',
      steps: [
        processStep('Check frontend formatting', 'npm', [
          'run',
          'format:check',
        ], frontendRoot),
        processStep('Check backend formatting', 'npm', [
          'run',
          'backend:format:check',
        ]),
      ],
    },
  ],
  [
    'format',
    {
      description: 'Apply canonical frontend and backend formatting.',
      steps: [
        commandStep('Frontend formatting', 'format frontend'),
        commandStep('Backend formatting', 'format backend'),
      ],
    },
  ],
  [
    'build frontend',
    {
      description: 'Build the frontend without starting infrastructure.',
      steps: [
        processStep(
          'Build frontend',
          'npm',
          ['run', 'build'],
          frontendRoot,
          { ...process.env, NODE_ENV: 'production' },
        ),
      ],
    },
  ],
  [
    'build backend',
    {
      description: 'Build the backend in Release configuration.',
      steps: [
        processStep('Build backend', 'dotnet', [
          'build',
          backendSolution,
          '--configuration',
          'Release',
          '--nologo',
          '--verbosity',
          'minimal',
        ]),
      ],
    },
  ],
  [
    'build storybook',
    {
      description: 'Build the infrastructure-independent Storybook site.',
      steps: [
        processStep(
          'Build Storybook',
          'npm',
          ['run', 'storybook:build'],
          frontendRoot,
        ),
      ],
    },
  ],
  [
    'build',
    {
      description: 'Build frontend and backend without starting infrastructure.',
      steps: [
        commandStep('Frontend build', 'build frontend'),
        commandStep('Backend build', 'build backend'),
      ],
    },
  ],
  [
    'test unit',
    {
      description: 'Run frontend and backend unit tests only.',
      steps: [
        processStep('Frontend unit tests', 'npm', ['test'], frontendRoot),
        processStep('Backend unit tests', 'npm', ['run', 'backend:test:unit']),
      ],
    },
  ],
  [
    'test architecture',
    {
      description: 'Run the infrastructure-independent architecture tests.',
      steps: [
        processStep('Backend architecture tests', 'npm', [
          'run',
          'backend:test:architecture',
        ]),
      ],
    },
  ],
  [
    'test',
    {
      description: 'Run all infrastructure-independent test suites.',
      steps: [
        commandStep('Unit tests', 'test unit'),
        commandStep('Architecture tests', 'test architecture'),
      ],
    },
  ],
]);

class CommandFailure extends Error {
  constructor(message, exitCode = 1) {
    super(message);
    this.exitCode = exitCode;
  }
}

function unknownCommand(command) {
  return new CommandFailure(
    `Unknown command: ${command || '(none)'}\nValid commands: ${[
      ...commands.keys(),
    ].join(', ')}`,
  );
}

function runProcess(processDefinition, spawn = spawnSync) {
  const { name, args, cwd, environment } = processDefinition;
  const resolved = invocation(name, args);
  const result = spawn(resolved.name, resolved.args, {
    cwd,
    stdio: 'inherit',
    ...(environment ? { env: environment } : {}),
  });
  if (result.error) {
    throw new CommandFailure(
      `Required executable "${name}" could not be started: ${result.error.message}`,
    );
  }
  if (result.status !== 0) {
    throw new CommandFailure(
      `Command failed: ${name} ${args.join(' ')}`,
      result.status ?? 1,
    );
  }
}

function execute(command, options = {}) {
  const definition = commands.get(command);
  if (!definition) {
    throw unknownCommand(command);
  }

  definition.steps.forEach((step, index) => {
    const log = options.log ?? console.log;
    log(`[${index + 1}/${definition.steps.length}] ${step.label}`);
    if (step.command) execute(step.command, options);
    else runProcess(step.process, options.spawn);
  });
}

function printHelp(log = console.log) {
  log('Canonical repository commands:');
  for (const [name, definition] of commands) {
    log(`  ${name.padEnd(30)} ${definition.description}`);
  }
  log('');
  log('Usage: npm run repo -- <command> [category]');
  log('Validation, build, and test commands never start infrastructure.');
  log('Formatting commands without "check" intentionally modify source.');
  log('');
  log('Operational compatibility commands: doctor, bootstrap, dev, storybook, stop, lint, migrate, reset-db, health, export-permissions');
}

async function executeOperational(command, args, options = {}) {
  const spawn = options.spawn ?? spawnSync;
  const run = (name, commandArgs, cwd = repositoryRoot) =>
    runProcess({ name, args: commandArgs, cwd }, spawn);

  switch (command) {
    case 'doctor':
      run(process.execPath, ['scripts/verify-prerequisites.cjs']);
      return true;
    case 'bootstrap':
      run('npm', ['ci']);
      run('npm', ['ci'], frontendRoot);
      run('dotnet', ['restore', backendSolution]);
      return true;
    case 'dev':
      run('docker', [...compose, 'up', '--build', '--detach', '--wait']);
      return true;
    case 'storybook':
      run('npm', ['run', 'storybook'], frontendRoot);
      return true;
    case 'stop':
      run('docker', [...compose, 'down']);
      return true;
    case 'lint':
      execute('validate repo', options);
      run('npm', ['run', 'lint'], frontendRoot);
      run('npm', ['run', 'backend:format:check']);
      return true;
    case 'migrate':
      run('docker', [
        ...compose,
        'up',
        '--build',
        '--exit-code-from',
        'database-migrations',
        'database-migrations',
      ]);
      return true;
    case 'reset-db':
      if (!args.includes('--force')) {
        throw new CommandFailure(
          'reset-db removes the named Proprium PostgreSQL volume. Re-run with --force to confirm.',
        );
      }
      run('docker', [...compose, 'down', '--volumes']);
      run('docker', [...compose, 'up', '--build', '--detach', '--wait']);
      return true;
    case 'health':
      for (const url of [
        'http://localhost:8080/api/v1/health/live',
        'http://localhost:8080/api/v1/health/ready',
        'http://localhost:3000/health',
      ]) {
        const response = await fetch(url);
        if (!response.ok) {
          throw new CommandFailure(`${url} returned HTTP ${response.status}.`);
        }
        console.log(`${url} is healthy.`);
      }
      return true;
    case 'export-permissions':
      run('dotnet', [
        'run',
        '--project',
        'services/api/Proprium.Api',
        '--',
        '--export-permissions',
        '../permissions.json',
      ]);
      return true;
    default:
      return false;
  }
}

async function main(argv = process.argv.slice(2), options = {}) {
  if (argv.length === 0 || argv[0] === 'help' || argv[0] === '--help') {
    printHelp(options.log);
    return 0;
  }

  const twoPart = argv.slice(0, 2).join(' ');
  const onePart = argv[0];
  const command =
    argv.length >= 2 && commands.has(twoPart) ? twoPart : onePart;
  const consumed = argv.length >= 2 && command === twoPart ? 2 : 1;

  if (commands.has(command)) {
    const hasCategories = [...commands.keys()].some((name) =>
      name.startsWith(`${onePart} `),
    );
    if (
      command === onePart &&
      hasCategories &&
      argv.length > 1 &&
      !argv[1].startsWith('-')
    ) {
      throw unknownCommand(argv.join(' '));
    }
    if (argv.length !== consumed) {
      throw new CommandFailure(
        `Unexpected arguments for "${command}": ${argv.slice(consumed).join(' ')}`,
      );
    }
    execute(command, options);
    return 0;
  }

  if (await executeOperational(onePart, argv.slice(1), options)) return 0;
  throw unknownCommand(argv.join(' '));
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = error.exitCode ?? 1;
  });
}

module.exports = { CommandFailure, commands, execute, main, printHelp };
