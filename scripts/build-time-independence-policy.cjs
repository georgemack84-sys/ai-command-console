function validateBuildTimeIndependence({
  program,
  configuration,
  openApiTooling,
  infrastructureRegistration,
  designTimeFactory,
  openApiGenerator,
  commandSource,
  productionFiles,
  workflow,
}) {
  const errors = [];
  const openApiBranch = section(
    program,
    'if (openApiOutput is not null)\n{',
    'if (args.Contains("--migrate"',
  );

  requirePattern(
    errors,
    program,
    /OpenApiToolingConfiguration\.AddSyntheticProvider/,
    'OpenAPI tooling must own its synthetic configuration provider',
  );
  requirePattern(
    errors,
    program,
    /AddMetadataServices[\s\S]*builder\.Build\(\)[\s\S]*Capture\(app\)[\s\S]*ISwaggerProvider/,
    'OpenAPI tooling must capture endpoint metadata without running the host',
  );
  rejectPattern(
    errors,
    openApiBranch,
    /StartAsync|StopAsync|\.Run(?:Async)?\s*\(|Migrate(?:Async)?\s*\(|CanConnect|Ping(?:Async)?\s*\(|HttpClient/,
    'OpenAPI tooling must not activate the host or runtime infrastructure',
  );

  rejectPattern(
    errors,
    configuration,
    /Migrate(?:Async)?\s*\(|EnsureCreated|OpenConnection|CanConnect|ConnectionMultiplexer\.Connect|Ping(?:Async)?\s*\(|HttpClient|SendAsync|GetAsync/,
    'configuration validation must remain structural and connectivity-free',
  );
  for (const expected of [
    'postgres.openapi.invalid',
    'redis.openapi.invalid',
    'synthetic-not-connected',
  ]) {
    requirePattern(
      errors,
      openApiTooling,
      new RegExp(escapeRegExp(expected)),
      `OpenAPI tooling configuration must contain ${expected}`,
    );
  }
  rejectPattern(
    errors,
    openApiTooling,
    /Migrate(?:Async)?\s*\(|OpenConnection|CanConnect|ConnectionMultiplexer\.Connect|Ping(?:Async)?\s*\(|HttpClient/,
    'OpenAPI tooling configuration must not activate runtime infrastructure',
  );

  requirePattern(
    errors,
    infrastructureRegistration,
    /AddDbContext<PropriumDbContext>[\s\S]*AddSingleton<IConnectionMultiplexer>\(provider =>/,
    'database and Redis clients must be registered through deferred factories',
  );
  requirePattern(
    errors,
    designTimeFactory,
    /IDesignTimeDbContextFactory<PropriumDbContext>[\s\S]*postgres\.design-time\.invalid/,
    'EF design-time construction must use the documented non-routable synthetic host',
  );
  rejectPattern(
    errors,
    designTimeFactory,
    /Environment\.|IConfiguration|ConfigurationBuilder|Migrate(?:Async)?\s*\(|EnsureCreated|OpenConnection|CanConnect|Ping(?:Async)?\s*\(/,
    'EF design-time construction must not require runtime state or connectivity',
  );

  for (const option of ['--no-build', '--no-restore']) {
    requirePattern(
      errors,
      openApiGenerator,
      new RegExp(`["']${escapeRegExp(option)}["']`),
      `OpenAPI generation must use ${option} after its explicit CI build`,
    );
  }
  rejectPattern(
    errors,
    openApiGenerator,
    /['"](?:docker|compose|migrate|health-probe)['"]|curl\s|fetch\s*\(|HttpClient/i,
    'OpenAPI generation must not invoke runtime infrastructure commands',
  );

  const backendBuild =
    commandSource.match(/["']build backend["'][\s\S]*?["']build storybook["']/)?.[0] ??
    '';
  requirePattern(
    errors,
    backendBuild,
    /dotnet[\s\S]*build[\s\S]*backendSolution/,
    'the canonical backend build must compile the complete solution',
  );
  rejectPattern(
    errors,
    backendBuild,
    /docker|compose|migrate|health|test:integration/i,
    'the canonical backend build must not invoke runtime infrastructure',
  );

  for (const { file, source } of productionFiles) {
    if (/\[\s*ModuleInitializer\s*\]/.test(source)) {
      errors.push(
        `${file}: module initializers are prohibited in production assemblies`,
      );
    }
    if (
      /static\s+[A-Za-z_][A-Za-z0-9_]*\s*\([^)]*\)\s*\{[^}]*?(?:Migrate|EnsureCreated|OpenConnection|CanConnect|ConnectionMultiplexer\.Connect|Ping|HttpClient)/s.test(
        source,
      )
    ) {
      errors.push(
        `${file}: static constructor activates runtime infrastructure`,
      );
    }
  }

  validateWorkflow(errors, workflow);
  return [...new Set(errors)];
}

function validateWorkflow(errors, workflow) {
  const jobs = workflow?.jobs ?? {};
  const buildJobs = [
    'repository-validation',
    'frontend-validation',
    'backend-validation',
    'openapi-validation',
  ];
  for (const id of buildJobs) {
    const job = jobs[id];
    if (!job) {
      errors.push(`CI build-time job ${id} is missing`);
      continue;
    }
    if (job.services && Object.keys(job.services).length > 0) {
      errors.push(
        `CI build-time job ${id} must not provision runtime services`,
      );
    }
    const commands = commandsFor(job);
    if (
      /docker\s+compose|repo -- (?:dev|migrate|health)|backend:test:integration/.test(
        commands,
      )
    ) {
      errors.push(
        `CI build-time job ${id} invokes infrastructure-dependent execution`,
      );
    }
  }

  const backendCommands = commandsFor(jobs['backend-validation']);
  requirePattern(
    errors,
    backendCommands,
    /dotnet restore services\/api\/Proprium\.sln[\s\S]*repo -- validate backend/,
    'backend CI must restore and compile the complete solution without services',
  );
  const openApiCommands = commandsFor(jobs['openapi-validation']);
  requirePattern(
    errors,
    openApiCommands,
    /dotnet build services\/api\/Proprium\.Api[\s\S]*repo -- validate openapi/,
    'OpenAPI CI must build explicitly before metadata-only generation',
  );

  const integration = jobs['integration-validation'];
  const needs = Array.isArray(integration?.needs)
    ? integration.needs
    : [integration?.needs].filter(Boolean);
  if (!needs.includes('backend-validation')) {
    errors.push(
      'integration CI must depend on infrastructure-independent backend validation',
    );
  }
  const integrationCommands = commandsFor(integration);
  if (
    integrationCommands.indexOf(
      'dotnet build services/api/Proprium.IntegrationTests',
    ) < 0 ||
    integrationCommands.indexOf(
      'dotnet build services/api/Proprium.IntegrationTests',
    ) > integrationCommands.indexOf('repo -- migrate')
  ) {
    errors.push(
      'integration-test compilation must occur before infrastructure activation',
    );
  }
}

function commandsFor(job) {
  return (job?.steps ?? [])
    .map((step) => step.run)
    .filter(Boolean)
    .join('\n');
}

function section(source, start, end) {
  const startIndex = source.indexOf(start);
  if (startIndex < 0) return '';
  const endIndex = source.indexOf(end, startIndex + start.length);
  return source.slice(startIndex, endIndex < 0 ? source.length : endIndex);
}

function requirePattern(errors, source, pattern, message) {
  if (!pattern.test(source)) errors.push(message);
}

function rejectPattern(errors, source, pattern, message) {
  if (pattern.test(source)) errors.push(message);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = { validateBuildTimeIndependence };
