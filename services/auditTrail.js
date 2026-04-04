const fs = require("fs");
const path = require("path");

const AUDIT_PATH = path.join(process.cwd(), "data", "agents", "audit-log.jsonl");

function ensureAuditPath() {
  fs.mkdirSync(path.dirname(AUDIT_PATH), { recursive: true });
  if (!fs.existsSync(AUDIT_PATH)) {
    fs.writeFileSync(AUDIT_PATH, "", "utf8");
  }
}

function appendAuditEvent(event) {
  ensureAuditPath();
  const entry = {
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    ...event,
  };
  fs.appendFileSync(AUDIT_PATH, `${JSON.stringify(entry)}\n`, "utf8");
  return entry;
}

function listAuditEvents(limit = 20) {
  ensureAuditPath();
  const lines = fs.readFileSync(AUDIT_PATH, "utf8").split(/\r?\n/).filter(Boolean);
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
  fs.writeFileSync(AUDIT_PATH, "", "utf8");
}

module.exports = {
  appendAuditEvent,
  listAuditEvents,
  clearAuditEvents,
};
