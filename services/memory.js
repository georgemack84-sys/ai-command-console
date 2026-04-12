const { loadJsonDocument, saveJsonDocument } = require("./documentStore");
const { getRuntimeMemoryPath } = require("./runtimePaths");

const memoryFile = getRuntimeMemoryPath("memory.json");
const MEMORY_KEY = "runtime.memory";

function saveMemory(data) {
  return saveJsonDocument(MEMORY_KEY, memoryFile, data || {}, (value) =>
    value && typeof value === "object" ? value : {}
  );
}

function loadMemory() {
  return loadJsonDocument(MEMORY_KEY, memoryFile, {}, (value) =>
    value && typeof value === "object" ? value : {}
  );
}

module.exports = {
  saveMemory,
  loadMemory,
};
