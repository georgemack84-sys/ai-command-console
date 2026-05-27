#!/usr/bin/env node

const fs = require("fs");
const { spawn, spawnSync } = require("child_process");
const path = require("path");

const [, , command = "dev", ...args] = process.argv;
const root = process.cwd();
const devLifecycleDir = path.join(root, ".next", "dev", "ai-command-console");
const devPidFile = path.join(devLifecycleDir, "dev-server.json");

function ensureDir(targetPath) {
  fs.mkdirSync(targetPath, { recursive: true });
}

function removePath(targetPath) {
  try {
    fs.rmSync(targetPath, { recursive: true, force: true });
    return true;
  } catch {
    return false;
  }
}

function pruneDevRuntimeArtifacts() {
  const removed = [];
  const candidates = [
    path.join(root, ".next", "dev", "cache", "turbopack"),
    path.join(root, ".next", "dev", "logs"),
    path.join(root, ".next", "diagnostics"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && removePath(candidate)) {
      removed.push(path.relative(root, candidate));
    }
  }

  const nextRoot = path.join(root, ".next");
  if (fs.existsSync(nextRoot)) {
    for (const entry of fs.readdirSync(nextRoot)) {
      if (/^_events_\d+\.json$/i.test(entry)) {
        const candidate = path.join(nextRoot, entry);
        if (removePath(candidate)) {
          removed.push(path.relative(root, candidate));
        }
      }
    }
  }

  return removed;
}

function readJsonFile(targetPath) {
  try {
    return JSON.parse(fs.readFileSync(targetPath, "utf8"));
  } catch {
    return null;
  }
}

