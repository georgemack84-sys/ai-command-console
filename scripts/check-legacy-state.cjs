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

function checkLegacyState(options = {}) {
  const projectRoot = options.projectRoot || process.cwd();
  const gitStatus = getGitStatus(projectRoot);

  if (!gitStatus.ok) {
    return {
      ok: false,
      reason: "git_error",
      error: gitStatus.error,
      offending: [],
      other: [],
    };
  }

  const parsed = gitStatus.lines.map(parseStatusLine);
  const offending = parsed.filter((entry) =>
    KNOWN_RUNTIME_RESIDUE.has(entry.relativePath),
  );
  const other = parsed.filter(
    (entry) => !KNOWN_RUNTIME_RESIDUE.has(entry.relativePath),
  );

  return {
    ok: offending.length === 0,
    reason: offending.length === 0 ? "clean" : "known_runtime_residue",
    error: null,
    offending,
    other,
  };
}

function formatReport(result, mode) {
  const lines = [
    "=== Legacy State Guard ===",
    `Mode: ${mode}`,
  ];

  if (result.reason === "git_error") {
    lines.push(`Unable to inspect git status: ${result.error}`);
    return lines.join("\n");
  }

  lines.push(`Known Runtime Residue: ${result.offending.length}`);
  lines.push(`Other Dirty Entries: ${result.other.length}`);
  lines.push("");

  if (result.offending.length) {
    lines.push("=== Known Runtime Residue ===");
    for (const entry of result.offending) {
      lines.push(entry.raw);
    }
    lines.push("");
  }

  if (result.other.length) {
    lines.push("=== Other Dirty Entries ===");
    for (const entry of result.other) {
      lines.push(entry.raw);
    }
    lines.push("");
  }

  lines.push("=== Guidance ===");
  if (result.offending.length) {
    lines.push("Run npm run dev:state-archive before cleanup if you want a snapshot of the current residue.");
    lines.push("Run npm run dev:state-cleanup -- --apply to restore or remove the known residue set.");
    lines.push("Run npm run dev:state-report to confirm the repo is clean afterward.");
  } else {
    lines.push("No known runtime residue is currently dirty under tracked legacy paths.");
  }

  return lines.join("\n");
}

function main() {
  const strict = process.argv.includes("--strict");
  const result = checkLegacyState();
  const mode = strict ? "strict" : "report";
  const output = formatReport(result, mode);

  if (strict && !result.ok) {
    console.error(output);
    process.exit(1);
  }

  console.log(output);
}

if (require.main === module) {
  main();
}

module.exports = {
  KNOWN_RUNTIME_RESIDUE,
  checkLegacyState,
};
