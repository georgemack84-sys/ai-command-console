#!/usr/bin/env node

const { existsSync, readFileSync, readdirSync } = require("node:fs");
const { join, relative } = require("node:path");
const {
  validateConfigurationArchitecture,
} = require("./configuration-architecture-policy.cjs");

const repositoryRoot = join(__dirname, "..");
const architectureDocument =
  "docs/architecture/ADR-0010-configuration-architecture.md";
const roots = [
  "services/api/Proprium.Api",
  "services/api/Proprium.Application",
  "services/api/Proprium.Domain",
  "services/api/Proprium.Infrastructure",
  "apps/web/src",
];

function sourceFiles(directory) {
  const absolute = join(repositoryRoot, directory);
  if (!existsSync(absolute)) return [];
  return readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const child = join(absolute, entry.name);
    if (
      entry.isDirectory() &&
      [".next", "bin", "node_modules", "obj"].includes(entry.name)
    )
      return [];
    if (entry.isDirectory())
      return sourceFiles(relative(repositoryRoot, child));
    if (!/\.(?:cs|ts|tsx)$/.test(entry.name)) return [];
    return [
      {
        file: relative(repositoryRoot, child),
        source: readFileSync(child, "utf8"),
      },
    ];
  });
}

const files = roots.flatMap(sourceFiles);
const documentationPath = join(repositoryRoot, architectureDocument);
const documentation = existsSync(documentationPath)
  ? readFileSync(documentationPath, "utf8")
  : "";
const errors = [
  ...(!existsSync(documentationPath)
    ? [`${architectureDocument}: canonical architecture document is missing`]
    : []),
  ...validateConfigurationArchitecture({ files, documentation }),
];

if (errors.length) {
  for (const error of errors)
    console.error(`Configuration architecture failure: ${error}`);
  process.exit(1);
}

console.log(
  `Configuration architecture: PASS (${files.length} production source files; API, frontend, typed-consumption, and documentation boundaries)`,
);
