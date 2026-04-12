const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const KNOWN_RUNTIME_RESIDUE = new Set([
  "data/agents/alerts.json",
  "data/agents/audit-log.jsonl",
  "data/agents/automation-policy.json",
  "data/agents/builder.state.json",
  "data/agents/collaboration.json",
  "data/agents/dashboard.json",
  "data/agents/inbox.json",
  "data/agents/jobs.json",
  "data/agents/manager.state.json",
  "data/agents/planner.state.json",
  "data/agents/researcher.state.json",
  "data/agents/reviewQueue.json",
  "data/agents/scheduler.json",
  "data/agents/taskQueue.json",
  "data/agents/telemetry.json",
  "data/agents/watcher.json",
  "data/research-briefs.json",
  "data/research-reports.json",
  "data/workspace-users.json",
  "data/agents/ai-summary-budget.json",
  "data/agents/legacy-console-usage.json",
  "data/agents/profiles/",
]);

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

  return {
    ok: true,
    error: null,
    lines: result.stdout
      .split(/\r?\n/)
      .map((line) => line.trimEnd())
      .filter(Boolean),
  };
}

function parseStatusLine(line) {
  return {
    code: line.slice(0, 2),
    relativePath: line.slice(3).trim(),
    raw: line,
  };
}

function printSection(title, lines) {
  console.log(title);
  for (const line of lines) {
    console.log(line);
  }
  console.log("");
}

function runGit(projectRoot, args) {
  const result = spawnSync("git", args, {
    cwd: projectRoot,
    encoding: "utf8",
  });

  if (result.error) {
    return { ok: false, error: result.error.message };
  }

  if (result.status !== 0) {
    return {
      ok: false,
      error: (result.stderr || result.stdout || "git command failed").trim(),
    };
  }

  return { ok: true, error: null };
}

function removeEntry(projectRoot, relativePath) {
  const absolutePath = path.join(projectRoot, relativePath);
  if (!fs.existsSync(absolutePath)) {
    return { ok: true, error: null };
  }

  fs.rmSync(absolutePath, { recursive: true, force: true });
  return { ok: true, error: null };
}

function main() {
  const projectRoot = process.cwd();
  const apply = process.argv.includes("--apply");
  const gitStatus = getGitStatus(projectRoot);

  if (!gitStatus.ok) {
    printSection("=== Legacy State Cleanup ===", [
      `Unable to inspect git status: ${gitStatus.error}`,
    ]);
    process.exitCode = 1;
    return;
  }

  if (!gitStatus.lines.length) {
    printSection("=== Legacy State Cleanup ===", [
      "No dirty tracked legacy state files were found under data/, agents/, memory/, or logs/.",
      "Nothing to clean.",
    ]);
    return;
  }

  const parsed = gitStatus.lines.map(parseStatusLine);
  const safe = [];
  const skipped = [];

  for (const entry of parsed) {
    if (KNOWN_RUNTIME_RESIDUE.has(entry.relativePath)) {
      safe.push(entry);
      continue;
    }

    skipped.push(entry);
  }

  printSection("=== Legacy State Cleanup ===", [
    `Mode: ${apply ? "apply" : "dry-run"}`,
    `Known Runtime Residue: ${safe.length}`,
    `Skipped For Review: ${skipped.length}`,
  ]);

  if (safe.length) {
    printSection(
      apply ? "=== Cleaned Entries ===" : "=== Planned Cleanup ===",
      safe.map((entry) => `${entry.code} ${entry.relativePath}`),
    );
  }

  if (skipped.length) {
    printSection(
      "=== Skipped Entries ===",
      skipped.map((entry) => entry.raw),
    );
  }

  if (!apply) {
    printSection("=== Guidance ===", [
      "Dry-run only. No files were modified.",
      "Run npm run dev:state-archive before any destructive cleanup so the current legacy state is preserved.",
      "Run npm run dev:state-cleanup -- --apply to restore tracked residue and remove untracked residue from the known-safe list.",
    ]);
    return;
  }

  const modifiedEntries = safe.filter((entry) => entry.code.includes("M"));
  const untrackedEntries = safe.filter((entry) => entry.code === "??");
  const failures = [];

  if (modifiedEntries.length) {
    const restoreResult = runGit(projectRoot, [
      "restore",
      "--source=HEAD",
      "--",
      ...modifiedEntries.map((entry) => entry.relativePath),
    ]);

    if (!restoreResult.ok) {
      failures.push(`git restore failed: ${restoreResult.error}`);
    }
  }

  for (const entry of untrackedEntries) {
    try {
      removeEntry(projectRoot, entry.relativePath);
    } catch (error) {
      failures.push(`remove failed for ${entry.relativePath}: ${error.message}`);
    }
  }

  if (failures.length) {
    printSection("=== Errors ===", failures);
    process.exitCode = 1;
    return;
  }

  printSection("=== Guidance ===", [
    "Known runtime residue has been cleaned from tracked legacy paths.",
    "Run npm run dev:state-report to confirm what remains.",
    "Any skipped entries were left untouched for manual review.",
  ]);
}

main();
