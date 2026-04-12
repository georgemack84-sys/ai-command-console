const path = require("path");
const { loadJsonDocument, saveJsonDocument } = require("./documentStore");
const { getRuntimeLogPath } = require("./runtimePaths");

const historyFile = getRuntimeLogPath("history.json");
const HISTORY_KEY = "runtime.history";

function loadHistory() {
  try {
    return loadJsonDocument(HISTORY_KEY, historyFile, [], (value) =>
      Array.isArray(value) ? value : []
    );
  } catch (error) {
    return [];
  }
}

function saveHistory(history) {
  saveJsonDocument(HISTORY_KEY, historyFile, history, (value) => (Array.isArray(value) ? value : []));
}

function addToHistory(entry) {
  const history = loadHistory();

  history.push({
    timestamp: new Date().toISOString(),
    ...entry,
  });

  saveHistory(history);
}

module.exports = {
  loadHistory,
  addToHistory,
};
