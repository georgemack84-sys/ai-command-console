#!/usr/bin/env node

const { spawnSync } = require("node:child_process");
const { existsSync, readFileSync } = require("node:fs");
const path = require("node:path");
const {
  validateDevelopmentAudit,
} = require("./development-dependency-audit-policy.cjs");

const root = path.resolve(__dirname, "..");
const register = JSON.parse(
  readFileSync(
    path.join(root, "docs", "security", "dependency-audit-exceptions.json"),
    "utf8",
  ),
);
const npmCli =
  process.env.npm_execpath ??
  path.join(
    path.dirname(process.execPath),
    "node_modules",
    "npm",
    "bin",
    "npm-cli.js",
  );

function audit(graph, cwd) {
  if (!existsSync(npmCli))
    throw new Error(`Unable to locate npm CLI at ${npmCli}`);
  const result = spawnSync(process.execPath, [npmCli, "audit", "--json"], {
    cwd,
    encoding: "utf8",
  });
  if (result.error) throw result.error;
  if (![0, 1].includes(result.status))
    throw new Error(
      result.stderr || `npm audit failed with exit ${result.status}`,
    );
  const report = JSON.parse(result.stdout);
  return validateDevelopmentAudit({
    report,
    graph,
    register,
    today: new Date().toISOString().slice(0, 10),
  });
}

const errors = [
  ...audit("root", root),
  ...audit("web", path.join(root, "apps", "web")),
];
if (errors.length > 0) {
  for (const error of errors)
    console.error(`Development dependency audit failure: ${error}`);
  process.exit(1);
}
console.log(
  `Development dependency audit: PASS (${register.exceptions.length} active, scoped exceptions)`,
);
