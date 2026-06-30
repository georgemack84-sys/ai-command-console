#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = process.cwd();
const IGNORE_DIRS = new Set([
  ".git",
  ".next",
  "node_modules",
  "coverage",
  "test-results",
  "playwright-report",
]);

function hasFlag(name) {
  return process.argv.includes(name);
}

function safeGit(args) {
  try {
    return execFileSync("git", args, {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trimEnd();
  } catch (error) {
    return "";
  }
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), "utf8"));
}

function walk(relativeDir, visitor) {
  const absoluteDir = path.join(ROOT, relativeDir);
  if (!fs.existsSync(absoluteDir)) return;

  for (const entry of fs.readdirSync(absoluteDir, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(entry.name)) continue;

    const relativePath = path.join(relativeDir, entry.name);
    if (entry.isDirectory()) {
      visitor(relativePath, entry);
      walk(relativePath, visitor);
    } else {
      visitor(relativePath, entry);
    }
  }
}

function countTopLevelDirectories(relativeDir) {
  const absoluteDir = path.join(ROOT, relativeDir);
  if (!fs.existsSync(absoluteDir)) return 0;
  return fs.readdirSync(absoluteDir, { withFileTypes: true }).filter((entry) => entry.isDirectory()).length;
}

function collectRepositoryStatistics() {
  let totalFiles = 0;
  let sourceFiles = 0;
  let docs = 0;
  let tests = 0;
  let generatedCandidates = 0;
  const extensions = {};

  walk(".", (relativePath, entry) => {
    if (entry.isDirectory()) return;

    totalFiles += 1;
    const extension = path.extname(relativePath).toLowerCase() || "(none)";
    extensions[extension] = (extensions[extension] || 0) + 1;

    if (/\.(cjs|js|jsx|mjs|mts|ts|tsx)$/.test(relativePath)) sourceFiles += 1;
    if (relativePath.startsWith(`docs${path.sep}`)) docs += 1;
    if (relativePath.startsWith(`tests${path.sep}`) || relativePath.includes(`${path.sep}tests${path.sep}`)) tests += 1;
    if (
      relativePath.startsWith(`types${path.sep}`)
      || relativePath.startsWith(`services${path.sep}`)
      || relativePath.startsWith(`app${path.sep}api${path.sep}`)
    ) {
      if (/phase-|certification|contract|gate|engine|replay|governance|autonomy/.test(relativePath)) {
        generatedCandidates += 1;
      }
    }
  });

  return {
    totalFiles,
    sourceFiles,
    docs,
    tests,
    appRouteFamilies: countTopLevelDirectories("app"),
    apiFamilies: countTopLevelDirectories(path.join("app", "api")),
    serviceFamilies: countTopLevelDirectories("services"),
    unitTestFamilies: countTopLevelDirectories(path.join("tests", "unit")),
    typeFiles: fs.existsSync(path.join(ROOT, "types"))
      ? fs.readdirSync(path.join(ROOT, "types"), { withFileTypes: true }).filter((entry) => entry.isFile()).length
      : 0,
    generatedCandidates,
    largestExtensions: Object.entries(extensions)
      .sort((left, right) => right[1] - left[1])
      .slice(0, 12)
      .map(([extension, count]) => ({ extension, count })),
  };
}

function collectDirtyWorktree() {
  const status = safeGit(["status", "--short"]);
  const entries = status ? status.split(/\r?\n/).filter(Boolean) : [];
  const summary = entries.reduce(
    (accumulator, line) => {
      const marker = line.slice(0, 2);
      if (marker.includes("?")) accumulator.untracked += 1;
      else accumulator.modified += 1;
      return accumulator;
    },
    { total: entries.length, modified: 0, untracked: 0 },
  );

  return {
    ...summary,
    sample: entries.slice(0, 40),
  };
}

function collectScriptCoverage() {
  const packageJson = readJson("package.json");
  const scripts = packageJson.scripts || {};
  const required = [
    "verify:fast",
    "verify:changed",
    "verify:domain",
    "verify:phase",
    "verify:release",
    "verify:full",
    "lint",
    "typecheck",
    "test:unit",
    "test:legacy",
    "build",
  ];

  return {
    present: required.filter((name) => Boolean(scripts[name])),
    missing: required.filter((name) => !scripts[name]),
  };
}

function collectChangedFiles() {
  const status = safeGit(["status", "--short"]);
  if (!status) return [];
  return status.split(/\r?\n/).filter(Boolean).map((line) => line.slice(3));
}

function collectChangedEntries() {
  const status = safeGit(["status", "--short"]);
  if (!status) return [];
  return status.split(/\r?\n/).filter(Boolean).map((line) => ({
    status: line.slice(0, 2),
    path: line.slice(3),
  }));
}

