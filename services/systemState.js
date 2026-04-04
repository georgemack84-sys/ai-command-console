const memory = require("./memory");
const historyService = require("./history");
const taskQueue = require("./taskQueue");
const { listPlugins } = require("./pluginLoader");

function getMemoryState() {
  const mem = memory.loadMemory();

  return {
    hasMemory: !!mem && Object.keys(mem).length > 0,
    lastCommand: mem.lastCommand || null,
    lastIntent: mem.lastIntent || null,
    lastReflectionStatus: mem.lastReflection?.status || null,
    updatedAt: mem.updatedAt || null,
  };
}

function getHistoryState() {
  const history = historyService.loadHistory();
  const last = history[history.length - 1] || null;

  return {
    totalEntries: history.length,
    lastCommand: last?.command || null,
    lastStatus: last?.reflection?.status || null,
    lastIntent: last?.plan?.intent?.category || null,
  };
}

function getQueueState() {
  const summary = taskQueue.getQueueSummary();
  const nextTask = taskQueue.getNextTask();

  return {
    ...summary,
    nextTask: nextTask
      ? {
          id: nextTask.id,
          command: nextTask.command,
          attempts: nextTask.attempts || 0,
        }
      : null,
  };
}

function getPluginState() {
  const plugins = listPlugins();

  return {
    total: plugins.length,
    loaded: plugins.filter((p) => p.loaded).length,
    failed: plugins.filter((p) => !p.loaded).length,
    plugins,
  };
}

function getHealthState() {
  const queue = getQueueState();
  const memoryState = getMemoryState();
  const pluginState = getPluginState();

  let overall = "healthy";

  if (pluginState.failed > 0) {
    overall = "degraded";
  }

  if (queue.failed > 0) {
    overall = "warning";
  }

  return {
    overall,
    queueFailedTasks: queue.failed,
    loadedPlugins: pluginState.loaded,
    failedPlugins: pluginState.failed,
    hasRecentMemory: memoryState.hasMemory,
    lastReflectionStatus: memoryState.lastReflectionStatus,
  };
}

function getFullSystemState() {
  return {
    memory: getMemoryState(),
    history: getHistoryState(),
    queue: getQueueState(),
    plugins: getPluginState(),
    health: getHealthState(),
    generatedAt: new Date().toISOString(),
  };
}

function formatSystemStateReport(state) {
  return [
    "=== System Status ===",
    `Generated At: ${state.generatedAt}`,
    "",
    "--- Health ---",
    `Overall: ${state.health.overall}`,
    `Queue Failed Tasks: ${state.health.queueFailedTasks}`,
    `Loaded Plugins: ${state.health.loadedPlugins}`,
    `Failed Plugins: ${state.health.failedPlugins}`,
    `Has Recent Memory: ${state.health.hasRecentMemory ? "Yes" : "No"}`,
    `Last Reflection Status: ${state.health.lastReflectionStatus || "None"}`,
    "",
    "--- Memory ---",
    `Last Command: ${state.memory.lastCommand || "None"}`,
    `Last Intent: ${state.memory.lastIntent?.category || "None"}`,
    `Updated At: ${state.memory.updatedAt || "None"}`,
    "",
    "--- History ---",
    `Total Entries: ${state.history.totalEntries}`,
    `Last Command: ${state.history.lastCommand || "None"}`,
    `Last Status: ${state.history.lastStatus || "None"}`,
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
  ].join("\n");
}

function formatQueueStatus(queueState) {
  return [
    "=== Queue Status ===",
    `Total: ${queueState.total}`,
    `Queued: ${queueState.queued}`,
    `Running: ${queueState.running}`,
    `Done: ${queueState.done}`,
    `Failed: ${queueState.failed}`,
    `Next Task: ${queueState.nextTask ? queueState.nextTask.command : "None"}`,
  ].join("\n");
}

function formatMemoryStatus(memoryState) {
  return [
    "=== Memory Status ===",
    `Has Memory: ${memoryState.hasMemory ? "Yes" : "No"}`,
    `Last Command: ${memoryState.lastCommand || "None"}`,
    `Last Intent: ${memoryState.lastIntent?.category || "None"}`,
    `Last Reflection Status: ${memoryState.lastReflectionStatus || "None"}`,
    `Updated At: ${memoryState.updatedAt || "None"}`,
  ].join("\n");
}

function formatPluginStatus(pluginState) {
  return [
    "=== Plugin Status ===",
    `Total: ${pluginState.total}`,
    `Loaded: ${pluginState.loaded}`,
    `Failed: ${pluginState.failed}`,
    "",
    ...pluginState.plugins.map(
      (p) => `- ${p.name} | loaded=${p.loaded} | ${p.description}${p.error ? ` | error=${p.error}` : ""}`
    ),
  ].join("\n");
}

function formatHealthStatus(healthState) {
  return [
    "=== Health Status ===",
    `Overall: ${healthState.overall}`,
    `Queue Failed Tasks: ${healthState.queueFailedTasks}`,
    `Loaded Plugins: ${healthState.loadedPlugins}`,
    `Failed Plugins: ${healthState.failedPlugins}`,
    `Has Recent Memory: ${healthState.hasRecentMemory ? "Yes" : "No"}`,
    `Last Reflection Status: ${healthState.lastReflectionStatus || "None"}`,
  ].join("\n");
}

module.exports = {
  getMemoryState,
  getHistoryState,
  getQueueState,
  getPluginState,
  getHealthState,
  getFullSystemState,
  formatSystemStateReport,
  formatQueueStatus,
  formatMemoryStatus,
  formatPluginStatus,
  formatHealthStatus,
};