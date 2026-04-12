const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const content = fs.readFileSync(filePath, "utf8");
  const entries = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const equalsIndex = line.indexOf("=");
    if (equalsIndex < 0) {
      continue;
    }

    const key = line.slice(0, equalsIndex).trim();
    const value = line.slice(equalsIndex + 1).trim();
    if (key) {
      entries[key] = value;
    }
  }

  return entries;
}

function resolveDataRoot(projectRoot) {
  const envPath = path.join(projectRoot, ".env");
  const envEntries = readEnvFile(envPath);
  const configured =
    process.env.AI_COMMAND_CONSOLE_DATA_ROOT ||
    envEntries.AI_COMMAND_CONSOLE_DATA_ROOT ||
    "./data";

  return path.resolve(projectRoot, configured);
}

function getGitStatus(projectRoot) {
  const result = spawnSync(
    "git",
    ["status", "--short", "--", "data", "agents", "memory", "logs"],
    {
      cwd: projectRoot,
      encoding: "utf8",
    },
  );

  if (result.error) {
    return { ok: false, error: result.error.message, lines: [] };
  }

  if (result.status !== 0) {
    return {
      ok: false,
      error: (result.stderr || result.stdout || "git status failed").trim(),
      lines: [],
    };
  }

  const lines = result.stdout
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean);

  return { ok: true, error: null, lines };
}

function normalizeRelativePath(statusLine) {
  return statusLine.slice(3).trim().replace(/\s+->\s+/g, "__RENAMED_TO__");
}

function sanitizeForWindowsPath(value) {
  return value.replace(/[<>:"/\\|?*]/g, "_");
}

function copyFileWithParents(sourcePath, destinationPath) {
  fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
  fs.copyFileSync(sourcePath, destinationPath);
}

function copyEntryWithParents(sourcePath, destinationPath) {
  const stat = fs.statSync(sourcePath);
  if (stat.isDirectory()) {
    fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
    fs.cpSync(sourcePath, destinationPath, { recursive: true });
    return;
  }

  copyFileWithParents(sourcePath, destinationPath);
}

function printSection(title, lines) {
  console.log(title);
  for (const line of lines) {
    console.log(line);
  }
  console.log("");
}

function main() {
  const projectRoot = process.cwd();
  const runtimeDataRoot = resolveDataRoot(projectRoot);
  const archiveRoot = path.join(projectRoot, ".codex-temp", "legacy-state-archive");
  const gitStatus = getGitStatus(projectRoot);

  if (!gitStatus.ok) {
    printSection("=== Legacy State Archive ===", [
      `Unable to inspect git status: ${gitStatus.error}`,
    ]);
    process.exitCode = 1;
    return;
  }

  if (!gitStatus.lines.length) {
    printSection("=== Legacy State Archive ===", [
      "No dirty tracked legacy state files were found under data/, agents/, memory/, or logs/.",
      "Nothing was archived.",
    ]);
    return;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const archiveDir = path.join(archiveRoot, timestamp);
  const copied = [];
  const missing = [];

  for (const line of gitStatus.lines) {
    const relativePath = normalizeRelativePath(line);
    const sourcePath = path.join(projectRoot, relativePath);

    if (!fs.existsSync(sourcePath)) {
      missing.push(relativePath);
      continue;
    }

    const destinationPath = path.join(
      archiveDir,
      sanitizeForWindowsPath(relativePath),
    );

    copyEntryWithParents(sourcePath, destinationPath);
    copied.push(relativePath);
  }

  const manifest = {
    createdAt: new Date().toISOString(),
    projectRoot,
    runtimeDataRoot,
    archiveDir,
    copied,
    missing,
    statusLines: gitStatus.lines,
  };

  fs.mkdirSync(archiveDir, { recursive: true });
  fs.writeFileSync(
    path.join(archiveDir, "manifest.json"),
    JSON.stringify(manifest, null, 2),
  );

  printSection("=== Legacy State Archive ===", [
    `Archive Dir: ${archiveDir}`,
    `Runtime Data Root: ${runtimeDataRoot}`,
    `Copied Files: ${copied.length}`,
    `Skipped Entries: ${missing.length}`,
  ]);

  if (copied.length) {
    printSection("=== Archived Files ===", copied);
  }

  if (missing.length) {
    printSection("=== Skipped Entries ===", missing);
  }

  printSection("=== Guidance ===", [
    "This script is non-destructive. It copies current dirty legacy state into an ignored archive folder.",
    "Review the archive before manually cleaning tracked files or fixture residue.",
    "Use npm run dev:state-report to compare the current repo state before and after any manual cleanup.",
  ]);
}

main();
