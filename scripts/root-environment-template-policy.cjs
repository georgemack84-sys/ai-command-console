const canonicalRootKeys = [
  "COMPOSE_PROJECT_NAME",
  "POSTGRES_DATABASE",
  "POSTGRES_USER",
  "POSTGRES_PASSWORD",
  "POSTGRES_HOST_PORT",
  "REDIS_HOST_PORT",
  "API_PORT",
  "WEB_PORT",
];

const portKeys = new Set([
  "POSTGRES_HOST_PORT",
  "REDIS_HOST_PORT",
  "API_PORT",
  "WEB_PORT",
]);

function validateRootEnvironmentTemplate(content) {
  const errors = [];
  const values = new Map();

  for (const [index, line] of content.split(/\r?\n/).entries()) {
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
    if (!match) {
      errors.push(`line ${index + 1} is not a portable KEY=value assignment`);
      continue;
    }
    if (values.has(match[1])) {
      errors.push(`line ${index + 1} duplicates ${match[1]}`);
      continue;
    }
    values.set(match[1], match[2]);
  }

  const expected = new Set(canonicalRootKeys);
  for (const key of canonicalRootKeys) {
    if (!values.has(key)) errors.push(`root template is missing ${key}`);
  }
  for (const key of values.keys()) {
    if (!expected.has(key))
      errors.push(`root template contains unowned key ${key}`);
  }

  for (const [key, value] of values) {
    if (!value) errors.push(`${key} must have a deterministic local example`);
    if (/\$\(|`/.test(value))
      errors.push(`${key} contains executable or shell-dependent syntax`);
    if (portKeys.has(key)) {
      const port = Number(value);
      if (
        !/^\d+$/.test(value) ||
        !Number.isInteger(port) ||
        port < 1 ||
        port > 65_535
      )
        errors.push(`${key} must be an integer from 1 through 65535`);
    }
  }

  if (
    values.has("POSTGRES_PASSWORD") &&
    values.get("POSTGRES_PASSWORD") !== "local-development-only"
  ) {
    errors.push(
      "POSTGRES_PASSWORD must use the approved non-production placeholder",
    );
  }

  return errors;
}

function validateRootComposeAlignment(content) {
  const errors = [];
  const requiredMappings = [
    ["COMPOSE_PROJECT_NAME", "name: ${COMPOSE_PROJECT_NAME:-proprium}"],
    ["POSTGRES_DATABASE", "${POSTGRES_DATABASE:-proprium}"],
    ["POSTGRES_USER", "${POSTGRES_USER:-proprium}"],
    ["POSTGRES_PASSWORD", "${POSTGRES_PASSWORD:-local-development-only}"],
    ["POSTGRES_HOST_PORT", "${POSTGRES_HOST_PORT:-55432}:5432"],
    ["REDIS_HOST_PORT", "${REDIS_HOST_PORT:-6379}:6379"],
    ["API_PORT host binding", "${API_PORT:-8080}:8080"],
    ["API_PORT browser URL", "http://localhost:${API_PORT:-8080}"],
    ["WEB_PORT host binding", "${WEB_PORT:-3000}:3000"],
    ["WEB_PORT allowed origin", "http://localhost:${WEB_PORT:-3000}"],
  ];
  for (const [relationship, marker] of requiredMappings) {
    if (!content.includes(marker))
      errors.push(`Compose is missing the ${relationship} mapping`);
  }
  return errors;
}

module.exports = {
  canonicalRootKeys,
  validateRootComposeAlignment,
  validateRootEnvironmentTemplate,
};
