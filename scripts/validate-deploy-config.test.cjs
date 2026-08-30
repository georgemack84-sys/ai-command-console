const assert = require("node:assert/strict");
const test = require("node:test");

const { validateDeployConfig } = require("./validate-deploy-config.cjs");

const managedKeys = [
  "DEPLOY_ARTIFACT_ONLY",
  "DEPLOY_HOST",
  "DEPLOY_PATH",
  "DEPLOY_RESTART_COMMAND",
  "DEPLOY_SSH_KEY",
  "DEPLOY_TARGET_ENVIRONMENT",
  "DEPLOY_USER",
];

function withEnv(values, callback) {
  const previous = new Map(managedKeys.map((key) => [key, process.env[key]]));

  for (const key of managedKeys) {
    delete process.env[key];
  }

  Object.assign(process.env, values);

  try {
    return callback();
  } finally {
    for (const key of managedKeys) {
      const value = previous.get(key);
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

test("allows artifact-only staging to keep remote placeholders inert", () => {
  const report = withEnv({
    DEPLOY_ARTIFACT_ONLY: "true",
    DEPLOY_HOST: "your-host",
    DEPLOY_PATH: "your-path",
    DEPLOY_TARGET_ENVIRONMENT: "staging",
    DEPLOY_USER: "your-user",
  }, () => validateDeployConfig());

  assert.equal(report.ok, true);
  assert.equal(report.artifactOnly, true);
  assert.equal(report.checks.remoteDeploymentConfigured, false);
});

test("rejects placeholder values when staging remote deploy is enabled", () => {
  const report = withEnv({
    DEPLOY_ARTIFACT_ONLY: "false",
    DEPLOY_HOST: "your-host",
    DEPLOY_PATH: "your-path",
    DEPLOY_RESTART_COMMAND: "your-restart-command",
    DEPLOY_SSH_KEY: "present",
    DEPLOY_TARGET_ENVIRONMENT: "staging",
    DEPLOY_USER: "your-user",
  }, () => validateDeployConfig());

  assert.equal(report.ok, false);
  assert.match(report.problems.join("\n"), /DEPLOY_HOST cannot use placeholder value 'your-host'\./);
  assert.match(report.problems.join("\n"), /DEPLOY_PATH cannot use placeholder value 'your-path'\./);
  assert.match(report.problems.join("\n"), /DEPLOY_USER cannot use placeholder value 'your-user'\./);
  assert.match(report.warnings.join("\n"), /DEPLOY_RESTART_COMMAND still uses placeholder value 'your-restart-command'\./);
});
