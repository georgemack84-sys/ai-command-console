#!/usr/bin/env node

const { spawnSync } = require("child_process");

const showFiles = process.argv.includes("--files");

function readStatus() {
  const result = spawnSync("git", ["status", "--porcelain=v1", "--untracked-files=all"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });

  if (result.error || result.status !== 0) {
    throw new Error((result.error?.message || result.stderr || "git status failed").trim());
  }

  return result.stdout.split(/\r?\n/).filter(Boolean).map((line) => ({
    code: line.slice(0, 2),
    path: line.slice(3),
  }));
}

function isGeneratedOutput(filePath) {
  return filePath.startsWith(".next") || filePath.startsWith("test-results/") || filePath.startsWith("playwright-report/") || filePath.startsWith(".codex-temp/") || filePath.startsWith(".codex-worktrees/");
}

function isNuruPath(filePath) {
  return filePath.includes("/nuru/") || filePath.startsWith("app/nuru/") || filePath.startsWith("src/nuru/") || filePath.startsWith("src/server/services/nuru-") || filePath.startsWith("src/server/repositories/nuru-") || filePath.startsWith("docs/NURU_") || filePath.startsWith("tests/unit/nuru-") || filePath.startsWith("tests/e2e/nuru-") || filePath === "playwright.vault.config.ts" || filePath === "scripts/run-playwright-server.cjs" || filePath === "src/instrumentation.ts";
}

function summarize(entries) {
  return entries.reduce((summary, entry) => {
    if (entry.code === "??") summary.untracked += 1;
    else if (entry.code.includes("M")) summary.modified += 1;
    else if (entry.code.includes("A")) summary.added += 1;
    else if (entry.code.includes("D")) summary.deleted += 1;
    else if (entry.code.includes("R")) summary.renamed += 1;
    else summary.other += 1;
    return summary;
  }, { modified: 0, untracked: 0, added: 0, deleted: 0, renamed: 0, other: 0 });
}

function printSummary(title, entries) {
  const summary = summarize(entries);
  console.log(`${title}: ${entries.length} (${summary.modified} modified, ${summary.untracked} untracked, ${summary.added} added, ${summary.deleted} deleted, ${summary.renamed} renamed, ${summary.other} other)`);
}

function main() {
  const status = readStatus();
  const generated = status.filter((entry) => isGeneratedOutput(entry.path));
  const nuru = status.filter((entry) => !isGeneratedOutput(entry.path) && isNuruPath(entry.path));
  const other = status.filter((entry) => !isGeneratedOutput(entry.path) && !isNuruPath(entry.path));

  console.log("=== Nuru Worktree Report ===");
  printSummary("Nuru scope", nuru);
  printSummary("Other source work", other);
  printSummary("Generated output visible to Git", generated);

  if (showFiles) {
    console.log("\n=== Nuru Scope Files ===");
    nuru.forEach((entry) => console.log(`${entry.code} ${entry.path}`));
  }

  console.log("\nGuidance: stage Nuru scope explicitly, never stage the repository root from a mixed worktree. Run this report before review and commit. Use a dedicated Git worktree for unrelated concurrent work.");

  if (generated.length > 0) {
    console.error("Generated output is visible to Git. Add a narrow ignore rule before staging source work.");
    process.exitCode = 1;
  }
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
