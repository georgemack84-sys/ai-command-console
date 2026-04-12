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

function summarizeLines(lines) {
  const summary = {
    modified: 0,
    untracked: 0,
    added: 0,
    deleted: 0,
    renamed: 0,
    others: 0,
  };

  for (const line of lines) {
    const code = line.slice(0, 2);
    if (code.includes("M")) {
      summary.modified += 1;
    } else if (code === "??") {
      summary.untracked += 1;
    } else if (code.includes("A")) {
      summary.added += 1;
    } else if (code.includes("D")) {
      summary.deleted += 1;
    } else if (code.includes("R")) {
      summary.renamed += 1;
    } else {
      summary.others += 1;
    }
  }

  return summary;
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
  const legacyTestRuntimeRoot = path.join(projectRoot, ".codex-temp", "legacy-test-runtime");
  const gitStatus = getGitStatus(projectRoot);

  printSection("=== Runtime State Report ===", [
    `Project Root: ${projectRoot}`,
    `Runtime Data Root: ${runtimeDataRoot}`,
    `Legacy Test Runtime Root: ${legacyTestRuntimeRoot}`,
    `Runtime Data Root Exists: ${fs.existsSync(runtimeDataRoot) ? "Yes" : "No"}`,
    `Legacy Test Runtime Root Exists: ${fs.existsSync(legacyTestRuntimeRoot) ? "Yes" : "No"}`,
  ]);

  if (!gitStatus.ok) {
    printSection("=== Tracked Legacy State ===", [
      `Unable to inspect git status: ${gitStatus.error}`,
    ]);
    process.exitCode = 1;
    return;
  }

  const summary = summarizeLines(gitStatus.lines);
  printSection("=== Tracked Legacy State ===", [
    `Modified: ${summary.modified}`,
    `Untracked: ${summary.untracked}`,
    `Added: ${summary.added}`,
    `Deleted: ${summary.deleted}`,
    `Renamed: ${summary.renamed}`,
    `Other: ${summary.others}`,
  ]);

  if (!gitStatus.lines.length) {
    printSection("=== Details ===", ["No tracked legacy state files are currently dirty."]);
    return;
  }

  printSection("=== Details ===", gitStatus.lines);
  printSection("=== Guidance ===", [
    "Mutable local runtime state should live under AI_COMMAND_CONSOLE_DATA_ROOT, not under tracked repo fixtures.",
    "If tracked data files are still dirty here, they are likely preexisting local state or intentional fixture edits.",
    "Use npm run dev:state-archive to snapshot the current dirty legacy state before any manual cleanup.",
    "Review before cleaning. This script is report-only and does not modify files.",
  ]);
}

main();
