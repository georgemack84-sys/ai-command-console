function recordApprovalTrustSnapshot(governance = {}, dashboard = {}, environmentPolicy = {}, deps) {
  const environment = String(environmentPolicy.currentEnvironment || governance.currentEnvironment || "development");
  const history = Array.isArray(governance.approvalTrustHistory) ? governance.approvalTrustHistory : [];
  const now = Date.now();
  const recent = history.find(
    (item) => String(item.environment) === environment && now - new Date(item.takenAt).getTime() < 60 * 60 * 1000
  );
  if (recent) {
    return history;
  }
  const entry = {
    environment,
    takenAt: new Date(now).toISOString(),
    score: Number(dashboard.score || 0),
    regressedCount: Number(dashboard.regressedCount || 0),
    improvedCount: Number(dashboard.improvedCount || 0),
    rolledBackCount: Number(dashboard.rolledBackCount || 0),
    observingCount: Number(dashboard.observingCount || 0),
    cooldownCount: Number(dashboard.cooldownCount || 0),
    alertCount: Array.isArray(dashboard.alerts) ? dashboard.alerts.length : 0,
  };
  deps.updateGovernance({
    ...governance,
    approvalTrustHistory: [entry, ...history].slice(0, 500),
  });
  return [entry, ...history].slice(0, 500);
}

function applyTrustEscalationPolicy(workspaceId, collaboration, trustSignals = [], deps) {
  const governance = collaboration.governance || {};
  const environmentPolicy = deps.getEnvironmentPolicy(governance, workspaceId);
  const action = String(environmentPolicy.trustDropAction || "notify");
  const trustDrop = (Array.isArray(trustSignals) ? trustSignals : []).find((item) =>
    String(item.id || "").startsWith("trust-drop:")
  );

  if (!trustDrop || action === "notify") {
    return { applied: false, mode: "notify" };
  }

  if (action === "followup") {
    const existing = deps.listAutomationFollowups(workspaceId).find((task) =>
      String(task.description || "").includes("trust drop")
    );
    if (existing) {
      return { applied: false, mode: "followup" };
    }
    const owner = String(environmentPolicy.trustDropFollowupOwner || "Jamie Lead");
    deps.addTask("manager", `Investigate trust drop for ${workspaceId}`, {
      priority: 1,
      sourceAgent: "trust-monitor",
      delegationReason: trustDrop.detail,
      tags: ["automation-escalation", "trust-drop"],
      notifyAgent: "manager",
      callbackEnabled: true,
      workspaceId,
      linkedWorkspaceId: workspaceId,
      ownerName: owner,
    });
    deps.appendDigestWorkspaceEvent(workspaceId, {
      type: "trust-drop-followup",
      message: `Opened trust-drop follow-up for ${workspaceId}.`,
      actorId: "system",
      actorName: "System",
      note: trustDrop.detail,
    });
    return { applied: true, mode: "followup" };
  }

  return { applied: true, mode: "digest" };
}

function promoteTrustDropToIncident(workspaceId, collaboration, trustSignals = [], deps) {
  const governance = collaboration.governance || {};
  const environmentPolicy = deps.getEnvironmentPolicy(governance, workspaceId);
  if (!environmentPolicy.promoteTrustDropToIncident) {
    return false;
  }
  const trustDrop = (Array.isArray(trustSignals) ? trustSignals : []).find((item) =>
    String(item.id || "").startsWith("trust-drop:")
  );
  if (!trustDrop) {
    return false;
  }

  const state = deps.getDigestWorkspaceState(workspaceId);
  const existingNote = Array.isArray(state.events)
    ? state.events.find((event) => event.type === "trust-incident-promoted" && String(event.note || "").includes(trustDrop.id))
    : null;
  if (existingNote) {
    return false;
  }

  deps.updateDigestWorkspaceState(workspaceId, {
    incidentStatus: "open",
    incidentStatusUpdatedAt: new Date().toISOString(),
    incidentSummary: state.incidentSummary || `Trust incident: ${trustDrop.detail}`,
    incidentSummaryUpdatedAt: state.incidentSummaryUpdatedAt || new Date().toISOString(),
  });
  deps.appendDigestWorkspaceEvent(workspaceId, {
    type: "trust-incident-promoted",
    message: "Promoted trust degradation into a workspace incident.",
    actorId: "system",
    actorName: "System",
    note: `${trustDrop.id} • ${trustDrop.detail}`,
  });
  return true;
}

