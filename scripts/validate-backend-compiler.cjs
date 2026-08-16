const assert = require('node:assert/strict');
const { readFileSync, readdirSync } = require('node:fs');
const { join, relative } = require('node:path');

const repositoryRoot = join(__dirname, '..');
const backendRoot = join(repositoryRoot, 'services', 'api');
const ignoredDirectories = new Set(['bin', 'obj']);

function walk(directory, predicate) {
  const paths = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) paths.push(...walk(path, predicate));
    else if (predicate(path)) paths.push(path);
  }
  return paths;
}

function repositoryPath(path) {
  return relative(repositoryRoot, path).replaceAll('\\', '/');
}

function assertSharedProperty(content, property, value) {
  assert.match(
    content,
    new RegExp(`<${property}>${value.replace('.', '\\.')}</${property}>`),
    `Directory.Build.props must set ${property}=${value}.`,
  );
}

const sharedProps = readFileSync(
  join(repositoryRoot, 'Directory.Build.props'),
  'utf8',
);
const sharedTargets = readFileSync(
  join(repositoryRoot, 'Directory.Build.targets'),
  'utf8',
);
for (const [property, value] of [
  ['TargetFramework', 'net8.0'],
  ['Nullable', 'enable'],
  ['TreatWarningsAsErrors', 'true'],
  ['AnalysisLevel', '8.0'],
  ['AnalysisMode', 'Default'],
  ['EnableNETAnalyzers', 'true'],
  ['EnforceCodeStyleInBuild', 'true'],
  ['GenerateDocumentationFile', 'true'],
  ['Deterministic', 'true'],
]) {
  assertSharedProperty(sharedProps, property, value);
  if (property === 'TargetFramework') continue;
  assert.match(
    sharedTargets,
    new RegExp(`'\\$\\(${property}\\)' != '${value.replace('.', '\\.')}'`),
    `Directory.Build.targets must reject an evaluated ${property} override.`,
  );
}

const sdkPolicy = JSON.parse(
  readFileSync(join(repositoryRoot, 'global.json'), 'utf8'),
).sdk;
assert.deepEqual(
  sdkPolicy,
  { version: '8.0.400', rollForward: 'latestPatch' },
  'global.json must remain on the pinned .NET 8 feature band and patch-only roll-forward policy.',
);

const weakeningProperty =
  /<(Nullable|TreatWarningsAsErrors|AnalysisLevel|AnalysisMode|EnableNETAnalyzers|EnforceCodeStyleInBuild|GenerateDocumentationFile|Deterministic|WarningsAsErrors|NoWarn|WarningsNotAsErrors)>/;
for (const project of walk(backendRoot, (path) => path.endsWith('.csproj'))) {
  assert.doesNotMatch(
    readFileSync(project, 'utf8'),
    weakeningProperty,
    `${repositoryPath(project)} must not override or suppress the shared compiler policy.`,
  );
}

