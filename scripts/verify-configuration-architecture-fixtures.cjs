#!/usr/bin/env node

const assert = require("node:assert/strict");
const {
  validateConfigurationArchitecture,
} = require("./configuration-architecture-policy.cjs");

const documentation = [
  "Configuration flow",
  "Bootstrap boundaries",
  "Typed binding and startup validation",
  "Least exposure and ownership",
  "Public and secret classification",
  "Build-time and runtime separation",
  "Prohibited patterns",
  "Enforcement and roadmap continuity",
]
  .map((heading) => `## ${heading}`)
  .join("\n");

const validFiles = [
  {
    file: "services/api/Proprium.Api/Program.cs",
    source:
      "ApiConfigurationSources.Configure(builder.Configuration); ApiConfiguration.Resolve(builder.Configuration, env); builder.Build();",
  },
  {
    file: "services/api/Proprium.Api/Configuration/ApiConfigurationSources.cs",
    source:
      'configuration.AddJsonFile("appsettings.json").AddJsonFile($"appsettings.{environmentName}.json").AddEnvironmentVariables(); addSecretProvider?.Invoke(configuration); configuration.AddCommandLine(args);',
  },
  {
    file: "services/api/Proprium.Api/Configuration/ApiConfiguration.cs",
    source:
      "IConfiguration ApiConfigurationSnapshot IOptions<PlatformOptions> ApiConfigurationException",
  },
  {
    file: "services/api/Proprium.Application/Example.cs",
    source: "sealed class Example(PlatformOptions options);",
  },
  {
    file: "apps/web/src/config/environment.ts",
    source:
      "Object.freeze(parsePublicEnvironment({ value: process.env.NEXT_PUBLIC_VALUE }))",
  },
  {
    file: "apps/web/src/config/environment-schema.ts",
    source: "z.object({}).strict()",
  },
];

assert.deepEqual(
  validateConfigurationArchitecture({ files: validFiles, documentation }),
  [],
  "the canonical boundary fixture must pass",
);

const fixtures = [
  [
    "application environment read",
    {
      file: "services/api/Proprium.Application/Service.cs",
      source: 'Environment.GetEnvironmentVariable("KEY")',
    },
    "raw environment access",
  ],
  [
    "domain configuration service locator",
    {
      file: "services/api/Proprium.Domain/Policy.cs",
      source: "Policy(IConfiguration configuration)",
    },
    "IConfiguration",
  ],
  [
    "component environment read",
    {
      file: "apps/web/src/components/widget.tsx",
      source: "process.env.NEXT_PUBLIC_VALUE",
    },
    "process.env",
  ],
  [
    "ad hoc backend provider",
    {
      file: "services/api/Proprium.Infrastructure/FeatureConfiguration.cs",
      source: 'configuration.AddJsonFile("feature.json")',
    },
    "canonical composition root",
  ],
];

for (const [name, file, expected] of fixtures) {
  const errors = validateConfigurationArchitecture({
    files: [...validFiles, file],
    documentation,
  });
  assert.ok(
    errors.some((error) => error.includes(expected)),
    `${name} did not fail with ${expected}: ${errors.join("; ")}`,
  );
}

for (const [name, change, expected] of [
  [
    "late API resolution",
    {
      file: validFiles[0].file,
      source: "builder.Build(); ApiConfiguration.Resolve(configuration, env);",
    },
    "before builder.Build",
  ],
  [
    "unvalidated frontend object",
    {
      file: "apps/web/src/config/environment.ts",
      source: "export const environment = process.env",
    },
    "frozen validated object",
  ],
]) {
  const files = validFiles.map((file) =>
    file.file === change.file ? change : file,
  );
  const errors = validateConfigurationArchitecture({ files, documentation });
  assert.ok(
    errors.some((error) => error.includes(expected)),
    `${name} did not fail with ${expected}: ${errors.join("; ")}`,
  );
}

console.log(
  "Configuration architecture controlled failures: PASS (6 rejected fixtures)",
);
