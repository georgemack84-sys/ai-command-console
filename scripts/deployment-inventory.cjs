#!/usr/bin/env node

const environments = {
  staging: {
    variables: [
      "DEPLOY_HOST",
      "DEPLOY_PORT",
      "DEPLOY_USER",
      "DEPLOY_PATH",
      "DEPLOY_RESTART_COMMAND",
      "DEPLOY_HEALTHCHECK_URL",
      "DEPLOY_HEALTHCHECK_PATH",
      "DEPLOY_HEALTHCHECK_ATTEMPTS",
      "DEPLOY_HEALTHCHECK_DELAY_SECONDS",
      "DEPLOY_VALIDATION_PATHS",
      "DEPLOY_RELEASE_RETENTION",
      "DEPLOY_ARTIFACT_ONLY",
    ],
    secrets: ["DEPLOY_SSH_KEY"],
    appEnv: [
      "AI_COMMAND_CONSOLE_AUTH_SECRET",
      "AI_COMMAND_CONSOLE_STORAGE_DRIVER",
      "AI_COMMAND_CONSOLE_DATABASE_PATH",
      "AI_COMMAND_CONSOLE_AGENTS_DATABASE_PATH",
      "AI_COMMAND_CONSOLE_SECURE_COOKIES",
      "AI_COMMAND_CONSOLE_SESSION_MAX_AGE_SECONDS",
      "AI_COMMAND_CONSOLE_ALERT_WEBHOOK_URL",
      "AI_COMMAND_CONSOLE_ALERT_WEBHOOK_SEVERITIES",
      "AI_COMMAND_CONSOLE_ALERT_WEBHOOK_THROTTLE_SECONDS",
    ],
  },
  production: {
    variables: [
      "DEPLOY_HOST",
      "DEPLOY_PORT",
      "DEPLOY_USER",
      "DEPLOY_PATH",
      "DEPLOY_RESTART_COMMAND",
      "DEPLOY_HEALTHCHECK_URL",
      "DEPLOY_HEALTHCHECK_PATH",
      "DEPLOY_HEALTHCHECK_ATTEMPTS",
      "DEPLOY_HEALTHCHECK_DELAY_SECONDS",
      "DEPLOY_VALIDATION_PATHS",
      "DEPLOY_RELEASE_RETENTION",
    ],
    secrets: ["DEPLOY_SSH_KEY"],
    appEnv: [
      "AI_COMMAND_CONSOLE_AUTH_SECRET",
      "AI_COMMAND_CONSOLE_STORAGE_DRIVER",
      "AI_COMMAND_CONSOLE_DATABASE_PATH",
      "AI_COMMAND_CONSOLE_AGENTS_DATABASE_PATH",
      "AI_COMMAND_CONSOLE_SECURE_COOKIES",
      "AI_COMMAND_CONSOLE_SESSION_MAX_AGE_SECONDS",
      "AI_COMMAND_CONSOLE_ALERT_WEBHOOK_URL",
      "AI_COMMAND_CONSOLE_ALERT_WEBHOOK_SEVERITIES",
      "AI_COMMAND_CONSOLE_ALERT_WEBHOOK_THROTTLE_SECONDS",
    ],
  },
};

const target = (process.argv[2] || "all").toLowerCase();
const selected = target === "all" ? Object.keys(environments) : [target];

const missing = selected.filter((name) => !environments[name]);
if (missing.length) {
  console.error(`Unknown environment: ${missing.join(", ")}`);
  process.exit(1);
}

for (const name of selected) {
  const config = environments[name];
  console.log(`## ${name}`);
  console.log("");
  console.log("Variables:");
  for (const variable of config.variables) {
    console.log(`- ${variable}`);
  }
  console.log("");
  console.log("Secrets:");
  for (const secret of config.secrets) {
    console.log(`- ${secret}`);
  }
  console.log("");
  console.log("App environment:");
  for (const variable of config.appEnv) {
    console.log(`- ${variable}`);
  }
  console.log("");
}
