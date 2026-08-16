#!/usr/bin/env node

const assert = require("node:assert/strict");
const {
  canonicalTemplates,
  validateEnvironmentTemplateOwnership,
} = require("./environment-template-ownership-policy.cjs");

const templateContents = new Map(
  canonicalTemplates.map(({ path, local, owner }) => [
    path,
    `# Owner: ${owner}\n# Local counterpart: ${local}\n# Safe to commit: placeholders only.\n`,
  ]),
);
const valid = {
  trackedPaths: canonicalTemplates.map(({ path }) => path),
  ignoredPaths: canonicalTemplates.map(({ local }) => local),
  contentsByPath: templateContents,
};

assert.deepEqual(validateEnvironmentTemplateOwnership(valid), []);

const fixtures = [
  [
    "missing canonical template",
    { trackedPaths: valid.trackedPaths.slice(1) },
    "must be tracked",
  ],
  [
    "ignored canonical template",
    { ignoredPaths: [...valid.ignoredPaths, ".env.example"] },
    "eligible for source control",
  ],
  [
    "unignored local file",
    { ignoredPaths: valid.ignoredPaths.slice(1) },
    "developer-owned configuration",
  ],
  [
    "tracked local file",
    { trackedPaths: [...valid.trackedPaths, "services/api/.env"] },
    "must not be tracked",
  ],
  [
    "competing sample template",
    { trackedPaths: [...valid.trackedPaths, "apps/web/.env.sample"] },
    "competing environment contract",
  ],
  [
    "phantom API owner",
    {
      trackedPaths: [
        ...valid.trackedPaths,
        "services/platform-api/.env.example",
      ],
    },
    "services/platform-api",
  ],
];

for (const [name, change, expected] of fixtures) {
  const errors = validateEnvironmentTemplateOwnership({ ...valid, ...change });
  assert.ok(
    errors.some((error) => error.includes(expected)),
    `${name} did not fail with ${expected}: ${errors.join("; ")}`,
  );
}

console.log(
  "Environment template ownership controlled failures: PASS (6 rejected fixtures)",
);