function classifyDirtyEntry(entry) {
  const normalized = entry.path.replaceAll("\\", "/");
  const status = entry.status.includes("?") ? "untracked" : "modified";

  const buildEntry = ({ category, risk, rationale, owner, purpose, lifecycle, reviewPath }) => ({
    status,
    path: entry.path,
    category,
    risk,
    owner,
    purpose,
    lifecycle,
    reviewPath,
    rationale,
  });

  if (
    normalized === "package.json"
    || normalized === "scripts/phase-8m-quality-gate.cjs"
    || normalized.startsWith("docs/phase-8m-")
    || normalized.startsWith("tests/unit/recommendation-resilience/")
    || normalized.startsWith("components/truth-ledger-completion/")
  ) {
    return buildEntry({
      category: "Phase 8M Stabilization",
      risk: "low",
      owner: "Mission Control reliability",
      purpose: "Repository stabilization, validation repair, classification, or certification evidence.",
      lifecycle: "Commit as Bundle A after scoped validation.",
      reviewPath: "Review with Phase 8M stabilization bundle only.",
      rationale: "Directly supports the stabilization bundle, validation repair, or Phase 8M evidence reporting.",
    });
  }

  if (
    normalized.startsWith("app/api/")
    || normalized.startsWith("types/")
    || normalized.startsWith("tests/unit/")
    || normalized.startsWith("components/governance-")
    || normalized.startsWith("components/integrity-")
    || normalized.startsWith("components/ledger-")
    || normalized.startsWith("components/replay-")
    || normalized.startsWith("components/truth-")
    || normalized.startsWith("components/visibility-")
    || normalized.startsWith("app/governance-")
    || normalized.startsWith("app/integrity-")
    || normalized.startsWith("app/ledger-")
    || normalized.startsWith("app/replay-")
    || normalized.startsWith("app/truth-")
    || normalized.startsWith("app/visibility-")
    || /^docs\/phase-(?!8m-)/.test(normalized)
    || /^services\/.*(contract|engine|gate|certification|governance|replay|autonomy|assurance|integrity|visibility|lineage|recommendation|recovery|planning|delegation|compliance|risk|policy|runtime|truth|workflow|task|query|boundary)/.test(normalized)
  ) {
    return buildEntry({
      category: "Generated Phase Expansion",
      risk: "high",
      owner: "Generated phase domain owner pending assignment",
      purpose: "Generated phase/API/service/type/test/documentation expansion.",
      lifecycle: "Do not merge with Bundle A; review as Bundle B by phase/domain.",
      reviewPath: "Generated expansion review, ownership assignment, domain validation, then separate merge.",
      rationale: "Matches generated or phase-expansion naming patterns and must be reviewed as a coherent phase/domain bundle.",
    });
  }

  if (normalized.startsWith("docs/")) {
    return buildEntry({
      category: "Documentation",
      risk: "medium",
      owner: "Architecture documentation",
      purpose: "Documentation, roadmap, architecture, or certification narrative outside Bundle A.",
      lifecycle: "Review in documentation reconciliation bundle.",
      reviewPath: "Documentation review after Bundle A and generated expansion separation.",
      rationale: "Documentation or roadmap material outside the active Phase 8M stabilization bundle.",
    });
  }

  if (normalized.includes("/test") || normalized.startsWith("tests/")) {
    return buildEntry({
      category: "Test Repairs",
      risk: "medium",
      owner: "Test/domain owner pending assignment",
      purpose: "Fixture correction, validation update, or regression coverage.",
      lifecycle: "Review with affected domain bundle unless explicitly included in Bundle A.",
      reviewPath: "Targeted test validation and owner review.",
      rationale: "Test or fixture change that requires targeted validation before bundling.",
    });
  }

  if (
    normalized.startsWith("app/")
    || normalized.startsWith("src/")
    || normalized.startsWith("services/")
    || normalized.startsWith("components/")
    || normalized === "next.config.ts"
  ) {
    return buildEntry({
      category: "Source Changes",
      risk: "high",
      owner: "Source/platform owner pending assignment",
      purpose: "Production, infrastructure, shared library, service, or UI source change.",
      lifecycle: "Review as Bundle C after Bundle A; validate with typecheck, lint, build, and affected tests.",
      reviewPath: "Source change review with explicit production impact assessment.",
      rationale: "Production, infrastructure, or source-surface change requiring owner review and release validation.",
    });
  }

  if (
    normalized.startsWith("logs/")
    || normalized.startsWith("coverage/")
    || normalized.startsWith("test-results/")
    || normalized.includes(".log")
    || normalized.includes(".tmp")
    || normalized.includes(".sqlite")
    || normalized.startsWith(".codex-temp")
  ) {
    return buildEntry({
      category: "Temporary",
      risk: "low",
      owner: "Repository hygiene",
      purpose: "Runtime residue, scratch output, temporary build/test artifact, or local state.",
      lifecycle: "Archive or remove only through reviewed cleanup.",
      reviewPath: "State cleanup review with no silent deletion.",
      rationale: "Runtime residue, generated artifact, or temporary file candidate.",
    });
  }

  if (
    normalized.startsWith("backups/")
    || normalized.includes("project-report")
    || normalized.includes("ai-command-console-report")
  ) {
    return buildEntry({
      category: "Archive Candidates",
      risk: "medium",
      owner: "Repository archive",
      purpose: "Legacy, duplicate, superseded, or historical material.",
      lifecycle: "Archive with manifest before removal.",
      reviewPath: "Archive review and manifest generation.",
      rationale: "Historical or backup material that should be archived before removal.",
    });
  }

  return buildEntry({
    category: "Experimental",
    risk: "medium",
    owner: "Experimental owner pending assignment",
    purpose: "Research, prototype, or incomplete work outside release boundary.",
    lifecycle: "Promote, defer, or archive after owner review.",
    reviewPath: "Experimental review; excluded from release until promoted.",
    rationale: "Unclassified work requiring manual owner assignment before inclusion in a release bundle.",
  });
}

