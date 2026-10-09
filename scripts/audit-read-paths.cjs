const fs = require("fs");
const path = require("path");

const APP_API_ROOT = path.join(process.cwd(), "app", "api");
const EXCEPTION_PREFIXES = ["auth", "health", "ready"];

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}

function classifyReadRoute(routePath) {
  if (EXCEPTION_PREFIXES.some((prefix) => routePath === prefix || routePath.startsWith(`${prefix}/`))) return "operational_exception";
  if (routePath === "console" || routePath.startsWith("console/")) return "console_read";
  if (routePath.startsWith("v1/")) return "versioned_observability";
  return "authenticated_read";
}

function inventoryReadPaths(root = APP_API_ROOT) {
  return walk(root)
    .filter((file) => path.basename(file) === "route.ts")
    .filter((file) => /export\s+(async\s+)?function\s+GET\b|export\s+const\s+GET\b/.test(fs.readFileSync(file, "utf8")))
    .map((file) => path.relative(root, path.dirname(file)).replaceAll(path.sep, "/") || ".")
    .sort()
    .map((routePath) => ({ routePath, classification: classifyReadRoute(routePath) }));
}

if (require.main === module) {
  const inventory = inventoryReadPaths();
  process.stdout.write(`${JSON.stringify({ count: inventory.length, inventory }, null, 2)}\n`);
}

module.exports = { classifyReadRoute, inventoryReadPaths };
