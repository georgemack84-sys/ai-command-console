const fs = require("fs");
const path = require("path");
const { loadDocument, saveDocument } = require("./stateDatabase");

function ensureParent(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function loadJsonDocument(key, legacyPath, createDefault, normalize = (value) => value) {
  ensureParent(legacyPath);
  try {
    const parsed = loadDocument(key, createDefault, { legacyPath });
    return normalize(parsed);
  } catch (error) {
    const fallback = typeof createDefault === "function" ? createDefault() : createDefault;
    return {
      ...normalize(fallback),
      updatedAt: new Date().toISOString(),
      error: `Failed to parse document: ${error.message}`,
    };
  }
}

function saveJsonDocument(key, legacyPath, value, normalize = (next) => next) {
  ensureParent(legacyPath);
  return saveDocument(key, normalize(value), { legacyPath });
}

module.exports = {
  loadJsonDocument,
  saveJsonDocument,
};
