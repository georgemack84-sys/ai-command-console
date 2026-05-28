#!/usr/bin/env node

const { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = process.cwd();
const testsRoot = path.join(root, "tests");
const dryRun = process.argv.includes("--dry-run");
const resumeLast = process.argv.includes("--resume-last");
const fromArg = process.argv.find((arg) => arg.startsWith("--from="));
const resumeArg = process.argv.find((arg) => arg.startsWith("--resume"));
const onlyArg = process.argv.find((arg) => arg.startsWith("--only="));
const timeoutArg = process.argv.find((arg) => arg.startsWith("--partition-timeout-ms="));
const fileTimeoutArg = process.argv.find((arg) => arg.startsWith("--file-timeout-ms="));
const maxFilesArg = process.argv.find((arg) => arg.startsWith("--max-files="));
const unitMaxFilesArg = process.argv.find((arg) => arg.startsWith("--unit-max-files="));
const maxWorkersArg = process.argv.find((arg) => arg.startsWith("--max-workers="));
const resumePartition = resumeArg
  ? (resumeArg.includes("=") ? resumeArg.slice("--resume=".length) : process.argv[process.argv.indexOf(resumeArg) + 1])
  : null;
const fromPartition = fromArg ? fromArg.slice("--from=".length) : resumePartition;
const onlyPartition = onlyArg ? onlyArg.slice("--only=".length) : null;
const partitionTimeoutMs = timeoutArg ? Number(timeoutArg.slice("--partition-timeout-ms=".length)) : 10 * 60 * 1000;
const singleFileTimeoutMs = fileTimeoutArg
  ? Number(fileTimeoutArg.slice("--file-timeout-ms=".length))
  : Math.min(partitionTimeoutMs, 5 * 60 * 1000);
const maxFilesPerChunk = maxFilesArg ? Number(maxFilesArg.slice("--max-files=".length)) : 40;
const unitMaxFilesPerChunk = unitMaxFilesArg ? Number(unitMaxFilesArg.slice("--unit-max-files=".length)) : 10;
const requestedMaxWorkers = maxWorkersArg ? Number(maxWorkersArg.slice("--max-workers=".length)) : 1;
const vitestEntrypoint = path.join(root, "node_modules", "vitest", "vitest.mjs");
const progressPath = path.join(root, ".codex-temp", "test-release-progress.json");

const topLevelExcluded = new Set([
  "helpers",
  "unit",
  "integration",
  "red-team",
  "e2e",
]);

function isVitestTestFile(fileName) {
  return /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(fileName);
}

function listVitestTestFiles(relativeDir) {
  const absoluteDir = path.join(root, relativeDir);
  const files = [];

  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }
      if (isVitestTestFile(entry.name)) {
        files.push(path.relative(root, fullPath).replace(/\\/g, "/"));
      }
    }
  }

  if (statSync(absoluteDir).isDirectory()) {
    walk(absoluteDir);
  }

  return files.sort((a, b) => a.localeCompare(b));
}

function chunkFiles(name, files, chunkSize) {
  const chunks = [];
  for (let index = 0; index < files.length; index += chunkSize) {
    chunks.push({
      name: `${name}-${chunks.length + 1}`,
      paths: files.slice(index, index + chunkSize),
    });
  }
  return chunks;
}

