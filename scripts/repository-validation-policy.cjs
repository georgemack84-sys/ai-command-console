const { posix } = require('node:path');
const ts = require('typescript');
const yaml = require('js-yaml');

const prohibitedArtifact = /(^|\/)(node_modules|\.next|\.idea|\.vs|bin|coverage|obj|playwright-artifacts|playwright-report|storybook-static|TestResults|test-results)(\/|$)|(^|\/)(\.DS_Store|Thumbs\.db)$|\.sqlite(?:-shm|-wal)?$|\.tsbuildinfo$|\.user$/i;
const forbiddenLockfile = /(^|\/)(pnpm-lock\.yaml|yarn\.lock|bun\.lockb?|npm-shrinkwrap\.json)$/i;
const weakeningProperty = /<(Nullable|TreatWarningsAsErrors|AnalysisLevel|EnableNETAnalyzers|Deterministic|NoWarn|WarningsNotAsErrors)(?:\s[^>]*)?>/;

function issue(id, path, problem, expected) {
  return { id, path, problem, expected };
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

function validateMarkdown(path, content, targetExists = () => true) {
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
  for (const match of content.matchAll(/\]\(([^)#]+)(?:#[^)]+)?\)/g)) {
    const target = match[1];
    if (/^(https?:|mailto:)/.test(target)) continue;
    const resolved = posix.normalize(posix.join(posix.dirname(path), target));
    if (!targetExists(resolved)) {
      violations.push(issue('RVAL-MD-003', path, `local link target does not exist: ${target}`, 'a tracked or present repository-local target'));
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
  validateConfigurationAuthority,
  validateDotnetProjects,
  validateJson,
  validateMarkdown,
  validatePackageManager,
  validateRequiredFiles,
  validateSolutionCoverage,
  validateTrackedPaths,
  validateYaml,
};
