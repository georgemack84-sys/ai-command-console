#!/usr/bin/env node

const { URL } = require("node:url");

function getEnv(name, fallback = "") {
  const value = process.env[name];
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function getPositiveInteger(name, fallback) {
  const raw = getEnv(name, "");
  if (!raw) {
    return fallback;
  }

  const value = Number.parseInt(raw, 10);
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive integer`);
  }

  return value;
}

function normalizeBaseUrl() {
  const baseUrl = getEnv("DEPLOY_HEALTHCHECK_URL", "http://127.0.0.1:3000");
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

function normalizePaths() {
  const raw = getEnv("DEPLOY_VALIDATION_PATHS", "/api/health,/api/ready,/auth");
  const paths = raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => (value.startsWith("/") ? value : `/${value}`));

  if (paths.length === 0) {
    throw new Error("DEPLOY_VALIDATION_PATHS must include at least one path");
  }

  return paths;
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPath(baseUrl, path) {
  const url = new URL(path, `${baseUrl}/`).toString();
  const response = await fetch(url, {
    headers: {
      "user-agent": "ai-command-console-deploy-validator",
    },
  });

  const body = await response.text();
  return {
    url,
    ok: response.ok,
    status: response.status,
    body: body.slice(0, 400),
  };
}

async function main() {
  const attempts = getPositiveInteger("DEPLOY_HEALTHCHECK_ATTEMPTS", 12);
  const delaySeconds = getPositiveInteger("DEPLOY_HEALTHCHECK_DELAY_SECONDS", 10);
  const baseUrl = normalizeBaseUrl();
  const paths = normalizePaths();

  console.log(`Validating deployment at ${baseUrl}`);
  console.log(`Paths: ${paths.join(", ")}`);

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    let allPassed = true;

    for (const path of paths) {
      try {
        const result = await fetchPath(baseUrl, path);
        if (!result.ok) {
          allPassed = false;
          console.log(`[attempt ${attempt}/${attempts}] ${result.url} -> ${result.status}`);
          if (result.body) {
            console.log(result.body);
          }
          break;
        }

        console.log(`[attempt ${attempt}/${attempts}] ${result.url} -> ${result.status}`);
      } catch (error) {
        allPassed = false;
        const message = error instanceof Error ? error.message : String(error);
        console.log(`[attempt ${attempt}/${attempts}] ${baseUrl}${path} -> ${message}`);
        break;
      }
    }

    if (allPassed) {
      console.log("Deployment validation passed");
      return;
    }

    if (attempt < attempts) {
      console.log(`Retrying in ${delaySeconds}s`);
      await sleep(delaySeconds * 1000);
    }
  }

  throw new Error(`Deployment validation failed after ${attempts} attempts`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
