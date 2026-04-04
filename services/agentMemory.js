const fs = require("fs");
const path = require("path");
const { loadJsonDocument, saveJsonDocument } = require("./documentStore");
const { getAgentsDataPath } = require("./runtimePaths");

const AGENT_DATA_DIR = getAgentsDataPath();

function ensureDir() {
  fs.mkdirSync(AGENT_DATA_DIR, { recursive: true });
}

function getStatePath(agentName) {
  ensureDir();
  return path.join(AGENT_DATA_DIR, `${agentName}.state.json`);
}

function defaultAgentState(agentName) {
  return {
    name: agentName,
    active: false,
    status: "idle",
    goal: "",
    createdAt: null,
    updatedAt: null,
    lastRunAt: null,
    stepCount: 0,
    maxSteps: 0,
    history: [],
    lastPlan: [],
    lastResult: null,
    notes: [],
  };
}

function loadAgentState(agentName) {
  const filePath = getStatePath(agentName);
  const key = `agent.state.${String(agentName).trim().toLowerCase()}`;

  try {
    return loadJsonDocument(key, filePath, () => defaultAgentState(agentName), (value) => ({
      ...defaultAgentState(agentName),
      ...(value && typeof value === "object" ? value : {}),
      name: agentName,
      history: Array.isArray(value?.history) ? value.history : [],
      lastPlan: Array.isArray(value?.lastPlan) ? value.lastPlan : [],
      notes: Array.isArray(value?.notes) ? value.notes : [],
    }));
  } catch (error) {
    return {
      ...defaultAgentState(agentName),
      status: "error",
      lastResult: {
        ok: false,
        error: `Failed to parse state file: ${error.message}`
      },
    };
  }
}

function saveAgentState(agentName, state) {
  const filePath = getStatePath(agentName);
  ensureDir();
  const key = `agent.state.${String(agentName).trim().toLowerCase()}`;

  const merged = {
    ...defaultAgentState(agentName),
    ...state,
    name: agentName,
    history: Array.isArray(state?.history) ? state.history.slice(-100) : [],
    lastPlan: Array.isArray(state?.lastPlan) ? state.lastPlan : [],
    notes: Array.isArray(state?.notes) ? state.notes : [],
    updatedAt: new Date().toISOString()
  };

  return saveJsonDocument(key, filePath, merged);
}

function appendAgentHistory(agentName, entry) {
  const state = loadAgentState(agentName);

  state.history = Array.isArray(state.history) ? state.history : [];
  state.history.push({
    timestamp: new Date().toISOString(),
    ...entry
  });

  if (state.history.length > 100) {
    state.history = state.history.slice(-100);
  }

  return saveAgentState(agentName, state);
}

module.exports = {
  loadAgentState,
  saveAgentState,
  appendAgentHistory
};
