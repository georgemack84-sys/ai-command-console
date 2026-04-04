const fs = require("fs");
const path = require("path");

const logDir = path.join(__dirname, "../logs");
const actionLogFile = path.join(logDir, "actions.log");

function ensureLogFile() {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  if (!fs.existsSync(actionLogFile)) {
    fs.writeFileSync(actionLogFile, "", "utf8");
  }
}

function logAction(entry) {
  ensureLogFile();

  const line = JSON.stringify({
    timestamp: new Date().toISOString(),
    ...entry,
  }) + "\n";

  fs.appendFileSync(actionLogFile, line, "utf8");
}

module.exports = {
  logAction,
};