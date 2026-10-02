#!/usr/bin/env node

const { spawnSync } = require("child_process");

const checks = [
  ["npx", ["prisma", "migrate", "status"]],
  ["npx", ["prisma", "validate"]],
  ["npx", ["eslint", "src/server/security/server-url-policy.ts", "src/server/security/rate-limit.ts", "src/server/security/distributed-rate-limit.ts", "src/server/security/nsi-write-rate-limit.ts", "src/server/security/nuru-egress-fetch.ts", "src/server/security/same-origin.ts", "src/server/services/nuru-artifact-integrity-service.ts", "src/server/services/nuru-manual-ingestion-service.ts", "src/server/services/nuru-url-frontier-service.ts", "src/server/services/nuru-nsi-canonical-admission-service.ts"]],
  ["npx", ["vitest", "run", "--config", "vitest.config.mjs", "tests/unit/server-url-policy.test.ts", "tests/unit/rate-limit.test.ts", "tests/unit/distributed-rate-limit.test.ts", "tests/unit/nsi-write-rate-limit.test.ts", "tests/unit/nuru-egress-fetch.test.ts", "tests/unit/nuru-egress-topology.test.ts", "tests/unit/same-origin.test.ts", "tests/unit/nuru-manual-ingestion-service.test.ts", "tests/unit/nuru-artifact-integrity-service.test.ts", "tests/integration/nsi-route-security.integration.test.ts", "tests/unit/nuru-claim-extraction.test.ts", "tests/unit/nuru-claim-review-and-citation.test.ts", "tests/unit/nuru-claim-corroboration-service.test.ts", "tests/unit/nuru-quality-agent.test.ts"]],
];

for (const [command, args] of checks) {
  const isWindows = process.platform === "win32";
  const executable = isWindows ? (process.env.ComSpec || "cmd.exe") : command;
  const commandArgs = isWindows ? ["/d", "/s", "/c", [command, ...args].join(" ")] : args;
  const result = spawnSync(executable, commandArgs, { stdio: "inherit", shell: false });
  if ((result.status ?? 1) !== 0) process.exit(result.status ?? 1);
}

console.log("NSI production sign-off baseline passed.");
