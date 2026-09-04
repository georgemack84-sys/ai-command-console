const { posix } = require("node:path");

const canonicalTemplates = [
  {
    path: ".env.example",
    local: ".env",
    owner: "Repository Platform",
  },
  {
    path: "apps/web/.env.example",
    local: "apps/web/.env.local",
    owner: "Frontend",
  },
  {
    path: "services/api/.env.example",
    local: "services/api/.env",
    owner: "Platform API",
  },
  {
    path: "apps/learning-agent/.env.example",
    local: "apps/learning-agent/.env.local",
    owner: "Learning Agent",
  },
];

const approvedSpecializedEnvironmentFiles = new Set([
  ".github/environment-templates/production.env.example",
  ".github/environment-templates/staging.env.example",
  "apps/web/.env.docker",
  "apps/web/.env.test",
]);

function isEnvironmentContract(path) {
  const name = posix.basename(path);
  return (
    name === ".env" ||
    name.startsWith(".env.") ||
    /\.env\.(?:example|sample|template)$/.test(name)
  );
}

function validateEnvironmentTemplateOwnership({
  trackedPaths,
  ignoredPaths,
  contentsByPath,
}) {
  const errors = [];
  const tracked = new Set(trackedPaths);
  const ignored = new Set(ignoredPaths);
  const canonicalPaths = new Set(canonicalTemplates.map(({ path }) => path));
  const allowedTracked = new Set([
    ...canonicalPaths,
    ...approvedSpecializedEnvironmentFiles,
  ]);

  for (const contract of canonicalTemplates) {
    if (!tracked.has(contract.path))
      errors.push(`${contract.path} must be tracked as a canonical template`);
    if (ignored.has(contract.path))
      errors.push(`${contract.path} must remain eligible for source control`);
    if (!ignored.has(contract.local))
      errors.push(
        `${contract.local} must be ignored as developer-owned configuration`,
      );
    if (tracked.has(contract.local))
      errors.push(`${contract.local} must not be tracked`);

    const content = contentsByPath.get(contract.path) ?? "";
    for (const marker of [
      `Owner: ${contract.owner}`,
      `Local counterpart: ${contract.local}`,
      "Safe to commit:",
    ]) {
      if (!content.includes(marker))
        errors.push(`${contract.path} is missing ownership header: ${marker}`);
    }
  }

  for (const path of tracked) {
    if (isEnvironmentContract(path) && !allowedTracked.has(path)) {
      errors.push(
        `${path} is an unclassified or competing environment contract`,
      );
    }
  }

  if (tracked.has("services/platform-api/.env.example")) {
    errors.push(
      "services/platform-api/.env.example duplicates the real services/api owner",
    );
  }

  return errors;
}

module.exports = {
  canonicalTemplates,
  validateEnvironmentTemplateOwnership,
};
