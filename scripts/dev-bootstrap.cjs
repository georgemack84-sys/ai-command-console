#!/usr/bin/env node

const fs = require("fs");
const net = require("net");
const path = require("path");
const { spawnSync } = require("child_process");
const dotenv = require("dotenv");
const { defaultDatabaseUrl, parseDatabaseTarget, isSafeLocalBootstrapTarget } = require("./lib/bootstrap-target.cjs");

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

function resolveDatabaseUrl() {
  return readEnv("DATABASE_URL", defaultDatabaseUrl());
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: false,
    ...options,
  });

  if (result.error) {
    throw result.error;
  }

  if ((result.status ?? 1) !== 0) {
    throw new Error(`${command} ${args.join(" ")} exited with status ${result.status ?? 1}.`);
  }
}

function isDockerAvailable() {
  const result = spawnSync("docker", ["info"], {
    stdio: "pipe",
    encoding: "utf8",
  });

  return !result.error && result.status === 0;
}

function checkPortReachable(host, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;

    function finish(ok) {
      if (settled) {
        return;
      }
      settled = true;
      socket.destroy();
      resolve(ok);
    }

    socket.setTimeout(1500);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
    socket.connect(port, host);
  });
}

function waitForPort(host, port, timeoutMs = 30_000) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    function attempt() {
      const socket = new net.Socket();
      let settled = false;

      function finish(ok) {
        if (settled) {
          return;
        }
        settled = true;
        socket.destroy();
        if (ok) {
          resolve();
          return;
        }
        if (Date.now() - startedAt >= timeoutMs) {
          reject(new Error(`Timed out waiting for ${host}:${port}.`));
          return;
        }
        setTimeout(attempt, 1000);
      }

      socket.setTimeout(1500);
      socket.once("connect", () => finish(true));
      socket.once("timeout", () => finish(false));
      socket.once("error", () => finish(false));
      socket.connect(port, host);
    }

    attempt();
  });
}

async function main() {
  const target = parseDatabaseTarget(resolveDatabaseUrl());
  const { host, port, databaseName } = target;

  console.log("Running local development bootstrap...");
  console.log(`Database target: ${host}:${port}/${databaseName}`);

  try {
    run(process.execPath, [path.join(__dirname, "dev-doctor.cjs")]);
  } catch {
    console.log("Doctor reported issues. Continuing with bootstrap steps where possible.");
  }

  if (!isSafeLocalBootstrapTarget(target)) {
    console.error(`Refusing to auto-bootstrap non-local or non-standard database target ${host}:${port}/${databaseName}.`);
    console.error(
      "Set DATABASE_URL to a local ai_command_console database, or run `npm run db:deploy` and `npm run db:seed` manually if you intend to use a shared environment.",
    );
    process.exit(1);
  }

  const databaseReachable = await checkPortReachable(host, port);

  if (!databaseReachable) {
    if (!isDockerAvailable()) {
      console.error("Docker is not available and Postgres is not reachable. Start Postgres manually, run `npm run dev:postgres:windows`, or install Docker Desktop, then rerun `npm run dev:bootstrap`.");
      process.exit(1);
    }

    console.log("Starting local Postgres container...");
    run("docker", ["compose", "up", "-d", "postgres"]);

    console.log(`Waiting for Postgres at ${host}:${port}/${databaseName}...`);
    await waitForPort(host, port);
  } else {
    console.log(`Using existing Postgres instance at ${host}:${port}/${databaseName}.`);
  }

  console.log("Applying Prisma migrations...");
  run("npm.cmd", ["run", "db:deploy"]);

  console.log("Seeding demo data...");
  run("npm.cmd", ["run", "db:seed"]);

  console.log("");
  console.log("Local bootstrap complete.");
  console.log("Next steps:");
  console.log("- Start the app with `npm run dev`");
  console.log("- Sign in with `operator@pulse.local` / `demo-password`");
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
