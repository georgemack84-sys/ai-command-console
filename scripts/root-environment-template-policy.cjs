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
const yaml = require("js-yaml");
const { parseEnvironmentTemplate } = require("./environment-template-parser.cjs");

const portKeys = new Set([
  "POSTGRES_HOST_PORT",
  "REDIS_HOST_PORT",
  "API_PORT",
  "WEB_PORT",
]);

function validateRootEnvironmentTemplate(content) {
  const errors = [];
  const parsed = parseEnvironmentTemplate(content, ".env.example");
  const values = parsed.values;
  errors.push(...parsed.errors.map(({ line, message }) => `line ${line} ${message}`));

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
  errors.push(...validateMigrationExecution(content));
  return errors;
}

function validateMigrationExecution(content) {
  let compose;
  try {
    compose = yaml.load(content);
  } catch (error) {
    return [`Compose cannot be parsed: ${error.message}`];
  }

  const command = compose?.services?.["database-migrations"]?.command;
  if (!Array.isArray(command) || command.length !== 1 || command[0] !== "--migrate") {
    return [
      "Compose database-migrations command must append only --migrate to the image ENTRYPOINT",
    ];
  }
  return [];
}

module.exports = {
  canonicalRootKeys,
  validateMigrationExecution,
  validateRootComposeAlignment,
  validateRootEnvironmentTemplate,
};
