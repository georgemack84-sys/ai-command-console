const path = require("path");
const { loadJsonDocument } = require("./documentStore");

const configPath = path.join(__dirname, "../config/startup.json");
const STARTUP_POLICY_KEY = "config.startup-policy";

function defaultStartupPolicy() {
  return {
    showDashboard: true,
    autoRunNextTask: false,
    startupMacros: [],
    safeModeOnStartupAutomation: true,
  };
}

function loadStartupPolicy() {
  try {
    const parsed = loadJsonDocument(STARTUP_POLICY_KEY, configPath, defaultStartupPolicy, (value) => ({
      ...defaultStartupPolicy(),
      ...(value && typeof value === "object" ? value : {}),
      showDashboard: value?.showDashboard !== false,
      autoRunNextTask: Boolean(value?.autoRunNextTask),
      startupMacros: Array.isArray(value?.startupMacros) ? value.startupMacros : [],
      safeModeOnStartupAutomation: value?.safeModeOnStartupAutomation !== false,
    }));

    return parsed;
  } catch (error) {
    return defaultStartupPolicy();
  }
}

module.exports = {
  loadStartupPolicy,
};
