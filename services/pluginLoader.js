const fs = require("fs");
const path = require("path");
const { loadJsonDocument } = require("./documentStore");
const helloPlugin = require("../plugins/helloPlugin");
const projectReportPlugin = require("../plugins/projectReportPlugin");

const configPath = path.join(__dirname, "../config/plugins.json");
const PLUGINS_KEY = "config.plugins";
const DEFAULT_TIMEOUT_MS = 5_000;
const MAX_OUTPUT_LENGTH = 64_000;
const HOST_API_VERSION = 1;
const CAPABILITY_CATALOG = Object.freeze({
  "workspace.list": Object.freeze({
    name: "workspace.list",
    version: 1,
    scope: "workspace",
    access: "read",
    sideEffects: false,
    methods: Object.freeze(["listWorkspaceDirectory"]),
    security: Object.freeze({
      status: "qualified",
      evidence: Object.freeze(["tests/unit/plugin-isolation.test.ts"]),
    }),
    compatibility: Object.freeze({
      status: "qualified",
      hostApiVersion: HOST_API_VERSION,
      evidence: Object.freeze(["tests/unit/plugin-capability-admission.test.ts"]),
    }),
  }),
});

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

function qualifyCapabilityBinding(binding, capabilityCatalog) {
  if (!binding || typeof binding !== "object" || typeof binding.name !== "string") {
    throw new Error("Plugin manifest capabilities must declare a name and version.");
  }
  if (!Number.isInteger(binding.version) || binding.version < 1) {
    throw new Error(`Plugin capability ${binding.name} must declare a positive integer version.`);
  }

  const contract = capabilityCatalog[binding.name];
  if (!contract) {
    throw new Error(`Plugin requests an unsupported capability: ${binding.name}`);
  }
  if (
    contract.name !== binding.name ||
    !Number.isInteger(contract.version) ||
    typeof contract.scope !== "string" ||
    contract.scope.length === 0 ||
    !["read", "write", "execute"].includes(contract.access) ||
    typeof contract.sideEffects !== "boolean" ||
    !Array.isArray(contract.methods) ||
    contract.methods.length === 0 ||
    contract.methods.some((method) => typeof method !== "string" || method.length === 0) ||
    new Set(contract.methods).size !== contract.methods.length
  ) {
    throw new Error(`Plugin capability ${binding.name} has an incomplete host contract.`);
  }
  if (contract.name !== binding.name || contract.version !== binding.version) {
    throw new Error(
      `Plugin capability ${binding.name} version ${binding.version} is incompatible with host version ${contract.version}.`,
    );
  }
  if (contract.compatibility?.hostApiVersion !== HOST_API_VERSION) {
    throw new Error(`Plugin capability ${binding.name} is not compatible with host API ${HOST_API_VERSION}.`);
  }
  if (
    contract.security?.status !== "qualified" ||
    !Array.isArray(contract.security.evidence) ||
    contract.security.evidence.length === 0
  ) {
    throw new Error(`Plugin capability ${binding.name} lacks security qualification evidence.`);
  }
  if (
    contract.compatibility?.status !== "qualified" ||
    !Array.isArray(contract.compatibility.evidence) ||
    contract.compatibility.evidence.length === 0
  ) {
    throw new Error(`Plugin capability ${binding.name} lacks compatibility qualification evidence.`);
  }

  return Object.freeze({ name: binding.name, version: binding.version });
}

function normalizeManifest(registryName, plugin, capabilityCatalog) {
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
  if (manifest.hostApiVersion !== HOST_API_VERSION) {
    throw new Error(
      `Plugin host API version ${String(manifest.hostApiVersion)} is incompatible with host API ${HOST_API_VERSION}.`,
    );
  }

  const capabilities = Array.isArray(manifest.capabilities) ? manifest.capabilities : null;
  if (!capabilities) {
    throw new Error("Plugin manifest capabilities must be an array.");
  }
  if (new Set(capabilities.map((capability) => capability?.name)).size !== capabilities.length) {
    throw new Error("Plugin manifest capabilities must be unique.");
  }

  const capabilityBindings = capabilities.map((capability) => qualifyCapabilityBinding(capability, capabilityCatalog));

  return Object.freeze({
    name: manifest.name,
    version: String(manifest.version || "0.0.0"),
    hostApiVersion: manifest.hostApiVersion,
    capabilities: Object.freeze(capabilityBindings.map((capability) => capability.name)),
    capabilityBindings: Object.freeze(capabilityBindings),
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

  if (manifest.capabilityBindings.some((capability) => capability.name === "workspace.list")) {
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
  const capabilityCatalog = options.capabilityCatalog || CAPABILITY_CATALOG;
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

        const manifest = normalizeManifest(name, plugin, capabilityCatalog);
        loaded.push({
          name: manifest.name,
          version: manifest.version,
          hostApiVersion: manifest.hostApiVersion,
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
      hostApiVersion: entry.hostApiVersion || null,
      description: entry.description || "No description",
      capabilities: entry.capabilities || [],
      isolation: entry.isolation || null,
      loaded: !!entry.loaded,
      error: entry.error || null,
    }));
  }

  function listCapabilities() {
    return Object.values(capabilityCatalog).map((contract) => ({
      name: contract.name,
      version: contract.version,
      scope: contract.scope,
      access: contract.access,
      sideEffects: contract.sideEffects,
      methods: [...contract.methods],
      securityStatus: contract.security.status,
      compatibilityStatus: contract.compatibility.status,
      hostApiVersion: contract.compatibility.hostApiVersion,
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

  return Object.freeze({ loadPlugins, listPlugins, listCapabilities, runPlugin });
}

const defaultRuntime = createPluginRuntime();

module.exports = {
  loadPlugins: defaultRuntime.loadPlugins,
  listPlugins: defaultRuntime.listPlugins,
  listPluginCapabilities: defaultRuntime.listCapabilities,
  runPlugin: defaultRuntime.runPlugin,
  createPluginRuntime,
  resolveWorkspacePath,
};
