const path = require("node:path");

const backendProduction =
  /^services\/api\/Proprium\.(?:Api|Application|Domain|Infrastructure)\/.*\.cs$/;
const backendBootstrap =
  /^services\/api\/Proprium\.Api\/(?:Program\.cs|Configuration\/.*\.cs)$/;
const frontendProduction = /^apps\/web\/src\/.*\.(?:ts|tsx)$/;
const frontendEnvironmentAdapter = "apps/web/src/config/environment.ts";
const frontendTestBootstrap = "apps/web/src/test/setup.ts";

function normalize(filePath) {
  return filePath.split(path.sep).join("/");
}

function validateConfigurationArchitecture({ files, documentation }) {
  const errors = [];
  const normalized = files.map(({ file, source }) => ({
    file: normalize(file),
    source,
  }));

  for (const { file, source } of normalized) {
    if (backendProduction.test(file)) {
      if (
        /Environment\.GetEnvironmentVariables?\s*\(/.test(source) &&
        !backendBootstrap.test(file)
      ) {
        errors.push(
          `${file}: raw environment access is outside the API bootstrap boundary`,
        );
      }
      if (/\bIConfiguration\b/.test(source) && !backendBootstrap.test(file)) {
        errors.push(
          `${file}: IConfiguration is outside the API bootstrap boundary`,
        );
      }
    }

    if (
      frontendProduction.test(file) &&
      /\bprocess\.env\b/.test(source) &&
      file !== frontendEnvironmentAdapter &&
      file !== frontendTestBootstrap
    ) {
      errors.push(
        `${file}: process.env is outside the frontend configuration boundary`,
      );
    }
  }

  const byPath = new Map(normalized.map(({ file, source }) => [file, source]));
  const program = byPath.get("services/api/Proprium.Api/Program.cs") ?? "";
  const apiConfiguration =
    byPath.get("services/api/Proprium.Api/Configuration/ApiConfiguration.cs") ??
    "";
  const frontendEnvironment = byPath.get(frontendEnvironmentAdapter) ?? "";
  const frontendSchema =
    byPath.get("apps/web/src/config/environment-schema.ts") ?? "";

  requirePattern(
    errors,
    program,
    /ApiConfiguration\.Resolve\([\s\S]*builder\.Build\(\)/,
    "API startup must resolve configuration before builder.Build()",
  );
  requirePattern(
    errors,
    apiConfiguration,
    /ApiConfigurationSnapshot[\s\S]*IOptions</,
    "API bootstrap must expose typed options rather than raw configuration",
  );
  requirePattern(
    errors,
    apiConfiguration,
    /ApiConfigurationException/,
    "API bootstrap must fail with value-safe configuration diagnostics",
  );
  requirePattern(
    errors,
    frontendEnvironment,
    /Object\.freeze\([\s\S]*parsePublicEnvironment/,
    "frontend environment adapter must expose a frozen validated object",
  );
  requirePattern(
    errors,
    frontendSchema,
    /\.strict\(\)/,
    "frontend public configuration schema must reject unknown input",
  );

  for (const heading of [
    "Configuration flow",
    "Bootstrap boundaries",
    "Typed binding and startup validation",
    "Least exposure and ownership",
    "Public and secret classification",
    "Build-time and runtime separation",
    "Prohibited patterns",
    "Enforcement and roadmap continuity",
  ]) {
    requirePattern(
      errors,
      documentation,
      new RegExp(`^## ${escapeRegExp(heading)}$`, "m"),
      `configuration architecture document is missing section: ${heading}`,
    );
  }

  return errors;
}

function requirePattern(errors, source, pattern, message) {
  if (!pattern.test(source)) errors.push(message);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = { validateConfigurationArchitecture };
