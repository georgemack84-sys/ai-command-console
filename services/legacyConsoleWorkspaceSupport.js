function listWorkspaceRoutes(loadWorkspaceDocument, routesPath, workspaceId) {
  const store = loadWorkspaceDocument("workspace.routes", {}, { legacyPath: routesPath });
  const key = String(workspaceId || "default");
  return Array.isArray(store[key]) ? store[key] : [];
}

function listWorkspaceUsers(loadWorkspaceDocument, usersPath, workspaceId) {
  const users = loadWorkspaceDocument("workspace.users", [], { legacyPath: usersPath });
  const key = String(workspaceId || "default");
  return Array.isArray(users)
    ? users.filter((user) => String(user.workspaceId || "default") === key && user.status !== "disabled")
    : [];
}

function getWorkspaceName(loadWorkspaceDocument, usersPath, workspaceId) {
  const members = listWorkspaceUsers(loadWorkspaceDocument, usersPath, workspaceId);
  return members[0]?.workspaceName || String(workspaceId || "default");
}

function listAllWorkspaceIds(loadWorkspaceDocument, usersPath, collaboration) {
  const users = loadWorkspaceDocument("workspace.users", [], { legacyPath: usersPath });
  const ids = new Set(
    (Array.isArray(users) ? users : [])
      .filter((user) => user && user.status !== "disabled")
      .map((user) => String(user.workspaceId || "default"))
  );
  Object.keys(collaboration?.digestWorkspaceState || {}).forEach((workspaceId) => ids.add(String(workspaceId)));
  return [...ids];
}

function computeDigestSchedulerStaleState(digestScheduler) {
  if (!digestScheduler.enabled) {
    return { stale: false, staleAfterMs: 0, ageMs: 0 };
  }

  const staleAfterMs = Math.max(Number(digestScheduler.intervalMs || 60_000) * 3, 5 * 60 * 1000);
  const ageMs = digestScheduler.lastRunAt
    ? Math.max(0, Date.now() - new Date(digestScheduler.lastRunAt).getTime())
    : staleAfterMs + 1;
  return {
    stale: !digestScheduler.lastRunAt || ageMs > staleAfterMs,
    staleAfterMs,
    ageMs,
  };
}

function createBriefRecord(listBriefs, saveBriefs, workspace, payload = {}) {
  const now = new Date().toISOString();
  const existing = listBriefs(workspace);
  const brief = {
    id: payload.id || `brief_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title: String(payload.title || "").trim(),
    question: String(payload.question || "").trim(),
    status: payload.status || "draft",
    priority: payload.priority || "medium",
    assignedAgent: String(payload.assignedAgent || "researcher").trim(),
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    createdAt: payload.createdAt || now,
    updatedAt: now,
    summary: String(payload.summary || "Created from the command desk.").trim(),
    linkedTaskId: payload.linkedTaskId || null,
  };
  saveBriefs(workspace, [brief, ...existing.filter((item) => item.id !== brief.id)]);
  return brief;
}

function createReportRecord(listReports, saveReports, workspace, payload = {}) {
  const now = new Date().toISOString();
  const existing = listReports(workspace);
  const report = {
    id: payload.id || `report_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    briefId: String(payload.briefId || "").trim(),
    title: String(payload.title || "").trim(),
    format: payload.format || "memo",
    status: payload.status || "draft",
    createdAt: payload.createdAt || now,
    updatedAt: now,
    excerpt: String(payload.excerpt || "Created from the command desk.").trim(),
    keyFindings: Array.isArray(payload.keyFindings) ? payload.keyFindings : [],
  };
  saveReports(workspace, [report, ...existing.filter((item) => item.id !== report.id)]);
  return report;
}

function queueBriefToTask(listBriefs, saveBriefs, addTask, workspace, briefId) {
  const briefs = listBriefs(workspace);
  const target = briefs.find((brief) => brief.id === briefId);
  if (!target) {
    return { ok: false, error: `Brief not found: ${briefId}` };
  }

  const task = addTask(target.assignedAgent, `${target.title}: ${target.question}`, {
    priority: target.priority === "high" ? 1 : target.priority === "medium" ? 2 : 3,
    sourceAgent: "research-desk",
    delegationReason: `Queued from research brief ${target.id}.`,
    tags: ["research-brief", ...target.tags],
    notifyAgent: "manager",
    callbackEnabled: true,
  });
  saveBriefs(
    workspace,
    briefs.map((brief) =>
      brief.id === briefId
        ? { ...brief, status: "queued", linkedTaskId: task.id, updatedAt: new Date().toISOString() }
        : brief
    )
  );
  return { ok: true, task, briefId };
}

function publishReportRecord(listReports, saveReports, listBriefs, saveBriefs, workspace, reportId) {
  const reports = listReports(workspace);
  const target = reports.find((report) => report.id === reportId);
  if (!target) {
    return { ok: false, error: `Report not found: ${reportId}` };
  }

  saveReports(
    workspace,
    reports.map((report) =>
      report.id === reportId ? { ...report, status: "published", updatedAt: new Date().toISOString() } : report
    )
  );
  saveBriefs(
    workspace,
    listBriefs(workspace).map((brief) =>
      brief.id === target.briefId
        ? {
            ...brief,
            status: "complete",
            updatedAt: new Date().toISOString(),
            summary: `Published report "${target.title}" completed this brief.`,
          }
        : brief
    )
  );
  return { ok: true, report: target };
}

module.exports = {
  listWorkspaceRoutes,
  listWorkspaceUsers,
  getWorkspaceName,
  listAllWorkspaceIds,
  computeDigestSchedulerStaleState,
  createBriefRecord,
  createReportRecord,
  queueBriefToTask,
  publishReportRecord,
};
