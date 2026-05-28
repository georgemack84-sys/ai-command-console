const { createRequire } = require("module");

let cachedTsxRequire = null;

function loadTsxRequire() {
  if (cachedTsxRequire) {
    return cachedTsxRequire;
  }

  // Keep the tsx bridge runtime-only so Next's server bundler does not try to
  // statically follow tsx -> esbuild and parse declaration files.
  const runtimeRequire = createRequire(__filename);
  const packageName = ["tsx", "cjs", "api"].join("/");
  const tsxApi = runtimeRequire(packageName);

  if (!tsxApi || typeof tsxApi.require !== "function") {
    throw new Error("TSX_RUNTIME_BRIDGE_UNAVAILABLE");
  }

  cachedTsxRequire = tsxApi.require;
  return cachedTsxRequire;
}

function requireTypeScriptModule(modulePath, parentPath = __filename) {
  return loadTsxRequire()(modulePath, parentPath);
}

module.exports = {
  requireTypeScriptModule,
};