function recoverTrustIncident(workspaceId, collaboration, trustSignals = [], deps) {
  const trustDrop = (Array.isArray(trustSignals) ? trustSignals : []).find((item) =>
    String(item.id || "").startsWith("trust-drop:")
  );
  if (trustDrop) {
    return false;
  }

  const state = deps.getDigestWorkspaceState(workspaceId);
  const promotedEvent = Array.isArray(state.events)
    ? state.events.find((event) => event.type === "trust-incident-promoted")
    : null;
  if (!promotedEvent) {
    return false;
  }
  if (["ready_for_closeout", "resolved", "shared", "archived"].includes(String(state.incidentStatus || ""))) {
    return false;
  }

  const trustSignalsSummary = (Array.isArray(trustSignals) ? trustSignals : [])
    .map((item) => item.title)
    .slice(0, 3)
    .join(" | ");
  const summary = `Trust recovery detected for ${workspaceId}. No active trust-drop signal remains.${trustSignalsSummary ? ` Remaining trust watch items: ${trustSignalsSummary}.` : ""}`;

  deps.updateDigestWorkspaceState(workspaceId, {
    incidentStatus: "ready_for_closeout",
    incidentStatusUpdatedAt: new Date().toISOString(),
    incidentSummary: summary,
    incidentSummaryUpdatedAt: new Date().toISOString(),
  });
  deps.appendDigestWorkspaceEvent(workspaceId, {
    type: "trust-incident-recovered",
    message: "Trust incident recovered and is ready for closeout.",
    actorId: "system",
    actorName: "System",
    note: summary,
  });
  deps.updateIncidentChecklistItem(workspaceId, "summary_generated", {
    completed: true,
    completedAt: new Date().toISOString(),
    completedByName: "System",
  });
  return true;
}

function requestRecoveredTrustIncidentCloseout(workspaceId, collaboration, deps) {
  const governance = collaboration.governance || {};
  if (!deps.requiresIncidentApproval("resolved", governance, workspaceId)) {
    return false;
  }

  const workspaceHealth = deps.buildDigestWorkspaceHealth(deps.getDigestSchedulerStatus()).find(
    (item) => item.workspaceId === workspaceId
  );
  if (!workspaceHealth || String(workspaceHealth.incidentStatus || "") !== "ready_for_closeout") {
    return false;
  }
  if (!workspaceHealth.incidentReadiness?.canResolve) {
    return false;
  }

  const state = deps.getDigestWorkspaceState(workspaceId);
  const recoveredEvent = Array.isArray(state.events)
    ? state.events.find((event) => event.type === "trust-incident-recovered")
    : null;
  if (!recoveredEvent) {
    return false;
  }

  const existingApprovals = (Array.isArray(collaboration.approvals) ? collaboration.approvals : []).filter(
    (approval) =>
      approval.action === "collaboration:automation-set-status" &&
      String(approval.payload?.workspaceId || "") === workspaceId &&
      String(approval.payload?.incidentStatus || "").toLowerCase() === "resolved"
  );
  if (existingApprovals.some((approval) => approval.status === "pending")) {
    return false;
  }

  const recoveredAt = new Date(recoveredEvent.createdAt || recoveredEvent.at || 0).getTime();
  const alreadyReviewed = existingApprovals.some((approval) => {
    if (!["approved", "rejected"].includes(String(approval.status || ""))) {
      return false;
    }
    const decisionAt = new Date(approval.resolvedAt || approval.updatedAt || approval.createdAt || 0).getTime();
    return decisionAt >= recoveredAt;
  });
  if (alreadyReviewed) {
    return false;
  }

  const approvalRouting = deps.selectAdaptiveApprovalTarget(
    workspaceId,
    String(state.incidentApproverTarget || "").trim() || null,
    String(state.backupApproverTarget || "").trim() || null,
    governance
  );
  const approvalTarget = approvalRouting.approverTarget;
  const approval = deps.createApprovalRequest({
    action: "collaboration:automation-set-status",
    payload: approvalTarget
      ? { workspaceId, incidentStatus: "resolved", approverTarget: approvalTarget }
      : { workspaceId, incidentStatus: "resolved" },
    label: `Approve incident resolved for ${workspaceHealth.workspaceName}`,
    requestedById: "system",
    requestedByName: "System",
    approverTarget: approvalTarget,
    routingMode: approvalRouting.mode,
    routingReason: approvalRouting.reason,
    routedFromTarget: approvalRouting.routedFromTarget,
  });
  deps.appendDigestWorkspaceEvent(workspaceId, {
    type: "incident-approval",
    message: "Automatically requested closeout approval after trust recovery.",
    actorId: "system",
    actorName: "System",
    note: approvalRouting.reason ? `${approval.id} • ${approvalRouting.reason}` : approval.id,
  });
  deps.appendAuditEvent({
    type: "approval:requested",
    message: `Automatically requested closeout approval for recovered trust incident ${workspaceId}.`,
    payload: { workspaceId, approvalId: approval.id, approverTarget: approvalTarget, routingMode: approvalRouting.mode },
  });
  return true;
}

