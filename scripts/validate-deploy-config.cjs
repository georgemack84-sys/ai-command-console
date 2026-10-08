#!/usr/bin/env node

function readEnv(name) {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}

function isTruthy(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

function isPostgresConnectionUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "postgresql:" || url.protocol === "postgres:";
  } catch {
    return false;
  }
}

function validateDeployConfig() {
  const targetEnvironment = readEnv("DEPLOY_TARGET_ENVIRONMENT") || "staging";
  const artifactOnly = isTruthy(readEnv("DEPLOY_ARTIFACT_ONLY"));

  const requiredRemoteSettings = [
    "DEPLOY_HOST",
    "DEPLOY_USER",
    "DEPLOY_PATH",
    "DEPLOY_SSH_KEY",
    "DEPLOY_DATABASE_URL",
  ];

  const optionalRecommendedSettings = [
    "DEPLOY_RESTART_COMMAND",
    "DEPLOY_HEALTHCHECK_URL",
  ];

  const missingRequired = [];
  const invalidRequired = [];
  const warnings = [];

  if (!artifactOnly) {
    for (const setting of requiredRemoteSettings) {
      if (!readEnv(setting)) {
        missingRequired.push(setting);
      }
    }

    const databaseUrl = readEnv("DEPLOY_DATABASE_URL");
    if (databaseUrl && !isPostgresConnectionUrl(databaseUrl)) {
      invalidRequired.push("DEPLOY_DATABASE_URL");
    }
  }

  for (const setting of optionalRecommendedSettings) {
    if (!readEnv(setting)) {
      warnings.push(`${setting} is not configured.`);
    }
  }

  if (targetEnvironment === "production" && artifactOnly) {
    missingRequired.push("DEPLOY_ARTIFACT_ONLY cannot be enabled for production deploys.");
  }

  const ok = missingRequired.length === 0 && invalidRequired.length === 0;

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
        ...(setting === "DEPLOY_DATABASE_URL" && readEnv(setting)
          ? { valid: isPostgresConnectionUrl(readEnv(setting)) }
          : {}),
      })),
    },
    warnings,
    problems: missingRequired.map((item) =>
      item.startsWith("DEPLOY_ARTIFACT_ONLY")
        ? item
        : `${item} must be configured for ${targetEnvironment} deployment.`,
    ).concat(
      invalidRequired.map(
        (item) => `${item} must begin with postgresql:// or postgres://; use only the connection-string value, without DATABASE_URL= or quotes.`,
      ),
    ),
  };
}

const report = validateDeployConfig();
const output = JSON.stringify(report, null, 2);

if (!report.ok) {
  console.error(output);
  process.exit(1);
}

console.log(output);
