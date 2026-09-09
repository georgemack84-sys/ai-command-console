const { posix } = require('node:path');
const ts = require('typescript');
const yaml = require('js-yaml');

const prohibitedArtifact = /(^|\/)(node_modules|\.next(?:-production)?|\.idea|\.vs|bin|coverage|obj|playwright-artifacts|playwright-report|storybook-static|TestResults|test-results)(\/|$)|(^|\/)(\.DS_Store|Thumbs\.db)$|\.sqlite(?:-shm|-wal)?$|\.tsbuildinfo$|\.user$/i;
const forbiddenLockfile = /(^|\/)(pnpm-lock\.yaml|yarn\.lock|bun\.lockb?|npm-shrinkwrap\.json)$/i;
const weakeningProperty = /<(Nullable|TreatWarningsAsErrors|AnalysisLevel|EnableNETAnalyzers|Deterministic|NoWarn|WarningsNotAsErrors)(?:\s[^>]*)?>/;

function categoryFor(id) {
  const family = id.split('-')[1];
  return new Map([
    ['FILE', 'repository-structure'],
    ['GIT', 'repository-hygiene'],
    ['TEXT', 'text-content'],
    ['JSON', 'json'],
    ['YAML', 'yaml'],
    ['MD', 'markdown'],
    ['SCHEMA', 'schema'],
    ['EXCEPTION', 'exception-governance'],
    ['NODE', 'node-configuration'],
    ['DOTNET', 'dotnet-configuration'],
    ['ENV', 'environment-configuration'],
    ['SECRET', 'secret-boundary'],
  ]).get(family) ?? 'repository-validation';
}

function splitLocation(path) {
  const match = path.match(/^(.*):(\d+)(?::(\d+))?$/);
  return match
    ? { file: match[1], location: { line: Number(match[2]), column: match[3] ? Number(match[3]) : null } }
    : { file: path, location: null };
}

function validationResult(id, path, problem, expected, severity = 'error') {
  const { file, location } = splitLocation(path);
  return { id, category: categoryFor(id), severity, file, location, path, problem, expected };
}

function issue(id, path, problem, expected) {
  return validationResult(id, path, problem, expected);
}

function isLocalEnvironment(path) {
  const name = posix.basename(path);
  return (name === '.env' || name.startsWith('.env.')) && !name.endsWith('.example');
}

function validateRequiredFiles(required, existing, tracked) {
  const violations = [];
  for (const path of required) {
    if (!existing.has(path)) {
      violations.push(issue('RVAL-FILE-001', path, 'required repository file is missing', 'restore the canonical tracked file'));
    } else if (!tracked.has(path)) {
      violations.push(issue('RVAL-FILE-002', path, 'required repository file is not tracked', 'add the canonical file to Git'));
    }
  }
  return violations;
}

function validateTrackedPaths(paths, approvedLocalConfigurations = new Set()) {
  const violations = [];
  for (const path of paths) {
    if (isLocalEnvironment(path) && !approvedLocalConfigurations.has(path)) {
      violations.push(issue('RVAL-GIT-001', path, 'local environment configuration is tracked', 'track only approved examples or repository-owned test profiles'));
    }
    if (prohibitedArtifact.test(path)) {
      violations.push(issue('RVAL-GIT-002', path, 'generated, IDE, OS, or machine-local artifact is tracked', 'remove the artifact from Git and retain the applicable ignore rule'));
    }
  }
  return violations;
}

function validateJson(path, content) {
  if (/^tsconfig(?:\..+)?\.json$/i.test(posix.basename(path))) {
    const parsed = ts.parseConfigFileTextToJson(path, content);
    return parsed.error
      ? [issue('RVAL-JSON-001', path, ts.flattenDiagnosticMessageText(parsed.error.messageText, '\n'), 'valid JSON-with-comments syntax')]
      : [];
  }
  try {
    JSON.parse(content);
    return [];
  } catch (error) {
    return [issue('RVAL-JSON-001', path, error.message, 'valid strict JSON syntax')];
  }
}

