const path = require("path");
const { loadJsonDocument, saveJsonDocument } = require("./documentStore");

const memoryDir = path.join(__dirname, "../memory");
const memoryFile = path.join(memoryDir, "memory.json");
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
