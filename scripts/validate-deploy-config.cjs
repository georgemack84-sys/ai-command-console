#!/usr/bin/env node

function readEnv(name) {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}

function isTruthy(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

const placeholderValues = new Set([
  "your-host",
  "your-path",
  "your-restart-command",
  "your-user",
]);

function isPlaceholderValue(value) {
  return placeholderValues.has(String(value || "").trim().toLowerCase());
}

function validateDeployConfig() {
  const targetEnvironment = readEnv("DEPLOY_TARGET_ENVIRONMENT") || "staging";
  const artifactOnly = isTruthy(readEnv("DEPLOY_ARTIFACT_ONLY"));

  const requiredRemoteSettings = [
    "DEPLOY_HOST",
    "DEPLOY_USER",
    "DEPLOY_PATH",
    "DEPLOY_SSH_KEY",
  ];

  const optionalRecommendedSettings = [
    "DEPLOY_RESTART_COMMAND",
    "DEPLOY_HEALTHCHECK_URL",
  ];

  const missingRequired = [];
  const warnings = [];

  if (!artifactOnly) {
    for (const setting of requiredRemoteSettings) {
      if (!readEnv(setting)) {
        missingRequired.push(setting);
      } else if (isPlaceholderValue(readEnv(setting))) {
        missingRequired.push(`${setting} cannot use placeholder value '${readEnv(setting)}'.`);
      }
    }
  }

  for (const setting of optionalRecommendedSettings) {
    if (!readEnv(setting)) {
      warnings.push(`${setting} is not configured.`);
    } else if (!artifactOnly && isPlaceholderValue(readEnv(setting))) {
      warnings.push(`${setting} still uses placeholder value '${readEnv(setting)}'.`);
    }
  }

  if (targetEnvironment === "production" && artifactOnly) {
    missingRequired.push("DEPLOY_ARTIFACT_ONLY cannot be enabled for production deploys.");
  }

  const ok = missingRequired.length === 0;

  return {
    ok,
    checkedAt: new Date().toISOString(),
    targetEnvironment,
    artifactOnly,
    checks: {
      remoteDeploymentConfigured: !artifactOnly,
      requiredRemoteSettings: requiredRemoteSettings.map((setting) => ({
        name: setting,
        configured: Boolean(readEnv(setting)),
        required: !artifactOnly,
      })),
    },
    warnings,
    problems: missingRequired.map((item) =>
      item.startsWith("DEPLOY_ARTIFACT_ONLY")
        || item.includes(" cannot use placeholder value ")
        ? item
        : `${item} must be configured for ${targetEnvironment} deployment.`,
    ),
  };
}

module.exports = { validateDeployConfig };

if (require.main === module) {
  const report = validateDeployConfig();
  const output = JSON.stringify(report, null, 2);

  if (!report.ok) {
    console.error(output);
    process.exit(1);
  }

  console.log(output);
}
