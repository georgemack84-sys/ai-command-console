const path = require("path");
const { loadWorkspaceDocument, saveWorkspaceDocument } = require("./workspaceDocuments");

const BRIEFS_PATH = path.join(process.cwd(), "data", "research-briefs.json");
const REPORTS_PATH = path.join(process.cwd(), "data", "research-reports.json");

function defaultWorkspaceStore() {
  return {};
}

function getWorkspaceKey(userId) {
  return String(userId || "demo");
}

function readBriefStore() {
  return loadWorkspaceDocument("workspace.research-briefs", defaultWorkspaceStore, { legacyPath: BRIEFS_PATH });
}

function writeBriefStore(store) {
  return saveWorkspaceDocument("workspace.research-briefs", store, { legacyPath: BRIEFS_PATH });
}

function readReportStore() {
  return loadWorkspaceDocument("workspace.research-reports", defaultWorkspaceStore, { legacyPath: REPORTS_PATH });
}

function writeReportStore(store) {
  return saveWorkspaceDocument("workspace.research-reports", store, { legacyPath: REPORTS_PATH });
}

function listBriefs(userId) {
  const store = readBriefStore();
  return Array.isArray(store[getWorkspaceKey(userId)]) ? store[getWorkspaceKey(userId)] : [];
}

function saveBriefs(userId, briefs) {
  const store = readBriefStore();
  store[getWorkspaceKey(userId)] = Array.isArray(briefs) ? briefs : [];
  writeBriefStore(store);
  return store[getWorkspaceKey(userId)];
}

function listReports(userId) {
  const store = readReportStore();
  return Array.isArray(store[getWorkspaceKey(userId)]) ? store[getWorkspaceKey(userId)] : [];
}

function saveReports(userId, reports) {
  const store = readReportStore();
  store[getWorkspaceKey(userId)] = Array.isArray(reports) ? reports : [];
  writeReportStore(store);
  return store[getWorkspaceKey(userId)];
}

module.exports = {
  listBriefs,
  saveBriefs,
  listReports,
  saveReports,
};
