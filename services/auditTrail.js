const fs = require("fs");
const path = require("path");
const { getAgentsDataPath } = require("./runtimePaths");

function getAuditPath() {
  return getAgentsDataPath("audit-log.jsonl");
}

function ensureAuditPath() {
  const auditPath = getAuditPath();
  fs.mkdirSync(path.dirname(auditPath), { recursive: true });
  if (!fs.existsSync(auditPath)) {
    fs.writeFileSync(auditPath, "", "utf8");
  }
}

function appendAuditEvent(event) {
  ensureAuditPath();
  const auditPath = getAuditPath();
  const entry = {
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    ...event,
  };
  fs.appendFileSync(auditPath, `${JSON.stringify(entry)}\n`, "utf8");
  return entry;
}

function listAuditEvents(limit = 20) {
  ensureAuditPath();
  const auditPath = getAuditPath();
  const lines = fs.readFileSync(auditPath, "utf8").split(/\r?\n/).filter(Boolean);
  return lines
    .slice(-Math.max(1, Number(limit || 20)))
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return {
          id: `audit_parse_${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: "parse_error",
          message: line,
        };
      }
    })
    .reverse();
}

function clearAuditEvents() {
  ensureAuditPath();
  fs.writeFileSync(getAuditPath(), "", "utf8");
}

module.exports = {
  appendAuditEvent,
  listAuditEvents,
  clearAuditEvents,
};