function collectDirtyClassification() {
  const entries = collectChangedEntries().map(classifyDirtyEntry);
  const byCategory = entries.reduce((accumulator, entry) => {
    accumulator[entry.category] = (accumulator[entry.category] || 0) + 1;
    return accumulator;
  }, {});
  const byRisk = entries.reduce((accumulator, entry) => {
    accumulator[entry.risk] = (accumulator[entry.risk] || 0) + 1;
    return accumulator;
  }, {});

  return {
    total: entries.length,
    byCategory,
    byRisk,
    entries,
  };
}

function collectDomainCoverage() {
  const servicesDir = path.join(ROOT, "services");
  const testsDir = path.join(ROOT, "tests", "unit");
  const services = fs.existsSync(servicesDir)
    ? fs.readdirSync(servicesDir, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort()
    : [];
  const tests = new Set(
    fs.existsSync(testsDir)
      ? fs.readdirSync(testsDir, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name)
      : [],
  );

  const covered = services.filter((service) => tests.has(service));
  const uncovered = services.filter((service) => !tests.has(service));

  return {
    serviceFamilies: services.length,
    serviceFamiliesWithUnitTests: covered.length,
    serviceFamiliesWithoutUnitTests: uncovered.length,
    uncoveredSample: uncovered.slice(0, 50),
  };
}

function collectPhaseCoverage() {
  const docsDir = path.join(ROOT, "docs");
  const phaseDocs = fs.existsSync(docsDir)
    ? fs.readdirSync(docsDir, { withFileTypes: true })
        .filter((entry) => entry.isFile() && /^phase-/.test(entry.name))
        .map((entry) => entry.name)
        .sort()
    : [];

  return {
    phaseDocs: phaseDocs.length,
    latestPhaseDocs: phaseDocs.slice(-30),
    hasPhase8M: phaseDocs.includes("phase-8m-mission-control-consolidation-reliability-gate.md"),
  };
}

function classifyCertification({ dirtyWorktree, scriptCoverage }) {
  const blockers = [];
  if (dirtyWorktree.total > 0) blockers.push("DIRTY_WORKTREE_UNRESOLVED");
  if (scriptCoverage.missing.length > 0) blockers.push("VERIFICATION_TIERS_MISSING");

  return {
    state: blockers.length === 0 ? "CONDITIONAL_PASS" : "FAIL",
    blockers,
    note:
      blockers.length === 0
        ? "Read-only repository checks passed. Execute release gates before PASS."
        : "Phase 8M cannot certify PASS until blockers and runtime gate failures are resolved.",
  };
}

function buildReport() {
  const dirtyWorktree = collectDirtyWorktree();
  const scriptCoverage = collectScriptCoverage();
  const report = {
    phase: "8M",
    name: "Mission Control Consolidation and Reliability Gate",
    generatedAt: new Date().toISOString(),
    mode: hasFlag("--classify") ? "classify" : hasFlag("--changed") ? "changed" : hasFlag("--domain") ? "domain" : hasFlag("--phase") ? "phase" : "inventory",
    repository: {
      branch: safeGit(["branch", "--show-current"]) || null,
      head: safeGit(["rev-parse", "--short", "HEAD"]) || null,
      statistics: collectRepositoryStatistics(),
      dirtyWorktree,
    },
    verification: {
      scriptCoverage,
    },
    certification: null,
  };

  if (hasFlag("--changed")) {
    report.changedFiles = collectChangedFiles();
  }

  if (hasFlag("--classify") || hasFlag("--changed")) {
    report.dirtyClassification = collectDirtyClassification();
  }

  if (hasFlag("--domain")) {
    report.domainCoverage = collectDomainCoverage();
  }

  if (hasFlag("--phase")) {
    report.phaseCoverage = collectPhaseCoverage();
  }

  report.certification = classifyCertification({
    dirtyWorktree,
    scriptCoverage,
  });

  return report;
}

console.log(JSON.stringify(buildReport(), null, 2));
