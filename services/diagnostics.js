const fs = require("fs");
const path = require("path");

function safeExists(targetPath) {
  try {
    return fs.existsSync(targetPath);
  } catch (error) {
    return false;
  }
}

function getProjectRoot() {
  return path.join(__dirname, "..");
}

function diagnosePath(target = "") {
  const projectRoot = getProjectRoot();
  const resolved = target ? path.resolve(projectRoot, target) : projectRoot;

  const exists = safeExists(resolved);
  let type = "missing";

  if (exists) {
    const stats = fs.statSync(resolved);
    if (stats.isDirectory()) type = "directory";
    if (stats.isFile()) type = "file";
  }

  return {
    target: target || ".",
    resolvedPath: resolved,
    exists,
    type,
  };
}

function diagnoseEnvironment() {
  const projectRoot = getProjectRoot();

  const checks = [
    { name: "cli.js", path: path.join(projectRoot, "cli.js") },
    { name: ".env", path: path.join(projectRoot, ".env") },
    { name: "services", path: path.join(projectRoot, "services") },
    { name: "tools", path: path.join(projectRoot, "tools") },
    { name: "memory", path: path.join(projectRoot, "memory") },
    { name: "logs", path: path.join(projectRoot, "logs") },
    { name: "history.json", path: path.join(projectRoot, "logs", "history.json") },
    { name: "memory.json", path: path.join(projectRoot, "memory", "memory.json") },
  ];

  const results = checks.map((check) => {
    const exists = safeExists(check.path);
    return {
      name: check.name,
      path: check.path,
      exists,
    };
  });

  const envState = {
    hasOpenAIKey:
      !!process.env.OPENAI_API_KEY &&
      process.env.OPENAI_API_KEY !== "your_api_key_here",
    nodeVersion: process.version,
    cwd: process.cwd(),
    projectRoot,
  };

  return {
    envState,
    checks: results,
  };
}

function formatDiagnosticReport(report) {
  if (report && report.envState && Array.isArray(report.checks)) {
    const lines = [];
    lines.push("=== Diagnostic Report ===");
    lines.push(`Node Version: ${report.envState.nodeVersion}`);
    lines.push(`Current Working Directory: ${report.envState.cwd}`);
    lines.push(`Project Root: ${report.envState.projectRoot}`);
    lines.push(`OpenAI Key Present: ${report.envState.hasOpenAIKey ? "Yes" : "No"}`);
    lines.push("");
    lines.push("Checks:");

    report.checks.forEach((check) => {
      lines.push(`- ${check.name}: ${check.exists ? "OK" : "MISSING"} (${check.path})`);
    });

    return lines.join("\n");
  }

  if (report && Object.prototype.hasOwnProperty.call(report, "resolvedPath")) {
    return [
      "=== Path Diagnostic ===",
      `Target: ${report.target}`,
      `Resolved Path: ${report.resolvedPath}`,
      `Exists: ${report.exists ? "Yes" : "No"}`,
      `Type: ${report.type}`,
    ].join("\n");
  }

  return "No diagnostic information available.";
}

module.exports = {
  diagnoseEnvironment,
  diagnosePath,
  formatDiagnosticReport,
};