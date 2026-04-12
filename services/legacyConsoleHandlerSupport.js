function getResearchWorkspace(options = {}) {
  return options.workspaceId || options.userId || "demo";
}

function getActor(options = {}, deps) {
  return {
    id: String(options.userId || "demo"),
    name: String(options.userName || "Demo User"),
    role: deps.normalizeRole(options.userRole, options.userId ? "operator" : "admin"),
  };
}

function listWorkspaceRoutesFor(workspaceId, deps) {
  return deps.listWorkspaceRoutes(deps.loadWorkspaceDocument, deps.routesPath, workspaceId);
}

function listWorkspaceUsersFor(workspaceId, deps) {
  return deps.listWorkspaceUsers(deps.loadWorkspaceDocument, deps.usersPath, workspaceId);
}

function getWorkspaceNameFor(workspaceId, deps) {
  return deps.getWorkspaceName(deps.loadWorkspaceDocument, deps.usersPath, workspaceId);
}

function listAllWorkspaceIdsFor(deps) {
  return deps.listAllWorkspaceIds(deps.loadWorkspaceDocument, deps.usersPath, deps.loadCollaborationState());
}

function createBriefRecordFor(workspaceId, payload = {}, deps) {
  return deps.createBriefRecord(deps.listBriefs, deps.saveBriefs, workspaceId, payload);
}

function createReportRecordFor(workspaceId, payload = {}, deps) {
  return deps.createReportRecord(deps.listReports, deps.saveReports, workspaceId, payload);
}

function queueBriefToTaskFor(workspaceId, briefId, deps) {
  return deps.queueBriefToTask(deps.listBriefs, deps.saveBriefs, deps.addTask, workspaceId, briefId);
}

function createReportDraft(workspaceId, payload = {}, deps) {
  const report = createReportRecordFor(workspaceId, {
    briefId: String(payload.briefId || ""),
    title: String(payload.title || ""),
    format: String(payload.format || "memo"),
    excerpt: String(payload.excerpt || "Created from the command desk."),
    keyFindings: Array.isArray(payload.keyFindings) ? payload.keyFindings : [],
  }, deps);

  deps.saveBriefs(
    workspaceId,
    deps.listBriefs(workspaceId).map((brief) =>
      brief.id === report.briefId
        ? {
            ...brief,
            status: "in_review",
            updatedAt: new Date().toISOString(),
            summary: `Report draft "${report.title}" created and waiting for editorial review.`,
          }
        : brief
    ),
  );

  return report;
}

function publishReportRecordFor(workspaceId, reportId, deps) {
  return deps.publishReportRecord(
    deps.listReports,
    deps.saveReports,
    deps.listBriefs,
    deps.saveBriefs,
    workspaceId,
    reportId,
  );
}

module.exports = {
  getResearchWorkspace,
  getActor,
  listWorkspaceRoutesFor,
  listWorkspaceUsersFor,
  getWorkspaceNameFor,
  listAllWorkspaceIdsFor,
  createBriefRecordFor,
  createReportRecordFor,
  queueBriefToTaskFor,
  createReportDraft,
  publishReportRecordFor,
};
