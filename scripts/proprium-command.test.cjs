const assert = require('node:assert/strict');
const { test } = require('node:test');

const {
  CommandFailure,
  commands,
  execute,
  main,
} = require('./proprium-command.cjs');

function recorder(statuses = []) {
  const calls = [];
  return {
    calls,
    spawn(name, args, options) {
      calls.push({
        name,
        args,
        cwd: options.cwd,
        stdio: options.stdio,
        env: options.env,
      });
      return { status: statuses[calls.length - 1] ?? 0 };
    },
  };
}

function npmArguments(call) {
  return call.args[0]?.endsWith('npm-cli.js') ? call.args.slice(1) : call.args;
}

test('canonical command surface contains the GP-13 contract', () => {
  assert.deepEqual(
    [...commands.keys()],
    [
      'validate repo',
      'validate documentation',
      'validate qualification',
      'validate baseline',
      'validate frontend',
      'validate test-classification',
      'validate backend',
      'validate docker',
      'validate openapi',
      'validate',
      'format frontend',
      'format backend',
      'format check',
      'format',
      'build frontend',
      'build backend',
      'build',
      'test unit',
      'test architecture',
      'test',
    ],
  );
});

test('root validation dispatches repository, frontend, then backend', () => {
  const recorded = recorder();
  execute('validate', { spawn: recorded.spawn, log() {} });

  assert.equal(recorded.calls.length, 9);
  assert.deepEqual(npmArguments(recorded.calls[0]), [
    'run',
    'validate:repository',
  ]);
  assert.deepEqual(npmArguments(recorded.calls[1]), [
    'run',
    'validate:documentation',
  ]);
  assert.deepEqual(npmArguments(recorded.calls[2]), [
    'run',
    'validate:baseline',
  ]);
  assert.deepEqual(npmArguments(recorded.calls[3]), [
    'run',
    'validate:frontend',
  ]);
  assert.deepEqual(npmArguments(recorded.calls[4]), [
    'run',
    'backend:format:check',
  ]);
  assert.deepEqual(npmArguments(recorded.calls.at(-1)), [
    'run',
    'validate:backend-test-classification',
  ]);
  assert.ok(recorded.calls.every((call) => call.stdio === 'inherit'));
});

test('the single-word validate command is accepted by the CLI', async () => {
  const recorded = recorder();
  assert.equal(
    await main(['validate'], { spawn: recorded.spawn, log() {} }),
    0,
  );
  assert.equal(recorded.calls.length, 9);
});

test('a child failure propagates and stops grouped validation', () => {
  const recorded = recorder([0, 23]);

  assert.throws(
    () => execute('validate', { spawn: recorded.spawn, log() {} }),
    (error) => error instanceof CommandFailure && error.exitCode === 23,
  );
  assert.equal(recorded.calls.length, 2);
});

test('a missing tool fails closed with an actionable diagnostic', () => {
  assert.throws(
    () =>
      execute('validate repo', {
        spawn() {
          return { error: new Error('ENOENT') };
        },
        log() {},
      }),
    /Required executable "npm" could not be started: ENOENT/,
  );
});

test('unknown commands and unsupported arguments return failures', async () => {
  await assert.rejects(
    () => main(['validate', 'future']),
    /Unknown command: validate future\nValid commands: validate repo/,
  );
  await assert.rejects(
    () => main(['validate', 'frontend', '--skip-lint']),
    /Unexpected arguments/,
  );
});

test('format check is non-mutating while format uses explicit write commands', () => {
  const checked = recorder();
  execute('format check', { spawn: checked.spawn, log() {} });
  assert.deepEqual(
    checked.calls.map(npmArguments),
    [
      ['run', 'format:check'],
      ['run', 'backend:format:check'],
    ],
  );

  const formatted = recorder();
  execute('format', { spawn: formatted.spawn, log() {} });
  assert.deepEqual(
    formatted.calls.map(npmArguments),
    [
      ['run', 'format'],
      ['run', 'backend:format'],
    ],
  );
});

test('unit and architecture test categories remain separate', () => {
  const unit = recorder();
  execute('test unit', { spawn: unit.spawn, log() {} });
  assert.deepEqual(
    unit.calls.map(npmArguments),
    [['test'], ['run', 'backend:test:unit']],
  );

  const architecture = recorder();
  execute('test architecture', { spawn: architecture.spawn, log() {} });
  assert.deepEqual(npmArguments(architecture.calls[0]), [
    'run',
    'backend:test:architecture',
  ]);
});

test('frontend builds use the production mode required by Next.js', () => {
  const recorded = recorder();
  execute('build frontend', { spawn: recorded.spawn, log() {} });
  assert.equal(recorded.calls[0].env.NODE_ENV, 'production');
});

test('Docker and OpenAPI validation remain focused canonical domains', () => {
  const docker = recorder();
  execute('validate docker', { spawn: docker.spawn, log() {} });
  assert.deepEqual(
    docker.calls.map((call) => call.args),
    [
      ['compose', '-f', 'docker-compose.proprium.yml', 'config', '--quiet'],
      ['compose', '-f', 'docker-compose.proprium.yml', 'build'],
    ],
  );

  const openapi = recorder();
  execute('validate openapi', { spawn: openapi.spawn, log() {} });
  assert.deepEqual(npmArguments(openapi.calls[0]), [
    'run',
    'validate:openapi',
  ]);
});

test('doctor delegates to the repository-owned prerequisite verifier', async () => {
  const recorded = recorder();
  assert.equal(await main(['doctor'], { spawn: recorded.spawn, log() {} }), 0);
  assert.equal(recorded.calls.length, 1);
  assert.equal(recorded.calls[0].name, process.execPath);
  assert.deepEqual(recorded.calls[0].args, ['scripts/verify-prerequisites.cjs']);
});
