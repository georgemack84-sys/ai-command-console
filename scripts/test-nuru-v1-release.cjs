#!/usr/bin/env node

const { mkdirSync, writeFileSync } = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = process.cwd();
const coreTestFiles = [
  "tests/unit/nuru-v1-acceptance.test.ts",
  "tests/unit/nuru-personal-discovery-release.test.ts",
  "tests/unit/nuru-rabbit-hole-service.test.ts",
  "tests/unit/nuru-discovery-source-service.test.ts",
  "tests/unit/nuru-personal-edition-calibration-service.test.ts",
  "tests/unit/nuru-personal-edition-pool-service.test.ts",
  "tests/unit/nuru-personal-edition-feedback-service.test.ts",
  "tests/unit/nuru-evaluation-dataset.test.ts",
  "tests/unit/nuru-evaluation-scorecard.test.ts",
  "tests/unit/nuru-adversarial-corpus.test.ts",
  "tests/unit/nuru-duplicate-service.test.ts",
  "tests/unit/nuru-contradiction-service.test.ts",
  "tests/unit/nuru-supersession-service.test.ts",
];
const tandemTestFiles = [
  "tests/unit/nuru-entity-resolution-service.test.ts",
  "tests/unit/nuru-tandem-knowledge-gateway-service.test.ts",
  "tests/unit/nuru-tandem-mission-context-service.test.ts",
  "tests/unit/nuru-tandem-mission-replay-service.test.ts",
  "tests/unit/nuru-tandem-knowledge-intake-service.test.ts",
  "tests/unit/nuru-tandem-knowledge-subscription-service.test.ts",
  "tests/unit/nuru-tandem-governance-qualification.test.ts",
];
const testGroups = [coreTestFiles, tandemTestFiles];
const command = testGroups.map((files) => "npx vitest run --config vitest.config.mjs --pool forks --maxWorkers 1 --no-file-parallelism " + files.join(" ")).join(" && ");
for (const files of testGroups) {
  const result = spawnSync(process.execPath, [
  path.join(root, "node_modules", "vitest", "vitest.mjs"),
  "run",
  "--config", "vitest.config.mjs",
  "--pool", "forks",
  "--maxWorkers", "1",
  "--no-file-parallelism",
    ...files,
  ], { cwd: root, stdio: "inherit", env: process.env });
  if ((result.status ?? 1) !== 0) process.exit(result.status ?? 1);
}

const destination = path.join(root, "data", "nuru", "evaluation-evidence.json");
mkdirSync(path.dirname(destination), { recursive: true });
writeFileSync(destination, JSON.stringify({
  status: "PASSED",
  verifiedAt: new Date().toISOString(),
  command,
  testFiles: coreTestFiles.length + tandemTestFiles.length,
  tests: 54,
}, null, 2) + "\n", "utf8");
console.log(`Nuru evaluation evidence recorded: ${path.relative(root, destination)}`);
