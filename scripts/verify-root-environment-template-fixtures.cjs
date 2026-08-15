#!/usr/bin/env node

const assert = require("node:assert/strict");
const {
  validateMigrationExecution,
  validateRootComposeAlignment,
  validateRootEnvironmentTemplate,
} = require("./root-environment-template-policy.cjs");

const valid = `COMPOSE_PROJECT_NAME=proprium
POSTGRES_DATABASE=proprium
POSTGRES_USER=proprium
POSTGRES_PASSWORD=local-development-only
POSTGRES_HOST_PORT=55432
REDIS_HOST_PORT=6379
API_PORT=8080
WEB_PORT=3000
`;

assert.deepEqual(validateRootEnvironmentTemplate(valid), []);

const fixtures = [
  [
    "missing port",
    valid.replace("POSTGRES_HOST_PORT=55432\n", ""),
    "missing POSTGRES_HOST_PORT",
  ],
  ["duplicate port", `${valid}API_PORT=8081\n`, "duplicates API_PORT"],
  [
    "malformed port",
    valid.replace("REDIS_HOST_PORT=6379", "REDIS_HOST_PORT=redis"),
    "REDIS_HOST_PORT must be an integer",
  ],
  [
    "out-of-range port",
    valid.replace("WEB_PORT=3000", "WEB_PORT=70000"),
    "WEB_PORT must be an integer",
  ],
  [
    "unsafe password",
    valid.replace(
      "POSTGRES_PASSWORD=local-development-only",
      "POSTGRES_PASSWORD=plausible-production-password",
    ),
    "approved non-production placeholder",
  ],
  [
    "shell-dependent value",
    valid.replace("API_PORT=8080", "API_PORT=$(find-port)"),
    "shell-dependent syntax",
  ],
];

for (const [name, content, expected] of fixtures) {
  const errors = validateRootEnvironmentTemplate(content);
  assert.ok(
    errors.some((error) => error.includes(expected)),
    `${name} did not fail with ${expected}: ${errors.join("; ")}`,
  );
}

assert.ok(
  validateRootComposeAlignment('ports: ["${API_PORT:-8080}:8080"]').some(
    (error) => error.includes("API_PORT browser URL"),
  ),
  "a partially wired API port did not fail Compose alignment",
);

assert.deepEqual(
  validateMigrationExecution(`services:
  database-migrations:
    command: ["--migrate"]
`),
  [],
);
assert.ok(
  validateMigrationExecution(`services:
  database-migrations:
    command: ["dotnet", "Proprium.Api.dll", "--migrate"]
`).some((error) => error.includes("append only --migrate")),
  "a duplicated image entrypoint did not fail the migration execution contract",
);

console.log(
  "Root environment template controlled failures: PASS (8 rejected fixtures)",
);
