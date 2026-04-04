const path = require("path");

function readEnv(name) {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}

function getDataRoot() {
  return readEnv("AI_COMMAND_CONSOLE_DATA_ROOT") || path.join(process.cwd(), "data");
}

function getWorkspaceDataPath(...segments) {
  return path.join(getDataRoot(), ...segments);
}

function getAgentsDataPath(...segments) {
  return path.join(getDataRoot(), "agents", ...segments);
}

module.exports = {
  getDataRoot,
  getWorkspaceDataPath,
  getAgentsDataPath,
};
