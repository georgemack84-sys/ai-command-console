const {
  getFullSystemState,
} = require("./systemState");

function buildStartupDashboard() {
  const state = getFullSystemState();

  const lines = [
    "=== AI Command Console Boot Summary ===",
    `Started: ${new Date().toISOString()}`,
    "",
    "--- Health ---",
    `Overall: ${state.health.overall}`,
    `Queue Failed Tasks: ${state.health.queueFailedTasks}`,
    `Loaded Plugins: ${state.health.loadedPlugins}`,
    `Failed Plugins: ${state.health.failedPlugins}`,
    "",
    "--- Last Session ---",
    `Last Command: ${state.memory.lastCommand || "None"}`,
    `Last Intent: ${state.memory.lastIntent?.category || "None"}`,
    `Last Reflection Status: ${state.memory.lastReflectionStatus || "None"}`,
    `Last Updated: ${state.memory.updatedAt || "None"}`,
    "",
    "--- Queue ---",
    `Total: ${state.queue.total}`,
    `Queued: ${state.queue.queued}`,
    `Running: ${state.queue.running}`,
    `Done: ${state.queue.done}`,
    `Failed: ${state.queue.failed}`,
    `Next Task: ${state.queue.nextTask ? state.queue.nextTask.command : "None"}`,
    "",
    "--- Plugins ---",
    `Total: ${state.plugins.total}`,
    `Loaded: ${state.plugins.loaded}`,
    `Failed: ${state.plugins.failed}`,
  ];

  return lines.join("\n");
}

module.exports = {
  buildStartupDashboard,
};