function schemaPath(path, segment) {
  return path ? `${path}.${segment}` : segment;
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function matchesType(value, type) {
  return (type === 'object' && isObject(value)) ||
    (type === 'array' && Array.isArray(value)) ||
    (type === 'string' && typeof value === 'string') ||
    (type === 'boolean' && typeof value === 'boolean') ||
    (type === 'number' && typeof value === 'number' && Number.isFinite(value)) ||
    (type === 'integer' && Number.isInteger(value)) ||
    (type === 'null' && value === null);
}

function sameJsonValue(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function validateJsonSchema(instance, schema, path, location = '') {
  const violations = [];
  const at = location || '$';
  const report = (problem, expected) => violations.push(issue('RVAL-SCHEMA-001', `${path}:${at}`, problem, expected));

  if (!isObject(schema)) {
    report('registered schema is not a JSON object', 'a JSON Schema object');
    return violations;
  }
  if (schema.type !== undefined && !matchesType(instance, schema.type)) {
    report(`value has type ${Array.isArray(instance) ? 'array' : instance === null ? 'null' : typeof instance}`, `type ${schema.type}`);
    return violations;
  }
  if (schema.const !== undefined && !sameJsonValue(instance, schema.const)) {
    report(`value does not equal ${JSON.stringify(schema.const)}`, `constant ${JSON.stringify(schema.const)}`);
  }
  if (schema.enum !== undefined && !schema.enum.some((value) => sameJsonValue(instance, value))) {
    report(`value does not match any allowed value`, `one of ${schema.enum.map((value) => JSON.stringify(value)).join(', ')}`);
  }
  if (typeof instance === 'string' && schema.minLength !== undefined && instance.length < schema.minLength) {
    report(`string has length ${instance.length}`, `minimum length ${schema.minLength}`);
  }
  if (Array.isArray(instance)) {
    if (schema.minItems !== undefined && instance.length < schema.minItems) {
      report(`array contains ${instance.length} item(s)`, `at least ${schema.minItems} item(s)`);
    }
    if (schema.maxItems !== undefined && instance.length > schema.maxItems) {
      report(`array contains ${instance.length} item(s)`, `at most ${schema.maxItems} item(s)`);
    }
    if (schema.items !== undefined) {
      for (const [index, value] of instance.entries()) {
        violations.push(...validateJsonSchema(value, schema.items, path, `${at}[${index}]`));
      }
    }
  }
  if (isObject(instance)) {
    for (const property of schema.required ?? []) {
      if (!Object.hasOwn(instance, property)) {
        report(`required property is missing: ${property}`, `property ${property} to be present`);
      }
    }
    const properties = schema.properties ?? {};
    if (schema.additionalProperties === false) {
      for (const property of Object.keys(instance)) {
        if (!Object.hasOwn(properties, property)) {
          report(`property is not allowed: ${property}`, 'only properties defined by the registered schema');
        }
      }
    }
    for (const [property, propertySchema] of Object.entries(properties)) {
      if (Object.hasOwn(instance, property)) {
        violations.push(...validateJsonSchema(instance[property], propertySchema, path, schemaPath(at === '$' ? '' : at, property)));
      }
    }
  }
  return violations;
}

function isValidDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function hasValidExceptionShape(exception) {
  return isObject(exception) &&
    /^RVAL-(?!EXCEPTION-)[A-Z]+-\d{3}$/.test(exception.ruleId ?? '') &&
    typeof exception.path === 'string' && exception.path.length > 0 &&
    !exception.path.startsWith('/') && !exception.path.includes('\\') && !exception.path.split('/').includes('..') &&
    typeof exception.reason === 'string' && exception.reason.trim().length > 0 &&
    typeof exception.owner === 'string' && exception.owner.trim().length > 0 &&
    isValidDate(exception.expiresOn);
}

function validateExceptionRegistry(exceptions, today = new Date().toISOString().slice(0, 10)) {
  const violations = [];
  const seen = new Set();
  for (const [index, exception] of exceptions.entries()) {
    const path = `scripts/repository-validation-exceptions.cjs:exceptions[${index}]`;
    if (!hasValidExceptionShape(exception)) {
      violations.push(issue('RVAL-EXCEPTION-001', path, 'exception must specify a non-exception rule ID, repository-relative path, owner, reason, and ISO expiry date', 'a complete, narrowly scoped exception record'));
      continue;
    }
    const key = `${exception.ruleId}\0${exception.path}`;
    if (seen.has(key)) {
      violations.push(issue('RVAL-EXCEPTION-002', path, `duplicates exception for ${exception.ruleId} at ${exception.path}`, 'one exception per rule and exact path'));
    }
    seen.add(key);
    if (exception.expiresOn <= today) {
      violations.push(issue('RVAL-EXCEPTION-003', path, `exception expired on ${exception.expiresOn}`, 'remove it or replace it with a newly reviewed exception'));
    }
  }
  return violations;
}

function applyExceptions(violations, exceptions, today = new Date().toISOString().slice(0, 10)) {
  const active = exceptions.filter((exception) => hasValidExceptionShape(exception) && exception.expiresOn > today);
  const used = new Set();
  const remaining = violations.filter((violation) => {
    const index = active.findIndex((exception) => exception.ruleId === violation.id && exception.path === violation.file);
    if (index === -1) return true;
    used.add(index);
    return false;
  });
  const unused = active
    .map((exception, index) => ({ exception, index }))
    .filter(({ index }) => !used.has(index))
    .map(({ exception, index }) => issue(
      'RVAL-EXCEPTION-004',
      `scripts/repository-validation-exceptions.cjs:exceptions[${index}]`,
      `exception for ${exception.ruleId} at ${exception.path} did not suppress a current violation`,
      'remove the obsolete exception',
    ));
  return { remaining, unused };
}

function validateYaml(path, content) {
  try {
    yaml.load(content, { json: false });
  } catch (error) {
    return [issue('RVAL-YAML-001', path, error.message, 'valid YAML syntax')];
  }
  const violations = [];
  for (const [index, line] of content.split(/\r?\n/).entries()) {
    if (/^\s*#|^\s*$/.test(line)) continue;
    if (/\t/.test(line)) {
      violations.push(issue('RVAL-YAML-002', `${path}:${index + 1}`, 'YAML indentation contains a tab', 'spaces with two-column indentation'));
    }
    const mapping = line.match(/^( *)([A-Za-z0-9_.-]+):(?:\s|$)/);
    if (mapping && mapping[1].length % 2) {
      violations.push(issue('RVAL-YAML-002', `${path}:${index + 1}`, 'YAML mapping uses odd indentation', 'spaces with two-column indentation'));
    }
  }
  return violations;
}

function markdownAnchors(content) {
  const counts = new Map();
  const anchors = new Set();
  for (const line of content.split(/\r?\n/)) {
    const heading = line.match(/^ {0,3}#{1,6}\s+(.+?)(?:\s+#+)?\s*$/);
    if (!heading) continue;
    const base = heading[1]
      .replace(/[`*_~]/g, '')
      .toLocaleLowerCase()
      .trim()
      .replace(/[^\p{L}\p{N}\s-]/gu, '')
      .replace(/\s+/g, '-');
    if (!base) continue;
    const occurrence = counts.get(base) ?? 0;
    counts.set(base, occurrence + 1);
    anchors.add(occurrence === 0 ? base : `${base}-${occurrence}`);
  }
  return anchors;
}

function decodeFragment(fragment) {
  try {
    return decodeURIComponent(fragment).toLocaleLowerCase();
  } catch {
    return fragment.toLocaleLowerCase();
  }
}

function validateMarkdown(path, content, targetExists = () => true, targetContent = () => null) {
  const violations = [];
  const fences = (content.match(/^\s*```/gm) ?? []).length;
  if (fences % 2) {
    violations.push(issue('RVAL-MD-001', path, 'fenced code block is not closed', 'balanced Markdown fences'));
  }
  let previousLevel = 0;
  for (const [index, line] of content.split(/\r?\n/).entries()) {
    const heading = line.match(/^(#{1,6})\s+\S/);
    if (!heading) continue;
    const level = heading[1].length;
    if (previousLevel && level > previousLevel + 1) {
      violations.push(issue('RVAL-MD-002', `${path}:${index + 1}`, 'heading hierarchy skips a level', 'increase heading depth one level at a time'));
    }
    previousLevel = level;
  }
  for (const match of content.matchAll(/\]\(([^)\s]+)\)/g)) {
    const reference = match[1];
    if (/^(https?:|mailto:)/i.test(reference)) continue;
    const separator = reference.indexOf('#');
    const target = separator === -1 ? reference : reference.slice(0, separator);
    const fragment = separator === -1 ? null : reference.slice(separator + 1);
    const resolved = target ? posix.normalize(posix.join(posix.dirname(path), target)) : path;
    const line = content.slice(0, match.index).split(/\r?\n/).length;
    if (!targetExists(resolved)) {
      violations.push(issue('RVAL-MD-003', `${path}:${line}`, `local link target does not exist: ${target}`, 'a tracked or present repository-local target'));
      continue;
    }
    if (fragment !== null && fragment !== '') {
      const targetMarkdown = resolved === path ? content : targetContent(resolved);
      if (targetMarkdown === null || !markdownAnchors(targetMarkdown).has(decodeFragment(fragment))) {
        violations.push(issue('RVAL-MD-004', `${path}:${line}`, `local link anchor does not exist: #${fragment} in ${resolved}`, 'a heading anchor in the linked Markdown document'));
      }
    }
  }
  return violations;
}

function validatePackageManager(paths) {
  const pathSet = new Set(paths);
  const violations = [];
  for (const required of ['package-lock.json', 'apps/web/package-lock.json']) {
    if (!pathSet.has(required)) {
      violations.push(issue('RVAL-NODE-001', required, 'canonical npm lockfile is missing', 'a tracked npm lockfile for each package root'));
    }
  }
  for (const path of paths) {
    if (forbiddenLockfile.test(path)) {
      violations.push(issue('RVAL-NODE-002', path, 'conflicting package-manager lockfile is tracked', 'npm package-lock.json only'));
    }
  }
  return violations;
}

function validateConfigurationAuthority(paths) {
  const violations = [];
  const allowed = new Map([
    ['.editorconfig', new Set(['.editorconfig'])],
    ['Directory.Build.props', new Set(['Directory.Build.props'])],
    ['Directory.Build.targets', new Set(['Directory.Build.targets'])],
  ]);
  for (const path of paths) {
    const name = posix.basename(path);
    if (allowed.has(name) && !allowed.get(name).has(path)) {
      violations.push(issue('RVAL-FILE-004', path, `duplicates canonical ${name} authority`, `use the repository-root ${name}`));
    }
    if (path.startsWith('apps/web/') && /(^|\/)(?:prettier\.config\.[^.]+|\.prettierrc(?:\..+)?)$/i.test(path) && path !== 'apps/web/.prettierrc.json') {
      violations.push(issue('RVAL-NODE-003', path, 'duplicates the canonical frontend Prettier configuration', 'use apps/web/.prettierrc.json'));
    }
  }
  return violations;
}

function validateDotnetProjects(projects) {
  const violations = [];
  for (const [path, content] of projects) {
    const match = content.match(weakeningProperty);
    if (match) {
      violations.push(issue('RVAL-DOTNET-001', path, `project overrides shared compiler property ${match[1]}`, 'inherit the enforced Directory.Build.props and Directory.Build.targets policy'));
    }
  }
  return violations;
}

function validateSolutionCoverage(solutionPath, solutionContent, projectPaths) {
  const included = new Set(
    [...solutionContent.matchAll(/^Project\([^\n]+?=\s*"[^"]+",\s*"([^"]+\.csproj)"/gm)]
      .map((match) => `services/api/${match[1].replaceAll('\\', '/')}`),
  );
  return projectPaths
    .filter((path) => !included.has(path))
    .map((path) => issue('RVAL-DOTNET-002', path, `project is absent from ${solutionPath}`, 'include every canonical Proprium project in the backend solution'));
}

module.exports = {
  categoryFor,
  applyExceptions,
  validationResult,
  validateExceptionRegistry,
  validateConfigurationAuthority,
  validateDotnetProjects,
  validateJson,
  validateJsonSchema,
  validateMarkdown,
  markdownAnchors,
  validatePackageManager,
  validateRequiredFiles,
  validateSolutionCoverage,
  validateTrackedPaths,
  validateYaml,
};