function writeJsonFile(targetPath, value) {
  ensureDir(path.dirname(targetPath));
  fs.writeFileSync(targetPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function removeFile(targetPath) {
  try {
    fs.rmSync(targetPath, { force: true });
  } catch {}
}

function parseDevPort(argv) {
  for (let index = 0; index < argv.length; index += 1) {
    const current = String(argv[index] || "");
    const next = String(argv[index + 1] || "");
    if (current === "--port" || current === "-p") {
      const value = Number(next);
      if (Number.isFinite(value) && value > 0) {
        return Math.floor(value);
      }
    }
    if (current.startsWith("--port=")) {
      const value = Number(current.slice("--port=".length));
      if (Number.isFinite(value) && value > 0) {
        return Math.floor(value);
      }
    }
  }
  return 3000;
}

function listListeningPids(port) {
  if (process.platform !== "win32") {
    return [];
  }

  const command = `netstat -ano -p tcp | findstr LISTENING | findstr :${port}`;
  const result = spawnSync("cmd.exe", ["/c", command], { encoding: "utf8", stdio: "pipe" });
  if ((result.status ?? 1) !== 0 || !result.stdout) {
    return [];
  }

  return Array.from(
    new Set(
      result.stdout
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => Number(line.split(/\s+/).at(-1)))
        .filter((pid) => Number.isFinite(pid) && pid > 0),
    ),
  );
}

function processExists(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function terminateProcessTree(pid) {
  if (!Number.isFinite(pid) || pid <= 0) {
    return false;
  }

  if (process.platform === "win32") {
    const result = spawnSync("taskkill", ["/PID", String(pid), "/T", "/F"], { stdio: "ignore" });
    return (result.status ?? 1) === 0;
  }

  try {
    process.kill(pid, "SIGTERM");
    return true;
  } catch {
    return false;
  }
}

function prelaunchDevPortHygiene(port) {
  const previous = readJsonFile(devPidFile);
  const report = {
    port,
    clearedPids: [],
    blockedPids: [],
    previous,
  };

  const priorPid = Number(previous?.childPid || 0);
  if (priorPid > 0 && processExists(priorPid)) {
    const listeningPids = listListeningPids(port);
    if (listeningPids.includes(priorPid) && terminateProcessTree(priorPid)) {
      report.clearedPids.push(priorPid);
    }
  }

  removeFile(devPidFile);
  report.blockedPids = listListeningPids(port).filter((pid) => !report.clearedPids.includes(pid));
  return report;
}

function resolveTsxCli() {
  try {
    return require.resolve("tsx/cli");
  } catch {
    return require.resolve("tsx/dist/cli.mjs");
  }
}

function runProductionStartupChecks() {
  const preflight = spawnSync(process.execPath, [path.join(__dirname, "preflight.cjs")], {
    stdio: "inherit",
    env: process.env,
  });

  if ((preflight.status ?? 1) !== 0) {
    process.exit(preflight.status ?? 1);
  }

  const startupGovernor = spawnSync(process.execPath, [resolveTsxCli(), path.join(__dirname, "startup-governor.ts")], {
    stdio: "inherit",
    env: process.env,
  });

  if ((startupGovernor.status ?? 1) !== 0) {
    process.exit(startupGovernor.status ?? 1);
  }
}

function normalizeStandaloneRuntimePath(name) {
  const configured = process.env[name];
  if (typeof configured === "string" && configured.trim() && !path.isAbsolute(configured)) {
    process.env[name] = path.resolve(root, configured);
  }
}

function normalizeStandaloneRuntimePaths() {
  normalizeStandaloneRuntimePath("AI_COMMAND_CONSOLE_DATA_ROOT");
  normalizeStandaloneRuntimePath("AI_COMMAND_CONSOLE_DATABASE_PATH");
  normalizeStandaloneRuntimePath("AI_COMMAND_CONSOLE_AGENTS_DATABASE_PATH");
}

if (command === "dev") {
  process.env.NODE_ENV = "development";
  process.env.AI_COMMAND_CONSOLE_DEV = "1";
  process.env.AI_COMMAND_CONSOLE_DEV_ROOT = root;
  process.env.AI_COMMAND_CONSOLE_DEV_PORT = String(parseDevPort(args));
} else {
  process.env.NODE_ENV = "production";
}

if (command === "standalone") {
  normalizeStandaloneRuntimePaths();
}

if (command === "start" || command === "standalone") {
  runProductionStartupChecks();
}

if (command === "standalone") {
  const standaloneServer = path.join(root, ".next", "standalone", "server.js");
  if (!fs.existsSync(standaloneServer)) {
    console.error("Standalone server not found. Run `npm run build` before `npm run start:standalone`.");
    process.exit(1);
  }

  const result = spawnSync(process.execPath, [standaloneServer, ...args], {
    stdio: "inherit",
    env: process.env,
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  process.exit(result.status ?? 0);
}

if (command === "dev") {
  if (process.env.AI_COMMAND_CONSOLE_PRESERVE_DEV_CACHE !== "1") {
    const removed = pruneDevRuntimeArtifacts();
    if (removed.length) {
      console.log(`Dev cleanup: pruned stale runtime artifacts (${removed.join(", ")}).`);
    }
  }
  console.log("Dev note: run `npm run dev:doctor` if Prisma-backed routes fail or local auth cannot connect to Postgres.");
}

const nextBin = require.resolve("next/dist/bin/next");
const nextArgs = command === "dev" ? [command, "--webpack", ...args] : [command, ...args];

if (command === "dev") {
  const port = parseDevPort(args);
  const hygiene = prelaunchDevPortHygiene(port);
  if (hygiene.clearedPids.length) {
    console.log(`Dev port guard: cleared stale dev process(es) on port ${port} (${hygiene.clearedPids.join(", ")}).`);
  }
  if (hygiene.blockedPids.length) {
    console.warn(
      `Dev port guard: port ${port} is already in use by non-owned process(es): ${hygiene.blockedPids.join(", ")}.`,
    );
  }

  ensureDir(devLifecycleDir);
  const child = spawn(process.execPath, [nextBin, ...nextArgs], {
    stdio: "inherit",
    env: process.env,
  });

  writeJsonFile(devPidFile, {
    command: "next-dev",
    port,
    root,
    parentPid: process.pid,
    childPid: child.pid,
    startedAt: new Date().toISOString(),
    owned: true,
    envTag: process.env.AI_COMMAND_CONSOLE_DEV,
  });

  const cleanup = () => {
    removeFile(devPidFile);
  };

  const forwardSignal = (signal) => {
    if (child.exitCode == null && child.signalCode == null) {
      try {
        child.kill(signal);
      } catch {}
    }
  };

  process.on("SIGINT", () => forwardSignal("SIGINT"));
  process.on("SIGTERM", () => forwardSignal("SIGTERM"));
  process.on("exit", cleanup);

  child.on("error", (error) => {
    cleanup();
    console.error(error.message);
    process.exit(1);
  });

  child.on("exit", (code) => {
    cleanup();
    process.exit(code ?? 0);
  });

  return;
}

const result = spawnSync(process.execPath, [nextBin, ...nextArgs], {
  stdio: "inherit",
  env: process.env,
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 0);