const editorConfig = readFileSync(
  join(repositoryRoot, '.editorconfig'),
  'utf8',
);
for (const requiredPolicy of [
  'dotnet_style_namespace_match_folder = true:error',
  'dotnet_style_require_accessibility_modifiers = for_non_interface_members:error',
  'csharp_style_namespace_declarations = file_scoped:error',
  'csharp_using_directive_placement = outside_namespace:error',
  'dotnet_diagnostic.IDE0005.severity = error',
  'dotnet_diagnostic.IDE0044.severity = error',
  'dotnet_diagnostic.CS1591.severity = silent',
  'dotnet_naming_rule.member_constants_are_pascal_case.severity = error',
  'dotnet_naming_rule.local_constants_are_camel_case.severity = error',
  'dotnet_naming_rule.interfaces_begin_with_i.severity = error',
  'dotnet_naming_rule.async_methods_end_in_async.severity = error',
]) {
  assert.match(
    editorConfig,
    new RegExp(`^${requiredPolicy.replaceAll('.', '\\.')}\\s*$`, 'm'),
    `.editorconfig must retain: ${requiredPolicy}`,
  );
}
assert.doesNotMatch(
  editorConfig,
  /^\s*(?:dotnet_diagnostic\.[^.]+|dotnet_analyzer_diagnostic(?:\.category-[^.]+)?)\.severity\s*=\s*none\s*(?:#.*)?$/im,
  '.editorconfig must not hide compiler or analyzer diagnostics with severity=none.',
);
const nonErrorDiagnosticOverrides = [
  ...editorConfig.matchAll(
    /^\s*dotnet_diagnostic\.([^.]+)\.severity\s*=\s*(silent|suggestion|none)\s*$/gim,
  ),
].map((match) => `${match[1].toUpperCase()}=${match[2].toLowerCase()}`);
assert.deepEqual(
  nonErrorDiagnosticOverrides,
  ['CS1591=silent'],
  'CS1591 is the only approved non-error diagnostic override; it exists solely to enable IDE0005 without introducing XML-documentation policy.',
);
assert.equal(
  (
    editorConfig.match(
      /dotnet_naming_rule\.async_methods_end_in_async\.severity = suggestion/g,
    ) || []
  ).length,
  2,
  'Only the two xUnit project sections may relax async naming to suggestion severity.',
);
assert.equal(
  (
    editorConfig.match(
      /dotnet_style_namespace_match_folder = true:suggestion/g,
    ) || []
  ).length,
  2,
  'Only the two architecture-fixture files may relax namespace-folder matching.',
);

const invalidSuppressions = [];
const approvedNullForgivingInvariants = new Set([
  '// EF Core required-navigation materialization guarantees UserRole.User before navigation access.',
  '// EF Core required-navigation materialization guarantees UserRole.Role before navigation access.',
  '// EF Core required-navigation materialization guarantees RolePermission.Role before navigation access.',
  '// EF Core required-navigation materialization guarantees RolePermission.Permission before navigation access.',
  '// EF Core required-navigation materialization guarantees Session.User before navigation access.',
]);
const observedNullForgivingInvariants = [];
for (const source of walk(backendRoot, (path) => path.endsWith('.cs'))) {
  const content = readFileSync(source, 'utf8');
  const path = repositoryPath(source);
  const generated =
    /<auto-generated\s*\/?>/i.test(content) ||
    /\/Persistence\/\d{14}_.+\.cs$/.test(path) ||
    /\/Persistence\/.+ModelSnapshot\.cs$/.test(path);
  const lines = content.split(/\r?\n/);
  for (const [index, line] of lines.entries()) {
    if (/^\s*#nullable\s+disable\b/.test(line) && !generated) {
      invalidSuppressions.push(
        `${path}:${index + 1} disables nullable analysis`,
      );
    }
    if (/^\s*#pragma\s+warning\s+disable\s*$/.test(line)) {
      invalidSuppressions.push(`${path}:${index + 1} disables all warnings`);
    }
    if (
      /^\s*#pragma\s+warning\s+disable\s+/.test(line) &&
      !generated &&
      !/\/\/\s*\S/.test(line)
    ) {
      invalidSuppressions.push(`${path}:${index + 1} lacks a justification`);
    }
    const disabled = line.match(
      /^\s*#pragma\s+warning\s+disable\s+([^/]+?)(?:\s*\/\/|\s*$)/,
    );
    if (disabled) {
      if (
        !generated &&
        !/\/\/.*\b(?:remove|permanent)\b/i.test(line)
      ) {
        invalidSuppressions.push(
          `${path}:${index + 1} lacks a removal condition or permanent-contract rationale`,
        );
      }
      const diagnostics = disabled[1]
        .split(',')
        .map((diagnostic) => diagnostic.trim())
        .join('\\s*,\\s*');
      const restore = new RegExp(
        `^\\s*#pragma\\s+warning\\s+restore\\s+${diagnostics}\\s*$`,
        'm',
      );
      if (!restore.test(content)) {
        invalidSuppressions.push(
          `${path}:${index + 1} has no matching warning restore`,
        );
      }
    }
    const nullForgivingOperators = line.match(
      /\b(?:null|default)!|(?:[A-Za-z_]\w*|\)|\])!(?=[.\[,;)\]])/g,
    );
    if (nullForgivingOperators && !generated) {
      const invariant = lines[index - 1]?.trim();
      if (
        path ===
          'services/api/Proprium.Domain/Identity/IdentityEntities.cs' &&
        nullForgivingOperators.every((operator) => operator === 'null!') &&
        approvedNullForgivingInvariants.has(invariant)
      ) {
        observedNullForgivingInvariants.push(invariant);
      } else {
        invalidSuppressions.push(
          `${path}:${index + 1} uses an undocumented null-forgiving operator`,
        );
      }
    }
  }
  for (const suppression of content.matchAll(
    /\[\s*(?:assembly:\s*)?SuppressMessage\s*\([\s\S]*?\)\s*\]/g,
  )) {
    if (
      /Justification\s*=\s*"[^"]*(?:remove|permanent)[^"]*"/i.test(
        suppression[0],
      )
    )
      continue;
    const line = content.slice(0, suppression.index).split(/\r?\n/).length;
    invalidSuppressions.push(
      `${path}:${line} lacks a meaningful justification and removal/permanent-contract rationale`,
    );
  }
}

assert.deepEqual(
  observedNullForgivingInvariants.sort(),
  [...approvedNullForgivingInvariants].sort(),
  'The approved EF Core null-forgiving invariants must remain exact and documented.',
);

assert.deepEqual(
  invalidSuppressions,
  [],
  `Invalid backend suppressions:\n${invalidSuppressions.join('\n')}`,
);

console.log('Backend compiler policy: PASS');
