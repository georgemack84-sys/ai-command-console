const fs = require("fs");
const path = require("path");
const { loadJsonDocument } = require("./documentStore");
const helloPlugin = require("../plugins/helloPlugin");
const projectReportPlugin = require("../plugins/projectReportPlugin");

const configPath = path.join(__dirname, "../config/plugins.json");
const PLUGINS_KEY = "config.plugins";
const DEFAULT_TIMEOUT_MS = 5_000;
const MAX_OUTPUT_LENGTH = 64_000;
const SUPPORTED_CAPABILITIES = Object.freeze(["workspace.list"]);

const PLUGIN_REGISTRY = Object.freeze({
  helloPlugin,
  projectReportPlugin,
});

function loadPluginConfig() {
  try {
    return loadJsonDocument(PLUGINS_KEY, configPath, { enabled: [] }, (value) => ({
      enabled: Array.isArray(value?.enabled) ? value.enabled : [],
    }));
  } catch (error) {
    return { enabled: [] };
  }
}

function getEnabledPluginNames() {
  const config = loadPluginConfig();
  return Array.isArray(config.enabled) ? config.enabled : [];
}

function normalizeManifest(registryName, plugin) {
  if (!plugin || typeof plugin.run !== "function") {
    throw new Error("Plugin does not export a run() function.");
  }

  const manifest = plugin.manifest;
  if (!manifest || typeof manifest !== "object") {
    throw new Error("Plugin does not export an isolation manifest.");
  }
  if (manifest.name !== registryName) {
    throw new Error(`Plugin manifest name must match its registry key: ${registryName}`);
  }

  const capabilities = Array.isArray(manifest.capabilities) ? manifest.capabilities : null;
  if (!capabilities || capabilities.some((capability) => typeof capability !== "string")) {
    throw new Error("Plugin manifest capabilities must be an array of strings.");
  }
  if (new Set(capabilities).size !== capabilities.length) {
    throw new Error("Plugin manifest capabilities must be unique.");
  }

  const unsupported = capabilities.find((capability) => !SUPPORTED_CAPABILITIES.includes(capability));
  if (unsupported) {
    throw new Error(`Plugin requests an unsupported capability: ${unsupported}`);
  }

  return Object.freeze({
    name: manifest.name,
    version: String(manifest.version || "0.0.0"),
    capabilities: Object.freeze([...capabilities]),
  });
}

function resolveWorkspacePath(workspaceRoot, requestedPath) {
  const root = fs.realpathSync(path.resolve(workspaceRoot));
  const target = fs.realpathSync(path.resolve(root, requestedPath || "."));
  const relative = path.relative(root, target);
  if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error("Plugin workspace access must remain inside the configured workspace root.");
  }
  return { target, relative: relative || "." };
}

function createCapabilities(manifest, workspaceRoot) {
  const capabilities = Object.create(null);

  if (manifest.capabilities.includes("workspace.list")) {
    capabilities.listWorkspaceDirectory = (requestedPath = ".") => {
      const resolved = resolveWorkspacePath(workspaceRoot, requestedPath);
      const entries = fs.readdirSync(/* turbopackIgnore: true */ resolved.target, { withFileTypes: true });
      return Object.freeze({
        path: resolved.relative,
        directories: Object.freeze(entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort()),
        files: Object.freeze(entries.filter((entry) => entry.isFile()).map((entry) => entry.name).sort()),
      });
    };
  }

  return Object.freeze(capabilities);
}

function createPluginRuntime(options = {}) {
  const registry = options.registry || PLUGIN_REGISTRY;
  const enabledPluginNames = options.enabledPluginNames || getEnabledPluginNames;
  const workspaceRoot = path.resolve(options.workspaceRoot || process.cwd());
  const timeoutMs = Number.isFinite(options.timeoutMs) ? Math.max(1, options.timeoutMs) : DEFAULT_TIMEOUT_MS;
  const maxOutputLength = Number.isFinite(options.maxOutputLength)
    ? Math.max(1, options.maxOutputLength)
    : MAX_OUTPUT_LENGTH;

  function loadPlugins() {
    const enabledNames = enabledPluginNames();
    const loaded = [];

    for (const name of enabledNames) {
      try {
        const plugin = registry[name];
        if (!plugin) {
          loaded.push({ name, loaded: false, error: `Plugin is not registered: ${name}` });
          continue;
        }

        const manifest = normalizeManifest(name, plugin);
        loaded.push({
          name: manifest.name,
          version: manifest.version,
          description: plugin.description || "No description",
          capabilities: manifest.capabilities,
          isolation: "host-capability",
          loaded: true,
          plugin,
          manifest,
        });
      } catch (error) {
        loaded.push({
          name,
          loaded: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return loaded;
  }

  function listPlugins() {
    return loadPlugins().map((entry) => ({
      name: entry.name,
      version: entry.version || null,
      description: entry.description || "No description",
      capabilities: entry.capabilities || [],
      isolation: entry.isolation || null,
      loaded: !!entry.loaded,
      error: entry.error || null,
    }));
  }

  async function runPlugin(name, context = {}) {
    const plugins = loadPlugins();
    const match = plugins.find((plugin) => String(plugin.name).toLowerCase() === String(name).toLowerCase());

    if (!match) {
      return `Plugin not found or not enabled: ${name}`;
    }
    if (!match.loaded || !match.plugin || !match.manifest) {
      return `Plugin failed to load: ${match.error || match.name}`;
    }

    const pluginContext = Object.freeze({
      input: String(context.input || ""),
      pluginArg: String(context.pluginArg || context.payload || ""),
      capabilities: createCapabilities(match.manifest, workspaceRoot),
    });

    let timer;
    try {
      const result = await Promise.race([
        Promise.resolve().then(() => match.plugin.run(pluginContext)),
        new Promise((_, reject) => {
          timer = setTimeout(() => reject(new Error(`Plugin execution timed out after ${timeoutMs}ms.`)), timeoutMs);
        }),
      ]);
      if (typeof result !== "string") {
        throw new Error("Plugin output must be a string.");
      }
      if (result.length > maxOutputLength) {
        throw new Error(`Plugin output exceeds the ${maxOutputLength}-character limit.`);
      }
      return result;
    } finally {
      clearTimeout(timer);
    }
  }

  return Object.freeze({ loadPlugins, listPlugins, runPlugin });
}

const defaultRuntime = createPluginRuntime();

module.exports = {
  loadPlugins: defaultRuntime.loadPlugins,
  listPlugins: defaultRuntime.listPlugins,
  runPlugin: defaultRuntime.runPlugin,
  createPluginRuntime,
  resolveWorkspacePath,
};