function finalizeRecoveredTrustIncidentCloseout(workspaceId, actorName = "System", deps) {
  const workspaceHealth = deps.buildDigestWorkspaceHealth(deps.getDigestSchedulerStatus()).find(
    (item) => item.workspaceId === workspaceId
  );
  if (!workspaceHealth || String(workspaceHealth.incidentStatus || "") !== "resolved") {
    return false;
  }

  const state = deps.getDigestWorkspaceState(workspaceId);
  const recoveredEvent = Array.isArray(state.events)
    ? state.events.find((event) => event.type === "trust-incident-recovered")
    : null;
  if (!recoveredEvent) {
    return false;
  }
  const existingEvent = Array.isArray(state.events)
    ? state.events.find((event) => event.type === "trust-incident-closeout-approved")
    : null;
  if (existingEvent) {
    return false;
  }

  const closeoutSummary = [
    `Trust recovery closeout approved for ${workspaceHealth.workspaceName || workspaceId}.`,
    "The workspace recovered from the earlier trust drop and the incident is now resolved.",
    workspaceHealth.incidentPolicy?.requireSummaryShareBeforeArchived
      ? "Share the closeout handoff before archiving this incident."
      : "Review archive readiness and archive when the team is ready.",
  ].join(" ");
  const handoffDraft = [
    `Trust recovery handoff for ${workspaceHealth.workspaceName || workspaceId}.`,
    "Recovery status: approved and resolved.",
    `Summary: ${workspaceHealth.incidentSummary || "Trust conditions improved and the closeout approval was granted."}`,
    `Next step: ${workspaceHealth.incidentPolicy?.requireSummaryShareBeforeArchived ? "Share this handoff with the workspace owner or team before archive." : "Review archive readiness and archive when appropriate."}`,
  ].join(" ");
  const archiveRecommendation = workspaceHealth.incidentPolicy?.requireSummaryShareBeforeArchived
    ? "Share the prepared trust recovery handoff, then archive this incident when the handoff is complete."
    : "This recovered trust incident is resolved and can be archived when the team is ready.";

  deps.updateDigestWorkspaceState(workspaceId, {
    incidentSummary: closeoutSummary,
    incidentSummaryUpdatedAt: new Date().toISOString(),
    incidentHandoffDraft: handoffDraft,
    incidentHandoffDraftUpdatedAt: new Date().toISOString(),
    incidentArchiveRecommendation: archiveRecommendation,
  });
  deps.appendDigestWorkspaceEvent(workspaceId, {
    type: "trust-incident-closeout-approved",
    message: "Approved trust recovery closeout and prepared archive guidance.",
    actorId: "system",
    actorName,
    note: closeoutSummary,
  });
  return true;
}

function buildTrustArchiveRationale(workspaceId, deps) {
  const workspaceHealth = deps.buildDigestWorkspaceHealth(deps.getDigestSchedulerStatus()).find(
    (item) => item.workspaceId === workspaceId
  );
  if (!workspaceHealth) {
    return null;
  }
  const state = deps.getDigestWorkspaceState(workspaceId);
  const closeoutApproved = Array.isArray(state.events)
    ? state.events.find((event) => event.type === "trust-incident-closeout-approved")
    : null;
  if (!closeoutApproved) {
    return null;
  }
  return [
    `Trust recovery closeout was approved for ${workspaceHealth.workspaceName || workspaceId}.`,
    workspaceHealth.incidentArchiveRecommendation || "Archive this recovered trust incident once the prepared handoff has been shared.",
  ].join(" ");
}

function finalizeArchivedTrustIncident(workspaceId, actorName = "System", deps) {
  const workspaceHealth = deps.buildDigestWorkspaceHealth(deps.getDigestSchedulerStatus()).find(
    (item) => item.workspaceId === workspaceId
  );
  if (!workspaceHealth || String(workspaceHealth.incidentStatus || "") !== "archived") {
    return false;
  }
  const state = deps.getDigestWorkspaceState(workspaceId);
  const closeoutApproved = Array.isArray(state.events)
    ? state.events.find((event) => event.type === "trust-incident-closeout-approved")
    : null;
  if (!closeoutApproved) {
    return false;
  }
  const existingArchivedEvent = Array.isArray(state.events)
    ? state.events.find((event) => event.type === "trust-incident-archived")
    : null;
  if (existingArchivedEvent) {
    return false;
  }

  const finalSummary = [
    `Trust incident archived for ${workspaceHealth.workspaceName || workspaceId}.`,
    "Recovery was approved, the closeout handoff was shared, and the workspace has completed the trust remediation lifecycle.",
    `Archive approved by policy in the ${workspaceHealth.incidentPolicy?.environment || "current"} environment.`,
  ].join(" ");

  deps.updateDigestWorkspaceState(workspaceId, {
    incidentSummary: finalSummary,
    incidentSummaryUpdatedAt: new Date().toISOString(),
    incidentHandoffDraft: null,
    incidentHandoffDraftUpdatedAt: null,
    incidentArchiveRecommendation: null,
  });
  deps.appendDigestWorkspaceEvent(workspaceId, {
    type: "trust-incident-archived",
    message: "Archived the completed trust incident and finalized the recap.",
    actorId: "system",
    actorName,
    note: finalSummary,
  });
  return true;
}

module.exports = {
  recordApprovalTrustSnapshot,
  applyTrustEscalationPolicy,
  promoteTrustDropToIncident,
  recoverTrustIncident,
  requestRecoveredTrustIncidentCloseout,
  finalizeRecoveredTrustIncidentCloseout,
  buildTrustArchiveRationale,
  finalizeArchivedTrustIncident,
};
