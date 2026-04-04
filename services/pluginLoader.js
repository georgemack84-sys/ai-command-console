const path = require("path");
const { loadJsonDocument } = require("./documentStore");
const configPath = path.join(__dirname, "../config/plugins.json");
const helloPlugin = require("../plugins/helloPlugin");
const projectReportPlugin = require("../plugins/projectReportPlugin");
const PLUGINS_KEY = "config.plugins";

const PLUGIN_REGISTRY = {
  helloPlugin,
  projectReportPlugin,
};

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

function loadPlugins() {
  const enabledNames = getEnabledPluginNames();
  const loaded = [];

  for (const name of enabledNames) {
    try {
      const plugin = PLUGIN_REGISTRY[name];

      if (!plugin) {
        loaded.push({
          name,
          loaded: false,
          error: `Plugin is not registered: ${name}`,
        });
        continue;
      }

      if (!plugin || typeof plugin.run !== "function") {
        loaded.push({
          name,
          loaded: false,
          error: "Plugin does not export a run() function.",
        });
        continue;
      }

      loaded.push({
        name: plugin.name || name,
        description: plugin.description || "No description",
        loaded: true,
        plugin,
      });
    } catch (error) {
      loaded.push({
        name,
        loaded: false,
        error: error.message,
      });
    }
  }

  return loaded;
}

function listPlugins() {
  return loadPlugins().map((entry) => ({
    name: entry.name,
    description: entry.description || "No description",
    loaded: !!entry.loaded,
    error: entry.error || null,
  }));
}

async function runPlugin(name, context = {}) {
  const plugins = loadPlugins();
  const match = plugins.find(
    (p) => String(p.name).toLowerCase() === String(name).toLowerCase()
  );

  if (!match) {
    return `Plugin not found or not enabled: ${name}`;
  }

  if (!match.loaded || !match.plugin) {
    return `Plugin failed to load: ${match.error || match.name}`;
  }

  return match.plugin.run(context);
}

module.exports = {
  loadPlugins,
  listPlugins,
  runPlugin,
  PLUGIN_REGISTRY,
};