function formatDuration(ms) {
  const seconds = Math.round(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return minutes > 0 ? `${minutes}m ${remainder}s` : `${remainder}s`;
}

const topLevelDirs = readdirSync(testsRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter((name) => !topLevelExcluded.has(name))
  .sort((a, b) => a.localeCompare(b));

const unitFiles = listVitestTestFiles("tests/unit");
const integrationRedTeamFiles = [
  ...listVitestTestFiles("tests/integration"),
  ...listVitestTestFiles("tests/red-team"),
].sort((a, b) => a.localeCompare(b));
const topLevelFiles = topLevelDirs
  .flatMap((name) => listVitestTestFiles(`tests/${name}`))
  .sort((a, b) => a.localeCompare(b));

const partitions = [
  ...chunkFiles("unit", unitFiles, unitMaxFilesPerChunk),
  ...chunkFiles("integration-red-team", integrationRedTeamFiles, maxFilesPerChunk),
  ...chunkFiles("top-level-constitutional", topLevelFiles, maxFilesPerChunk),
].filter((partition) => partition.paths.length > 0);

for (const partition of partitions) {
  console.log(`[test:release] ${partition.name}: ${partition.paths.length} files`);
}

const expectedFiles = [...unitFiles, ...integrationRedTeamFiles, ...topLevelFiles];
const partitionedFiles = partitions.flatMap((partition) => partition.paths);
const expectedSet = new Set(expectedFiles);
const partitionedSet = new Set(partitionedFiles);
const omittedFiles = expectedFiles.filter((file) => !partitionedSet.has(file));
const duplicateFiles = partitionedFiles.filter((file, index) => partitionedFiles.indexOf(file) !== index);
const unexpectedFiles = partitionedFiles.filter((file) => !expectedSet.has(file));

if (omittedFiles.length > 0 || duplicateFiles.length > 0 || unexpectedFiles.length > 0) {
  console.error("[test:release] file accounting failed");
  if (omittedFiles.length > 0) {
    console.error(`[test:release] omitted files:\n${omittedFiles.join("\n")}`);
  }
  if (duplicateFiles.length > 0) {
    console.error(`[test:release] duplicate files:\n${duplicateFiles.join("\n")}`);
  }
  if (unexpectedFiles.length > 0) {
    console.error(`[test:release] unexpected files:\n${unexpectedFiles.join("\n")}`);
  }
  process.exit(1);
}

if (dryRun) {
  console.log(`[test:release] total files: ${partitions.reduce((sum, partition) => sum + partition.paths.length, 0)}`);
  console.log(`[test:release] unit chunk size: ${unitMaxFilesPerChunk}`);
  console.log(`[test:release] non-unit chunk size: ${maxFilesPerChunk}`);
  console.log(`[test:release] partition timeout: ${formatDuration(partitionTimeoutMs)}`);
  console.log(`[test:release] single-file fallback timeout: ${formatDuration(singleFileTimeoutMs)}`);
  console.log(`[test:release] max workers: ${requestedMaxWorkers}`);
  console.log("[test:release] file parallelism: disabled");
  console.log("[test:release] file accounting: complete");
  console.log("[test:release] dry run complete");
  process.exit(0);
}

if (onlyPartition && (fromPartition || resumeLast)) {
  console.error("[test:release] use --only by itself, without --from, --resume, or --resume-last");
  process.exit(1);
}

if (resumeLast && fromPartition) {
  console.error("[test:release] use either --resume-last or an explicit --from/--resume partition, not both");
  process.exit(1);
}

const progress = readProgress();
const resumeLastPartition = resumeLast ? findPartitionAfter(progress.lastCompletedPartition) : null;
const requestedFromPartition = resumeLast ? resumeLastPartition : fromPartition;

const fromIndex = requestedFromPartition
  ? partitions.findIndex((partition) => partition.name === requestedFromPartition)
  : -1;
let selectedPartitions = requestedFromPartition ? partitions.slice(fromIndex) : partitions;

if (requestedFromPartition && fromIndex === -1) {
  console.error(`[test:release] unknown resume partition: ${requestedFromPartition}`);
  process.exit(1);
}

if (resumeLast && !requestedFromPartition) {
  console.error("[test:release] no incomplete partition found for --resume-last");
  process.exit(1);
}

if (onlyPartition) {
  selectedPartitions = partitions.filter((partition) => partition.name === onlyPartition);
  if (selectedPartitions.length === 0) {
    console.error(`[test:release] unknown --only partition: ${onlyPartition}`);
    process.exit(1);
  }
}

for (const partition of selectedPartitions) {
  const startedAt = Date.now();
  console.log(`[test:release] running ${partition.name} (${partition.paths.length} files)`);
  const result = runVitest(partition.paths, partitionTimeoutMs);
  const elapsed = formatDuration(Date.now() - startedAt);

  if (result.stdout) {
    process.stdout.write(result.stdout);
  }
  if (result.stderr) {
    process.stderr.write(result.stderr);
  }

  if (result.error) {
    if (result.error.code === "ETIMEDOUT") {
      const fallbackPassed = runSingleFileFallback(partition, startedAt, result);
      if (fallbackPassed) {
        continue;
      }
    } else {
      console.error(`[test:release] ${partition.name} failed to start after ${elapsed}: ${result.error.message}`);
    }
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`[test:release] ${partition.name} failed with exit code ${result.status} after ${elapsed}`);
    process.exit(result.status || 1);
  }

  writeProgress(partition, "passed", elapsed);
  console.log(`[test:release] ${partition.name} passed in ${elapsed}`);
}

console.log("[test:release] all partitions passed");
writeProgress(selectedPartitions[selectedPartitions.length - 1], "complete", "0s");

function runVitest(paths, timeoutMs) {
  return spawnSync(
    process.execPath,
    [
      vitestEntrypoint,
      "run",
      ...paths,
      "--config",
      "vitest.release.config.mjs",
      "--reporter=dot",
      `--maxWorkers=${requestedMaxWorkers}`,
      "--no-file-parallelism",
      "--testTimeout=10000",
    ],
    {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 50 * 1024 * 1024,
      timeout: timeoutMs,
    },
  );
}

function runSingleFileFallback(partition, partitionStartedAt, timeoutResult) {
  const elapsed = formatDuration(Date.now() - partitionStartedAt);
  const lastOutput = getLastVisibleOutput(timeoutResult);
  const slowFiles = [];

  console.error(`[test:release] ${partition.name} timed out after ${elapsed}`);
  console.error(`[test:release] timeout value: ${formatDuration(partitionTimeoutMs)}`);
  console.error(`[test:release] chunk file count: ${partition.paths.length}`);
  console.error(`[test:release] chunk file list:\n${partition.paths.join("\n")}`);
  if (lastOutput) {
    console.error(`[test:release] last visible output:\n${lastOutput}`);
  }
  console.error(`[test:release] falling back to single-file diagnostics for ${partition.name}`);
  console.error(`[test:release] recommended fallback command: npm run test:release -- --only=${partition.name} --file-timeout-ms=${singleFileTimeoutMs}`);
  writeProgress(partition, "timeout_fallback_started", elapsed);

  for (const file of partition.paths) {
    const startedAt = Date.now();
    console.log(`[test:release] fallback running ${file}`);
    const result = runVitest([file], singleFileTimeoutMs);
    const elapsedMs = Date.now() - startedAt;
    const fileElapsed = formatDuration(elapsedMs);

    if (result.stdout) {
      process.stdout.write(result.stdout);
    }
    if (result.stderr) {
      process.stderr.write(result.stderr);
    }

    if (elapsedMs > singleFileTimeoutMs * 0.75) {
      slowFiles.push(`${file} (${fileElapsed})`);
    }

    if (result.error) {
      if (result.error.code === "ETIMEDOUT") {
        console.error(`[test:release] fallback file timed out after ${fileElapsed}: ${file}`);
      } else {
        console.error(`[test:release] fallback file failed to start after ${fileElapsed}: ${file}: ${result.error.message}`);
      }
      if (slowFiles.length > 0) {
        console.error(`[test:release] slow files observed:\n${slowFiles.join("\n")}`);
      }
      return false;
    }

    if (result.status !== 0) {
      console.error(`[test:release] fallback file failed with exit code ${result.status} after ${fileElapsed}: ${file}`);
      if (slowFiles.length > 0) {
        console.error(`[test:release] slow files observed:\n${slowFiles.join("\n")}`);
      }
      return false;
    }

    console.log(`[test:release] fallback file passed in ${fileElapsed}: ${file}`);
  }

  if (slowFiles.length > 0) {
    console.log(`[test:release] slow files observed:\n${slowFiles.join("\n")}`);
  } else {
    console.log("[test:release] slow files observed: none");
  }
  writeProgress(partition, "passed_via_fallback", formatDuration(Date.now() - partitionStartedAt));
  console.log(`[test:release] ${partition.name} passed via single-file fallback`);
  return true;
}

function getLastVisibleOutput(result) {
  const combined = `${result.stdout || ""}\n${result.stderr || ""}`.trim();
  if (!combined) {
    return "";
  }
  const lines = combined.split(/\r?\n/).filter(Boolean);
  return lines.slice(-20).join("\n");
}

function readProgress() {
  try {
    return JSON.parse(readFileSync(progressPath, "utf8"));
  } catch {
    return {};
  }
}

function writeProgress(partition, status, elapsed) {
  if (!partition) {
    return;
  }

  mkdirSync(path.dirname(progressPath), { recursive: true });
  writeFileSync(
    progressPath,
    JSON.stringify(
      {
        lastCompletedPartition: partition.name,
        lastStatus: status,
        elapsed,
        completedAt: new Date().toISOString(),
        totalPartitions: partitions.length,
        totalFiles: expectedFiles.length,
      },
      null,
      2,
    ),
  );
}

function findPartitionAfter(partitionName) {
  if (!partitionName) {
    return partitions[0]?.name || null;
  }

  const partitionIndex = partitions.findIndex((partition) => partition.name === partitionName);
  if (partitionIndex === -1) {
    return null;
  }

  return partitions[partitionIndex + 1]?.name || null;
}
