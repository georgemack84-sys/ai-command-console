#!/usr/bin/env node

const fs = require("fs");
const net = require("net");
const path = require("path");
const { spawnSync } = require("child_process");
const dotenv = require("dotenv");

const root = process.cwd();

for (const envFile of [".env.local", ".env"]) {
  const target = path.join(root, envFile);
  if (fs.existsSync(target)) {
    dotenv.config({ path: target, override: false });
  }
}

function readEnv(name, fallback = "") {
  const value = process.env[name];
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  return fallback;
}

function defaultDatabaseUrl() {
  return "postgresql://postgres:postgres@localhost:55432/ai_command_console?schema=public";
}

function resolveDatabaseUrl() {
  return readEnv("DATABASE_URL", defaultDatabaseUrl());
}

function resolveAuthSecret() {
  return readEnv("AI_COMMAND_CONSOLE_AUTH_SECRET", "ai-command-console-dev-only-secret");
}

function checkDockerAvailability() {
  const result = spawnSync("docker", ["info"], { stdio: "pipe", encoding: "utf8" });
  if (result.error) {
    return {
      installed: false,
      daemonReady: false,
      detail: result.error.message,
    };
  }

  return {
    installed: true,
    daemonReady: result.status === 0,
    detail: (result.stderr || result.stdout || "").trim(),
  };
}

function checkPortReachable(host, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;

    function finish(ok, detail) {
      if (settled) {
        return;
      }
      settled = true;
      socket.destroy();
      resolve({ ok, detail });
    }

    socket.setTimeout(1500);
    socket.once("connect", () => finish(true, `Connected to ${host}:${port}.`));
    socket.once("timeout", () => finish(false, `Timed out while connecting to ${host}:${port}.`));
    socket.once("error", (error) => finish(false, error.message || `Unable to connect to ${host}:${port}.`));
    socket.connect(port, host);
  });
}

async function run() {
  const databaseUrl = resolveDatabaseUrl();
  const authSecret = resolveAuthSecret();
  const warnings = [];
  const problems = [];
  const nextSteps = [];
  let database = {
    configured: true,
    url: databaseUrl,
    host: null,
    port: null,
    reachable: false,
    detail: "",
  };

  try {
    const parsed = new URL(databaseUrl);
    database.host = parsed.hostname || "localhost";
    database.port = Number(parsed.port || 5432);

    const reachability = await checkPortReachable(database.host, database.port);
    database.reachable = reachability.ok;
    database.detail = reachability.detail;

    if (!reachability.ok) {
      problems.push(`Postgres is not reachable at ${database.host}:${database.port}.`);
    }
  } catch (error) {
    database.configured = false;
    database.detail = error instanceof Error ? error.message : String(error);
    problems.push("DATABASE_URL is invalid.");
  }

  const docker = checkDockerAvailability();

  if (!readEnv("AI_COMMAND_CONSOLE_AUTH_SECRET")) {
    warnings.push("AI_COMMAND_CONSOLE_AUTH_SECRET is not set; the development fallback secret will be used.");
  }

  if (!database.reachable) {
    if (docker.installed && docker.daemonReady) {
      nextSteps.push("Start Postgres with `docker compose up -d postgres`.");
      nextSteps.push("On Windows without Docker, try `npm run dev:postgres:windows`.");
    } else if (!docker.installed) {
      nextSteps.push("Install Docker Desktop or point DATABASE_URL at a reachable Postgres instance.");
      nextSteps.push("On Windows, run `npm run dev:postgres:windows` to detect or start a native PostgreSQL service.");
    } else {
      nextSteps.push("Start Docker Desktop or point DATABASE_URL at a reachable Postgres instance.");
      nextSteps.push("On Windows, run `npm run dev:postgres:windows` to detect or start a native PostgreSQL service.");
    }
    nextSteps.push("Apply migrations with `npm run db:deploy`.");
    nextSteps.push("Seed local demo data with `npm run db:seed`.");
  }

  const report = {
    ok: problems.length === 0,
    checkedAt: new Date().toISOString(),
    appUrl: readEnv("NEXT_PUBLIC_APP_URL", "http://localhost:5050"),
    database,
    authSecretConfigured: Boolean(readEnv("AI_COMMAND_CONSOLE_AUTH_SECRET")),
    authSecretLength: authSecret.length,
    docker,
    warnings,
    problems,
    nextSteps,
  };

  const output = JSON.stringify(report, null, 2);

  if (report.ok) {
    console.log(output);
    return;
  }

  console.error(output);
  process.exitCode = 1;
}

void run();
