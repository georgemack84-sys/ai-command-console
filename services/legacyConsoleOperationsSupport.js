function selectBulkAutomationWorkspaces(digestWorkspaceHealth = [], payload = {}) {
  const environments = new Set(
    (Array.isArray(payload.environments) ? payload.environments : [payload.environment])
      .filter(Boolean)
      .map((item) => String(item))
  );
  const statuses = new Set(
    (Array.isArray(payload.statuses) && payload.statuses.length ? payload.statuses : ["error", "stalled"])
      .filter(Boolean)
      .map((item) => String(item))
  );
  return (Array.isArray(digestWorkspaceHealth) ? digestWorkspaceHealth : []).filter((workspace) => {
    const environment = String(workspace.incidentPolicy?.environment || "development");
    if (environments.size && !environments.has(environment)) {
      return false;
    }
    if (statuses.size && !statuses.has(String(workspace.status || ""))) {
      return false;
    }
    return true;
  });
}

function parseAutomationInboxItem(itemId) {
  const raw = String(itemId || "").replace(/^inbox:/, "");
  if (raw.startsWith("digest-escalation:")) {
    return {
      kind: "digest-escalation",
      workspaceId: raw.replace("digest-escalation:", ""),
    };
  }
  return null;
}

function listAutomationFollowups(workspaceId = null, deps) {
  return deps
    .listTasks()
    .filter((task) => Array.isArray(task.tags) && task.tags.includes("automation-escalation"))
    .filter((task) => !workspaceId || String(task.workspaceId || task.linkedWorkspaceId || "") === String(workspaceId))
    .slice(0, 16)
    .map((task) => ({
      id: task.id,
      agentName: task.agentName,
      description: task.description,
      status: task.status,
      priority: task.priority,
      ownerId: task.ownerId || null,
      ownerName: task.ownerName || null,
      workspaceId: task.workspaceId || task.linkedWorkspaceId || null,
      linkedInboxItemId: task.linkedInboxItemId || null,
      createdAt: task.createdAt,
      completedAt: task.completedAt || null,
    }));
}

function buildOwnershipSignals(workspaceId, deps) {
  const briefs = deps.listBriefs(workspaceId);
  const reports = deps.listReports(workspaceId);
  const routes = deps.listWorkspaceRoutes(workspaceId);
  const totalItems = briefs.length + reports.length + routes.length;
  const orphanedBriefs = briefs.filter((item) => !item.ownerId).length;
  const orphanedReports = reports.filter((item) => !item.ownerId).length;
  const orphanedRoutes = routes.filter((item) => !item.ownerId).length;
  const orphanedTotal = orphanedBriefs + orphanedReports + orphanedRoutes;
  const ownerLoad = new Map();

  [...briefs, ...reports, ...routes].forEach((item) => {
    const owner = item.ownerName || item.ownerId || "Unowned";
    ownerLoad.set(owner, (ownerLoad.get(owner) || 0) + 1);
  });

  const busiestOwner = [...ownerLoad.entries()].sort((a, b) => b[1] - a[1])[0] || null;
  const signals = [];

  if (orphanedTotal > 0) {
    signals.push({
      id: "ownership:orphaned",
      tone: orphanedTotal >= 3 ? "critical" : "warning",
      title: `${orphanedTotal} workspace items are unassigned`,
      detail: `${orphanedBriefs} briefs, ${orphanedReports} reports, and ${orphanedRoutes} saved routes do not have an owner.`,
      command: "ownership:signals",
    });
  }

  if (totalItems >= 4 && busiestOwner && busiestOwner[0] !== "Unowned" && busiestOwner[1] >= Math.ceil(totalItems * 0.5)) {
    signals.push({
      id: "ownership:imbalance",
      tone: "warning",
      title: `${busiestOwner[0]} is carrying most of the workspace load`,
      detail: `${busiestOwner[0]} currently owns ${busiestOwner[1]} of ${totalItems} tracked briefs, reports, and saved routes.`,
      command: "ownership:signals",
    });
  }

  return signals;
}

function queueDueDigestSweepIfNeeded(workspaceId, actor = { actorId: "system", actorName: "System" }, deps) {
  const workspace = String(workspaceId || "default");
  const users = deps.listWorkspaceUsers(workspace);
  if (!users.length) {
    return null;
  }

  let collaboration = deps.loadCollaborationState();
  const trustSignals = deps.buildTrustSignalsForGovernance(collaboration, deps.digestDeps);
  const immediateTrustDrop = trustSignals.some((item) => String(item.id || "").startsWith("trust-drop:"));
  const promotedTrustIncident = deps.promoteTrustDropToIncident(workspace, collaboration, trustSignals);
  const recoveredTrustIncident = deps.recoverTrustIncident(workspace, collaboration, trustSignals);
  const requestedRecoveredTrustCloseout = deps.requestRecoveredTrustIncidentCloseout(workspace, collaboration);
  if (promotedTrustIncident || recoveredTrustIncident || requestedRecoveredTrustCloseout) {
    collaboration = deps.loadCollaborationState();
  }
  const trustEscalation = deps.applyTrustEscalationPolicy(workspace, collaboration, trustSignals);
  const digestAllowed = !immediateTrustDrop || trustEscalation.mode === "digest";
  const eligibleUsers = users.filter((user) =>
    deps.shouldGenerateDigestForUser(
      user,
      collaboration,
      workspace,
      { trustDropOnly: immediateTrustDrop && digestAllowed },
      deps.digestDeps
    )
  );
  if (!eligibleUsers.length) {
    return null;
  }

  const workspaceState = deps.getDigestWorkspaceState(workspace);
  const lastQueuedAt = workspaceState.lastSweepQueuedAt ? new Date(workspaceState.lastSweepQueuedAt).getTime() : 0;
  if (lastQueuedAt && Date.now() - lastQueuedAt < 15 * 60 * 1000) {
    return null;
  }

  const existing = deps.listJobs(100).some(
    (job) =>
      job.type === "digest:run-due" &&
      ["queued", "running", "scheduled_retry"].includes(job.status) &&
      String(job.payload?.workspace || "") === workspace
  );
  if (existing) {
    return null;
  }

  const job = deps.enqueueJob("digest:run-due", { workspace }, actor);
  deps.updateDigestWorkspaceState(workspace, {
    lastSweepQueuedAt: new Date().toISOString(),
    queuedBy: actor.actorId || "system",
    lastEligibleUserCount: eligibleUsers.length,
  });
  return job;
}

module.exports = {
  selectBulkAutomationWorkspaces,
  parseAutomationInboxItem,
  listAutomationFollowups,
  buildOwnershipSignals,
  queueDueDigestSweepIfNeeded,
};
