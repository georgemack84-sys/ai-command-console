const path = require("path");
const { loadJsonDocument, saveJsonDocument } = require("./documentStore");

const configDir = path.join(__dirname, "../config");
const macrosFile = path.join(configDir, "macros.json");
const MACROS_KEY = "runtime.macros";

function loadMacros() {
  try {
    const parsed = loadJsonDocument(MACROS_KEY, macrosFile, { macros: {} }, (value) => ({
      macros: value?.macros && typeof value.macros === "object" ? value.macros : {},
    }));
    return parsed.macros || {};
  } catch (error) {
    return {};
  }
}

function saveMacros(macros) {
  saveJsonDocument(MACROS_KEY, macrosFile, { macros }, (value) => ({
    macros: value?.macros && typeof value.macros === "object" ? value.macros : {},
  }));
}

function listMacros() {
  return loadMacros();
}

function getMacro(name) {
  const macros = loadMacros();
  return macros[name] || null;
}

function saveMacro(name, command) {
  const macros = loadMacros();
  macros[name] = command;
  saveMacros(macros);
  return { name, command };
}

function removeMacro(name) {
  const macros = loadMacros();

  if (!Object.prototype.hasOwnProperty.call(macros, name)) {
    return false;
  }

  delete macros[name];
  saveMacros(macros);
  return true;
}

module.exports = {
  loadMacros,
  listMacros,
  getMacro,
  saveMacro,
  removeMacro,
};
