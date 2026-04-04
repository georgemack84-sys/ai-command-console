const { buildSystemSummary, buildHealthSummary, buildWorkloadSummary, getAgentDashboard } = require("./dashboard");
const path = require("path");
const { startAgent, tickAgent, getAgentStatus, stopAgent, listAgentProfiles, routeManagerTask } = require("./agentRuntime");
const { listTasks, peekNextTask, addTask } = require("./taskQueue");
const { listSchedules, getSchedule, runScheduledTick } = require("./scheduler");
const { getWatcherStatus, evaluateRules, startWatcher, stopWatcher, updateWatcherRule, addWatcherRule, removeWatcherRule } = require("./watcher");
const { listReviewItems, addReviewItemForTask, approveReviewItem, reviseReviewItem, createFollowupTask } = require("./reviewQueue");
const { listAlerts, listActiveAlerts, runAlertChecks, acknowledgeAlert, addAlertNote, resolveAlert, updateAlertThresholds, loadAlertsState } = require("./alerts");
const { appendAuditEvent, listAuditEvents } = require("./auditTrail");
const { listPlugins, runPlugin } = require("./pluginLoader");
const { listBriefs, saveBriefs, listReports, saveReports } = require("./researchDesk");
const { loadAgentState } = require("./agentMemory");
const { readAgentProfile, updateAgentProfile } = require("./agentProfiles");
const { loadAutomationPolicy, updateAutomationPolicy } = require("./automationPolicy");
const { buildTelemetrySummary, recordTelemetry } = require("./telemetry");
const { registerJobProcessor, enqueueJob, listJobs, buildJobMetrics, cancelJob, retryJob, getJob } = require("./jobQueue");
const {
  normalizeRole,
  canUseConsoleAction,
  getEnvironmentPolicy,
  requiresIncidentApproval,
  canExecuteCommands,
  canApproveInEnvironment,
  canManageGovernanceInEnvironment,
} = require("./permissions");
const {
  loadCollaborationState,
  upsertSharedSession,
  createHandoff,
  closeHandoff,
  createApprovalRequest,
  getApprovalRequest,
  resolveApprovalRequest,
  updateApprovalRequest,
  updateGovernance,
  getInboxState,
  updateInboxItemState,
  getInboxHistory,
  recordInboxHistoryItem,
  getDigestPreferences,
  updateDigestPreferences,
  listDigestRuns,
  recordDigestRun,
  getDigestWorkspaceState,
  updateDigestWorkspaceState,
  appendDigestWorkspaceEvent,
} = require("./collaboration");
const { getDigestSchedulerStatus } = require("./digestScheduler");
const { loadWorkspaceDocument } = require("./workspaceDocuments");
const { getWorkspaceDataPath } = require("./runtimePaths");

const ROUTES_PATH = getWorkspaceDataPath("workspace-user-routes.json");
const USERS_PATH = getWorkspaceDataPath("workspace-users.json");

function getResearchWorkspace(options = {}) {
  return options.workspaceId || options.userId || "demo";
}

function getActor(options = {}) {
  return {
    id: String(options.userId || "demo"),
    name: String(options.userName || "Demo User"),
    role: normalizeRole(options.userRole, options.userId ? "operator" : "admin"),
  };
}

function isSensitiveAction(action) {
  return [
    "watcher:stop",
    "watcher:rule-delete",
    "alert:resolve",
    "agent:update-config",
    "policy:update-thresholds",
    "policy:update-automation",
  ].includes(action);
}

function requiresApproval(action, payload = {}, options = {}) {
  if (options.bypassApproval) {
    return false;
  }

  let collaboration = loadCollaborationState();
  if (Boolean(collaboration.governance?.sensitiveActionsRequireApproval) && isSensitiveAction(action)) {
    return true;
  }

  if (action === "collaboration:automation-set-status") {
    return requiresIncidentApproval(payload.incidentStatus, collaboration.governance, payload.workspaceId);
  }

  return false;
}

function formatBriefs(briefs) {
  if (!briefs.length) {
    return "No research briefs found.";
  }

  return briefs
    .map((brief) =>
      [
        `ID: ${brief.id}`,
        `  Title: ${brief.title}`,
        `  Question: ${brief.question}`,
        `  Status: ${brief.status}`,
        `  Priority: ${brief.priority}`,
        `  Agent: ${brief.assignedAgent}`,
        `  Task: ${brief.linkedTaskId || "(none)"}`,
      ].join("\n")
    )
    .join("\n\n");
}

function formatReports(reports) {
  if (!reports.length) {
    return "No research reports found.";
  }

  return reports
    .map((report) =>
      [
        `ID: ${report.id}`,
        `  Title: ${report.title}`,
        `  Brief: ${report.briefId}`,
        `  Status: ${report.status}`,
        `  Format: ${report.format}`,
        `  Excerpt: ${report.excerpt || "(none)"}`,
      ].join("\n")
    )
    .join("\n\n");
}

function listWorkspaceRoutes(workspaceId) {
  const store = loadWorkspaceDocument("workspace.routes", {}, { legacyPath: ROUTES_PATH });
  const key = String(workspaceId || "default");
  return Array.isArray(store[key]) ? store[key] : [];
}

function listWorkspaceUsers(workspaceId) {
  const users = loadWorkspaceDocument("workspace.users", [], { legacyPath: USERS_PATH });
  const key = String(workspaceId || "default");
  return Array.isArray(users)
    ? users.filter((user) => String(user.workspaceId || "default") === key && user.status !== "disabled")
    : [];
}

function getWorkspaceName(workspaceId) {
  const members = listWorkspaceUsers(workspaceId);
  return members[0]?.workspaceName || String(workspaceId || "default");
}

function listAllWorkspaceIds() {
  const users = loadWorkspaceDocument("workspace.users", [], { legacyPath: USERS_PATH });
  let collaboration = loadCollaborationState();
  const ids = new Set(
    (Array.isArray(users) ? users : [])
      .filter((user) => user && user.status !== "disabled")
      .map((user) => String(user.workspaceId || "default"))
  );
  Object.keys(collaboration.digestWorkspaceState || {}).forEach((workspaceId) => ids.add(String(workspaceId)));
  return [...ids];
}

function defaultAlertWorkflow() {
  return {
    acknowledged: false,
    acknowledgedAt: null,
    owner: null,
    resolved: false,
    resolvedAt: null,
    resolutionNote: null,
    notes: [],
  };
}

function computeDigestSchedulerStaleState(digestScheduler) {
  if (!digestScheduler.enabled) {
    return { stale: false, staleAfterMs: 0, ageMs: 0 };
  }

  const staleAfterMs = Math.max(Number(digestScheduler.intervalMs || 60_000) * 3, 5 * 60 * 1000);
  const ageMs = digestScheduler.lastRunAt ? Math.max(0, Date.now() - new Date(digestScheduler.lastRunAt).getTime()) : staleAfterMs + 1;
  return {
    stale: !digestScheduler.lastRunAt || ageMs > staleAfterMs,
    staleAfterMs,
    ageMs,
  };
}

function buildAutomationResolutionByWorkspace() {
  const resolution = new Map();
  listAutomationFollowups().forEach((task) => {
    if (!task.workspaceId || !task.completedAt) {
      return;
    }
    const current = resolution.get(task.workspaceId);
    const completedAt = new Date(task.completedAt).getTime();
    if (!current || completedAt > new Date(current.completedAt).getTime()) {
      resolution.set(task.workspaceId, {
        taskId: task.id,
        completedAt: task.completedAt,
        description: task.description,
        ownerName: task.ownerName || null,
      });
    }
  });
  return resolution;
}

function buildIncidentApprovalsByWorkspace() {
  let collaboration = loadCollaborationState();
  const approvalsByWorkspace = new Map();

  (Array.isArray(collaboration.approvals) ? collaboration.approvals : [])
    .filter((approval) => approval.action === "collaboration:automation-set-status")
    .forEach((approval) => {
      const workspaceId = String(approval.payload?.workspaceId || "");
      if (!workspaceId) {
        return;
      }
      const current = approvalsByWorkspace.get(workspaceId) || [];
      current.push({
        id: approval.id,
        status: approval.status,
        requestedStatus: String(approval.payload?.incidentStatus || "open"),
        archiveRationale: approval.payload?.archiveRationale || null,
        approverTarget: approval.approverTarget || null,
        routingMode: approval.routingMode || null,
        routingReason: approval.routingReason || null,
        routedFromTarget: approval.routedFromTarget || null,
        requestedById: approval.requestedById || null,
        requestedByName: approval.requestedByName || null,
        createdAt: approval.createdAt || null,
        resolvedAt: approval.resolvedAt || null,
        approvedById: approval.approvedById || null,
        approvedByName: approval.approvedByName || null,
        rejectedById: approval.rejectedById || null,
        rejectedByName: approval.rejectedByName || null,
        rejectionNote: approval.rejectionNote || null,
        label: approval.label || approval.action,
      });
      approvalsByWorkspace.set(workspaceId, current);
    });

  return approvalsByWorkspace;
}

function generateWorkspaceIncidentSummary(workspaceHealth, followups = []) {
  const summaryParts = [
    `Workspace ${workspaceHealth.workspaceName || workspaceHealth.workspaceId} is currently ${workspaceHealth.status}.`,
    `${workspaceHealth.digestEnabledUsers} digest-enabled users and ${workspaceHealth.dueUsers} users currently due.`,
  ];

  if (workspaceHealth.lastSweepError) {
    summaryParts.push(`Last sweep error: ${workspaceHealth.lastSweepError}.`);
  } else if (workspaceHealth.lastSweepRunAt) {
    summaryParts.push(`Last sweep ran at ${workspaceHealth.lastSweepRunAt}.`);
  }

  if (workspaceHealth.escalationOwner) {
    summaryParts.push(`Current owner: ${workspaceHealth.escalationOwner}.`);
  }

  const notes = Array.isArray(workspaceHealth.events)
    ? workspaceHealth.events
        .filter((event) => event.type === "workspace-note" && event.note)
        .slice(0, 2)
        .map((event) => String(event.note))
    : [];
  if (notes.length) {
    summaryParts.push(`Notes: ${notes.join(" ")}`);
  }

  const completedFollowups = followups.filter((item) => item.status === "completed");
  if (completedFollowups.length) {
    summaryParts.push(`Completed follow-ups: ${completedFollowups.map((item) => item.description).slice(0, 2).join(" | ")}.`);
  } else if (followups.length) {
    summaryParts.push(`Open follow-ups: ${followups.map((item) => item.description).slice(0, 2).join(" | ")}.`);
  }

  return summaryParts.join(" ");
}

function defaultIncidentChecklist(existing = []) {
  const prior = new Map(
    (Array.isArray(existing) ? existing : []).map((item) => [String(item.id), item])
  );
  return [
    { id: "owner_assigned", label: "Assign an incident owner" },
    { id: "followup_created", label: "Create a remediation follow-up" },
    { id: "summary_generated", label: "Generate an incident summary" },
    { id: "shared_handoff", label: "Share the incident handoff" },
  ].map((item) => {
    const current = prior.get(item.id) || {};
    return {
      id: item.id,
      label: item.label,
      completed: Boolean(current.completed),
      completedAt: current.completedAt || null,
      completedByName: current.completedByName || null,
    };
  });
}

function updateIncidentChecklistItem(workspaceId, itemId, updates = {}) {
  const workspaceState = getDigestWorkspaceState(workspaceId);
  const checklist = defaultIncidentChecklist(workspaceState.incidentChecklist).map((item) =>
    item.id === itemId ? { ...item, ...updates } : item
  );
  return updateDigestWorkspaceState(workspaceId, { incidentChecklist: checklist });
}

function getIncidentPolicy(governance = {}, workspaceId = null) {
  const environmentPolicy = getEnvironmentPolicy(governance, workspaceId);
  const requiredChecklistForResolved = Array.isArray(environmentPolicy.requiredChecklistForResolved)
    ? environmentPolicy.requiredChecklistForResolved.map((item) => String(item))
    : ["owner_assigned", "followup_created", "summary_generated"];
  return {
    environment: environmentPolicy.currentEnvironment || "development",
    requireChecklistForResolved: Boolean(environmentPolicy.requireChecklistForResolved),
    requiredChecklistForResolved,
    requireSummaryShareBeforeArchived: Boolean(environmentPolicy.requireSummaryShareBeforeArchived),
    requireApprovalForResolved: Boolean(environmentPolicy.requireApprovalForResolved),
    requireApprovalForArchived: Boolean(environmentPolicy.requireApprovalForArchived),
    incidentApprovalReminderMinutes: Math.max(1, Number(environmentPolicy.incidentApprovalReminderMinutes || 30)),
    incidentApprovalEscalationMinutes: Math.max(
      1,
      Number(environmentPolicy.incidentApprovalEscalationMinutes || environmentPolicy.incidentApprovalReminderMinutes || 60)
    ),
    incidentApprovalEscalationTarget: String(environmentPolicy.incidentApprovalEscalationTarget || "team"),
    incidentApprovalFinalEscalationMinutes: Math.max(
      1,
      Number(
        environmentPolicy.incidentApprovalFinalEscalationMinutes ||
          environmentPolicy.incidentApprovalEscalationMinutes ||
          environmentPolicy.incidentApprovalReminderMinutes ||
          60
      )
    ),
    incidentApprovalFinalEscalationTarget: String(
      environmentPolicy.incidentApprovalFinalEscalationTarget || environmentPolicy.incidentApprovalEscalationTarget || "team"
    ),
    incidentApprovalCapacityLimit: Math.max(1, Number(environmentPolicy.incidentApprovalCapacityLimit || 1)),
  };
}

function getChecklistLabelMap(checklist = []) {
  return new Map((Array.isArray(checklist) ? checklist : []).map((item) => [String(item.id), item.label || String(item.id)]));
}

function getIncidentTransitionState(workspaceHealth, governance = {}) {
  const incidentPolicy = getIncidentPolicy(governance, workspaceHealth?.workspaceId || null);
  const checklist = Array.isArray(workspaceHealth?.incidentChecklist) ? workspaceHealth.incidentChecklist : [];
  const checklistLabels = getChecklistLabelMap(checklist);
  const completedItems = new Set(checklist.filter((item) => item.completed).map((item) => String(item.id)));
  const resolveBlockers = [];
  const archiveBlockers = [];

  if (incidentPolicy.requireChecklistForResolved) {
    incidentPolicy.requiredChecklistForResolved.forEach((itemId) => {
      if (!completedItems.has(itemId)) {
        resolveBlockers.push(`Complete "${checklistLabels.get(itemId) || itemId}" before resolving this incident.`);
      }
    });
  }

  if (incidentPolicy.requireSummaryShareBeforeArchived && !completedItems.has("shared_handoff")) {
    archiveBlockers.push("Share the incident summary before archiving this incident.");
  }

  if (!["resolved", "shared", "archived"].includes(String(workspaceHealth?.incidentStatus || ""))) {
    archiveBlockers.push("Move the incident into a resolved or shared state before archiving it.");
  }

  return {
    policy: incidentPolicy,
    canResolve: resolveBlockers.length === 0,
    canArchive: archiveBlockers.length === 0,
    resolveBlockers,
    archiveBlockers,
  };
}

function validateIncidentStatusChange(workspaceId, incidentStatus, governance = {}) {
  if (!workspaceId) {
    return { ok: false, error: "Workspace is required." };
  }

  const digestScheduler = getDigestSchedulerStatus();
  const workspaceHealth = buildDigestWorkspaceHealth(digestScheduler).find((item) => item.workspaceId === workspaceId);
  if (!workspaceHealth) {
    return { ok: false, error: `Workspace not found: ${workspaceId}` };
  }

  const transitionState = getIncidentTransitionState(workspaceHealth, governance);
  const normalizedStatus = String(incidentStatus || "").trim().toLowerCase();
  const blockers =
    normalizedStatus === "resolved"
      ? transitionState.resolveBlockers
      : normalizedStatus === "archived"
        ? transitionState.archiveBlockers
        : [];

  if (blockers.length) {
    return { ok: false, error: blockers[0], workspaceHealth, transitionState };
  }

  return { ok: true, workspaceHealth, transitionState };
}

function canActorHandleApproval(actor, request, governance) {
  if (!canApproveInEnvironment(actor.role, governance, request?.payload?.workspaceId || null)) {
    return false;
  }
  if (!request?.approverTarget) {
    return true;
  }
  return matchesTargets(request.approverTarget, buildActorTargets(actor));
}

function buildIncidentApprovalSla(approval, incidentPolicy = {}) {
  if (!approval?.createdAt) {
    return null;
  }
  const reminderDelayMs = Math.max(1, Number(incidentPolicy.incidentApprovalReminderMinutes || 30)) * 60 * 1000;
  const escalationDelayMs = Math.max(
    reminderDelayMs,
    Math.max(
      1,
      Number(
        incidentPolicy.incidentApprovalEscalationMinutes ||
          incidentPolicy.incidentApprovalReminderMinutes ||
          Math.ceil(reminderDelayMs / 60000) ||
          1
      )
    ) * 60 * 1000
  );
  const finalEscalationDelayMs = Math.max(
    escalationDelayMs,
    Math.max(
      1,
      Number(
        incidentPolicy.incidentApprovalFinalEscalationMinutes ||
          incidentPolicy.incidentApprovalEscalationMinutes ||
          incidentPolicy.incidentApprovalReminderMinutes ||
          Math.ceil(escalationDelayMs / 60000) ||
          1
      )
    ) * 60 * 1000
  );
  const ageMs = Math.max(0, Date.now() - new Date(approval.createdAt).getTime());
  return {
    ageMs,
    reminderDelayMs,
    escalationDelayMs,
    finalEscalationDelayMs,
    overdue: ageMs >= reminderDelayMs,
    escalated: ageMs >= escalationDelayMs,
    finalEscalated: ageMs >= finalEscalationDelayMs,
    targetAt: new Date(new Date(approval.createdAt).getTime() + reminderDelayMs).toISOString(),
    escalationTargetAt: new Date(new Date(approval.createdAt).getTime() + escalationDelayMs).toISOString(),
    finalEscalationTargetAt: new Date(new Date(approval.createdAt).getTime() + finalEscalationDelayMs).toISOString(),
  };
}

function closeIncidentApprovalReminderHandoffs(approvalId) {
  if (!approvalId) {
    return [];
  }
  const collaboration = loadCollaborationState();
  const matching = (Array.isArray(collaboration.handoffs) ? collaboration.handoffs : []).filter(
    (handoff) =>
      handoff.status === "open" &&
      ["incident-approval-reminder", "incident-approval-escalation", "incident-approval-final-escalation"].includes(handoff.kind) &&
      String(handoff.relatedApprovalId || "") === String(approvalId)
  );
  matching.forEach((handoff) => closeHandoff(handoff.id));
  return matching;
}

function reroutePendingApproval(request, nextTarget, actor, action) {
  const approvalId = String(request?.id || "");
  if (!approvalId || !request || request.status !== "pending") {
    return null;
  }
  const updatedRequest = updateApprovalRequest(approvalId, {
    approverTarget: nextTarget,
    reassignedById: actor.id,
    reassignedByName: actor.name,
    reassignedAt: new Date().toISOString(),
  });
  const closedReminders = closeIncidentApprovalReminderHandoffs(approvalId);
  if (updatedRequest?.action === "collaboration:automation-set-status" && updatedRequest.payload?.workspaceId) {
    appendDigestWorkspaceEvent(String(updatedRequest.payload.workspaceId), {
      type: "incident-approval-rerouted",
      message:
        action === "approval:take-over" || action === "approval:bulk-take-over"
          ? `${actor.name} took ownership of the pending incident approval.`
          : `Reassigned the pending incident approval to ${nextTarget}.`,
      actorId: actor.id,
      actorName: actor.name,
      note: closedReminders.length ? `${approvalId} • closed ${closedReminders.length} reminder(s)` : approvalId,
    });
  }
  appendAuditEvent({
    type: action,
    message:
      action === "approval:take-over" || action === "approval:bulk-take-over"
        ? `Took over approval ${approvalId}.`
        : `Reassigned approval ${approvalId} to ${nextTarget}.`,
    payload: { approvalId, approverTarget: nextTarget, actorId: actor.id, closedReminders: closedReminders.length },
  });
  return updatedRequest;
}

function ensureIncidentApprovalDelegation(workspaceHealth, collaboration) {
  const approval = workspaceHealth?.incidentApproval;
  if (!approval || approval.state !== "pending" || !approval.id || !approval.approverTarget || !approval.createdAt) {
    return null;
  }

  const approvalSla = workspaceHealth.incidentApprovalSla || buildIncidentApprovalSla(approval, workspaceHealth.incidentPolicy);
  const ageMs = approvalSla?.ageMs ?? 0;
  if (!approvalSla || !Number.isFinite(ageMs) || ageMs < approvalSla.reminderDelayMs) {
    return null;
  }

  const existingReminder = (Array.isArray(collaboration.handoffs) ? collaboration.handoffs : []).find(
    (handoff) =>
      handoff.status === "open" &&
      handoff.kind === "incident-approval-reminder" &&
      String(handoff.relatedApprovalId || "") === String(approval.id)
  );
  if (existingReminder) {
    return existingReminder;
  }

  let handoff = existingReminder;
  if (!handoff) {
    handoff = createHandoff({
      title: `Approval reminder: ${workspaceHealth.workspaceName}`,
      note: `${approval.label} is still pending for ${workspaceHealth.workspaceName}. Please review the requested ${approval.requestedStatus} transition.`,
      assignedTo: approval.approverTarget,
      assignedById: "system",
      assignedByName: "System",
      kind: "incident-approval-reminder",
      workspaceId: workspaceHealth.workspaceId,
      relatedApprovalId: approval.id,
    });
    appendDigestWorkspaceEvent(workspaceHealth.workspaceId, {
      type: "incident-approval-reminder",
      message: `Delegated a reminder to ${approval.approverTarget} for the pending ${approval.requestedStatus} approval.`,
      actorId: "system",
      actorName: "System",
      note: handoff.id,
    });
    appendAuditEvent({
      type: "incident-approval-reminder",
      message: `Created an approval reminder handoff for ${workspaceHealth.workspaceId}.`,
      payload: { workspaceId: workspaceHealth.workspaceId, approvalId: approval.id, handoffId: handoff.id, approverTarget: approval.approverTarget },
    });
  }

  const escalationTarget = String(workspaceHealth.incidentPolicy?.incidentApprovalEscalationTarget || "").trim();
  if (approvalSla.escalated && escalationTarget && !matchesTargets(escalationTarget, new Set([normalizeTarget(approval.approverTarget)]))) {
    const existingEscalation = (Array.isArray(collaboration.handoffs) ? collaboration.handoffs : []).find(
      (candidate) =>
        candidate.status === "open" &&
        candidate.kind === "incident-approval-escalation" &&
        String(candidate.relatedApprovalId || "") === String(approval.id)
    );
    if (!existingEscalation) {
      const escalationHandoff = createHandoff({
        title: `Approval escalation: ${workspaceHealth.workspaceName}`,
        note: `${approval.label} has exceeded its escalation threshold in ${workspaceHealth.workspaceName}. Please intervene or coordinate with ${approval.approverTarget}.`,
        assignedTo: escalationTarget,
        assignedById: "system",
        assignedByName: "System",
        kind: "incident-approval-escalation",
        workspaceId: workspaceHealth.workspaceId,
        relatedApprovalId: approval.id,
      });
      appendDigestWorkspaceEvent(workspaceHealth.workspaceId, {
        type: "incident-approval-escalation",
        message: `Escalated the pending approval to ${escalationTarget}.`,
        actorId: "system",
        actorName: "System",
        note: escalationHandoff.id,
      });
      appendAuditEvent({
        type: "incident-approval-escalation",
        message: `Escalated an approval reminder for ${workspaceHealth.workspaceId}.`,
        payload: { workspaceId: workspaceHealth.workspaceId, approvalId: approval.id, handoffId: escalationHandoff.id, escalationTarget },
      });
    }
  }
  const finalEscalationTarget = String(workspaceHealth.incidentPolicy?.incidentApprovalFinalEscalationTarget || "").trim();
  if (
    approvalSla.finalEscalated &&
    finalEscalationTarget &&
    !matchesTargets(finalEscalationTarget, new Set([normalizeTarget(approval.approverTarget), normalizeTarget(escalationTarget)]))
  ) {
    const existingFinalEscalation = (Array.isArray(collaboration.handoffs) ? collaboration.handoffs : []).find(
      (candidate) =>
        candidate.status === "open" &&
        candidate.kind === "incident-approval-final-escalation" &&
        String(candidate.relatedApprovalId || "") === String(approval.id)
    );
    if (!existingFinalEscalation) {
      const finalEscalationHandoff = createHandoff({
        title: `Final approval escalation: ${workspaceHealth.workspaceName}`,
        note: `${approval.label} remains pending after multiple reminder windows in ${workspaceHealth.workspaceName}. Please take ownership of the closeout decision or coordinate with ${approval.approverTarget}.`,
        assignedTo: finalEscalationTarget,
        assignedById: "system",
        assignedByName: "System",
        kind: "incident-approval-final-escalation",
        workspaceId: workspaceHealth.workspaceId,
        relatedApprovalId: approval.id,
      });
      appendDigestWorkspaceEvent(workspaceHealth.workspaceId, {
        type: "incident-approval-final-escalation",
        message: `Escalated the pending approval to ${finalEscalationTarget} after the final SLA window.`,
        actorId: "system",
        actorName: "System",
        note: finalEscalationHandoff.id,
      });
      appendAuditEvent({
        type: "incident-approval-final-escalation",
        message: `Created a final approval escalation handoff for ${workspaceHealth.workspaceId}.`,
        payload: {
          workspaceId: workspaceHealth.workspaceId,
          approvalId: approval.id,
          handoffId: finalEscalationHandoff.id,
          escalationTarget: finalEscalationTarget,
        },
      });
    }
  }
  return handoff;
}

function autoRerouteIncidentApproval(workspaceHealth) {
  const approval = workspaceHealth?.incidentApproval;
  const backupTarget = String(workspaceHealth?.backupApproverTarget || "").trim();
  if (!approval || approval.state !== "pending" || !approval.id || !backupTarget) {
    return null;
  }
  if (!workspaceHealth.incidentApprovalSla?.finalEscalated) {
    return null;
  }
  if (matchesTargets(backupTarget, new Set([normalizeTarget(approval.approverTarget)]))) {
    return null;
  }

  const updated = updateApprovalRequest(approval.id, {
    approverTarget: backupTarget,
    autoReroutedAt: new Date().toISOString(),
    autoReroutedFrom: approval.approverTarget || null,
    autoReroutedById: "system",
    autoReroutedByName: "System",
  });
  const closedReminders = closeIncidentApprovalReminderHandoffs(approval.id);
  appendDigestWorkspaceEvent(workspaceHealth.workspaceId, {
    type: "incident-approval-auto-rerouted",
    message: `Automatically rerouted the pending approval to backup approver ${backupTarget}.`,
    actorId: "system",
    actorName: "System",
    note: closedReminders.length ? `${approval.id} • closed ${closedReminders.length} reminder(s)` : approval.id,
  });
  appendAuditEvent({
    type: "incident-approval-auto-rerouted",
    message: `Automatically rerouted approval ${approval.id} for ${workspaceHealth.workspaceId}.`,
    payload: {
      workspaceId: workspaceHealth.workspaceId,
      approvalId: approval.id,
      from: approval.approverTarget || null,
      to: backupTarget,
      closedReminders: closedReminders.length,
    },
  });
  return updated;
}

function buildDigestWorkspaceHealth(digestScheduler) {
  let collaboration = loadCollaborationState();
  const workspaceOverrides =
    collaboration.governance?.workspacePolicyOverrides && typeof collaboration.governance.workspacePolicyOverrides === "object"
      ? collaboration.governance.workspacePolicyOverrides
      : {};
  const resolutions = buildAutomationResolutionByWorkspace();
  const incidentApprovals = buildIncidentApprovalsByWorkspace();
  return listAllWorkspaceIds()
    .map((workspaceId) => {
      const workspaceOverride = workspaceOverrides[workspaceId] || null;
      const incidentPolicy = getIncidentPolicy(collaboration.governance, workspaceId);
      const members = listWorkspaceUsers(workspaceId);
      const enabledUsers = members.filter((user) => getDigestPreferences(user.id).enabled);
      const eligibleUsers = enabledUsers.filter((user) => shouldGenerateDigestForUser(user, collaboration, workspaceId));
      const workspaceState = getDigestWorkspaceState(workspaceId);
      const incidentChecklist = defaultIncidentChecklist(workspaceState.incidentChecklist);
      const workspaceApprovals = (incidentApprovals.get(workspaceId) || [])
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      const pendingIncidentApproval = workspaceApprovals.find((approval) => approval.status === "pending") || null;
      const latestResolvedIncidentApproval =
        workspaceApprovals.find((approval) => approval.status === "approved" || approval.status === "rejected") || null;
      const incidentApprovalSla = buildIncidentApprovalSla(pendingIncidentApproval, incidentPolicy);
      const lastSweepRunAt = workspaceState.lastSweepRunAt || null;
      const lastSweepQueuedAt = workspaceState.lastSweepQueuedAt || null;
      const staleAfterMs = Math.max(Number(digestScheduler.intervalMs || 60_000) * 6, 30 * 60 * 1000);
      const lastSweepAgeMs = lastSweepRunAt ? Math.max(0, Date.now() - new Date(lastSweepRunAt).getTime()) : null;
      const hasDigestCoverage = enabledUsers.length > 0;
      const resolution = resolutions.get(workspaceId) || null;
      const issueTimestamp = lastSweepRunAt || lastSweepQueuedAt || null;
      const resolved = Boolean(
        resolution &&
          (
            !issueTimestamp ||
            new Date(resolution.completedAt).getTime() >= new Date(issueTimestamp).getTime()
          )
      );
      const incidentStatus = workspaceState.incidentStatus || (resolved ? "ready_for_closeout" : "open");
      const stalled =
        hasDigestCoverage &&
        (!lastSweepRunAt || Boolean(lastSweepAgeMs && lastSweepAgeMs > staleAfterMs));
      const status = !hasDigestCoverage
        ? "idle"
        : resolved
          ? "resolved"
        : workspaceState.lastSweepError
          ? "error"
          : stalled
            ? "stalled"
            : eligibleUsers.length
              ? "active"
              : "healthy";

      const transitionState = getIncidentTransitionState(
        {
          workspaceId,
          incidentStatus,
          incidentChecklist,
        },
        collaboration.governance
      );

      return {
        workspaceId,
        workspaceName: getWorkspaceName(workspaceId),
        memberCount: members.length,
        digestEnabledUsers: enabledUsers.length,
        dueUsers: eligibleUsers.length,
        lastSweepRunAt,
        lastSweepQueuedAt,
        lastGeneratedCount: Number(workspaceState.lastGeneratedCount || 0),
        lastSweepError: workspaceState.lastSweepError || null,
        escalationOwner: workspaceState.escalationOwner || null,
        incidentApproverTarget: workspaceState.incidentApproverTarget || null,
        backupApproverTarget: workspaceState.backupApproverTarget || null,
        snoozedUntil: workspaceState.snoozedUntil || null,
        resolutionTaskId: resolution?.taskId || null,
        resolutionCompletedAt: resolution?.completedAt || null,
        resolutionDescription: resolution?.description || null,
        resolutionOwnerName: resolution?.ownerName || null,
        incidentSummary: workspaceState.incidentSummary || null,
        incidentSummaryUpdatedAt: workspaceState.incidentSummaryUpdatedAt || null,
        incidentHandoffDraft: workspaceState.incidentHandoffDraft || null,
        incidentHandoffDraftUpdatedAt: workspaceState.incidentHandoffDraftUpdatedAt || null,
        incidentArchiveRecommendation: workspaceState.incidentArchiveRecommendation || null,
        incidentStatus,
        incidentStatusUpdatedAt: workspaceState.incidentStatusUpdatedAt || null,
        hasPolicyOverride: Boolean(workspaceOverride && Object.keys(workspaceOverride).length),
        policyOverrideSummary: summarizeWorkspacePolicyOverride(workspaceOverride),
        incidentChecklist,
        incidentApproval: pendingIncidentApproval
          ? {
              state: "pending",
              ...pendingIncidentApproval,
            }
          : latestResolvedIncidentApproval
            ? {
                state: latestResolvedIncidentApproval.status,
                ...latestResolvedIncidentApproval,
              }
            : null,
        incidentApprovalHistory: workspaceApprovals.slice(0, 6),
        incidentApprovalSla,
        incidentPolicy: transitionState.policy,
        incidentReadiness: {
          canResolve: transitionState.canResolve,
          canArchive: transitionState.canArchive,
          resolveBlockers: transitionState.resolveBlockers,
          archiveBlockers: transitionState.archiveBlockers,
        },
        events: Array.isArray(workspaceState.events) ? workspaceState.events.slice(0, 10) : [],
        overdueIntervals: lastSweepRunAt
          ? Math.max(0, Math.floor((lastSweepAgeMs || 0) / Math.max(Number(digestScheduler.intervalMs || 60_000), 1)))
          : hasDigestCoverage
            ? 999
            : 0,
        status,
      };
    })
    .sort((a, b) => {
      const priority = { error: 0, stalled: 1, active: 2, resolved: 3, healthy: 4, idle: 5 };
      return (priority[a.status] ?? 99) - (priority[b.status] ?? 99) || a.workspaceId.localeCompare(b.workspaceId);
    });
}

function buildDigestAutomationAlerts(digestScheduler, digestWorkspaceHealth) {
  const alerts = [];
  const staleState = computeDigestSchedulerStaleState(digestScheduler);

  if (digestScheduler.lastError) {
    alerts.push({
      id: "digest_scheduler_error",
      severity: "high",
      status: "active",
      title: "Digest scheduler failed during the last sweep.",
      details: {
        lastRunAt: digestScheduler.lastRunAt,
        error: digestScheduler.lastError,
      },
      workflow: defaultAlertWorkflow(),
      createdAt: digestScheduler.lastRunAt || new Date().toISOString(),
      clearedAt: null,
    });
  } else if (staleState.stale) {
    alerts.push({
      id: "digest_scheduler_stalled",
      severity: "moderate",
      status: "active",
      title: "Digest scheduler appears stalled.",
      details: {
        lastRunAt: digestScheduler.lastRunAt,
        staleAfterMs: staleState.staleAfterMs,
        ageMs: staleState.ageMs,
      },
      workflow: defaultAlertWorkflow(),
      createdAt: digestScheduler.lastRunAt || new Date().toISOString(),
      clearedAt: null,
    });
  }

  digestWorkspaceHealth
    .filter((workspace) => workspace.status === "error" || workspace.status === "stalled")
    .slice(0, 4)
    .forEach((workspace) => {
      alerts.push({
        id: `digest_workspace_${workspace.workspaceId}`,
        severity: workspace.status === "error" ? "high" : "moderate",
        status: "active",
        title:
          workspace.status === "error"
            ? `Workspace ${workspace.workspaceId} has digest automation errors.`
            : `Workspace ${workspace.workspaceId} is overdue for a digest sweep.`,
        details: {
          workspaceId: workspace.workspaceId,
          digestEnabledUsers: workspace.digestEnabledUsers,
          dueUsers: workspace.dueUsers,
          lastSweepRunAt: workspace.lastSweepRunAt,
          lastSweepError: workspace.lastSweepError,
        },
        workflow: defaultAlertWorkflow(),
        createdAt: workspace.lastSweepRunAt || workspace.lastSweepQueuedAt || new Date().toISOString(),
        clearedAt: null,
      });
    });

  return alerts;
}

function buildDigestEscalationSignals(digestScheduler, digestWorkspaceHealth) {
  const signals = [];
  const staleState = computeDigestSchedulerStaleState(digestScheduler);
  const approvalPressureSignals = buildApprovalPressureSignals(buildIncidentApprovalPressure(digestWorkspaceHealth));

  if (digestScheduler.lastError) {
    signals.push({
      id: "digest-escalation:scheduler-error",
      tone: "critical",
      title: "Digest scheduler needs operator attention",
      detail: `The last scheduler sweep failed${digestScheduler.lastRunAt ? ` at ${digestScheduler.lastRunAt}` : ""}.`,
      command: "digest:health",
    });
  } else if (staleState.stale && staleState.ageMs > staleState.staleAfterMs * 2) {
    signals.push({
      id: "digest-escalation:scheduler-stalled",
      tone: "warning",
      title: "Digest scheduler has missed multiple sweep windows",
      detail: "Automation health is stale enough that digests may no longer be reaching workspaces on time.",
      command: "digest:health",
    });
  }

  digestWorkspaceHealth
    .filter((workspace) => !workspace.snoozedUntil || new Date(workspace.snoozedUntil).getTime() <= Date.now())
    .filter((workspace) => workspace.status !== "resolved")
    .filter((workspace) => workspace.lastSweepError || (workspace.status === "stalled" && workspace.overdueIntervals >= 2))
    .slice(0, 6)
    .forEach((workspace) => {
      signals.push({
        id: `digest-escalation:${workspace.workspaceId}`,
        tone: workspace.lastSweepError ? "critical" : "warning",
        title: workspace.lastSweepError
          ? `Workspace ${workspace.workspaceId} digest automation is failing`
          : `Workspace ${workspace.workspaceId} has missed multiple digest intervals`,
        detail: workspace.lastSweepError
          ? `${workspace.lastSweepError}${workspace.escalationOwner ? ` • owner: ${workspace.escalationOwner}` : ""}`
          : `${workspace.dueUsers} due users and ${workspace.digestEnabledUsers} digest-enabled members are waiting on a sweep.${workspace.escalationOwner ? ` Owner: ${workspace.escalationOwner}.` : ""}`,
        command: "digest:health",
        workspaceId: workspace.workspaceId,
        workspaceName: workspace.workspaceName,
        owner: workspace.escalationOwner || null,
        snoozedUntil: workspace.snoozedUntil || null,
      });
    });

  approvalPressureSignals.forEach((signal) => {
    signals.push(signal);
  });

  return signals;
}

function buildIncidentApprovalPressure(digestWorkspaceHealth = []) {
  const summary = new Map();

  (Array.isArray(digestWorkspaceHealth) ? digestWorkspaceHealth : [])
    .filter((workspace) => workspace.incidentApproval?.state === "pending")
    .forEach((workspace) => {
      const target = String(workspace.incidentApproval?.approverTarget || workspace.incidentApproverTarget || "unassigned");
      const current = summary.get(target) || {
        target,
        pendingCount: 0,
        overdueCount: 0,
        escalatedCount: 0,
        finalEscalatedCount: 0,
        oldestAgeMs: 0,
        workspaces: [],
      };
      current.pendingCount += 1;
      if (workspace.incidentApprovalSla?.overdue) current.overdueCount += 1;
      if (workspace.incidentApprovalSla?.escalated) current.escalatedCount += 1;
      if (workspace.incidentApprovalSla?.finalEscalated) current.finalEscalatedCount += 1;
      current.oldestAgeMs = Math.max(current.oldestAgeMs, Number(workspace.incidentApprovalSla?.ageMs || 0));
      current.workspaces.push({
        approvalId: workspace.incidentApproval?.id || null,
        approverTarget: workspace.incidentApproval?.approverTarget || workspace.incidentApproverTarget || null,
        workspaceId: workspace.workspaceId,
        workspaceName: workspace.workspaceName,
        requestedStatus: workspace.incidentApproval?.requestedStatus || "resolved",
        ageMs: Number(workspace.incidentApprovalSla?.ageMs || 0),
        overdue: Boolean(workspace.incidentApprovalSla?.overdue),
        escalated: Boolean(workspace.incidentApprovalSla?.escalated),
        finalEscalated: Boolean(workspace.incidentApprovalSla?.finalEscalated),
      });
      summary.set(target, current);
    });

  return [...summary.values()]
    .map((entry) => ({
      ...entry,
      workspaces: entry.workspaces
        .sort((a, b) => b.ageMs - a.ageMs || a.workspaceId.localeCompare(b.workspaceId))
        .slice(0, 6),
    }))
    .sort((a, b) => b.finalEscalatedCount - a.finalEscalatedCount || b.escalatedCount - a.escalatedCount || b.oldestAgeMs - a.oldestAgeMs || a.target.localeCompare(b.target))
    .slice(0, 8);
}

function buildApprovalPressureSignals(incidentApprovalPressure = []) {
  return (Array.isArray(incidentApprovalPressure) ? incidentApprovalPressure : [])
    .filter((entry) => entry.finalEscalatedCount > 0 || entry.overdueCount >= 2)
    .map((entry) => ({
      id: `approval-pressure:${entry.target}`,
      tone: entry.finalEscalatedCount > 0 ? "critical" : "warning",
      title:
        entry.finalEscalatedCount > 0
          ? `${entry.target} has final-escalated incident approvals`
          : `${entry.target} is building an overdue approval queue`,
      detail:
        entry.finalEscalatedCount > 0
          ? `${entry.finalEscalatedCount} final-escalated and ${entry.escalatedCount} escalated incident approvals are waiting on ${entry.target}.`
          : `${entry.overdueCount} overdue incident approvals are currently assigned to ${entry.target}.`,
      command: "digest:health",
      owner: entry.target,
    }));
}

function buildApprovalThroughputAnalytics(collaboration, digestWorkspaceHealth = []) {
  const approvals = Array.isArray(collaboration?.approvals) ? collaboration.approvals : [];
  const approvalWorkspaces = new Map();
  (Array.isArray(digestWorkspaceHealth) ? digestWorkspaceHealth : []).forEach((workspace) => {
    const items = [];
    if (workspace.incidentApproval?.id) {
      items.push(workspace.incidentApproval);
    }
    (Array.isArray(workspace.incidentApprovalHistory) ? workspace.incidentApprovalHistory : []).forEach((approval) => items.push(approval));
    items.forEach((approval) => {
      if (approval?.id) {
        approvalWorkspaces.set(String(approval.id), {
          workspaceId: workspace.workspaceId,
          workspaceName: workspace.workspaceName,
        });
      }
    });
  });

  const targetStats = new Map();
  const workspaceStats = new Map();
  let manualReroutes = 0;
  let autoReroutes = 0;

  approvals
    .filter((approval) => approval.action === "collaboration:automation-set-status")
    .forEach((approval) => {
      const target = String(approval.approverTarget || "unassigned");
      const workspaceMeta = approvalWorkspaces.get(String(approval.id)) || {
        workspaceId: String(approval.payload?.workspaceId || "unknown"),
        workspaceName: getWorkspaceName(String(approval.payload?.workspaceId || "unknown")),
      };
      const resolvedAt = approval.resolvedAt ? new Date(approval.resolvedAt).getTime() : null;
      const createdAt = approval.createdAt ? new Date(approval.createdAt).getTime() : null;
      const durationMs = createdAt && resolvedAt ? Math.max(0, resolvedAt - createdAt) : null;

      const targetEntry = targetStats.get(target) || {
        target,
        total: 0,
        approved: 0,
        rejected: 0,
        pending: 0,
        rerouted: 0,
        autoRerouted: 0,
        totalDurationMs: 0,
        resolvedCount: 0,
      };
      targetEntry.total += 1;
      if (approval.status === "approved") targetEntry.approved += 1;
      else if (approval.status === "rejected") targetEntry.rejected += 1;
      else targetEntry.pending += 1;
      if (approval.reassignedAt) {
        targetEntry.rerouted += 1;
        manualReroutes += 1;
      }
      if (approval.autoReroutedAt) {
        targetEntry.autoRerouted += 1;
        autoReroutes += 1;
      }
      if (durationMs !== null) {
        targetEntry.totalDurationMs += durationMs;
        targetEntry.resolvedCount += 1;
      }
      targetStats.set(target, targetEntry);

      const workspaceEntry = workspaceStats.get(workspaceMeta.workspaceId) || {
        workspaceId: workspaceMeta.workspaceId,
        workspaceName: workspaceMeta.workspaceName,
        total: 0,
        rerouted: 0,
        autoRerouted: 0,
        totalDurationMs: 0,
        resolvedCount: 0,
      };
      workspaceEntry.total += 1;
      if (approval.reassignedAt) workspaceEntry.rerouted += 1;
      if (approval.autoReroutedAt) workspaceEntry.autoRerouted += 1;
      if (durationMs !== null) {
        workspaceEntry.totalDurationMs += durationMs;
        workspaceEntry.resolvedCount += 1;
      }
      workspaceStats.set(workspaceMeta.workspaceId, workspaceEntry);
    });

  const targets = [...targetStats.values()]
    .map((entry) => ({
      target: entry.target,
      total: entry.total,
      approved: entry.approved,
      rejected: entry.rejected,
      pending: entry.pending,
      rerouted: entry.rerouted,
      autoRerouted: entry.autoRerouted,
      averageApprovalMs: entry.resolvedCount ? Math.round(entry.totalDurationMs / entry.resolvedCount) : null,
    }))
    .sort((a, b) => (b.pending - a.pending) || (b.autoRerouted - a.autoRerouted) || (b.rerouted - a.rerouted) || a.target.localeCompare(b.target))
    .slice(0, 8);

  const workspaces = [...workspaceStats.values()]
    .map((entry) => ({
      workspaceId: entry.workspaceId,
      workspaceName: entry.workspaceName,
      total: entry.total,
      rerouted: entry.rerouted,
      autoRerouted: entry.autoRerouted,
      averageApprovalMs: entry.resolvedCount ? Math.round(entry.totalDurationMs / entry.resolvedCount) : null,
    }))
    .sort((a, b) => (b.autoRerouted - a.autoRerouted) || (b.rerouted - a.rerouted) || (b.total - a.total) || a.workspaceId.localeCompare(b.workspaceId))
    .slice(0, 8);

  return {
    totals: {
      totalApprovals: approvals.filter((approval) => approval.action === "collaboration:automation-set-status").length,
      manualReroutes,
      autoReroutes,
      resolvedApprovals: targets.reduce((sum, entry) => sum + entry.approved + entry.rejected, 0),
    },
    targets,
    workspaces,
  };
}

function buildWorkspaceBackupApproverSuggestion(workspaceId, digestWorkspaceHealth = [], approvalThroughput = { targets: [] }) {
  const workspaceHealth = (Array.isArray(digestWorkspaceHealth) ? digestWorkspaceHealth : []).find(
    (item) => item.workspaceId === workspaceId
  );
  if (!workspaceHealth) {
    return null;
  }

  const currentTargets = new Set(
    [workspaceHealth.incidentApproverTarget, workspaceHealth.backupApproverTarget]
      .map((item) => normalizeTarget(item))
      .filter(Boolean)
  );
  const throughputByTarget = new Map(
    (Array.isArray(approvalThroughput.targets) ? approvalThroughput.targets : []).map((entry) => [entry.target, entry])
  );
  const eligibleUsers = listWorkspaceUsers(workspaceId)
    .filter((user) => ["approver", "admin"].includes(normalizeRole(user.role)))
    .map((user) => {
      const target = `user:${user.id}`;
      const throughput = throughputByTarget.get(target);
      return {
        target,
        name: user.name || user.id,
        pending: Number(throughput?.pending || 0),
        averageApprovalMs: throughput?.averageApprovalMs ?? 0,
      };
    })
    .filter((entry) => !currentTargets.has(normalizeTarget(entry.target)))
    .sort((a, b) => (a.pending - b.pending) || (a.averageApprovalMs - b.averageApprovalMs) || a.name.localeCompare(b.name));

  return eligibleUsers[0]?.target || null;
}

function buildRecommendationConfidence(kind, { pressureEntry = null, throughputTargetEntry = null, workspaceEntry = null } = {}) {
  let score = 0.5;
  if (kind === "capacity" && pressureEntry) {
    score = Math.min(0.98, 0.55 + Number(pressureEntry.finalEscalatedCount || 0) * 0.18 + Number(pressureEntry.overdueCount || 0) * 0.06);
  } else if (kind === "throughput" && throughputTargetEntry) {
    const avgMinutes = Math.round(Number(throughputTargetEntry.averageApprovalMs || 0) / 60000);
    score = Math.min(0.95, 0.5 + Math.min(avgMinutes / 120, 0.25) + Math.min(Number(throughputTargetEntry.pending || 0) * 0.04, 0.16));
  } else if (kind === "workspace" && workspaceEntry) {
    score = Math.min(0.94, 0.52 + Math.min(Number(workspaceEntry.autoRerouted || 0) * 0.16, 0.24) + Math.min(Number(workspaceEntry.rerouted || 0) * 0.08, 0.18));
  }

  let label = "medium";
  if (score >= 0.8) {
    label = "high";
  } else if (score < 0.6) {
    label = "low";
  }
  return { score: Math.round(score * 100) / 100, label };
}

function buildApprovalPolicyRecommendations(
  incidentApprovalPressure = [],
  approvalThroughput = { targets: [], workspaces: [], totals: {} },
  environmentPolicy = {},
  digestWorkspaceHealth = []
) {
  const recommendations = [];
  const currentCapacityLimit = Math.max(1, Number(environmentPolicy.incidentApprovalCapacityLimit || 1));

  (Array.isArray(incidentApprovalPressure) ? incidentApprovalPressure : [])
    .filter((entry) => entry.finalEscalatedCount > 0 || entry.overdueCount >= Math.max(2, currentCapacityLimit))
    .slice(0, 3)
    .forEach((entry) => {
      const suggestedCapacityLimit = Math.max(1, currentCapacityLimit - 1);
      const confidence = buildRecommendationConfidence("capacity", { pressureEntry: entry });
      recommendations.push({
        id: `approval-policy-pressure:${entry.target}`,
        title: `Reduce load on ${entry.target}`,
        detail:
          entry.finalEscalatedCount > 0
            ? `${entry.target} has ${entry.finalEscalatedCount} final-escalated approvals. Consider lowering capacity or routing more work to a backup approver.`
            : `${entry.target} has ${entry.overdueCount} overdue approvals. Consider lowering capacity or assigning a backup approver.`,
        kind: "capacity",
        confidence,
        target: entry.target,
        action: {
          type: "collaboration:apply-approval-policy-recommendation",
          payload: {
            recommendationId: `approval-policy-pressure:${entry.target}`,
            recommendationTitle: `Reduce load on ${entry.target}`,
            recommendationKind: "capacity",
            environment: environmentPolicy.currentEnvironment || "development",
            target: entry.target,
            suggestedCapacityLimit,
          },
        },
        promoteAction: {
          type: "collaboration:promote-approval-policy-recommendation",
          payload: {
            recommendationId: `approval-policy-pressure:${entry.target}`,
            recommendationTitle: `Reduce load on ${entry.target}`,
            recommendationKind: "capacity",
            environment: environmentPolicy.currentEnvironment || "development",
            target: entry.target,
            suggestedCapacityLimit,
          },
        },
      });
    });

  (Array.isArray(approvalThroughput.targets) ? approvalThroughput.targets : [])
    .filter((entry) => entry.averageApprovalMs !== null && entry.averageApprovalMs > 30 * 60 * 1000)
    .slice(0, 3)
    .forEach((entry) => {
      const suggestedCapacityLimit = Math.max(1, currentCapacityLimit - 1);
      const confidence = buildRecommendationConfidence("throughput", { throughputTargetEntry: entry });
      recommendations.push({
        id: `approval-policy-throughput:${entry.target}`,
        title: `Reroute slower approvals away from ${entry.target}`,
        detail: `${entry.target} is averaging ${Math.round((entry.averageApprovalMs || 0) / 60000)} minutes per approval. Consider assigning a stronger backup or lowering their capacity limit.`,
        kind: "throughput",
        confidence,
        target: entry.target,
        action: {
          type: "collaboration:apply-approval-policy-recommendation",
          payload: {
            recommendationId: `approval-policy-throughput:${entry.target}`,
            recommendationTitle: `Reroute slower approvals away from ${entry.target}`,
            recommendationKind: "throughput",
            environment: environmentPolicy.currentEnvironment || "development",
            target: entry.target,
            suggestedCapacityLimit,
          },
        },
        promoteAction: {
          type: "collaboration:promote-approval-policy-recommendation",
          payload: {
            recommendationId: `approval-policy-throughput:${entry.target}`,
            recommendationTitle: `Reroute slower approvals away from ${entry.target}`,
            recommendationKind: "throughput",
            environment: environmentPolicy.currentEnvironment || "development",
            target: entry.target,
            suggestedCapacityLimit,
          },
        },
      });
    });

  (Array.isArray(approvalThroughput.workspaces) ? approvalThroughput.workspaces : [])
    .filter((entry) => entry.autoRerouted > 0 || entry.rerouted >= 2)
    .slice(0, 3)
    .forEach((entry) => {
      const suggestedBackupApproverTarget = buildWorkspaceBackupApproverSuggestion(
        entry.workspaceId,
        digestWorkspaceHealth,
        approvalThroughput
      );
      const confidence = buildRecommendationConfidence("workspace", { workspaceEntry: entry });
      const workspaceActionPayload = suggestedBackupApproverTarget
        ? {
            recommendationId: `approval-policy-workspace:${entry.workspaceId}`,
            recommendationTitle: `Tune approval policy for ${entry.workspaceName}`,
            recommendationKind: "workspace",
            workspaceId: entry.workspaceId,
            suggestedBackupApproverTarget,
          }
        : {
            recommendationId: `approval-policy-workspace:${entry.workspaceId}`,
            recommendationTitle: `Tune approval policy for ${entry.workspaceName}`,
            recommendationKind: "workspace",
            workspaceId: entry.workspaceId,
            environment: environmentPolicy.currentEnvironment || "development",
            suggestedCapacityLimit: Math.max(1, currentCapacityLimit - 1),
          };
      recommendations.push({
        id: `approval-policy-workspace:${entry.workspaceId}`,
        title: `Tune approval policy for ${entry.workspaceName}`,
        detail:
          entry.autoRerouted > 0
            ? `${entry.workspaceName} has already needed ${entry.autoRerouted} automatic reroutes. ${
                suggestedBackupApproverTarget
                  ? `Set ${suggestedBackupApproverTarget} as the backup approver to absorb overflow earlier.`
                  : "Consider a dedicated backup approver or tighter capacity settings."
              }`
            : `${entry.workspaceName} has needed repeated manual reroutes. ${
                suggestedBackupApproverTarget
                  ? `Pre-assign ${suggestedBackupApproverTarget} as the backup approver.`
                  : "Consider pre-assigning a backup approver or lowering the primary approver capacity."
              }`,
        kind: "workspace",
        confidence,
        workspaceId: entry.workspaceId,
        action: {
          type: "collaboration:apply-approval-policy-recommendation",
          payload: workspaceActionPayload,
        },
        promoteAction: {
          type: "collaboration:promote-approval-policy-recommendation",
          payload: workspaceActionPayload,
        },
      });
    });

  const deduped = new Map();
  recommendations.forEach((item) => {
    if (!deduped.has(item.id)) {
      deduped.set(item.id, item);
    }
  });
  return [...deduped.values()].slice(0, 6);
}

function selectAdaptiveApprovalTarget(workspaceId, requestedTarget, backupTarget, governance) {
  const primaryTarget = String(requestedTarget || "").trim();
  const fallbackTarget = String(backupTarget || "").trim();
  if (!primaryTarget) {
    return { approverTarget: null, routedByCapacity: false, routedAdaptively: false, reason: null, mode: "unassigned", routedFromTarget: null };
  }

  const policy = getIncidentPolicy(governance, workspaceId);
  const capacityLimit = Math.max(1, Number(policy.incidentApprovalCapacityLimit || 1));
  const digestWorkspaceHealth = buildDigestWorkspaceHealth(getDigestSchedulerStatus());
  const pressure = buildIncidentApprovalPressure(digestWorkspaceHealth);
  const throughput = buildApprovalThroughputAnalytics(loadCollaborationState(), digestWorkspaceHealth);
  const primaryPressure = pressure.find((entry) => entry.target === primaryTarget);
  const atCapacity = Number(primaryPressure?.pendingCount || 0) >= capacityLimit;
  const throughputByTarget = new Map((Array.isArray(throughput.targets) ? throughput.targets : []).map((entry) => [entry.target, entry]));
  const primaryThroughput = throughputByTarget.get(primaryTarget) || null;
  const fallbackThroughput = throughputByTarget.get(fallbackTarget) || null;
  const primaryPending = Number(primaryPressure?.pendingCount || primaryThroughput?.pending || 0);
  const fallbackPending = Number(
    pressure.find((entry) => entry.target === fallbackTarget)?.pendingCount || fallbackThroughput?.pending || 0
  );

  if (atCapacity && fallbackTarget && !matchesTargets(fallbackTarget, new Set([normalizeTarget(primaryTarget)]))) {
    return {
      approverTarget: fallbackTarget,
      routedByCapacity: true,
      routedAdaptively: false,
      reason: `${primaryTarget} is at capacity (${primaryPressure?.pendingCount || 0}/${capacityLimit}), so the approval was routed to ${fallbackTarget}.`,
      mode: "capacity",
      routedFromTarget: primaryTarget,
    };
  }

  const primaryAverage = Number(primaryThroughput?.averageApprovalMs || 0);
  const fallbackAverage = Number(fallbackThroughput?.averageApprovalMs || 0);
  const fallbackHasSignal = Boolean(fallbackThroughput && fallbackAverage > 0);
  const primaryLooksSlow = primaryAverage >= 30 * 60 * 1000;
  const fallbackLooksHealthier =
    fallbackTarget &&
    !matchesTargets(fallbackTarget, new Set([normalizeTarget(primaryTarget)])) &&
    ((fallbackHasSignal && fallbackAverage > 0 && fallbackAverage <= primaryAverage * 0.75) ||
      (!fallbackHasSignal && primaryPending >= Math.max(1, capacityLimit - 1) && fallbackPending < primaryPending));

  if (primaryLooksSlow && fallbackLooksHealthier) {
    return {
      approverTarget: fallbackTarget,
      routedByCapacity: false,
      routedAdaptively: true,
      reason: `${fallbackTarget} was selected over ${primaryTarget} based on faster recent approval throughput and lower current load.`,
      mode: "adaptive",
      routedFromTarget: primaryTarget,
    };
  }

  return { approverTarget: primaryTarget, routedByCapacity: false, routedAdaptively: false, reason: null, mode: "primary", routedFromTarget: null };
}

function summarizeApprovalPolicyRecommendationEffect(payload, outcome) {
  if (outcome?.backupApproverTarget && payload.workspaceId) {
    return `Assigned ${outcome.backupApproverTarget} as the backup approver for ${payload.workspaceId}.`;
  }
  return `Set the ${outcome?.environment || payload.environment || "active"} approval capacity limit to ${outcome?.capacityLimit || payload.suggestedCapacityLimit || 1}.`;
}

function buildApprovalPolicyMetricsSnapshot(payload = {}) {
  const digestWorkspaceHealth = buildDigestWorkspaceHealth(getDigestSchedulerStatus());
  const collaboration = loadCollaborationState();
  const pressure = buildIncidentApprovalPressure(digestWorkspaceHealth);
  const throughput = buildApprovalThroughputAnalytics(collaboration, digestWorkspaceHealth);
  const workspaceId = String(payload.workspaceId || "");
  const target = String(payload.target || "");
  return {
    targetPressure: target ? pressure.find((item) => item.target === target) || null : null,
    targetThroughput: target ? throughput.targets.find((item) => item.target === target) || null : null,
    workspaceThroughput: workspaceId ? throughput.workspaces.find((item) => item.workspaceId === workspaceId) || null : null,
  };
}

function evaluateAppliedApprovalPolicyImpact(entry, incidentApprovalPressure = [], approvalThroughput = { targets: [], workspaces: [] }) {
  const targetPressure = entry.target
    ? (Array.isArray(incidentApprovalPressure) ? incidentApprovalPressure : []).find((item) => item.target === entry.target) || null
    : null;
  const targetThroughput = entry.target
    ? (Array.isArray(approvalThroughput.targets) ? approvalThroughput.targets : []).find((item) => item.target === entry.target) || null
    : null;
  const workspaceThroughput = entry.workspaceId
    ? (Array.isArray(approvalThroughput.workspaces) ? approvalThroughput.workspaces : []).find((item) => item.workspaceId === entry.workspaceId) || null
    : null;
  const baselinePressure = entry.metricsSnapshot?.targetPressure || null;
  const baselineTargetThroughput = entry.metricsSnapshot?.targetThroughput || null;
  const baselineWorkspaceThroughput = entry.metricsSnapshot?.workspaceThroughput || null;
  const beforeOverdue = Number(baselinePressure?.overdueCount || 0);
  const afterOverdue = Number(targetPressure?.overdueCount || 0);
  const beforeAvg = Number(baselineTargetThroughput?.averageApprovalMs || baselineWorkspaceThroughput?.averageApprovalMs || 0);
  const afterAvg = Number(targetThroughput?.averageApprovalMs || workspaceThroughput?.averageApprovalMs || 0);
  const beforePending = Number(baselinePressure?.pendingCount || baselineTargetThroughput?.pending || 0);
  const afterPending = Number(targetPressure?.pendingCount || targetThroughput?.pending || 0);
  const beforeAutoReroutes = Number(baselineWorkspaceThroughput?.autoRerouted || 0);
  const afterAutoReroutes = Number(workspaceThroughput?.autoRerouted || 0);

  let status = "neutral";
  let summary = "No measurable impact yet.";
  if (entry.rolledBackAt) {
    status = "rolled_back";
    summary = `Rolled back on ${entry.rolledBackAt}.`;
  } else if (beforeOverdue || afterOverdue) {
    if (afterOverdue < beforeOverdue) {
      status = "improved";
      summary = `Overdue approvals dropped from ${beforeOverdue} to ${afterOverdue}.`;
    } else if (afterOverdue > beforeOverdue) {
      status = "regressed";
      summary = `Overdue approvals rose from ${beforeOverdue} to ${afterOverdue}.`;
    }
  } else if (beforeAvg || afterAvg) {
    if (beforeAvg && afterAvg && afterAvg < beforeAvg) {
      status = "improved";
      summary = `Average approval time improved from ${Math.round(beforeAvg / 60000)}m to ${Math.round(afterAvg / 60000)}m.`;
    } else if (beforeAvg && afterAvg && afterAvg > beforeAvg) {
      status = "regressed";
      summary = `Average approval time worsened from ${Math.round(beforeAvg / 60000)}m to ${Math.round(afterAvg / 60000)}m.`;
    }
  }

  return {
    status,
    summary,
    comparison: {
      overdueDelta: afterOverdue - beforeOverdue,
      pendingDelta: afterPending - beforePending,
      averageApprovalMinutesBefore: beforeAvg ? Math.round(beforeAvg / 60000) : null,
      averageApprovalMinutesAfter: afterAvg ? Math.round(afterAvg / 60000) : null,
      autoReroutesBefore: beforeAutoReroutes,
      autoReroutesAfter: afterAutoReroutes,
    },
    currentMetrics: {
      targetPressure,
      targetThroughput,
      workspaceThroughput,
    },
  };
}

function buildApprovalTrustDashboard(appliedPolicies = [], observations = [], environmentPolicy = {}, trustAlertAcks = []) {
  const regressedCount = (Array.isArray(appliedPolicies) ? appliedPolicies : []).filter((item) => item.impact?.status === "regressed").length;
  const improvedCount = (Array.isArray(appliedPolicies) ? appliedPolicies : []).filter((item) => item.impact?.status === "improved").length;
  const rolledBackCount = (Array.isArray(appliedPolicies) ? appliedPolicies : []).filter((item) => item.impact?.status === "rolled_back").length;
  const observingCount = (Array.isArray(observations) ? observations : []).filter((item) => item.status === "observing").length;
  const cooldownCount = (Array.isArray(observations) ? observations : []).filter((item) => item.status === "cooldown").length;
  const score = Math.max(0, Math.min(100, 70 + improvedCount * 8 - regressedCount * 12 - rolledBackCount * 10 - cooldownCount * 4));
  const observationHours = Math.max(1, Number(environmentPolicy.autoPromoteObservationHours || 24));
  const now = Date.now();
  const alerts = [];
  const acknowledgedById = new Map(
    (Array.isArray(trustAlertAcks) ? trustAlertAcks : []).map((item) => [String(item.alertId), item])
  );

  (Array.isArray(appliedPolicies) ? appliedPolicies : [])
    .filter((item) => item.impact?.status === "regressed")
    .slice(0, 3)
    .forEach((item) => {
      const id = `trust-regressed:${item.id}`;
      alerts.push({
        id,
        tone: "critical",
        title: `Policy regressed: ${item.title}`,
        detail: item.impact?.summary || "A promoted policy is trending in the wrong direction.",
        environment: String(item.environment || environmentPolicy.currentEnvironment || "development"),
        acknowledged: acknowledgedById.has(id),
        acknowledgedAt: acknowledgedById.get(id)?.acknowledgedAt || null,
        acknowledgedByName: acknowledgedById.get(id)?.acknowledgedByName || null,
        actions: item.rolledBackAt
          ? [
              {
                label: "Acknowledge",
                action: "collaboration:acknowledge-trust-alert",
                payload: { alertId: id },
              },
            ]
          : [
              {
                label: "Roll back policy",
                action: "collaboration:rollback-approval-policy",
                payload: { promotionId: item.id },
              },
              {
                label: "Acknowledge",
                action: "collaboration:acknowledge-trust-alert",
                payload: { alertId: id },
              },
            ],
      });
    });

  (Array.isArray(observations) ? observations : [])
    .filter((item) => item.status === "observing" && item.eligibleSinceAt)
    .filter((item) => now - new Date(item.eligibleSinceAt).getTime() >= observationHours * 60 * 60 * 1000 * 0.5)
    .slice(0, 3)
    .forEach((item) => {
      const id = `trust-maturing:${item.recommendationId}`;
      alerts.push({
        id,
        tone: "warning",
        title: `Recommendation maturing: ${item.title}`,
        detail: `This recommendation has held its signal for a meaningful part of the observation window and is approaching auto-promotion eligibility.`,
        environment: String(item.environment || environmentPolicy.currentEnvironment || "development"),
        acknowledged: acknowledgedById.has(id),
        acknowledgedAt: acknowledgedById.get(id)?.acknowledgedAt || null,
        acknowledgedByName: acknowledgedById.get(id)?.acknowledgedByName || null,
        actions: [
          {
            label: "Restart observation",
            action: "collaboration:restart-approval-recommendation-observation",
            payload: { recommendationId: item.recommendationId },
          },
          {
            label: "Acknowledge",
            action: "collaboration:acknowledge-trust-alert",
            payload: { alertId: id },
          },
        ],
      });
    });

  (Array.isArray(observations) ? observations : [])
    .filter((item) => item.status === "cooldown" && item.cooldownUntil)
    .filter((item) => new Date(item.cooldownUntil).getTime() - now <= 24 * 60 * 60 * 1000)
    .slice(0, 3)
    .forEach((item) => {
      const id = `trust-cooldown:${item.recommendationId}`;
      alerts.push({
        id,
        tone: "warning",
        title: `Cooldown ending soon: ${item.title}`,
        detail: `This recommendation family leaves cooldown on ${item.cooldownUntil}.`,
        environment: String(item.environment || environmentPolicy.currentEnvironment || "development"),
        acknowledged: acknowledgedById.has(id),
        acknowledgedAt: acknowledgedById.get(id)?.acknowledgedAt || null,
        acknowledgedByName: acknowledgedById.get(id)?.acknowledgedByName || null,
        actions: [
          {
            label: "Extend cooldown",
            action: "collaboration:extend-approval-recommendation-cooldown",
            payload: { recommendationId: item.recommendationId, hours: 24 },
          },
          {
            label: "Acknowledge",
            action: "collaboration:acknowledge-trust-alert",
            payload: { alertId: id },
          },
        ],
      });
    });

  return {
    score,
    regressedCount,
    improvedCount,
    rolledBackCount,
    observingCount,
    cooldownCount,
    alerts,
  };
}

function buildApprovalTrustEnvironmentSummaries(governance = {}) {
  const environmentPolicies = governance.environmentPolicies || {};
  const appliedPolicies = Array.isArray(governance.appliedApprovalPolicies) ? governance.appliedApprovalPolicies : [];
  const observations = Array.isArray(governance.approvalRecommendationObservations) ? governance.approvalRecommendationObservations : [];
  const currentEnvironment = String(governance.currentEnvironment || "development");

  return Object.keys(environmentPolicies)
    .map((environment) => {
      const policy = {
        currentEnvironment: environment,
        ...(environmentPolicies[environment] || {}),
      };
      const dashboard = buildApprovalTrustDashboard(
        appliedPolicies.filter((item) => String(item.environment || currentEnvironment) === environment),
        observations.filter((item) => String(item.environment || currentEnvironment) === environment),
        policy
      );
      return {
        environment,
        current: environment === currentEnvironment,
        autoPromoteEnabled: Boolean(policy.autoPromoteApprovalRecommendations),
        observationHours: Math.max(1, Number(policy.autoPromoteObservationHours || 24)),
        cooldownHours: Math.max(1, Number(policy.autoPromoteCooldownHours || 72)),
        score: dashboard.score,
        regressedCount: dashboard.regressedCount,
        improvedCount: dashboard.improvedCount,
        observingCount: dashboard.observingCount,
        cooldownCount: dashboard.cooldownCount,
        alertCount: dashboard.alerts.length,
      };
    })
    .sort((a, b) => {
      if (a.current) return -1;
      if (b.current) return 1;
      return a.environment.localeCompare(b.environment);
    });
}

function recordApprovalTrustSnapshot(governance = {}, dashboard = {}, environmentPolicy = {}) {
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
  updateGovernance({
    ...governance,
    approvalTrustHistory: [entry, ...history].slice(0, 500),
  });
  return [entry, ...history].slice(0, 500);
}

function pickTrustWindowSnapshot(history = [], environment, windowMs) {
  const now = Date.now();
  return (Array.isArray(history) ? history : [])
    .filter((item) => String(item.environment) === environment)
    .find((item) => now - new Date(item.takenAt).getTime() >= windowMs);
}

function buildApprovalTrustTrends(governance = {}, environmentSummaries = []) {
  const history = Array.isArray(governance.approvalTrustHistory) ? governance.approvalTrustHistory : [];
  return (Array.isArray(environmentSummaries) ? environmentSummaries : []).map((entry) => {
    const snapshots = history.filter((item) => String(item.environment) === entry.environment);
    const latest = snapshots[0] || null;
    const day = pickTrustWindowSnapshot(history, entry.environment, 24 * 60 * 60 * 1000);
    const week = pickTrustWindowSnapshot(history, entry.environment, 7 * 24 * 60 * 60 * 1000);
    const month = pickTrustWindowSnapshot(history, entry.environment, 30 * 24 * 60 * 60 * 1000);
    return {
      environment: entry.environment,
      current: entry.current,
      latestTakenAt: latest?.takenAt || null,
      sampleCount: snapshots.length,
      score: entry.score,
      deltas: {
        day: day ? entry.score - Number(day.score || 0) : null,
        week: week ? entry.score - Number(week.score || 0) : null,
        month: month ? entry.score - Number(month.score || 0) : null,
      },
      activity: {
        latestRegressedCount: entry.regressedCount,
        latestImprovedCount: entry.improvedCount,
        latestAlertCount: entry.alertCount,
      },
    };
  });
}

function buildApprovalTrustSignals(approvalTrustDashboard = {}, approvalTrustTrends = []) {
  const alerts = [];
  const trendMap = new Map(
    (Array.isArray(approvalTrustTrends) ? approvalTrustTrends : []).map((item) => [String(item.environment), item])
  );

  (Array.isArray(approvalTrustDashboard.alerts) ? approvalTrustDashboard.alerts : []).forEach((item) => {
    alerts.push({
      id: `trust:${item.id}`,
      tone: item.tone || "warning",
      type: "trust",
      title: item.title,
      detail: item.detail,
      command: "trust:status",
      environment: item.environment || null,
    });
  });

  trendMap.forEach((trend, environment) => {
    if (typeof trend.deltas?.day === "number" && trend.deltas.day <= -8) {
      alerts.push({
        id: `trust-drop:${environment}`,
        tone: "critical",
        type: "trust",
        title: `${environment} trust dropped sharply`,
        detail: `${environment} trust moved ${trend.deltas.day} points over the last 24 hours.`,
        command: "trust:status",
        environment,
      });
    }
    if (trend.activity?.latestRegressedCount > 0 && typeof trend.deltas?.day === "number" && trend.deltas.day < 0) {
      alerts.push({
        id: `trust-regression:${environment}`,
        tone: "warning",
        type: "trust",
        title: `${environment} has fresh policy regressions`,
        detail: `${trend.activity.latestRegressedCount} regressed policies are affecting ${environment} trust.`,
        command: "trust:status",
        environment,
      });
    }
  });

  return alerts.slice(0, 8);
}

function applyTrustEscalationPolicy(workspaceId, collaboration, trustSignals = []) {
  const governance = collaboration.governance || {};
  const environmentPolicy = getEnvironmentPolicy(governance, workspaceId);
  const action = String(environmentPolicy.trustDropAction || "notify");
  const trustDrop = (Array.isArray(trustSignals) ? trustSignals : []).find((item) =>
    String(item.id || "").startsWith("trust-drop:")
  );

  if (!trustDrop || action === "notify") {
    return { applied: false, mode: "notify" };
  }

  if (action === "followup") {
    const existing = listAutomationFollowups(workspaceId).find((task) =>
      String(task.description || "").includes("trust drop")
    );
    if (existing) {
      return { applied: false, mode: "followup" };
    }
    const owner = String(environmentPolicy.trustDropFollowupOwner || "Jamie Lead");
    addTask("manager", `Investigate trust drop for ${workspaceId}`, {
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
    appendDigestWorkspaceEvent(workspaceId, {
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

function promoteTrustDropToIncident(workspaceId, collaboration, trustSignals = []) {
  const governance = collaboration.governance || {};
  const environmentPolicy = getEnvironmentPolicy(governance, workspaceId);
  if (!environmentPolicy.promoteTrustDropToIncident) {
    return false;
  }
  const trustDrop = (Array.isArray(trustSignals) ? trustSignals : []).find((item) =>
    String(item.id || "").startsWith("trust-drop:")
  );
  if (!trustDrop) {
    return false;
  }

  const state = getDigestWorkspaceState(workspaceId);
  const existingNote = Array.isArray(state.events)
    ? state.events.find((event) => event.type === "trust-incident-promoted" && String(event.note || "").includes(trustDrop.id))
    : null;
  if (existingNote) {
    return false;
  }

  updateDigestWorkspaceState(workspaceId, {
    incidentStatus: "open",
    incidentStatusUpdatedAt: new Date().toISOString(),
    incidentSummary: state.incidentSummary || `Trust incident: ${trustDrop.detail}`,
    incidentSummaryUpdatedAt: state.incidentSummaryUpdatedAt || new Date().toISOString(),
  });
  appendDigestWorkspaceEvent(workspaceId, {
    type: "trust-incident-promoted",
    message: `Promoted trust degradation into a workspace incident.`,
    actorId: "system",
    actorName: "System",
    note: `${trustDrop.id} • ${trustDrop.detail}`,
  });
  return true;
}

function recoverTrustIncident(workspaceId, collaboration, trustSignals = []) {
  const trustDrop = (Array.isArray(trustSignals) ? trustSignals : []).find((item) =>
    String(item.id || "").startsWith("trust-drop:")
  );
  if (trustDrop) {
    return false;
  }

  const state = getDigestWorkspaceState(workspaceId);
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

  updateDigestWorkspaceState(workspaceId, {
    incidentStatus: "ready_for_closeout",
    incidentStatusUpdatedAt: new Date().toISOString(),
    incidentSummary: summary,
    incidentSummaryUpdatedAt: new Date().toISOString(),
  });
  appendDigestWorkspaceEvent(workspaceId, {
    type: "trust-incident-recovered",
    message: "Trust incident recovered and is ready for closeout.",
    actorId: "system",
    actorName: "System",
    note: summary,
  });
  updateIncidentChecklistItem(workspaceId, "summary_generated", {
    completed: true,
    completedAt: new Date().toISOString(),
    completedByName: "System",
  });
  return true;
}

function requestRecoveredTrustIncidentCloseout(workspaceId, collaboration) {
  const governance = collaboration.governance || {};
  if (!requiresIncidentApproval("resolved", governance, workspaceId)) {
    return false;
  }

  const workspaceHealth = buildDigestWorkspaceHealth(getDigestSchedulerStatus()).find((item) => item.workspaceId === workspaceId);
  if (!workspaceHealth || String(workspaceHealth.incidentStatus || "") !== "ready_for_closeout") {
    return false;
  }
  if (!workspaceHealth.incidentReadiness?.canResolve) {
    return false;
  }

  const state = getDigestWorkspaceState(workspaceId);
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

  const approvalRouting = selectAdaptiveApprovalTarget(
    workspaceId,
    String(state.incidentApproverTarget || "").trim() || null,
    String(state.backupApproverTarget || "").trim() || null,
    governance
  );
  const approvalTarget = approvalRouting.approverTarget;
  const approval = createApprovalRequest({
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
  appendDigestWorkspaceEvent(workspaceId, {
    type: "incident-approval",
    message: "Automatically requested closeout approval after trust recovery.",
    actorId: "system",
    actorName: "System",
    note: approvalRouting.reason ? `${approval.id} • ${approvalRouting.reason}` : approval.id,
  });
  appendAuditEvent({
    type: "approval:requested",
    message: `Automatically requested closeout approval for recovered trust incident ${workspaceId}.`,
    payload: { workspaceId, approvalId: approval.id, approverTarget: approvalTarget, routingMode: approvalRouting.mode },
  });
  return true;
}

function finalizeRecoveredTrustIncidentCloseout(workspaceId, actorName = "System") {
  const workspaceHealth = buildDigestWorkspaceHealth(getDigestSchedulerStatus()).find((item) => item.workspaceId === workspaceId);
  if (!workspaceHealth || String(workspaceHealth.incidentStatus || "") !== "resolved") {
    return false;
  }

  const state = getDigestWorkspaceState(workspaceId);
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
    `The workspace recovered from the earlier trust drop and the incident is now resolved.`,
    workspaceHealth.incidentPolicy?.requireSummaryShareBeforeArchived
      ? "Share the closeout handoff before archiving this incident."
      : "Review archive readiness and archive when the team is ready.",
  ].join(" ");
  const handoffDraft = [
    `Trust recovery handoff for ${workspaceHealth.workspaceName || workspaceId}.`,
    `Recovery status: approved and resolved.`,
    `Summary: ${workspaceHealth.incidentSummary || "Trust conditions improved and the closeout approval was granted."}`,
    `Next step: ${workspaceHealth.incidentPolicy?.requireSummaryShareBeforeArchived ? "Share this handoff with the workspace owner or team before archive." : "Review archive readiness and archive when appropriate."}`,
  ].join(" ");
  const archiveRecommendation = workspaceHealth.incidentPolicy?.requireSummaryShareBeforeArchived
    ? "Share the prepared trust recovery handoff, then archive this incident when the handoff is complete."
    : "This recovered trust incident is resolved and can be archived when the team is ready.";

  updateDigestWorkspaceState(workspaceId, {
    incidentSummary: closeoutSummary,
    incidentSummaryUpdatedAt: new Date().toISOString(),
    incidentHandoffDraft: handoffDraft,
    incidentHandoffDraftUpdatedAt: new Date().toISOString(),
    incidentArchiveRecommendation: archiveRecommendation,
  });
  appendDigestWorkspaceEvent(workspaceId, {
    type: "trust-incident-closeout-approved",
    message: "Approved trust recovery closeout and prepared archive guidance.",
    actorId: "system",
    actorName,
    note: closeoutSummary,
  });
  return true;
}

function buildTrustArchiveRationale(workspaceId) {
  const workspaceHealth = buildDigestWorkspaceHealth(getDigestSchedulerStatus()).find((item) => item.workspaceId === workspaceId);
  if (!workspaceHealth) {
    return null;
  }
  const state = getDigestWorkspaceState(workspaceId);
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

function finalizeArchivedTrustIncident(workspaceId, actorName = "System") {
  const workspaceHealth = buildDigestWorkspaceHealth(getDigestSchedulerStatus()).find((item) => item.workspaceId === workspaceId);
  if (!workspaceHealth || String(workspaceHealth.incidentStatus || "") !== "archived") {
    return false;
  }
  const state = getDigestWorkspaceState(workspaceId);
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
    `Recovery was approved, the closeout handoff was shared, and the workspace has completed the trust remediation lifecycle.`,
    `Archive approved by policy in the ${workspaceHealth.incidentPolicy?.environment || "current"} environment.`,
  ].join(" ");

  updateDigestWorkspaceState(workspaceId, {
    incidentSummary: finalSummary,
    incidentSummaryUpdatedAt: new Date().toISOString(),
    incidentHandoffDraft: null,
    incidentHandoffDraftUpdatedAt: null,
    incidentArchiveRecommendation: null,
  });
  appendDigestWorkspaceEvent(workspaceId, {
    type: "trust-incident-archived",
    message: "Archived the completed trust incident and finalized the recap.",
    actorId: "system",
    actorName,
    note: finalSummary,
  });
  return true;
}

function buildApprovalRecommendationFamilyHistory(
  recommendations = [],
  appliedPolicies = [],
  observations = [],
  trustSignals = []
) {
  const families = new Map();

  function ensureFamily(key, seed = {}) {
    if (!families.has(key)) {
      families.set(key, {
        family: key,
        label: seed.label || key,
        recommendationKind: seed.recommendationKind || "policy",
        target: seed.target || null,
        workspaceId: seed.workspaceId || null,
        recommendationCount: 0,
        promotedCount: 0,
        rolledBackCount: 0,
        observingCount: 0,
        trustSignalCount: 0,
        lastRecommendationAt: null,
        lastPromotionAt: null,
        lastSignalTitle: null,
      });
    }
    return families.get(key);
  }

  (Array.isArray(recommendations) ? recommendations : []).forEach((item) => {
    const familyKey = String(item.id || item.action?.payload?.recommendationId || item.title || "policy");
    const family = ensureFamily(familyKey, {
      label: item.title,
      recommendationKind: item.kind || item.action?.payload?.recommendationKind || "policy",
      target: item.target || item.action?.payload?.target || null,
      workspaceId: item.workspaceId || item.action?.payload?.workspaceId || null,
    });
    family.recommendationCount += 1;
    family.lastRecommendationAt = new Date().toISOString();
    family.lastSignalTitle = item.title || family.lastSignalTitle;
  });

  (Array.isArray(appliedPolicies) ? appliedPolicies : []).forEach((item) => {
    const familyKey = String(item.recommendationId || item.id || item.title || "policy");
    const family = ensureFamily(familyKey, {
      label: item.title,
      recommendationKind: item.recommendationKind || "policy",
      target: item.target || null,
      workspaceId: item.workspaceId || null,
    });
    family.promotedCount += 1;
    if (item.rolledBackAt) {
      family.rolledBackCount += 1;
    }
    family.lastPromotionAt = item.appliedAt || family.lastPromotionAt;
    family.lastSignalTitle = item.title || family.lastSignalTitle;
  });

  (Array.isArray(observations) ? observations : []).forEach((item) => {
    const familyKey = String(item.recommendationId || item.title || "policy");
    const family = ensureFamily(familyKey, {
      label: item.title,
    });
    if (item.status === "observing" || item.status === "cooldown") {
      family.observingCount += 1;
    }
  });

  (Array.isArray(trustSignals) ? trustSignals : []).forEach((item) => {
    const baseKey = String(item.id || "");
    const familyKey = baseKey.startsWith("trust:")
      ? baseKey.replace(/^trust:/, "")
      : baseKey.startsWith("trust-drop:") || baseKey.startsWith("trust-regression:")
        ? baseKey
        : baseKey;
    const family = ensureFamily(familyKey, {
      label: item.title,
    });
    family.trustSignalCount += 1;
    family.lastSignalTitle = item.title || family.lastSignalTitle;
  });

  return [...families.values()]
    .sort((a, b) =>
      (b.trustSignalCount - a.trustSignalCount) ||
      (b.rolledBackCount - a.rolledBackCount) ||
      (b.promotedCount - a.promotedCount) ||
      a.label.localeCompare(b.label)
    )
    .slice(0, 10);
}

function buildCompletedTrustIncidents(digestWorkspaceHealth = []) {
  return (Array.isArray(digestWorkspaceHealth) ? digestWorkspaceHealth : [])
    .map((workspace) => {
      const archivedEvent = Array.isArray(workspace.events)
        ? workspace.events.find((event) => event.type === "trust-incident-archived")
        : null;
      if (!archivedEvent) {
        return null;
      }
      return {
        workspaceId: workspace.workspaceId,
        workspaceName: workspace.workspaceName,
        environment: workspace.incidentPolicy?.environment || "unknown",
        archivedAt: archivedEvent.timestamp || null,
        summary: workspace.incidentSummary || archivedEvent.note || null,
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.archivedAt || 0).getTime() - new Date(a.archivedAt || 0).getTime())
    .slice(0, 8);
}

function summarizeWorkspacePolicyOverride(override = {}) {
  if (!override || typeof override !== "object" || !Object.keys(override).length) {
    return null;
  }
  const parts = [];
  if (override.environment) {
    parts.push(`env ${override.environment}`);
  }
  if (Object.prototype.hasOwnProperty.call(override, "requireApprovalForResolved")) {
    parts.push(`resolve approval ${override.requireApprovalForResolved ? "on" : "off"}`);
  }
  if (Object.prototype.hasOwnProperty.call(override, "requireApprovalForArchived")) {
    parts.push(`archive approval ${override.requireApprovalForArchived ? "on" : "off"}`);
  }
  if (Object.prototype.hasOwnProperty.call(override, "incidentApprovalCapacityLimit")) {
    parts.push(`capacity ${override.incidentApprovalCapacityLimit}`);
  }
  if (override.trustDropAction) {
    parts.push(`trust ${override.trustDropAction}`);
  }
  return parts.slice(0, 4).join(" • ");
}

function normalizePolicyPlaybookPayload(payload = {}, actor = { id: "system", name: "System" }) {
  const name = String(payload.name || "").trim();
  if (!name) {
    return { ok: false, error: "Playbook name is required." };
  }
  return {
    ok: true,
    playbook: {
      id: String(payload.id || `policy_playbook_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`),
      name,
      environment: String(payload.environment || "development"),
      incidentApprovalCapacityLimit: Math.max(1, Number(payload.incidentApprovalCapacityLimit || 1)),
      trustDropAction: String(payload.trustDropAction || "notify"),
      requireApprovalForResolved: Boolean(payload.requireApprovalForResolved),
      promoteTrustDropToIncident: Boolean(payload.promoteTrustDropToIncident),
      updatedAt: new Date().toISOString(),
      updatedById: actor.id,
      updatedByName: actor.name,
    },
  };
}

function listDefaultPolicyPlaybookPresets() {
  return [
    {
      id: "preset_development_watch",
      name: "Development Watch",
      environment: "development",
      incidentApprovalCapacityLimit: 3,
      trustDropAction: "notify",
      requireApprovalForResolved: false,
      promoteTrustDropToIncident: false,
      description: "Lightweight monitoring for lower-risk clusters with fast visibility and no extra closeout approval.",
    },
    {
      id: "preset_staging_watch",
      name: "Staging Watch",
      environment: "staging",
      incidentApprovalCapacityLimit: 2,
      trustDropAction: "digest",
      requireApprovalForResolved: true,
      promoteTrustDropToIncident: false,
      description: "Digest-heavy review mode for pre-production clusters that still keeps human approval in the loop.",
    },
    {
      id: "preset_production_recovery",
      name: "Production Recovery",
      environment: "production",
      incidentApprovalCapacityLimit: 1,
      trustDropAction: "followup",
      requireApprovalForResolved: true,
      promoteTrustDropToIncident: true,
      description: "Strict recovery posture for high-risk clusters with follow-up creation and trust-incident promotion enabled.",
    },
  ];
}

function summarizePolicyPlaybookRollouts(rollouts = []) {
  const normalized = Array.isArray(rollouts) ? rollouts : [];
  const environmentCounts = new Map();

  normalized.forEach((item) => {
    const environment = String(item.environment || "development");
    environmentCounts.set(environment, (environmentCounts.get(environment) || 0) + 1);
  });

  return {
    recent: normalized
      .slice()
      .sort((a, b) => new Date(b.appliedAt || 0).getTime() - new Date(a.appliedAt || 0).getTime())
      .slice(0, 8),
    byEnvironment: [...environmentCounts.entries()].map(([environment, rolloutCount]) => ({
      environment,
      rolloutCount,
    })),
  };
}

function buildPolicyPlaybookAdoptionSummary(
  rollouts = [],
  savedPlaybooks = [],
  presets = [],
  digestWorkspaceHealth = [],
  completedTrustIncidents = []
) {
  const normalizedRollouts = Array.isArray(rollouts) ? rollouts : [];
  const workspaces = Array.isArray(digestWorkspaceHealth) ? digestWorkspaceHealth : [];
  const completedTrust = Array.isArray(completedTrustIncidents) ? completedTrustIncidents : [];
  const savedMap = new Map(
    (Array.isArray(savedPlaybooks) ? savedPlaybooks : []).map((item) => [String(item.id), item])
  );
  const presetMap = new Map(
    (Array.isArray(presets) ? presets : []).map((item) => [String(item.id), item])
  );
  const workspaceMap = new Map(workspaces.map((item) => [String(item.workspaceId), item]));
  const completedTrustIds = new Set(completedTrust.map((item) => String(item.workspaceId)));
  const entries = new Map();

  normalizedRollouts.forEach((rollout) => {
    const playbookId = String(rollout.playbookId || "");
    const source = presetMap.has(playbookId) ? "preset" : savedMap.has(playbookId) ? "saved" : "custom";
    const key = `${source}:${playbookId || rollout.playbookName || "unknown"}`;
    if (!entries.has(key)) {
      entries.set(key, {
        playbookId: playbookId || null,
        playbookName: String(rollout.playbookName || "Unknown playbook"),
        source,
        environment: String(rollout.environment || savedMap.get(playbookId)?.environment || presetMap.get(playbookId)?.environment || "development"),
        rolloutCount: 0,
        workspaceCount: 0,
        latestAppliedAt: null,
        recoveredWorkspaceCount: 0,
        activeRiskWorkspaceCount: 0,
        completedTrustCount: 0,
      });
    }
    const current = entries.get(key);
    current.rolloutCount += 1;
    current.workspaceCount += Number(rollout.workspaceCount || 0);
    const touchedWorkspaceIds = Array.isArray(rollout.workspaceIds) ? rollout.workspaceIds.map((item) => String(item)) : [];
    touchedWorkspaceIds.forEach((workspaceId) => {
      const workspace = workspaceMap.get(workspaceId);
      if (workspace) {
        const stableStatus = !["error", "stalled"].includes(String(workspace.status || ""));
        const settledIncident = ["ready_for_closeout", "resolved", "shared", "archived"].includes(
          String(workspace.incidentStatus || "")
        );
        if (stableStatus && settledIncident) {
          current.recoveredWorkspaceCount += 1;
        } else {
          current.activeRiskWorkspaceCount += 1;
        }
      }
      if (completedTrustIds.has(workspaceId)) {
        current.completedTrustCount += 1;
      }
    });
    if (!current.latestAppliedAt || new Date(rollout.appliedAt || 0).getTime() > new Date(current.latestAppliedAt || 0).getTime()) {
      current.latestAppliedAt = rollout.appliedAt || null;
    }
  });

  const items = [...entries.values()].sort((a, b) => {
    if (a.rolloutCount !== b.rolloutCount) {
      return b.rolloutCount - a.rolloutCount;
    }
    if (a.workspaceCount !== b.workspaceCount) {
      return b.workspaceCount - a.workspaceCount;
    }
    return a.playbookName.localeCompare(b.playbookName);
  });

  const recommendations = items
    .map((item) => {
      if (item.rolloutCount < 1) {
        return null;
      }
      if (item.recoveredWorkspaceCount >= item.activeRiskWorkspaceCount && item.recoveredWorkspaceCount > 0) {
        return {
          id: `playbook_recommendation_prefer_${item.playbookId || item.playbookName}`,
          tone: "healthy",
          title: `Prefer ${item.playbookName}`,
          detail: `${item.playbookName} has stabilized ${item.recoveredWorkspaceCount} workspace${item.recoveredWorkspaceCount === 1 ? "" : "s"} with ${item.activeRiskWorkspaceCount} still at risk.`,
          environment: item.environment,
          playbookId: item.playbookId,
          playbookName: item.playbookName,
          kind: "prefer",
          source: item.source,
        };
      }
      if (item.activeRiskWorkspaceCount > item.recoveredWorkspaceCount) {
        return {
          id: `playbook_recommendation_review_${item.playbookId || item.playbookName}`,
          tone: "warning",
          title: `Review ${item.playbookName}`,
          detail: `${item.playbookName} still leaves ${item.activeRiskWorkspaceCount} workspace${item.activeRiskWorkspaceCount === 1 ? "" : "s"} at risk versus ${item.recoveredWorkspaceCount} recovered.`,
          environment: item.environment,
          playbookId: item.playbookId,
          playbookName: item.playbookName,
          kind: "review",
          source: item.source,
        };
      }
      return null;
    })
    .filter(Boolean)
    .slice(0, 6);

  return {
    totalTracked: items.length,
    presetCount: items.filter((item) => item.source === "preset").length,
    savedCount: items.filter((item) => item.source === "saved").length,
    items: items.slice(0, 8),
    recommendations,
  };
}

function buildCompletedTrustEnvironmentSummaries(completedTrustIncidents = []) {
  const grouped = new Map();
  (Array.isArray(completedTrustIncidents) ? completedTrustIncidents : []).forEach((item) => {
    const environment = String(item.environment || "unknown");
    if (!grouped.has(environment)) {
      grouped.set(environment, {
        environment,
        archivedCount: 0,
        latestArchivedAt: null,
        recentWorkspaces: [],
      });
    }
    const entry = grouped.get(environment);
    entry.archivedCount += 1;
    if (!entry.latestArchivedAt || new Date(item.archivedAt || 0).getTime() > new Date(entry.latestArchivedAt || 0).getTime()) {
      entry.latestArchivedAt = item.archivedAt || null;
    }
    if (entry.recentWorkspaces.length < 3) {
      entry.recentWorkspaces.push(item.workspaceName);
    }
  });
  return [...grouped.values()].sort((a, b) => b.archivedCount - a.archivedCount || a.environment.localeCompare(b.environment));
}

function buildEnvironmentTrustRecaps(
  approvalTrustEnvironments = [],
  approvalTrustSignals = [],
  completedTrustEnvironments = []
) {
  const completedMap = new Map(
    (Array.isArray(completedTrustEnvironments) ? completedTrustEnvironments : []).map((item) => [String(item.environment), item])
  );
  const signalCounts = new Map();
  (Array.isArray(approvalTrustSignals) ? approvalTrustSignals : []).forEach((item) => {
    const environment = String(item.environment || "global");
    signalCounts.set(environment, (signalCounts.get(environment) || 0) + 1);
  });

  return (Array.isArray(approvalTrustEnvironments) ? approvalTrustEnvironments : [])
    .map((item) => {
      const completed = completedMap.get(String(item.environment));
      return {
        environment: item.environment,
        score: Number(item.score || 0),
        activeSignals: Number(signalCounts.get(String(item.environment)) || 0),
        completedArchived: Number(completed?.archivedCount || 0),
        latestArchivedAt: completed?.latestArchivedAt || null,
      };
    })
    .sort((a, b) => {
      if (a.activeSignals !== b.activeSignals) {
        return b.activeSignals - a.activeSignals;
      }
      if (a.completedArchived !== b.completedArchived) {
        return b.completedArchived - a.completedArchived;
      }
      return a.environment.localeCompare(b.environment);
    });
}

function buildGlobalOperationsSummary(
  digestWorkspaceHealth = [],
  digestEscalations = [],
  incidentApprovalPressure = [],
  approvalTrustEnvironments = [],
  approvalTrustSignals = [],
  completedTrustIncidents = [],
  policyPlaybookRollouts = []
) {
  const workspaces = Array.isArray(digestWorkspaceHealth) ? digestWorkspaceHealth : [];
  const trustEnvironments = Array.isArray(approvalTrustEnvironments) ? approvalTrustEnvironments : [];
  const trustSignals = Array.isArray(approvalTrustSignals) ? approvalTrustSignals : [];
  const completedTrust = Array.isArray(completedTrustIncidents) ? completedTrustIncidents : [];
  const pressure = Array.isArray(incidentApprovalPressure) ? incidentApprovalPressure : [];
  const rolloutSummary = summarizePolicyPlaybookRollouts(policyPlaybookRollouts);
  const rolloutCounts = new Map(
    rolloutSummary.byEnvironment.map((item) => [String(item.environment), Number(item.rolloutCount || 0)])
  );

  const environmentMetrics = new Map();
  trustEnvironments.forEach((item) => {
    environmentMetrics.set(String(item.environment), {
      environment: String(item.environment),
      workspaceCount: 0,
      overrideCount: 0,
      unhealthyCount: 0,
      openIncidents: 0,
      pendingApprovals: 0,
      finalEscalations: 0,
      activeTrustSignals: 0,
      completedTrustIncidents: 0,
      playbookRollouts: 0,
      averageTrustScore: Number(item.score || 0),
    });
  });

  workspaces.forEach((workspace) => {
    const environment = String(workspace.incidentPolicy?.environment || "development");
    const current = environmentMetrics.get(environment) || {
      environment,
      workspaceCount: 0,
      overrideCount: 0,
      unhealthyCount: 0,
      openIncidents: 0,
      pendingApprovals: 0,
      finalEscalations: 0,
      activeTrustSignals: 0,
      completedTrustIncidents: 0,
      playbookRollouts: 0,
      averageTrustScore: 0,
    };
    current.workspaceCount += 1;
    if (workspace.hasPolicyOverride) {
      current.overrideCount += 1;
    }
    if (["error", "stalled"].includes(String(workspace.status || ""))) {
      current.unhealthyCount += 1;
    }
    if (!["ready_for_closeout", "resolved", "shared", "archived"].includes(String(workspace.incidentStatus || ""))) {
      current.openIncidents += 1;
    }
    if (workspace.incidentApproval?.state === "pending") {
      current.pendingApprovals += 1;
      if (workspace.incidentApprovalSla?.finalEscalated) {
        current.finalEscalations += 1;
      }
    }
    environmentMetrics.set(environment, current);
  });

  trustSignals.forEach((signal) => {
    const environment = String(signal.environment || "global");
    const current = environmentMetrics.get(environment) || {
      environment,
      workspaceCount: 0,
      overrideCount: 0,
      unhealthyCount: 0,
      openIncidents: 0,
      pendingApprovals: 0,
      finalEscalations: 0,
      activeTrustSignals: 0,
      completedTrustIncidents: 0,
      playbookRollouts: 0,
      averageTrustScore: 0,
    };
    current.activeTrustSignals += 1;
    environmentMetrics.set(environment, current);
  });

  completedTrust.forEach((item) => {
    const environment = String(item.environment || "development");
    const current = environmentMetrics.get(environment) || {
      environment,
      workspaceCount: 0,
      overrideCount: 0,
      unhealthyCount: 0,
      openIncidents: 0,
      pendingApprovals: 0,
      finalEscalations: 0,
      activeTrustSignals: 0,
      completedTrustIncidents: 0,
      playbookRollouts: 0,
      averageTrustScore: 0,
    };
    current.completedTrustIncidents += 1;
    environmentMetrics.set(environment, current);
  });

  const hotspots = workspaces
    .map((workspace) => ({
      workspaceId: workspace.workspaceId,
      workspaceName: workspace.workspaceName,
      status: workspace.status,
      incidentStatus: workspace.incidentStatus,
      environment: String(workspace.incidentPolicy?.environment || "development"),
      hasPolicyOverride: Boolean(workspace.hasPolicyOverride),
      policyOverrideSummary: workspace.policyOverrideSummary || null,
      dueUsers: Number(workspace.dueUsers || 0),
      overdueIntervals: Number(workspace.overdueIntervals || 0),
      pendingApprovalTarget: workspace.incidentApproval?.state === "pending" ? workspace.incidentApproval.approverTarget || null : null,
      finalEscalated: Boolean(workspace.incidentApprovalSla?.finalEscalated),
    }))
    .sort((a, b) => {
      const priority = { error: 0, stalled: 1, active: 2, resolved: 3, healthy: 4, idle: 5 };
      if (Boolean(a.finalEscalated) !== Boolean(b.finalEscalated)) {
        return a.finalEscalated ? -1 : 1;
      }
      return (priority[a.status] ?? 99) - (priority[b.status] ?? 99) || b.overdueIntervals - a.overdueIntervals;
    })
    .slice(0, 6);

  const pressureTargets = pressure
    .map((entry) => ({
      target: entry.target,
      pendingCount: Number(entry.pendingCount || 0),
      overdueCount: Number(entry.overdueCount || 0),
      finalEscalatedCount: Number(entry.finalEscalatedCount || 0),
      workspaceCount: Array.isArray(entry.workspaces) ? entry.workspaces.length : 0,
    }))
    .slice(0, 6);

  return {
    totals: {
      workspaceCount: workspaces.length,
      overriddenWorkspaces: workspaces.filter((item) => Boolean(item.hasPolicyOverride)).length,
      unhealthyWorkspaces: workspaces.filter((item) => ["error", "stalled"].includes(String(item.status || ""))).length,
      openIncidents: workspaces.filter((item) => !["ready_for_closeout", "resolved", "shared", "archived"].includes(String(item.incidentStatus || ""))).length,
      pendingApprovals: workspaces.filter((item) => item.incidentApproval?.state === "pending").length,
      finalEscalations: workspaces.filter((item) => Boolean(item.incidentApprovalSla?.finalEscalated)).length,
      activeTrustSignals: trustSignals.length,
      activeDigestEscalations: Array.isArray(digestEscalations) ? digestEscalations.length : 0,
      completedTrustIncidents: completedTrust.length,
      playbookRollouts: rolloutSummary.recent.length,
    },
    environments: [...environmentMetrics.values()]
      .map((item) => ({
        ...item,
        playbookRollouts: Number(rolloutCounts.get(String(item.environment)) || 0),
      }))
      .sort((a, b) => {
      if (a.unhealthyCount !== b.unhealthyCount) {
        return b.unhealthyCount - a.unhealthyCount;
      }
      if (a.activeTrustSignals !== b.activeTrustSignals) {
        return b.activeTrustSignals - a.activeTrustSignals;
      }
      return a.environment.localeCompare(b.environment);
    }),
    hotspots,
    pressureTargets,
    playbookRollouts: rolloutSummary.recent,
  };
}

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

function filterTrustCollaborationScope(collaboration = {}, trustEnvironment = "all") {
  const selected = String(trustEnvironment || "all");
  if (!selected || selected === "all") {
    return collaboration;
  }

  return {
    ...collaboration,
    approvalTrustEnvironments: (Array.isArray(collaboration.approvalTrustEnvironments) ? collaboration.approvalTrustEnvironments : []).filter(
      (item) => String(item.environment) === selected
    ),
    environmentTrustRecaps: (Array.isArray(collaboration.environmentTrustRecaps) ? collaboration.environmentTrustRecaps : []).filter(
      (item) => String(item.environment) === selected
    ),
    approvalTrustTrends: (Array.isArray(collaboration.approvalTrustTrends) ? collaboration.approvalTrustTrends : []).filter(
      (item) => String(item.environment) === selected
    ),
    approvalTrustSignals: (Array.isArray(collaboration.approvalTrustSignals) ? collaboration.approvalTrustSignals : []).filter(
      (item) => !item.environment || String(item.environment) === selected
    ),
    completedTrustEnvironments: (Array.isArray(collaboration.completedTrustEnvironments) ? collaboration.completedTrustEnvironments : []).filter(
      (item) => String(item.environment) === selected
    ),
    completedTrustIncidents: (Array.isArray(collaboration.completedTrustIncidents) ? collaboration.completedTrustIncidents : []).filter(
      (item) => String(item.environment) === selected
    ),
  };
}

function formatTrustReport(collaboration = {}) {
  const environments = Array.isArray(collaboration.approvalTrustEnvironments) ? collaboration.approvalTrustEnvironments : [];
  const trends = Array.isArray(collaboration.approvalTrustTrends) ? collaboration.approvalTrustTrends : [];
  const families = Array.isArray(collaboration.approvalRecommendationFamilies) ? collaboration.approvalRecommendationFamilies : [];
  const signals = Array.isArray(collaboration.approvalTrustSignals) ? collaboration.approvalTrustSignals : [];
  const completedTrustIncidents = Array.isArray(collaboration.completedTrustIncidents) ? collaboration.completedTrustIncidents : [];
  const completedTrustEnvironments = Array.isArray(collaboration.completedTrustEnvironments)
    ? collaboration.completedTrustEnvironments
    : [];
  const environmentTrustRecaps = Array.isArray(collaboration.environmentTrustRecaps) ? collaboration.environmentTrustRecaps : [];

  const environmentLines = environments.length
    ? environments.map((item) =>
        `- ${item.environment}: score ${item.score}, alerts ${item.alertCount}, regressed ${item.regressedCount}, improved ${item.improvedCount}`
      )
    : ["- No environment trust data."];

  const trendLines = trends.length
    ? trends.map((item) =>
        `- ${item.environment}: 24h ${item.deltas?.day ?? "n/a"}, 7d ${item.deltas?.week ?? "n/a"}, 30d ${item.deltas?.month ?? "n/a"}`
      )
    : ["- No trust trends recorded."];

  const familyLines = families.length
    ? families.map((item) =>
        `- ${item.label}: recommendations ${item.recommendationCount}, promoted ${item.promotedCount}, rolled back ${item.rolledBackCount}, trust alerts ${item.trustSignalCount}`
      )
    : ["- No recommendation family history recorded."];

  const signalLines = signals.length
    ? signals.map((item) => `- ${item.title}: ${item.detail}`)
    : ["- No active trust alerts."];

  const completedLines = completedTrustIncidents.length
    ? completedTrustIncidents.map((item) => `- ${item.workspaceName} (${item.environment}) archived ${item.archivedAt}: ${item.summary}`)
    : ["- No completed trust incidents recorded."];
  const completedEnvironmentLines = completedTrustEnvironments.length
    ? completedTrustEnvironments.map(
        (item) =>
          `- ${item.environment}: ${item.archivedCount} archived trust incidents${item.latestArchivedAt ? `, latest ${item.latestArchivedAt}` : ""}${item.recentWorkspaces.length ? ` (${item.recentWorkspaces.join(", ")})` : ""}`
      )
    : ["- No completed trust environment summaries recorded."];
  const environmentRecapLines = environmentTrustRecaps.length
    ? environmentTrustRecaps.map(
        (item) =>
          `- ${item.environment}: score ${item.score}, active trust ${item.activeSignals}, completed archived ${item.completedArchived}${item.latestArchivedAt ? `, latest archive ${item.latestArchivedAt}` : ""}`
      )
    : ["- No environment trust recaps recorded."];

  return [
    "Trust report",
    "",
    "Environment summary",
    ...environmentLines,
    "",
    "Environment recaps",
    ...environmentRecapLines,
    "",
    "Trend summary",
    ...trendLines,
    "",
    "Recommendation families",
    ...familyLines,
    "",
    "Completed trust by environment",
    ...completedEnvironmentLines,
    "",
    "Completed trust incidents",
    ...completedLines,
    "",
    "Active trust alerts",
    ...signalLines,
  ].join("\n");
}

function acknowledgeApprovalTrustAlert(actor, payload = {}) {
  const alertId = String(payload.alertId || "").trim();
  if (!alertId) {
    return { ok: false, error: "Trust alert ID is required." };
  }
  const collaboration = loadCollaborationState();
  const governance = collaboration.governance || {};
  const existing = Array.isArray(governance.approvalTrustAlertAcks) ? governance.approvalTrustAlertAcks : [];
  const nextEntry = {
    alertId,
    acknowledgedAt: new Date().toISOString(),
    acknowledgedById: actor.id,
    acknowledgedByName: actor.name,
  };
  updateGovernance({
    ...governance,
    approvalTrustAlertAcks: [nextEntry, ...existing.filter((item) => String(item.alertId) !== alertId)].slice(0, 100),
  });
  return {
    ok: true,
    output: `Acknowledged trust alert ${alertId}.`,
  };
}

function restartApprovalRecommendationObservation(actor, payload = {}) {
  const recommendationId = String(payload.recommendationId || "").trim();
  if (!recommendationId) {
    return { ok: false, error: "Recommendation ID is required." };
  }
  const collaboration = loadCollaborationState();
  const governance = collaboration.governance || {};
  const observations = Array.isArray(governance.approvalRecommendationObservations)
    ? governance.approvalRecommendationObservations
    : [];
  const now = new Date().toISOString();
  let found = false;
  const next = observations.map((item) => {
    if (String(item.recommendationId) !== recommendationId) {
      return item;
    }
    found = true;
    return {
      ...item,
      firstObservedAt: now,
      eligibleSinceAt: now,
      lastObservedAt: now,
      cooldownUntil: null,
      status: "observing",
    };
  });
  if (!found) {
    return { ok: false, error: `Recommendation observation not found: ${recommendationId}.` };
  }
  updateGovernance({
    ...governance,
    approvalRecommendationObservations: next,
    approvalTrustAlertAcks: (Array.isArray(governance.approvalTrustAlertAcks) ? governance.approvalTrustAlertAcks : []).filter(
      (item) => !String(item.alertId || "").includes(recommendationId)
    ),
  });
  return {
    ok: true,
    output: `Restarted observation for ${recommendationId}.`,
  };
}

function extendApprovalRecommendationCooldown(actor, payload = {}) {
  const recommendationId = String(payload.recommendationId || "").trim();
  const hours = Math.max(1, Number(payload.hours || 24));
  if (!recommendationId) {
    return { ok: false, error: "Recommendation ID is required." };
  }
  const collaboration = loadCollaborationState();
  const governance = collaboration.governance || {};
  const observations = Array.isArray(governance.approvalRecommendationObservations)
    ? governance.approvalRecommendationObservations
    : [];
  let found = false;
  const cooldownUntil = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
  const next = observations.map((item) => {
    if (String(item.recommendationId) !== recommendationId) {
      return item;
    }
    found = true;
    return {
      ...item,
      cooldownUntil,
      lastObservedAt: new Date().toISOString(),
      status: "cooldown",
    };
  });
  if (!found) {
    return { ok: false, error: `Recommendation observation not found: ${recommendationId}.` };
  }
  updateGovernance({
    ...governance,
    approvalRecommendationObservations: next,
    approvalTrustAlertAcks: (Array.isArray(governance.approvalTrustAlertAcks) ? governance.approvalTrustAlertAcks : []).filter(
      (item) => !String(item.alertId || "").includes(recommendationId)
    ),
  });
  return {
    ok: true,
    output: `Extended cooldown for ${recommendationId} by ${hours} hours.`,
  };
}

function buildApprovalPolicyPromotionEntry(payload, actor, beforeSnapshot, outcome) {
  return {
    id: `approval_policy_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    recommendationId: String(payload.recommendationId || payload.recommendationKind || "approval-policy"),
    recommendationKind: String(payload.recommendationKind || "policy"),
    environment: outcome.environment || String(payload.environment || "development"),
    target: String(payload.target || "") || null,
    workspaceId: String(payload.workspaceId || "") || null,
    title: String(payload.recommendationTitle || payload.recommendationId || "Approval policy change"),
    appliedAt: new Date().toISOString(),
    appliedById: actor.id,
    appliedByName: actor.name,
    appliedAutomatically: Boolean(outcome.automatic),
    effectSummary: summarizeApprovalPolicyRecommendationEffect(payload, outcome),
    metricsSnapshot: buildApprovalPolicyMetricsSnapshot(payload),
    beforeSnapshot,
    afterSnapshot: {
      capacityLimit: outcome.capacityLimit || null,
      backupApproverTarget: outcome.backupApproverTarget || null,
    },
  };
}

function observeApprovalPolicyRecommendations(recommendations = [], environmentPolicy = {}) {
  const collaboration = loadCollaborationState();
  const governance = collaboration.governance || {};
  const observations = Array.isArray(governance.approvalRecommendationObservations)
    ? governance.approvalRecommendationObservations
    : [];
  const observationById = new Map(observations.map((item) => [String(item.recommendationId), item]));
  const minConfidence = Math.max(0.5, Math.min(0.99, Number(environmentPolicy.autoPromoteRecommendationConfidence || 0.9)));
  const now = new Date();
  let changed = false;

  const next = (Array.isArray(recommendations) ? recommendations : []).map((recommendation) => {
    const recommendationId = String(recommendation.id || recommendation.promoteAction?.payload?.recommendationId || "");
    const existing = observationById.get(recommendationId) || {};
    const cooldownUntil = existing.cooldownUntil ? new Date(existing.cooldownUntil) : null;
    const inCooldown = Boolean(cooldownUntil && cooldownUntil.getTime() > now.getTime());
    const confidence = Number(recommendation.confidence?.score || 0);
    const eligibleNow = confidence >= minConfidence && !inCooldown;
    const status = inCooldown ? "cooldown" : eligibleNow ? "observing" : "watching";
    const candidate = {
      recommendationId,
      title: recommendation.title,
      environment: String(environmentPolicy.currentEnvironment || "development"),
      firstObservedAt: existing.firstObservedAt || now.toISOString(),
      eligibleSinceAt: eligibleNow ? existing.eligibleSinceAt || now.toISOString() : null,
      cooldownUntil: inCooldown ? cooldownUntil.toISOString() : null,
      lastObservedAt: now.toISOString(),
      lastConfidence: confidence,
      status,
      lastPromotionAt: existing.lastPromotionAt || null,
    };
    if (JSON.stringify(candidate) !== JSON.stringify(existing)) {
      changed = true;
    }
    return candidate;
  });

  if (changed || next.length !== observations.length) {
    updateGovernance({
      ...governance,
      approvalRecommendationObservations: next,
    });
  }
  return next;
}

function applyApprovalPolicyRecommendationChange(
  actor,
  payload = {},
  options = {},
  { persistPromotion = false, automatic = false, includeOverview = true } = {}
) {
  const recommendationKind = String(payload.recommendationKind || "").trim();
  const recommendationId = String(payload.recommendationId || recommendationKind || "approval-policy");
  const workspaceId = String(payload.workspaceId || "").trim();
  const target = String(payload.target || "").trim();
  const collaborationState = loadCollaborationState();
  const environment = String(payload.environment || collaborationState.governance.currentEnvironment || "development").trim();
  const nextEnvironmentPolicy = {
    ...getEnvironmentPolicy(collaborationState.governance),
    ...(collaborationState.governance.environmentPolicies?.[environment] || {}),
  };
  const beforeSnapshot = {
    capacityLimit: Math.max(1, Number(nextEnvironmentPolicy.incidentApprovalCapacityLimit || 1)),
    backupApproverTarget: workspaceId ? getDigestWorkspaceState(workspaceId).backupApproverTarget || null : null,
  };
  const now = new Date().toISOString();

  if (recommendationKind === "workspace" && workspaceId) {
    const backupApproverTarget = String(payload.suggestedBackupApproverTarget || "").trim();
    if (backupApproverTarget) {
      updateDigestWorkspaceState(workspaceId, {
        backupApproverTarget,
        backupApproverAssignedBy: actor.id,
        backupApproverAssignedAt: now,
      });
      appendDigestWorkspaceEvent(workspaceId, {
        type: persistPromotion ? "approval-policy-promoted" : "approval-policy-recommendation-applied",
        message: `${persistPromotion ? "Promoted" : "Applied"} policy recommendation ${recommendationId}.`,
        actorId: actor.id,
        actorName: actor.name,
        note: `Assigned ${backupApproverTarget} as the backup approver.`,
      });
      if (persistPromotion) {
        updateGovernance({
          ...loadCollaborationState().governance,
          appliedApprovalPolicies: [
            buildApprovalPolicyPromotionEntry(
              payload,
              actor,
              beforeSnapshot,
              { environment, backupApproverTarget, automatic }
            ),
            ...(loadCollaborationState().governance.appliedApprovalPolicies || []),
          ].slice(0, 20),
        });
      }
      appendAuditEvent({
        type: persistPromotion ? "collaboration:promote-approval-policy-recommendation" : "collaboration:apply-approval-policy-recommendation",
        message: `${automatic ? "Automatically " : ""}${persistPromotion ? "promoted" : "applied"} workspace approval recommendation for ${workspaceId}.`,
        payload: {
          recommendationId,
          recommendationKind,
          workspaceId,
          backupApproverTarget,
          actorId: actor.id,
          beforeSnapshot,
        },
      });
      const result = {
        ok: true,
        output: `Assigned ${backupApproverTarget} as the backup approver for ${workspaceId}.`,
      };
      if (includeOverview) {
        result.overview = buildOverview(options);
      }
      return result;
    }
  }

  const suggestedCapacityLimit = Math.max(
    1,
    Number(payload.suggestedCapacityLimit || nextEnvironmentPolicy.incidentApprovalCapacityLimit || 1)
  );
  const updatedGovernance = updateGovernance({
    ...collaborationState.governance,
    environmentPolicies: {
      ...(collaborationState.governance.environmentPolicies || {}),
      [environment]: {
        ...(collaborationState.governance.environmentPolicies?.[environment] || {}),
        incidentApprovalCapacityLimit: suggestedCapacityLimit,
      },
    },
    appliedApprovalPolicies: persistPromotion
      ? [
          buildApprovalPolicyPromotionEntry(
            payload,
            actor,
            beforeSnapshot,
            { environment, capacityLimit: suggestedCapacityLimit, automatic }
          ),
          ...(collaborationState.governance.appliedApprovalPolicies || []),
        ].slice(0, 20)
      : collaborationState.governance.appliedApprovalPolicies || [],
  });

  const digestScheduler = getDigestSchedulerStatus();
  const affectedWorkspaces = buildDigestWorkspaceHealth(digestScheduler)
    .filter((item) => {
      if (workspaceId) {
        return item.workspaceId === workspaceId;
      }
      if (target) {
        return (
          normalizeTarget(item.incidentApproverTarget) === normalizeTarget(target) ||
          normalizeTarget(item.incidentApproval?.approverTarget) === normalizeTarget(target)
        );
      }
      return false;
    })
    .slice(0, 5);
  affectedWorkspaces.forEach((item) => {
    appendDigestWorkspaceEvent(item.workspaceId, {
      type: persistPromotion ? "approval-policy-promoted" : "approval-policy-recommendation-applied",
      message: `${persistPromotion ? "Promoted" : "Applied"} policy recommendation ${recommendationId}.`,
      actorId: actor.id,
      actorName: actor.name,
      note: `Set ${environment} approval capacity limit to ${suggestedCapacityLimit}.`,
    });
  });
  appendAuditEvent({
    type: persistPromotion ? "collaboration:promote-approval-policy-recommendation" : "collaboration:apply-approval-policy-recommendation",
    message: `${automatic ? "Automatically " : ""}${persistPromotion ? "promoted" : "applied"} approval policy recommendation.`,
    payload: {
      recommendationId,
      recommendationKind,
      environment,
      target: target || null,
      workspaceId: workspaceId || null,
      suggestedCapacityLimit,
      actorId: actor.id,
      beforeSnapshot,
      governance: updatedGovernance,
    },
  });
  const result = {
    ok: true,
    output: `Set the ${environment} approval capacity limit to ${suggestedCapacityLimit}.`,
  };
  if (includeOverview) {
    result.overview = buildOverview(options);
  }
  return result;
}

function rollbackApprovalPolicyPromotion(actor, payload = {}, options = {}) {
  const promotionId = String(payload.promotionId || "").trim();
  const collaborationState = loadCollaborationState();
  const policies = Array.isArray(collaborationState.governance?.appliedApprovalPolicies)
    ? collaborationState.governance.appliedApprovalPolicies
    : [];
  const existing = policies.find((item) => item.id === promotionId);
  if (!existing) {
    return { ok: false, error: `Promoted policy not found: ${promotionId}`, overview: buildOverview(options) };
  }
  const environment = String(existing.environment || collaborationState.governance.currentEnvironment || "development");
  const cooldownHours = Math.max(
    1,
    Number(collaborationState.governance.environmentPolicies?.[environment]?.autoPromoteCooldownHours || 72)
  );
  const cooldownUntil = new Date(Date.now() + cooldownHours * 60 * 60 * 1000).toISOString();
  const nextGovernance = {
    ...collaborationState.governance,
    environmentPolicies: {
      ...(collaborationState.governance.environmentPolicies || {}),
      [environment]: {
        ...(collaborationState.governance.environmentPolicies?.[environment] || {}),
        incidentApprovalCapacityLimit: Math.max(
          1,
          Number(
            existing.beforeSnapshot?.capacityLimit ||
              collaborationState.governance.environmentPolicies?.[environment]?.incidentApprovalCapacityLimit ||
              1
          )
        ),
      },
    },
    appliedApprovalPolicies: policies.map((item) =>
      item.id === promotionId
        ? {
            ...item,
            rolledBackAt: new Date().toISOString(),
            rolledBackById: actor.id,
            rolledBackByName: actor.name,
          }
        : item
    ),
    approvalRecommendationObservations: (Array.isArray(collaborationState.governance.approvalRecommendationObservations)
      ? collaborationState.governance.approvalRecommendationObservations
      : []
    ).map((item) =>
      item.recommendationId === existing.recommendationId
        ? {
            ...item,
            cooldownUntil,
            eligibleSinceAt: null,
            status: "cooldown",
            lastObservedAt: new Date().toISOString(),
          }
        : item
    ),
  };
  updateGovernance(nextGovernance);
  if (existing.workspaceId) {
    updateDigestWorkspaceState(existing.workspaceId, {
      backupApproverTarget: existing.beforeSnapshot?.backupApproverTarget || null,
      backupApproverAssignedBy: actor.id,
      backupApproverAssignedAt: new Date().toISOString(),
    });
    appendDigestWorkspaceEvent(existing.workspaceId, {
      type: "approval-policy-rolled-back",
      message: `Rolled back promoted policy ${existing.title}.`,
      actorId: actor.id,
      actorName: actor.name,
      note: existing.effectSummary,
    });
  }
  appendAuditEvent({
    type: "collaboration:rollback-approval-policy",
    message: `Rolled back promoted approval policy ${existing.title}.`,
    payload: { promotionId, actorId: actor.id },
  });
  return {
    ok: true,
    output: `Rolled back promoted policy ${existing.title}.`,
    overview: buildOverview(options),
  };
}

function autoPromoteApprovalRecommendations(actor, recommendations = [], environmentPolicy = {}, options = {}) {
  if (!environmentPolicy.autoPromoteApprovalRecommendations) {
    return false;
  }
  const minConfidence = Math.max(0.5, Math.min(0.99, Number(environmentPolicy.autoPromoteRecommendationConfidence || 0.9)));
  const observationHours = Math.max(1, Number(environmentPolicy.autoPromoteObservationHours || 24));
  const collaboration = loadCollaborationState();
  const existing = Array.isArray(collaboration.governance?.appliedApprovalPolicies)
    ? collaboration.governance.appliedApprovalPolicies
    : [];
  const observations = Array.isArray(collaboration.governance?.approvalRecommendationObservations)
    ? collaboration.governance.approvalRecommendationObservations
    : [];
  const observationById = new Map(observations.map((item) => [String(item.recommendationId), item]));
  let changed = false;

  (Array.isArray(recommendations) ? recommendations : [])
    .filter((item) => item.promoteAction?.payload)
    .filter((item) => Number(item.confidence?.score || 0) >= minConfidence)
    .forEach((item) => {
      const recommendationId = String(item.id || item.promoteAction.payload.recommendationId || "");
      const observation = observationById.get(recommendationId);
      const alreadyApplied = existing.some((entry) => entry.recommendationId === recommendationId && !entry.rolledBackAt);
      const eligibleSince = observation?.eligibleSinceAt ? new Date(observation.eligibleSinceAt).getTime() : null;
      const matured =
        Number.isFinite(eligibleSince) &&
        Date.now() - Number(eligibleSince) >= observationHours * 60 * 60 * 1000;
      if (alreadyApplied || !matured) {
        return;
      }
      applyApprovalPolicyRecommendationChange(
        actor,
        { ...item.promoteAction.payload, recommendationId, recommendationTitle: item.title },
        options,
        { persistPromotion: true, automatic: true, includeOverview: false }
      );
      changed = true;
    });

  return changed;
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

function listAutomationFollowups(workspaceId = null) {
  return listTasks()
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

function buildOwnershipSignals(workspaceId) {
  const briefs = listBriefs(workspaceId);
  const reports = listReports(workspaceId);
  const routes = listWorkspaceRoutes(workspaceId);
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

function formatOwnershipSignals(workspaceId) {
  const signals = buildOwnershipSignals(workspaceId);
  if (!signals.length) {
    return "Ownership signals\nNo assignment risks detected in this workspace.";
  }

  return [
    "Ownership signals",
    ...signals.map((signal) => `- ${signal.title}\n  ${signal.detail}\n  Action: ${signal.command}`),
  ].join("\n");
}

function normalizeTarget(value) {
  return String(value || "").trim().toLowerCase();
}

function extractTargets(value) {
  return String(value || "")
    .split(",")
    .map((item) => normalizeTarget(item))
    .filter(Boolean);
}

function buildActorTargets(actor) {
  return new Set([
    normalizeTarget(actor.id),
    normalizeTarget(actor.name),
    normalizeTarget(actor.role),
    `user:${normalizeTarget(actor.id)}`,
    `name:${normalizeTarget(actor.name)}`,
    `role:${normalizeTarget(actor.role)}`,
    "team",
  ]);
}

function matchesTargets(value, actorTargets) {
  const targets = extractTargets(value);
  if (!targets.length) {
    return false;
  }
  return targets.some((target) => actorTargets.has(target));
}

function buildInbox(actor, collaboration, ownershipSignals, digestEscalations = [], trustSignals = []) {
  const inboxState = getInboxState(actor.id);
  const actorTargets = buildActorTargets(actor);

  const inbox = [];

  if (actor.role === "admin" || canManageGovernanceInEnvironment(actor.role, collaboration.governance)) {
    ownershipSignals.forEach((signal) => {
      inbox.push({
        id: `inbox:${signal.id}`,
        type: "ownership",
        status: "open",
        tone: signal.tone,
        title: signal.title,
        detail: signal.detail,
        command: signal.command,
        read: Boolean(inboxState[`inbox:${signal.id}`]?.readAt),
        acknowledged: Boolean(inboxState[`inbox:${signal.id}`]?.acknowledgedAt),
      });
    });
    digestEscalations.forEach((signal) => {
      inbox.push({
        id: `inbox:${signal.id}`,
        type: "automation",
        status: "open",
        tone: signal.tone,
        title: signal.title,
        detail: signal.detail,
        command: signal.command,
        workspaceId: signal.workspaceId,
        workspaceName: signal.workspaceName,
        owner: signal.owner,
        snoozedUntil: signal.snoozedUntil,
        read: Boolean(inboxState[`inbox:${signal.id}`]?.readAt),
        acknowledged: Boolean(inboxState[`inbox:${signal.id}`]?.acknowledgedAt),
      });
    });
    trustSignals.forEach((signal) => {
      inbox.push({
        id: `inbox:${signal.id}`,
        type: "trust",
        status: "open",
        tone: signal.tone,
        title: signal.title,
        detail: signal.detail,
        command: signal.command,
        environment: signal.environment || null,
        read: Boolean(inboxState[`inbox:${signal.id}`]?.readAt),
        acknowledged: Boolean(inboxState[`inbox:${signal.id}`]?.acknowledgedAt),
      });
    });
  }

  collaboration.handoffs
    .filter((handoff) => handoff.status === "open" && matchesTargets(handoff.assignedTo, actorTargets))
    .slice(0, 8)
    .forEach((handoff) => {
      inbox.push({
        id: `inbox:${handoff.id}`,
        type: "handoff",
        status: handoff.status,
        tone: "warning",
        title: handoff.title,
        detail: `${handoff.assignedByName} assigned this handoff to ${handoff.assignedTo}. ${handoff.note}`,
        handoffId: handoff.id,
        kind: handoff.kind || "general",
        workspaceId: handoff.workspaceId || null,
        relatedApprovalId: handoff.relatedApprovalId || null,
        createdAt: handoff.createdAt || null,
        read: Boolean(inboxState[`inbox:${handoff.id}`]?.readAt),
        acknowledged: Boolean(inboxState[`inbox:${handoff.id}`]?.acknowledgedAt),
      });
    });

  collaboration.approvals
    .filter((approval) => {
      if (
        approval.status === "pending" &&
        canApproveInEnvironment(actor.role, collaboration.governance) &&
        (!approval.approverTarget || matchesTargets(approval.approverTarget, actorTargets))
      ) {
        return true;
      }
      return approval.requestedById === actor.id;
    })
    .slice(0, 8)
    .forEach((approval) => {
      inbox.push({
        id: `inbox:${approval.id}`,
        type: "approval",
        status: approval.status,
        tone: approval.status === "pending" ? "warning" : approval.status === "approved" ? "active" : "error",
        title: approval.label,
        detail:
          approval.status === "pending"
            ? `${approval.requestedByName} is waiting on approval for ${approval.action}.${approval.approverTarget ? ` Target: ${approval.approverTarget}.` : ""}`
            : `${approval.requestedByName} request is ${approval.status}.`,
        approvalId: approval.id,
        approverTarget: approval.approverTarget || null,
        read: Boolean(inboxState[`inbox:${approval.id}`]?.readAt),
        acknowledged: Boolean(inboxState[`inbox:${approval.id}`]?.acknowledgedAt),
      });
    });

  return inbox.slice(0, 12);
}

function buildNotificationDigest(inbox, history) {
  return {
    open: inbox.length,
    unread: inbox.filter((item) => !item.read).length,
    acknowledged: history.filter((item) => item.acknowledged).length,
    ownership: inbox.filter((item) => item.type === "ownership").length,
    handoffs: inbox.filter((item) => item.type === "handoff").length,
    approvals: inbox.filter((item) => item.type === "approval").length,
    trust: inbox.filter((item) => item.type === "trust").length,
  };
}

function formatInbox(actor, collaboration, ownershipSignals, digestEscalations = [], trustSignals = []) {
  const items = buildInbox(actor, collaboration, ownershipSignals, digestEscalations, trustSignals);
  if (!items.length) {
    return "Operator inbox\nNo assignment, handoff, or approval items need attention.";
  }

  return [
    "Operator inbox",
    ...items.map((item) => `- [${item.type}] ${item.title}\n  ${item.detail}\n  Status: ${item.status}${item.read ? " • read" : ""}${item.acknowledged ? " • acknowledged" : ""}`),
  ].join("\n");
}

function formatNotificationHistory(actor, collaboration, ownershipSignals, digestEscalations = [], trustSignals = []) {
  const items = buildNotificationHistory(actor, collaboration, ownershipSignals, digestEscalations, trustSignals);
  if (!items.length) {
    return "Notification history\nNo notification activity has been recorded for this user yet.";
  }

  return [
    "Notification history",
    ...items.map((item) => `- [${item.type}] ${item.title}\n  ${item.detail}\n  Status: ${item.status}${item.read ? " • read" : ""}${item.acknowledged ? " • acknowledged" : ""}`),
  ].join("\n");
}

function formatNotificationDigest(actor, collaboration, ownershipSignals, digestEscalations = [], trustSignals = []) {
  const inbox = buildInbox(actor, collaboration, ownershipSignals, digestEscalations, trustSignals);
  const history = buildNotificationHistory(actor, collaboration, ownershipSignals, digestEscalations, trustSignals);
  const digest = buildNotificationDigest(inbox, history);
  return [
    "Notification digest",
    `Open: ${digest.open}`,
    `Unread: ${digest.unread}`,
    `Acknowledged: ${digest.acknowledged}`,
    `Ownership: ${digest.ownership}`,
    `Handoffs: ${digest.handoffs}`,
    `Approvals: ${digest.approvals}`,
    `Trust: ${digest.trust}`,
  ].join("\n");
}

function buildDigestRun(actor, collaboration, ownershipSignals, digestPreferences = {}) {
  const digestScheduler = getDigestSchedulerStatus();
  const digestWorkspaceHealth = buildDigestWorkspaceHealth(digestScheduler);
  const digestEscalations = buildDigestEscalationSignals(digestScheduler, digestWorkspaceHealth);
  const trustDashboard = buildApprovalTrustDashboard(
    Array.isArray(collaboration.governance?.appliedApprovalPolicies) ? collaboration.governance.appliedApprovalPolicies : [],
    Array.isArray(collaboration.governance?.approvalRecommendationObservations) ? collaboration.governance.approvalRecommendationObservations : [],
    getEnvironmentPolicy(collaboration.governance),
    Array.isArray(collaboration.governance?.approvalTrustAlertAcks) ? collaboration.governance.approvalTrustAlertAcks : []
  );
  const trustEnvironments = buildApprovalTrustEnvironmentSummaries(collaboration.governance);
  const trustTrends = buildApprovalTrustTrends(collaboration.governance, trustEnvironments);
  const trustSignals = buildApprovalTrustSignals(
    trustDashboard,
    trustTrends
  );
  const inbox = buildInbox(actor, collaboration, ownershipSignals, digestEscalations, trustSignals);
  const history = buildNotificationHistory(actor, collaboration, ownershipSignals, digestEscalations, trustSignals);
  const stats = buildNotificationDigest(inbox, history);
  const trustReportRequested = Boolean(digestPreferences.includeTrustReport);
  const trustFamilies = buildApprovalRecommendationFamilyHistory(
    [],
    Array.isArray(collaboration.governance?.appliedApprovalPolicies) ? collaboration.governance.appliedApprovalPolicies : [],
    Array.isArray(collaboration.governance?.approvalRecommendationObservations) ? collaboration.governance.approvalRecommendationObservations : [],
    trustSignals
  );
  const completedTrustIncidents = buildCompletedTrustIncidents(digestWorkspaceHealth);
  const completedTrustEnvironments = buildCompletedTrustEnvironmentSummaries(completedTrustIncidents);
  const environmentTrustRecaps = buildEnvironmentTrustRecaps(trustEnvironments, trustSignals, completedTrustEnvironments);
  const trustEnvironment = String(digestPreferences.trustEnvironment || "all");
  const scopedTrustCollaboration = filterTrustCollaborationScope(
    {
      approvalTrustEnvironments: trustEnvironments,
      environmentTrustRecaps,
      approvalTrustTrends: trustTrends,
      approvalRecommendationFamilies: trustFamilies,
      approvalTrustSignals: trustSignals,
      completedTrustEnvironments,
      completedTrustIncidents,
    },
    trustEnvironment
  );
  const highlights = [
    ...inbox.slice(0, 5).map((item) => item.title),
    ...(trustReportRequested
      ? (Array.isArray(scopedTrustCollaboration.environmentTrustRecaps) ? scopedTrustCollaboration.environmentTrustRecaps : []).slice(0, 2).map(
          (item) => `Env ${item.environment}: score ${item.score} • active ${item.activeSignals} • archived ${item.completedArchived}`
        )
      : []),
    ...(trustReportRequested ? (Array.isArray(scopedTrustCollaboration.approvalTrustSignals) ? scopedTrustCollaboration.approvalTrustSignals : []).slice(0, 2).map((item) => `Trust: ${item.title}`) : []),
    ...(trustReportRequested ? (Array.isArray(scopedTrustCollaboration.completedTrustIncidents) ? scopedTrustCollaboration.completedTrustIncidents : []).slice(0, 2).map((item) => `Trust complete: ${item.workspaceName}`) : []),
  ].slice(0, 8);
  const summary = [
    trustReportRequested && (Array.isArray(scopedTrustCollaboration.environmentTrustRecaps) ? scopedTrustCollaboration.environmentTrustRecaps : []).length
      ? `Environment trust recap${trustEnvironment !== "all" ? ` (${trustEnvironment})` : ""}: ${(Array.isArray(scopedTrustCollaboration.environmentTrustRecaps) ? scopedTrustCollaboration.environmentTrustRecaps : [])
          .slice(0, 2)
          .map((item) => `${item.environment} score ${item.score}, active ${item.activeSignals}, archived ${item.completedArchived}`)
          .join(" • ")}`
      : `${stats.open} open notifications • ${stats.unread} unread • ${stats.handoffs} handoffs • ${stats.approvals} approvals • ${stats.ownership} ownership signals • ${stats.trust} trust alerts`,
  ].join("");
  const report = trustReportRequested
    ? formatTrustReport(scopedTrustCollaboration)
    : "";

  return {
    summary,
    stats,
    highlights,
    report,
    reportType: trustReportRequested ? "trust" : "notification",
  };
}

function shouldGenerateDigestForUser(user, collaboration, workspaceId, options = {}) {
  const preferences = getDigestPreferences(user.id);
  if (!preferences.enabled || preferences.cadence === "manual") {
    return false;
  }

  const actor = {
    id: String(user.id),
    name: String(user.name || user.email || user.id),
    role: normalizeRole(user.role, "operator"),
  };
  const selectedTrustEnvironment = String(preferences.trustEnvironment || "all");
  const currentTrustEnvironment = String(collaboration.governance?.currentEnvironment || "development");
  const trustSignals = buildApprovalTrustSignals(
    buildApprovalTrustDashboard(
      Array.isArray(collaboration.governance?.appliedApprovalPolicies) ? collaboration.governance.appliedApprovalPolicies : [],
      Array.isArray(collaboration.governance?.approvalRecommendationObservations) ? collaboration.governance.approvalRecommendationObservations : [],
      getEnvironmentPolicy(collaboration.governance),
      Array.isArray(collaboration.governance?.approvalTrustAlertAcks) ? collaboration.governance.approvalTrustAlertAcks : []
    ),
    buildApprovalTrustTrends(collaboration.governance, buildApprovalTrustEnvironmentSummaries(collaboration.governance))
  );
  const scopedTrustSignals =
    selectedTrustEnvironment === "all"
      ? trustSignals
      : trustSignals.filter((item) => !item.environment || String(item.environment) === selectedTrustEnvironment);
  const inbox = buildInbox(actor, collaboration, buildOwnershipSignals(workspaceId), [], scopedTrustSignals);
  if (!inbox.length) {
    return false;
  }

  if (options.trustDropOnly) {
    if (!preferences.includeTrustReport || !preferences.immediateOnTrustDrop) {
      return false;
    }
    if (preferences.trustAudience === "admins" && !["admin", "approver"].includes(normalizeRole(user.role, "operator"))) {
      return false;
    }
    if (selectedTrustEnvironment !== "all" && selectedTrustEnvironment !== currentTrustEnvironment) {
      return false;
    }
    return scopedTrustSignals.some((item) => String(item.id || "").startsWith("trust-drop:"));
  }

  if (preferences.cadence === "handoff") {
    return inbox.some((item) => item.type === "handoff" && !item.read);
  }

  const lastDigestAt = preferences.lastDigestAt ? new Date(preferences.lastDigestAt).getTime() : 0;
  return !lastDigestAt || Date.now() - lastDigestAt >= 12 * 60 * 60 * 1000;
}

function runDueDigestsForWorkspace(workspaceId) {
  let collaboration = loadCollaborationState();
  const users = listWorkspaceUsers(workspaceId);
  const created = [];
  const trustSignals = buildApprovalTrustSignals(
    buildApprovalTrustDashboard(
      Array.isArray(collaboration.governance?.appliedApprovalPolicies) ? collaboration.governance.appliedApprovalPolicies : [],
      Array.isArray(collaboration.governance?.approvalRecommendationObservations) ? collaboration.governance.approvalRecommendationObservations : [],
      getEnvironmentPolicy(collaboration.governance),
      Array.isArray(collaboration.governance?.approvalTrustAlertAcks) ? collaboration.governance.approvalTrustAlertAcks : []
    ),
    buildApprovalTrustTrends(collaboration.governance, buildApprovalTrustEnvironmentSummaries(collaboration.governance))
  );
  const immediateTrustDrop = trustSignals.some((item) => String(item.id || "").startsWith("trust-drop:"));
  const promotedTrustIncident = promoteTrustDropToIncident(workspaceId, collaboration, trustSignals);
  const recoveredTrustIncident = recoverTrustIncident(workspaceId, collaboration, trustSignals);
  const requestedRecoveredTrustCloseout = requestRecoveredTrustIncidentCloseout(workspaceId, collaboration);
  if (promotedTrustIncident || recoveredTrustIncident || requestedRecoveredTrustCloseout) {
    collaboration = loadCollaborationState();
  }
  const trustEscalation = applyTrustEscalationPolicy(workspaceId, collaboration, trustSignals);
  const digestAllowed = !immediateTrustDrop || trustEscalation.mode === "digest";
  const eligibleUsers = users.filter((user) =>
    shouldGenerateDigestForUser(user, collaboration, workspaceId, { trustDropOnly: immediateTrustDrop && digestAllowed })
  );

  eligibleUsers.forEach((user) => {
    const actor = {
      id: String(user.id),
      name: String(user.name || user.email || user.id),
      role: normalizeRole(user.role, "operator"),
    };
    const digest = recordDigestRun(
      user.id,
      buildDigestRun(actor, collaboration, buildOwnershipSignals(workspaceId), getDigestPreferences(user.id))
    );
    created.push({
      userId: actor.id,
      userName: actor.name,
      digestId: digest.id,
      summary: digest.summary,
    });
  });

  updateDigestWorkspaceState(workspaceId, {
    lastSweepRunAt: new Date().toISOString(),
    lastGeneratedCount: created.length,
    lastEligibleUserCount: eligibleUsers.length,
    lastSweepError: null,
  });

  return {
    ok: true,
    workspaceId,
    generatedCount: created.length,
    digests: created,
  };
}

function queueDueDigestSweepIfNeeded(workspaceId, actor = { actorId: "system", actorName: "System" }) {
  const workspace = String(workspaceId || "default");
  const users = listWorkspaceUsers(workspace);
  if (!users.length) {
    return null;
  }

  let collaboration = loadCollaborationState();
  const trustSignals = buildApprovalTrustSignals(
    buildApprovalTrustDashboard(
      Array.isArray(collaboration.governance?.appliedApprovalPolicies) ? collaboration.governance.appliedApprovalPolicies : [],
      Array.isArray(collaboration.governance?.approvalRecommendationObservations) ? collaboration.governance.approvalRecommendationObservations : [],
      getEnvironmentPolicy(collaboration.governance),
      Array.isArray(collaboration.governance?.approvalTrustAlertAcks) ? collaboration.governance.approvalTrustAlertAcks : []
    ),
    buildApprovalTrustTrends(collaboration.governance, buildApprovalTrustEnvironmentSummaries(collaboration.governance))
  );
  const immediateTrustDrop = trustSignals.some((item) => String(item.id || "").startsWith("trust-drop:"));
  const promotedTrustIncident = promoteTrustDropToIncident(workspace, collaboration, trustSignals);
  const recoveredTrustIncident = recoverTrustIncident(workspace, collaboration, trustSignals);
  const requestedRecoveredTrustCloseout = requestRecoveredTrustIncidentCloseout(workspace, collaboration);
  if (promotedTrustIncident || recoveredTrustIncident || requestedRecoveredTrustCloseout) {
    collaboration = loadCollaborationState();
  }
  const trustEscalation = applyTrustEscalationPolicy(workspace, collaboration, trustSignals);
  const digestAllowed = !immediateTrustDrop || trustEscalation.mode === "digest";
  const eligibleUsers = users.filter((user) =>
    shouldGenerateDigestForUser(user, collaboration, workspace, { trustDropOnly: immediateTrustDrop && digestAllowed })
  );
  if (!eligibleUsers.length) {
    return null;
  }

  const workspaceState = getDigestWorkspaceState(workspace);
  const lastQueuedAt = workspaceState.lastSweepQueuedAt ? new Date(workspaceState.lastSweepQueuedAt).getTime() : 0;
  if (lastQueuedAt && Date.now() - lastQueuedAt < 15 * 60 * 1000) {
    return null;
  }

  const existing = listJobs(100).some(
    (job) =>
      job.type === "digest:run-due" &&
      ["queued", "running", "scheduled_retry"].includes(job.status) &&
      String(job.payload?.workspace || "") === workspace
  );
  if (existing) {
    return null;
  }

  const job = enqueueJob("digest:run-due", { workspace }, actor);
  updateDigestWorkspaceState(workspace, {
    lastSweepQueuedAt: new Date().toISOString(),
    queuedBy: actor.actorId || "system",
    lastEligibleUserCount: eligibleUsers.length,
  });
  return job;
}

function buildNotificationHistory(actor, collaboration, ownershipSignals, digestEscalations = [], trustSignals = []) {
  const liveItems = buildInbox(actor, collaboration, ownershipSignals, digestEscalations, trustSignals);
  const history = getInboxHistory(actor.id);
  const merged = [...liveItems, ...history]
    .filter((item, index, collection) => collection.findIndex((candidate) => candidate.id === item.id) === index)
    .sort((a, b) => {
      const aTime = new Date(a.recordedAt || a.updatedAt || a.createdAt || 0).getTime();
      const bTime = new Date(b.recordedAt || b.updatedAt || b.createdAt || 0).getTime();
      return bTime - aTime;
    });
  return merged.slice(0, 40);
}

function createBriefRecord(userId, payload = {}) {
  const now = new Date().toISOString();
  const existing = listBriefs(userId);
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
  const next = [brief, ...existing.filter((item) => item.id !== brief.id)];
  saveBriefs(userId, next);
  return brief;
}

function createReportRecord(userId, payload = {}) {
  const now = new Date().toISOString();
  const existing = listReports(userId);
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
  const next = [report, ...existing.filter((item) => item.id !== report.id)];
  saveReports(userId, next);
  return report;
}

function queueBriefToTask(workspace, briefId) {
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

function createReportDraft(workspace, payload = {}) {
  const report = createReportRecord(workspace, {
    briefId: String(payload.briefId || ""),
    title: String(payload.title || ""),
    format: String(payload.format || "memo"),
    excerpt: String(payload.excerpt || "Created from the command desk."),
    keyFindings: Array.isArray(payload.keyFindings) ? payload.keyFindings : [],
  });
  saveBriefs(
    workspace,
    listBriefs(workspace).map((brief) =>
      brief.id === report.briefId
        ? {
            ...brief,
            status: "in_review",
            updatedAt: new Date().toISOString(),
            summary: `Report draft "${report.title}" created and waiting for editorial review.`,
          }
        : brief
    )
  );

  return report;
}

function publishReportRecord(workspace, reportId) {
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

function formatAgentProfiles(agents) {
  if (!agents.length) {
    return "No agent profiles found.";
  }

  return agents
    .map((agent) =>
      [
        `${agent.name}`,
        `  Role: ${agent.role || "(none)"}`,
        `  Max steps: ${agent.maxStepsPerRun || 0}`,
        `  Tags: ${Array.isArray(agent.tags) ? agent.tags.join(", ") : "(none)"}`,
      ].join("\n")
    )
    .join("\n\n");
}

function formatTasks(tasks) {
  if (!tasks.length) {
    return "Task queue is empty.";
  }

  return tasks
    .map((task) =>
      [
        `ID: ${task.id}`,
        `  Agent: ${task.agentName}`,
        `  Status: ${task.status}`,
        `  Priority: ${task.priority ?? 3}`,
        `  Task: ${task.description}`,
        `  Created: ${task.createdAt}`,
        `  Result: ${task.result || "(none)"}`,
      ].join("\n")
    )
    .join("\n\n");
}

function formatSchedule(schedule) {
  if (!schedule) {
    return "No schedule found.";
  }

  return [
    `Agent: ${schedule.agentName}`,
    `Enabled: ${schedule.enabled ? "yes" : "no"}`,
    `Interval Seconds: ${schedule.intervalSeconds}`,
    `Cycles: ${schedule.cycleCount}/${schedule.maxCycles}`,
    `Last Run: ${schedule.lastRunAt || "(not yet run)"}`,
    `Last Error: ${schedule.lastError || "(none)"}`,
    `Stop Reason: ${schedule.stopReason || "(none)"}`,
  ].join("\n");
}

function formatWatcher(state) {
  return [
    `Enabled: ${state.enabled ? "yes" : "no"}`,
    `Interval Seconds: ${state.intervalSeconds}`,
    `Last Run: ${state.lastRunAt || "(not yet run)"}`,
    `Rule Count: ${Array.isArray(state.rules) ? state.rules.length : 0}`,
    `Last Error: ${state.lastError || "(none)"}`,
  ].join("\n");
}

function formatAgentStatus(state) {
  return [
    `Name: ${state.name || "unknown"}`,
    `Active: ${state.active ? "yes" : "no"}`,
    `Status: ${state.status || "unknown"}`,
    `Goal: ${state.goal || "(none)"}`,
    `Step Count: ${state.stepCount || 0}/${state.maxSteps || 0}`,
    `Current Task: ${
      state.currentTask && typeof state.currentTask === "object"
        ? `${state.currentTask.id || "task"} -> ${state.currentTask.description || "(no description)"}`
        : "(none)"
    }`,
    `Last Run: ${state.lastRunAt || "(not yet run)"}`,
  ].join("\n");
}

function formatObjectBlock(title, value) {
  return [title, JSON.stringify(value, null, 2)].join("\n");
}

function formatPlugins(plugins) {
  if (!plugins.length) {
    return "No plugins configured.";
  }

  return plugins
    .map((plugin) =>
      [
        `${plugin.name}`,
        `  Loaded: ${plugin.loaded ? "yes" : "no"}`,
        `  Description: ${plugin.description || "(none)"}`,
        `  Error: ${plugin.error || "(none)"}`,
      ].join("\n")
    )
    .join("\n\n");
}

function ensureJobProcessorsRegistered() {
  if (ensureJobProcessorsRegistered.ready) {
    return;
  }

  registerJobProcessor("watcher:run", async () => evaluateRules());
  registerJobProcessor("alerts:run", async () => runAlertChecks());
  registerJobProcessor("plugin:run", async (job) =>
    runPlugin(String(job.payload?.name || ""), {
      input: `run plugin ${String(job.payload?.name || "")}`.trim(),
      pluginArg: String(job.payload?.pluginArg || ""),
    })
  );
  registerJobProcessor("brief:route", async (job) => {
    const result = queueBriefToTask(String(job.payload?.workspace || "demo"), String(job.payload?.briefId || ""));
    if (!result.ok) {
      throw new Error(result.error);
    }
    return result;
  });
  registerJobProcessor("report:create", async (job) =>
    createReportDraft(String(job.payload?.workspace || "demo"), job.payload || {})
  );
  registerJobProcessor("report:publish", async (job) => {
    const result = publishReportRecord(String(job.payload?.workspace || "demo"), String(job.payload?.reportId || ""));
    if (!result.ok) {
      throw new Error(result.error);
    }
    return result;
  });
  registerJobProcessor("digest:run-due", async (job) => {
    const workspace = String(job.payload?.workspace || "demo");
    try {
      return runDueDigestsForWorkspace(workspace);
    } catch (error) {
      updateDigestWorkspaceState(workspace, {
        lastSweepRunAt: new Date().toISOString(),
        lastSweepError: error instanceof Error ? error.message : "Digest sweep failed.",
      });
      throw error;
    }
  });
  ensureJobProcessorsRegistered.ready = true;
}

ensureJobProcessorsRegistered.ready = false;

function readRecentManagerEvents(limit = 10) {
  return listAuditEvents(limit).map((entry) => ({
    timestamp: String(entry.timestamp || ""),
    event: String(entry.type || "system_activity"),
    message: String(entry.message || entry.summary || "Activity recorded."),
  }));
}

function buildRecommendations(workspace, activeAlerts) {
  const health = buildHealthSummary();
  const tasks = listTasks();
  const reviews = listReviewItems();
  const schedules = listSchedules();
  const ownershipSignals = buildOwnershipSignals(workspace);
  const digestScheduler = getDigestSchedulerStatus();
  const digestWorkspaceHealth = buildDigestWorkspaceHealth(digestScheduler);
  const digestEscalations = buildDigestEscalationSignals(digestScheduler, digestWorkspaceHealth);
  const incidentApprovalPressure = buildIncidentApprovalPressure(digestWorkspaceHealth);
  const approvalThroughput = buildApprovalThroughputAnalytics(loadCollaborationState(), digestWorkspaceHealth);
  const approvalPolicyRecommendations = buildApprovalPolicyRecommendations(
    incidentApprovalPressure,
    approvalThroughput,
    getEnvironmentPolicy(loadCollaborationState().governance),
    digestWorkspaceHealth
  );
  const recommendations = [];

  if (tasks.some((task) => task.status === "queued")) {
    recommendations.push({ id: "queue", title: "Inspect queued briefs", command: "queue:list", tone: "warning" });
  }

  if (reviews.some((item) => item.status === "pending")) {
    recommendations.push({ id: "review", title: "Process editorial reviews", command: "review:list", tone: "warning" });
  }

  if (activeAlerts.length) {
    recommendations.push({ id: "alerts", title: "Triage active research signals", command: "alerts:active", tone: "critical" });
  }

  if (String(health.watcherStatus).toLowerCase().includes("stopped")) {
    recommendations.push({ id: "watcher", title: "Run an automation sweep", command: "watcher:run", tone: "warning" });
  }

  if (schedules.some((item) => item.lastError)) {
    recommendations.push({ id: "schedules", title: "Inspect schedule issues", command: "schedule:list", tone: "critical" });
  }

  ownershipSignals.forEach((signal) => {
    recommendations.push({
      id: signal.id,
      title: signal.title,
      command: signal.command,
      tone: signal.tone,
    });
  });

  digestEscalations.forEach((signal) => {
    recommendations.push({
      id: signal.id,
      title: signal.title,
      command: signal.command,
      tone: signal.tone,
    });
  });

  approvalPolicyRecommendations.forEach((item) => {
    recommendations.push({
      id: item.id,
      title: item.title,
      command: "digest:health",
      tone: item.kind === "throughput" ? "warning" : "critical",
    });
  });

  return recommendations.slice(0, 5);
}

function extractAlertWorkflowField(alert, key, fallback = null) {
  if (alert.workflow && typeof alert.workflow === "object" && key in alert.workflow) {
    return alert.workflow[key];
  }

  return fallback;
}

function buildOverview(options = {}) {
  ensureJobProcessorsRegistered();
  const system = buildSystemSummary();
  const health = buildHealthSummary();
  const tasks = listTasks();
  const reviews = listReviewItems();
  const schedules = listSchedules();
  const watcher = getWatcherStatus();
  const alertState = loadAlertsState();
  const automationPolicy = loadAutomationPolicy();
  const alerts = listAlerts();
  const activeAlerts = listActiveAlerts();
  const plugins = listPlugins();
  let collaboration = loadCollaborationState();
  const actor = getActor(options);
  const workspace = getResearchWorkspace(options);
  const environmentPolicy = getEnvironmentPolicy(collaboration.governance);
  const ownershipSignals = buildOwnershipSignals(workspace);
  const digestPreferences = getDigestPreferences(actor.id);
  const digestRuns = listDigestRuns(actor.id).slice(0, 8);
  const digestScheduler = getDigestSchedulerStatus();
  let digestWorkspaceHealth = buildDigestWorkspaceHealth(digestScheduler);
  let delegatedApprovalReminder = false;
  let autoReroutedApproval = false;
  digestWorkspaceHealth.forEach((workspaceHealth) => {
    const rerouted = autoRerouteIncidentApproval(workspaceHealth);
    if (rerouted) {
      autoReroutedApproval = true;
      return;
    }
    const created = ensureIncidentApprovalDelegation(workspaceHealth, collaboration);
    if (created) {
      delegatedApprovalReminder = true;
    }
  });
  if (delegatedApprovalReminder || autoReroutedApproval) {
    collaboration = loadCollaborationState();
    digestWorkspaceHealth = buildDigestWorkspaceHealth(digestScheduler);
    if (autoReroutedApproval) {
      let delegatedAfterReroute = false;
      digestWorkspaceHealth.forEach((workspaceHealth) => {
        const created = ensureIncidentApprovalDelegation(workspaceHealth, collaboration);
        if (created) {
          delegatedAfterReroute = true;
        }
      });
      if (delegatedAfterReroute) {
        collaboration = loadCollaborationState();
        digestWorkspaceHealth = buildDigestWorkspaceHealth(digestScheduler);
      }
    }
  }
  const digestAutomationAlerts = buildDigestAutomationAlerts(digestScheduler, digestWorkspaceHealth);
  const digestEscalations = buildDigestEscalationSignals(digestScheduler, digestWorkspaceHealth);
  const incidentApprovalPressure = buildIncidentApprovalPressure(digestWorkspaceHealth);
  const approvalThroughput = buildApprovalThroughputAnalytics(collaboration, digestWorkspaceHealth);
  const approvalPolicyRecommendations = buildApprovalPolicyRecommendations(
    incidentApprovalPressure,
    approvalThroughput,
    environmentPolicy,
    digestWorkspaceHealth
  );
  const recommendationObservations = observeApprovalPolicyRecommendations(
    approvalPolicyRecommendations,
    environmentPolicy
  );
  if (recommendationObservations.length) {
    collaboration = loadCollaborationState();
  }
  const autoPromoted = autoPromoteApprovalRecommendations(
    { id: "system", name: "System", role: "admin" },
    approvalPolicyRecommendations,
    environmentPolicy,
    options
  );
  if (autoPromoted) {
    collaboration = loadCollaborationState();
  }
  const finalApprovalPolicyRecommendations = autoPromoted
    ? buildApprovalPolicyRecommendations(
        buildIncidentApprovalPressure(digestWorkspaceHealth),
        buildApprovalThroughputAnalytics(collaboration, digestWorkspaceHealth),
        environmentPolicy,
        digestWorkspaceHealth
      )
    : approvalPolicyRecommendations;
  const appliedApprovalPolicies = (Array.isArray(collaboration.governance?.appliedApprovalPolicies)
    ? collaboration.governance.appliedApprovalPolicies
    : []
  ).map((item) => ({
    ...item,
    impact: evaluateAppliedApprovalPolicyImpact(item, incidentApprovalPressure, approvalThroughput),
  }));
  const trustAlertAcks = Array.isArray(collaboration.governance?.approvalTrustAlertAcks)
    ? collaboration.governance.approvalTrustAlertAcks
    : [];
  const approvalTrustDashboard = buildApprovalTrustDashboard(
    appliedApprovalPolicies,
    Array.isArray(collaboration.governance?.approvalRecommendationObservations)
      ? collaboration.governance.approvalRecommendationObservations
      : [],
    environmentPolicy,
    trustAlertAcks
  );
  const approvalTrustHistory = recordApprovalTrustSnapshot(collaboration.governance, approvalTrustDashboard, environmentPolicy);
  if (approvalTrustHistory.length) {
    collaboration = loadCollaborationState();
  }
  const approvalTrustEnvironments = buildApprovalTrustEnvironmentSummaries({
    ...collaboration.governance,
    appliedApprovalPolicies,
  });
  const approvalTrustTrends = buildApprovalTrustTrends(
    {
      ...collaboration.governance,
      approvalTrustHistory,
    },
    approvalTrustEnvironments
  );
  const approvalTrustSignals = buildApprovalTrustSignals(approvalTrustDashboard, approvalTrustTrends);
  digestWorkspaceHealth.forEach((workspaceHealth) => {
    const promotedTrustIncident = promoteTrustDropToIncident(workspaceHealth.workspaceId, collaboration, approvalTrustSignals);
    const recoveredTrustIncident = recoverTrustIncident(workspaceHealth.workspaceId, collaboration, approvalTrustSignals);
    const requestedRecoveredTrustCloseout = requestRecoveredTrustIncidentCloseout(workspaceHealth.workspaceId, collaboration);
    if (promotedTrustIncident || recoveredTrustIncident || requestedRecoveredTrustCloseout) {
      collaboration = loadCollaborationState();
    }
  });
  if (Array.isArray(collaboration.governance?.appliedApprovalPolicies)) {
    digestWorkspaceHealth = buildDigestWorkspaceHealth(digestScheduler);
  }
  const approvalRecommendationFamilies = buildApprovalRecommendationFamilyHistory(
    finalApprovalPolicyRecommendations,
    appliedApprovalPolicies,
    Array.isArray(collaboration.governance?.approvalRecommendationObservations)
      ? collaboration.governance.approvalRecommendationObservations
      : [],
    approvalTrustSignals
  );
  const completedTrustIncidents = buildCompletedTrustIncidents(digestWorkspaceHealth);
  const completedTrustEnvironments = buildCompletedTrustEnvironmentSummaries(completedTrustIncidents);
  const environmentTrustRecaps = buildEnvironmentTrustRecaps(
    approvalTrustEnvironments,
    approvalTrustSignals,
    completedTrustEnvironments
  );
  const defaultPolicyPlaybookPresets = listDefaultPolicyPlaybookPresets();
  const policyPlaybookRollouts = Array.isArray(collaboration.governance?.workspacePolicyPlaybookRollouts)
    ? collaboration.governance.workspacePolicyPlaybookRollouts
    : [];
  const policyPlaybookAdoption = buildPolicyPlaybookAdoptionSummary(
    policyPlaybookRollouts,
    Array.isArray(collaboration.governance?.workspacePolicyPlaybooks)
      ? collaboration.governance.workspacePolicyPlaybooks
      : [],
    defaultPolicyPlaybookPresets,
    digestWorkspaceHealth,
    completedTrustIncidents
  );
  const globalOperations = buildGlobalOperationsSummary(
    digestWorkspaceHealth,
    digestEscalations,
    incidentApprovalPressure,
    approvalTrustEnvironments,
    approvalTrustSignals,
    completedTrustIncidents,
    policyPlaybookRollouts
  );
  const automationFollowups = listAutomationFollowups(workspace);
  const inbox = buildInbox(actor, collaboration, ownershipSignals, digestEscalations, approvalTrustSignals);
  const notificationHistory = buildNotificationHistory(actor, collaboration, ownershipSignals, digestEscalations, approvalTrustSignals);
  const notificationDigest = buildNotificationDigest(inbox, notificationHistory);
  const jobs = listJobs(12);
  const jobMetrics = buildJobMetrics(60);
  const workload = buildWorkloadSummary().map((agent) => ({
    agentName: agent.agentName,
    status: agent.status,
    active: agent.active,
    queuedTasks: agent.queuedTasks,
    claimedTasks: agent.claimedTasks,
    unreadCount: agent.unreadCount,
    updatedAt: agent.updatedAt,
  }));
  const agentDetails = workload.map((agent) => {
    const state = loadAgentState(agent.agentName);
    const profile = readAgentProfile(agent.agentName);
    const schedule = schedules.find((item) => item.agentName === agent.agentName) || null;
    const relatedTasks = tasks.filter((item) => item.agentName === agent.agentName);

    return {
      agentName: agent.agentName,
      profile: {
        role: profile.role,
        description: profile.description,
        defaultGoal: profile.defaultGoal,
        maxStepsPerRun: profile.maxStepsPerRun,
        cooldownSeconds: profile.cooldownSeconds,
        allowShellExecution: Boolean(profile.allowShellExecution),
        allowFileWrite: Boolean(profile.allowFileWrite),
        allowPlanning: Boolean(profile.allowPlanning),
        tags: Array.isArray(profile.tags) ? profile.tags : [],
      },
      runtime: {
        active: Boolean(state.active),
        status: state.status || "unknown",
        goal: state.goal || "",
        currentTask: state.currentTask || null,
        lastRunAt: state.lastRunAt || null,
        stepCount: state.stepCount || 0,
        maxSteps: state.maxSteps || profile.maxStepsPerRun || 0,
      },
      schedule: schedule
        ? {
            enabled: schedule.enabled,
            cycleCount: schedule.cycleCount,
            maxCycles: schedule.maxCycles,
            intervalSeconds: schedule.intervalSeconds,
            lastRunAt: schedule.lastRunAt,
            lastError: schedule.lastError,
            stopReason: schedule.stopReason,
          }
        : null,
      observability: {
        queuedTasks: relatedTasks.filter((item) => item.status === "queued").length,
        claimedTasks: relatedTasks.filter((item) => item.status === "claimed").length,
        completedTasks: relatedTasks.filter((item) => item.status === "completed").length,
        pendingReviews: reviews.filter((item) => item.agentName === agent.agentName && item.status === "pending").length,
      },
      recentHistory: Array.isArray(state.history) ? state.history.slice(-8).reverse() : [],
      recentNotes: Array.isArray(state.notes) ? state.notes.slice(-6).reverse() : [],
    };
  });

  return {
    system: {
      agentCount: system.agentCount,
      totalTasks: system.totalTasks,
      queuedTasks: system.queuedTasks,
      claimedTasks: system.claimedTasks,
      completedTasks: system.completedTasks,
      activeSchedules: system.activeSchedules,
      watcherEnabled: system.watcherEnabled,
    },
    health: {
      overall: health.overall,
      queuePressure: health.queuePressure,
      reviewPressure: health.reviewPressure,
      watcherStatus: health.watcherStatus,
    },
    queue: tasks.slice(0, 12).map((task) => ({
      id: task.id,
      agentName: task.agentName,
      status: task.status,
      priority: task.priority,
      description: task.description,
      createdAt: task.createdAt,
      result: task.result,
    })),
    reviews: reviews.slice(0, 12).map((item) => ({
      id: item.id,
      taskId: item.taskId,
      agentName: item.agentName,
      status: item.status,
      decision: item.decision,
      decisionNote: item.decisionNote,
      taskDescription: item.taskDescription,
      reviewedAt: item.reviewedAt,
      createdAt: item.createdAt,
    })),
    schedules: schedules.map((schedule) => ({
      agentName: schedule.agentName,
      enabled: schedule.enabled,
      cycleCount: schedule.cycleCount,
      maxCycles: schedule.maxCycles,
      intervalSeconds: schedule.intervalSeconds,
      lastRunAt: schedule.lastRunAt,
      lastError: schedule.lastError,
      stopReason: schedule.stopReason,
    })),
    watcher: {
      enabled: watcher.enabled,
      intervalSeconds: watcher.intervalSeconds,
      lastRunAt: watcher.lastRunAt,
      lastError: watcher.lastError,
      ruleCount: Array.isArray(watcher.rules) ? watcher.rules.length : 0,
      rules: Array.isArray(watcher.rules)
        ? watcher.rules.map((rule) => ({
            name: rule.name,
            agentName: rule.agentName,
            minQueuedTasks: rule.minQueuedTasks,
            scheduleIntervalSeconds: rule.scheduleIntervalSeconds,
            scheduleMaxCycles: rule.scheduleMaxCycles,
            enabled: rule.enabled,
          }))
        : [],
    },
    alerts: {
      activeCount: activeAlerts.length + digestAutomationAlerts.length,
      items: [...digestAutomationAlerts, ...activeAlerts].slice(0, 8).map((alert) => ({
        id: alert.id,
        severity: alert.severity,
        status: alert.status,
        title: alert.title,
        owner: extractAlertWorkflowField(alert, "owner", null),
        acknowledged: Boolean(extractAlertWorkflowField(alert, "acknowledged", false)),
        resolutionNote: extractAlertWorkflowField(alert, "resolutionNote", null),
      })),
      all: [...digestAutomationAlerts, ...alerts].slice(0, 12).map((alert) => ({
        id: alert.id,
        severity: alert.severity,
        status: alert.status,
        title: alert.title,
        owner: extractAlertWorkflowField(alert, "owner", null),
        acknowledged: Boolean(extractAlertWorkflowField(alert, "acknowledged", false)),
        resolved: Boolean(extractAlertWorkflowField(alert, "resolved", false)),
        createdAt: alert.createdAt,
      })),
    },
    plugins: plugins.map((plugin) => ({
      name: plugin.name,
      loaded: plugin.loaded,
      description: plugin.description,
      error: plugin.error,
    })),
    workload,
    agentDetails,
    trust: {
      lastWatcherRunAt: watcher.lastRunAt,
      lastWatcherError: watcher.lastError,
      pendingReviews: reviews.filter((item) => item.status === "pending").length,
      activeAlerts: activeAlerts.length + digestAutomationAlerts.length,
      schedulesWithErrors: schedules.filter((item) => item.lastError).length,
    },
    recommendations: buildRecommendations(workspace, [...digestAutomationAlerts, ...activeAlerts]),
    ownershipSignals,
    activity: readRecentManagerEvents(12),
    automation: {
      alertThresholds: alertState.thresholds,
      policy: automationPolicy,
    },
    telemetry: buildTelemetrySummary(),
    jobs: {
      total: jobs.length,
      queued: jobs.filter((job) => job.status === "queued").length,
      running: jobs.filter((job) => job.status === "running").length,
      failed: jobs.filter((job) => job.status === "failed").length,
      metrics: jobMetrics,
      items: jobs,
    },
    collaboration: {
      governance: {
        ...collaboration.governance,
        defaultPolicyPlaybookPresets,
      },
      sharedSessions: collaboration.sharedSessions.slice(0, 12),
      handoffs: collaboration.handoffs.slice(0, 12),
      approvals: collaboration.approvals.slice(0, 12),
      inbox,
      notificationHistory,
      notificationDigest,
      digestPreferences,
      digestRuns,
      digestScheduler,
      digestEscalations: digestEscalations.slice(0, 8),
      digestWorkspaceHealth: digestWorkspaceHealth.slice(0, 8),
      incidentApprovalPressure,
      approvalThroughput,
      approvalPolicyRecommendations: finalApprovalPolicyRecommendations,
      appliedApprovalPolicies: appliedApprovalPolicies.slice(0, 8),
      approvalRecommendationObservations: Array.isArray(collaboration.governance?.approvalRecommendationObservations)
        ? collaboration.governance.approvalRecommendationObservations.slice(0, 8)
        : [],
      approvalTrustDashboard,
      approvalTrustEnvironments,
      approvalTrustTrends,
      approvalTrustSignals,
      approvalRecommendationFamilies,
      completedTrustIncidents,
      completedTrustEnvironments,
      environmentTrustRecaps,
      globalOperations,
      policyPlaybookAdoption,
      automationFollowups,
      currentUser: actor,
      permissions: {
        canExecuteCommands: canExecuteCommands(actor.role, collaboration.governance),
        canApprove: canApproveInEnvironment(actor.role, collaboration.governance),
        canManageGovernance: canManageGovernanceInEnvironment(actor.role, collaboration.governance),
      },
      environmentPolicy,
    },
  };
}

async function executeCommand(rawCommand, options = {}) {
  ensureJobProcessorsRegistered();
  const trimmed = String(rawCommand || "").trim();
  const workspace = getResearchWorkspace(options);

  if (!trimmed || trimmed === "help") {
    return [
      "Available Commands",
      "------------------",
      "help",
      "agents:list",
      "agent:status <name>",
      "agent:start <name> [goal]",
      "agent:tick <name>",
      "agent:stop <name>",
      "manager:route <task>",
      "brief:list",
      "brief:create <title> | <question>",
      "brief:route <briefId>",
      "report:list",
      "report:create <briefId> | <title>",
      "report:publish <reportId>",
      "queue:list",
      "queue:next <agentName>",
      "dashboard:system",
      "dashboard:health",
      "dashboard:workload",
      "dashboard:agent <agentName>",
      "schedule:list",
      "schedule:status <agentName>",
      "schedule:run <agentName>",
      "watcher:status",
      "watcher:run",
      "review:create <taskId>",
      "review:list",
      "inbox:list",
      "inbox:digest",
      "inbox:history",
      "trust:report",
      "ownership:signals",
      "alerts:list",
      "alerts:active",
      "digest:health",
      "alerts:run",
      "plugins",
      "run plugin <name> [optional-argument]",
    ].join("\n");
  }

  if (trimmed === "agents:list") return formatAgentProfiles(listAgentProfiles());
  if (trimmed.startsWith("agent:status ")) return formatAgentStatus(getAgentStatus(trimmed.replace("agent:status ", "").trim()).state);

  if (trimmed.startsWith("agent:start ")) {
    const remainder = trimmed.replace("agent:start ", "").trim();
    const firstSpace = remainder.indexOf(" ");
    const agentName = firstSpace === -1 ? remainder : remainder.slice(0, firstSpace).trim();
    const goal = firstSpace === -1 ? "" : remainder.slice(firstSpace + 1).trim();
    const result = await startAgent(agentName, goal);
    return [result.message, formatAgentStatus(result.state)].join("\n\n");
  }

  if (trimmed.startsWith("agent:tick ")) {
    const result = await tickAgent(trimmed.replace("agent:tick ", "").trim());
    return [result.message, result.step ? `Step: ${result.step}` : null, result.result?.summary || null].filter(Boolean).join("\n");
  }

  if (trimmed.startsWith("agent:stop ")) {
    const result = stopAgent(trimmed.replace("agent:stop ", "").trim());
    return [result.message, formatAgentStatus(result.state)].join("\n\n");
  }

  if (trimmed.startsWith("manager:route ")) {
    const taskText = trimmed.replace("manager:route ", "").trim();
    const result = routeManagerTask(taskText);
    return [`Routed to ${result.routing.agentName}.`, `Reason: ${result.routing.delegationReason}`, formatTasks([result.task])].join("\n\n");
  }

  if (trimmed === "brief:list") {
    return formatBriefs(listBriefs(workspace));
  }

  if (trimmed.startsWith("brief:create ")) {
    const remainder = trimmed.replace("brief:create ", "").trim();
    const parts = remainder.split("|").map((item) => item.trim());
    if (parts.length < 2 || !parts[0] || !parts[1]) {
      throw new Error("Use brief:create <title> | <question>");
    }
    const brief = createBriefRecord(workspace, {
      title: parts[0],
      question: parts[1],
      status: "draft",
    });
    return formatBriefs([brief]);
  }

  if (trimmed.startsWith("brief:route ")) {
    const briefId = trimmed.replace("brief:route ", "").trim();
    const job = enqueueJob("brief:route", { workspace, briefId }, getActor(options));
    return `Queued brief routing as ${job.id}.`;
  }

  if (trimmed === "report:list") {
    return formatReports(listReports(workspace));
  }

  if (trimmed.startsWith("report:create ")) {
    const remainder = trimmed.replace("report:create ", "").trim();
    const parts = remainder.split("|").map((item) => item.trim());
    if (parts.length < 2 || !parts[0] || !parts[1]) {
      throw new Error("Use report:create <briefId> | <title>");
    }
    const job = enqueueJob("report:create", { workspace, briefId: parts[0], title: parts[1], status: "draft" }, getActor(options));
    return `Queued report draft creation as ${job.id}.`;
  }

  if (trimmed.startsWith("report:publish ")) {
    const reportId = trimmed.replace("report:publish ", "").trim();
    const job = enqueueJob("report:publish", { workspace, reportId }, getActor(options));
    return `Queued report publish as ${job.id}.`;
  }

  if (trimmed === "queue:list") return formatTasks(listTasks());
  if (trimmed.startsWith("queue:next ")) return formatTasks([peekNextTask(trimmed.replace("queue:next ", "").trim())].filter(Boolean));
  if (trimmed === "dashboard:system") return formatObjectBlock("System Summary", buildSystemSummary());
  if (trimmed === "dashboard:health") return formatObjectBlock("Health Summary", buildHealthSummary());
  if (trimmed === "dashboard:workload") return formatObjectBlock("Workload Summary", { agents: buildWorkloadSummary() });
  if (trimmed.startsWith("dashboard:agent ")) return formatObjectBlock(`Agent Dashboard: ${trimmed.replace("dashboard:agent ", "").trim()}`, getAgentDashboard(trimmed.replace("dashboard:agent ", "").trim()));

  if (trimmed === "schedule:list") {
    const schedules = listSchedules();
    return schedules.length ? schedules.map((schedule) => formatSchedule(schedule)).join("\n\n") : "No schedules found.";
  }

  if (trimmed.startsWith("schedule:status ")) return formatSchedule(getSchedule(trimmed.replace("schedule:status ", "").trim()));

  if (trimmed.startsWith("schedule:run ")) {
    const result = await runScheduledTick(trimmed.replace("schedule:run ", "").trim());
    return [result.message, result.schedule ? formatSchedule(result.schedule) : null].filter(Boolean).join("\n\n");
  }

  if (trimmed === "watcher:status") return formatWatcher(getWatcherStatus());
  if (trimmed === "watcher:run") {
    const job = enqueueJob("watcher:run", {}, getActor(options));
    return `Queued watcher run as ${job.id}.`;
  }
  if (trimmed.startsWith("review:create ")) {
    const result = addReviewItemForTask(trimmed.replace("review:create ", "").trim());
    return result.message;
  }
  if (trimmed === "review:list") {
    const reviews = listReviewItems();
    return reviews.length ? formatObjectBlock("Review Queue", { items: reviews }) : "No review items found.";
  }
  if (trimmed === "inbox:list") {
    const collaboration = loadCollaborationState();
    const trustSignals = buildApprovalTrustSignals(
      buildApprovalTrustDashboard(
        Array.isArray(collaboration.governance?.appliedApprovalPolicies) ? collaboration.governance.appliedApprovalPolicies : [],
        Array.isArray(collaboration.governance?.approvalRecommendationObservations) ? collaboration.governance.approvalRecommendationObservations : [],
        getEnvironmentPolicy(collaboration.governance),
        Array.isArray(collaboration.governance?.approvalTrustAlertAcks) ? collaboration.governance.approvalTrustAlertAcks : []
      ),
      buildApprovalTrustTrends(collaboration.governance, buildApprovalTrustEnvironmentSummaries(collaboration.governance))
    );
    return formatInbox(getActor(options), collaboration, buildOwnershipSignals(workspace), [], trustSignals);
  }
  if (trimmed === "inbox:digest") {
    const collaboration = loadCollaborationState();
    const trustSignals = buildApprovalTrustSignals(
      buildApprovalTrustDashboard(
        Array.isArray(collaboration.governance?.appliedApprovalPolicies) ? collaboration.governance.appliedApprovalPolicies : [],
        Array.isArray(collaboration.governance?.approvalRecommendationObservations) ? collaboration.governance.approvalRecommendationObservations : [],
        getEnvironmentPolicy(collaboration.governance),
        Array.isArray(collaboration.governance?.approvalTrustAlertAcks) ? collaboration.governance.approvalTrustAlertAcks : []
      ),
      buildApprovalTrustTrends(collaboration.governance, buildApprovalTrustEnvironmentSummaries(collaboration.governance))
    );
    return formatNotificationDigest(getActor(options), collaboration, buildOwnershipSignals(workspace), [], trustSignals);
  }
  if (trimmed === "inbox:history") {
    const collaboration = loadCollaborationState();
    const trustSignals = buildApprovalTrustSignals(
      buildApprovalTrustDashboard(
        Array.isArray(collaboration.governance?.appliedApprovalPolicies) ? collaboration.governance.appliedApprovalPolicies : [],
        Array.isArray(collaboration.governance?.approvalRecommendationObservations) ? collaboration.governance.approvalRecommendationObservations : [],
        getEnvironmentPolicy(collaboration.governance),
        Array.isArray(collaboration.governance?.approvalTrustAlertAcks) ? collaboration.governance.approvalTrustAlertAcks : []
      ),
      buildApprovalTrustTrends(collaboration.governance, buildApprovalTrustEnvironmentSummaries(collaboration.governance))
    );
    return formatNotificationHistory(getActor(options), collaboration, buildOwnershipSignals(workspace), [], trustSignals);
  }
  if (trimmed === "trust:report") {
    const overview = buildOverview(options);
    return formatTrustReport(overview.collaboration);
  }
  if (trimmed === "ownership:signals") return formatOwnershipSignals(workspace);
  if (trimmed === "alerts:list" || trimmed === "alerts:active" || trimmed === "digest:health") {
    const digestScheduler = getDigestSchedulerStatus();
    const digestWorkspaceHealth = buildDigestWorkspaceHealth(digestScheduler);
    const digestAutomationAlerts = buildDigestAutomationAlerts(digestScheduler, digestWorkspaceHealth);

    if (trimmed === "alerts:list") {
      return formatObjectBlock("Alerts", { alerts: [...digestAutomationAlerts, ...listAlerts()] });
    }

    if (trimmed === "alerts:active") {
      return formatObjectBlock("Active Alerts", { alerts: [...digestAutomationAlerts, ...listActiveAlerts()] });
    }

    return formatObjectBlock("Digest Automation Health", {
      scheduler: digestScheduler,
      workspaces: digestWorkspaceHealth,
      alerts: digestAutomationAlerts,
    });
  }
  if (trimmed === "alerts:run") {
    const job = enqueueJob("alerts:run", {}, getActor(options));
    return `Queued alert sweep as ${job.id}.`;
  }
  if (trimmed === "plugins") return formatPlugins(listPlugins());
  if (trimmed.startsWith("run plugin ")) {
    const remainder = trimmed.replace("run plugin ", "").trim();
    const firstSpace = remainder.indexOf(" ");
    const pluginName = firstSpace === -1 ? remainder : remainder.slice(0, firstSpace).trim();
    const pluginArg = firstSpace === -1 ? "" : remainder.slice(firstSpace + 1).trim();
    const job = enqueueJob("plugin:run", { name: pluginName, pluginArg }, getActor(options));
    return `Queued plugin ${pluginName} as ${job.id}.`;
  }

  throw new Error(`Unknown command: ${trimmed}`);
}

async function executeAction(action, payload = {}, options = {}) {
  ensureJobProcessorsRegistered();
  const workspace = getResearchWorkspace(options);
  const actor = getActor(options);

  if (action === "workflow:create-task") {
    const task = addTask(String(payload.agentName || ""), String(payload.description || ""), {
      priority: Number(payload.priority || 3),
      sourceAgent: "manager",
      delegationReason: "Created from the browser console workflow.",
      tags: ["browser-workflow"],
      notifyAgent: "manager",
      callbackEnabled: true,
    });
    appendAuditEvent({ type: action, message: `Created task ${task.id} for ${task.agentName}.`, summary: task.description, payload: { taskId: task.id, agentName: task.agentName, actorId: actor.id } });
    return { ok: true, output: formatTasks([task]), overview: buildOverview(options) };
  }

  if (action === "workflow:route-task") {
    const result = routeManagerTask(String(payload.description || ""));
    appendAuditEvent({ type: action, message: `Routed task ${result.task.id} to ${result.routing.agentName}.`, summary: String(payload.description || ""), payload: { taskId: result.task.id, agentName: result.routing.agentName, actorId: actor.id } });
    return { ok: true, output: [`Routed to ${result.routing.agentName}.`, `Reason: ${result.routing.delegationReason}`, formatTasks([result.task])].join("\n\n"), overview: buildOverview(options) };
  }

  if (action === "review:approve") {
    const result = approveReviewItem(String(payload.taskId || ""));
    appendAuditEvent({ type: action, message: result.message, payload: { ...payload, actorId: actor.id } });
    return { ok: result.ok, output: result.message, overview: buildOverview(options) };
  }

  if (action === "review:create") {
    const result = addReviewItemForTask(String(payload.taskId || ""));
    appendAuditEvent({ type: action, message: result.message, payload: { ...payload, actorId: actor.id } });
    return { ok: result.ok, output: result.message, overview: buildOverview(options) };
  }

  if (action === "review:revise") {
    const result = reviseReviewItem(String(payload.taskId || ""), String(payload.note || ""));
    appendAuditEvent({ type: action, message: result.message, summary: String(payload.note || ""), payload: { ...payload, actorId: actor.id } });
    return { ok: result.ok, output: result.message, overview: buildOverview(options) };
  }

  if (action === "review:followup") {
    const result = createFollowupTask(String(payload.taskId || ""), String(payload.agentName || ""), String(payload.description || ""));
    appendAuditEvent({ type: action, message: result.message, summary: String(payload.description || ""), payload: { ...payload, actorId: actor.id } });
    return { ok: result.ok, output: result.message, overview: buildOverview(options) };
  }

  if (action === "alert:acknowledge") {
    const result = acknowledgeAlert(String(payload.alertId || ""), String(payload.owner || "manager"));
    appendAuditEvent({ type: action, message: result.message, payload: { ...payload, actorId: actor.id } });
    return { ok: result.ok, output: result.message, overview: buildOverview(options) };
  }

  if (action === "alert:resolve") {
    const result = resolveAlert(String(payload.alertId || ""), String(payload.note || ""));
    appendAuditEvent({ type: action, message: result.message, summary: String(payload.note || ""), payload: { ...payload, actorId: actor.id } });
    return { ok: result.ok, output: result.message, overview: buildOverview(options) };
  }

  if (action === "alert:note") {
    const result = addAlertNote(String(payload.alertId || ""), String(payload.note || ""));
    appendAuditEvent({ type: action, message: result.message, summary: String(payload.note || ""), payload: { ...payload, actorId: actor.id } });
    return { ok: result.ok, output: result.message, overview: buildOverview(options) };
  }

  if (action === "alert:run-checks") {
    const result = runAlertChecks();
    appendAuditEvent({
      type: action,
      message: "Ran operational alert checks from the dashboard.",
      payload: { actorId: actor.id },
    });
    return { ok: true, output: "Alert checks completed.", result, overview: buildOverview(options) };
  }

  if (action === "plugin:run") {
    const pluginName = String(payload.name || "");
    const pluginArg = String(payload.pluginArg || "");
    const job = enqueueJob("plugin:run", { name: pluginName, pluginArg }, actor);
    appendAuditEvent({ type: action, message: `Queued plugin ${pluginName} as ${job.id}.`, summary: pluginArg || null, payload: { ...payload, actorId: actor.id, jobId: job.id } });
    return { ok: true, output: `Queued plugin ${pluginName} as ${job.id}.`, overview: buildOverview(options) };
  }

  if (action === "job:cancel") {
    const job = cancelJob(String(payload.jobId || ""));
    if (!job || job.status !== "canceled") {
      return { ok: false, error: `Unable to cancel job ${payload.jobId}.`, overview: buildOverview(options) };
    }
    appendAuditEvent({ type: action, message: `Canceled job ${job.id}.`, payload: { actorId: actor.id, jobId: job.id } });
    return { ok: true, output: `Canceled job ${job.id}.`, overview: buildOverview(options) };
  }

  if (action === "job:retry") {
    const job = retryJob(String(payload.jobId || ""));
    if (!job || job.status !== "queued") {
      return { ok: false, error: `Unable to retry job ${payload.jobId}.`, overview: buildOverview(options) };
    }
    appendAuditEvent({ type: action, message: `Retried job ${job.id}.`, payload: { actorId: actor.id, jobId: job.id } });
    return { ok: true, output: `Retried job ${job.id}.`, overview: buildOverview(options) };
  }

  if (action === "job:detail") {
    const job = getJob(String(payload.jobId || ""), { full: true });
    if (!job) {
      return { ok: false, error: `Job not found: ${payload.jobId}.`, overview: buildOverview(options) };
    }
    return { ok: true, output: `Loaded job ${job.id}.`, detail: { job }, overview: buildOverview(options) };
  }

  if (action === "watcher:start") {
    const state = startWatcher(Number(payload.intervalSeconds || 5));
    appendAuditEvent({ type: action, message: `Started watcher at ${state.intervalSeconds}s.`, payload: { intervalSeconds: state.intervalSeconds, actorId: actor.id } });
    return { ok: true, output: `Watcher started at ${state.intervalSeconds}s interval.`, overview: buildOverview(options) };
  }

  if (action === "watcher:stop") {
    stopWatcher(String(payload.reason || "stopped_by_user"));
    appendAuditEvent({ type: action, message: "Stopped watcher.", payload: { reason: payload.reason || "stopped_by_user", actorId: actor.id } });
    return { ok: true, output: "Watcher stopped.", overview: buildOverview(options) };
  }

  if (action === "watcher:rule-upsert") {
    const ruleName = String(payload.name || "");
    const existing = getWatcherStatus().rules.find((rule) => rule.name === ruleName);
    const rule = existing
      ? updateWatcherRule(ruleName, payload)
      : addWatcherRule(payload);
    appendAuditEvent({ type: action, message: `Saved watcher rule ${rule.name}.`, payload: { ...rule, actorId: actor.id } });
    return { ok: true, output: `Saved watcher rule ${rule.name}.`, overview: buildOverview(options) };
  }

  if (action === "watcher:rule-delete") {
    const removed = removeWatcherRule(String(payload.name || ""));
    appendAuditEvent({ type: action, message: removed ? `Removed watcher rule ${payload.name}.` : `Watcher rule not found: ${payload.name}.`, payload: { ...payload, actorId: actor.id } });
    return { ok: removed, output: removed ? `Removed watcher rule ${payload.name}.` : `Watcher rule not found: ${payload.name}.`, overview: buildOverview(options) };
  }

  if (action === "policy:update-thresholds") {
    const thresholds = updateAlertThresholds(payload);
    appendAuditEvent({ type: action, message: "Updated alert thresholds.", payload: { ...thresholds, actorId: actor.id } });
    return { ok: true, output: "Updated alert thresholds.", overview: buildOverview(options) };
  }

  if (action === "policy:update-automation") {
    const policy = updateAutomationPolicy({
      escalation: payload.escalation || {},
      remediation: payload.remediation || {},
    });

    if (policy.escalation.autoRunWatcherOnPolicySave) {
      evaluateRules();
    }
    if (policy.escalation.autoRunAlertsOnPolicySave) {
      runAlertChecks();
    }

    appendAuditEvent({ type: action, message: "Updated automation policy.", payload: { ...policy, actorId: actor.id } });
    return { ok: true, output: "Updated automation policy.", overview: buildOverview(options) };
  }

  if (action === "agent:update-config") {
    const agentName = String(payload.agentName || "");
    const profile = updateAgentProfile(agentName, {
      role: payload.role,
      description: payload.description,
      defaultGoal: payload.defaultGoal,
      systemPrompt: payload.systemPrompt,
      maxStepsPerRun: payload.maxStepsPerRun,
      cooldownSeconds: payload.cooldownSeconds,
      allowShellExecution: payload.allowShellExecution,
      allowFileWrite: payload.allowFileWrite,
      allowPlanning: payload.allowPlanning,
      tags: payload.tags,
    });
    appendAuditEvent({
      type: action,
      message: `Updated agent profile ${agentName}.`,
      payload: { agentName, profile, actorId: actor.id },
    });
    return { ok: true, output: `Updated profile for ${agentName}.`, overview: buildOverview(options) };
  }

  if (action === "brief:create") {
    const brief = createBriefRecord(workspace, {
      title: String(payload.title || ""),
      question: String(payload.question || ""),
      assignedAgent: String(payload.assignedAgent || "researcher"),
      priority: String(payload.priority || "medium"),
      tags: Array.isArray(payload.tags) ? payload.tags : [],
      summary: String(payload.summary || "Created from the command desk."),
    });
    appendAuditEvent({ type: action, message: `Created research brief ${brief.id}.`, summary: brief.title, payload: { briefId: brief.id, actorId: actor.id } });
    return { ok: true, output: formatBriefs([brief]), overview: buildOverview(options) };
  }

  if (action === "brief:route") {
    const briefId = String(payload.briefId || "");
    const job = enqueueJob("brief:route", { workspace, briefId }, actor);
    appendAuditEvent({ type: action, message: `Queued research brief job ${job.id}.`, payload: { briefId, actorId: actor.id, jobId: job.id } });
    return { ok: true, output: `Queued brief routing as ${job.id}.`, overview: buildOverview(options) };
  }

  if (action === "report:create") {
    const job = enqueueJob("report:create", { workspace, ...payload }, actor);
    appendAuditEvent({ type: action, message: `Queued research report creation as ${job.id}.`, summary: String(payload.title || ""), payload: { briefId: payload.briefId, actorId: actor.id, jobId: job.id } });
    return { ok: true, output: `Queued report draft creation as ${job.id}.`, overview: buildOverview(options) };
  }

  if (action === "report:publish") {
    const reportId = String(payload.reportId || "");
    const job = enqueueJob("report:publish", { workspace, reportId }, actor);
    appendAuditEvent({ type: action, message: `Queued report publish as ${job.id}.`, payload: { reportId, actorId: actor.id, jobId: job.id } });
    return { ok: true, output: `Queued report publish as ${job.id}.`, overview: buildOverview(options) };
  }

  if (action === "collaboration:share-session") {
    const session = upsertSharedSession({
      id: payload.id,
      name: String(payload.name || "Shared session").trim(),
      draftCommand: String(payload.draftCommand || "").trim(),
      macros: Array.isArray(payload.macros) ? payload.macros : [],
      ownerId: actor.id,
      ownerName: actor.name,
      sharedWith: Array.isArray(payload.sharedWith) ? payload.sharedWith : ["team"],
    });
    appendAuditEvent({ type: action, message: `Shared session ${session.name}.`, payload: { sessionId: session.id, actorId: actor.id } });
    return { ok: true, output: `Shared session "${session.name}".`, overview: buildOverview(options) };
  }

  if (action === "collaboration:create-handoff") {
    const handoff = createHandoff({
      title: String(payload.title || "").trim(),
      note: String(payload.note || "").trim(),
      assignedTo: String(payload.assignedTo || "team").trim(),
      assignedById: actor.id,
      assignedByName: actor.name,
    });
    appendAuditEvent({ type: action, message: `Created handoff ${handoff.title}.`, payload: { handoffId: handoff.id, actorId: actor.id } });
    return { ok: true, output: `Created handoff "${handoff.title}".`, overview: buildOverview(options) };
  }

  if (action === "collaboration:close-handoff") {
    const handoff = closeHandoff(String(payload.handoffId || ""));
    if (!handoff) {
      return { ok: false, error: `Handoff not found: ${payload.handoffId}`, overview: buildOverview(options) };
    }
    appendAuditEvent({ type: action, message: `Closed handoff ${handoff.title}.`, payload: { handoffId: handoff.id, actorId: actor.id } });
    return { ok: true, output: `Closed handoff "${handoff.title}".`, overview: buildOverview(options) };
  }

  if (action === "collaboration:inbox-mark-read") {
    const itemId = String(payload.itemId || "");
    if (!itemId) {
      return { ok: false, error: "Inbox item id is required.", overview: buildOverview(options) };
    }
    const digestScheduler = getDigestSchedulerStatus();
    const digestWorkspaceHealth = buildDigestWorkspaceHealth(digestScheduler);
    const digestEscalations = buildDigestEscalationSignals(digestScheduler, digestWorkspaceHealth);
    const collaboration = loadCollaborationState();
    const trustSignals = buildApprovalTrustSignals(
      buildApprovalTrustDashboard(
        Array.isArray(collaboration.governance?.appliedApprovalPolicies) ? collaboration.governance.appliedApprovalPolicies : [],
        Array.isArray(collaboration.governance?.approvalRecommendationObservations) ? collaboration.governance.approvalRecommendationObservations : [],
        getEnvironmentPolicy(collaboration.governance),
        Array.isArray(collaboration.governance?.approvalTrustAlertAcks) ? collaboration.governance.approvalTrustAlertAcks : []
      ),
      buildApprovalTrustTrends(collaboration.governance, buildApprovalTrustEnvironmentSummaries(collaboration.governance))
    );
    const currentItem = buildInbox(actor, collaboration, buildOwnershipSignals(workspace), digestEscalations, trustSignals).find((item) => item.id === itemId);
    updateInboxItemState(actor.id, itemId, { readAt: new Date().toISOString() });
    if (currentItem) {
      recordInboxHistoryItem(actor.id, { ...currentItem, read: true, updatedAt: new Date().toISOString() });
    }
    appendAuditEvent({ type: action, message: `Marked inbox item ${itemId} as read.`, payload: { itemId, actorId: actor.id } });
    return { ok: true, output: `Marked ${itemId} as read.`, overview: buildOverview(options) };
  }

  if (action === "collaboration:inbox-acknowledge") {
    const itemId = String(payload.itemId || "");
    if (!itemId) {
      return { ok: false, error: "Inbox item id is required.", overview: buildOverview(options) };
    }
    const digestScheduler = getDigestSchedulerStatus();
    const digestWorkspaceHealth = buildDigestWorkspaceHealth(digestScheduler);
    const digestEscalations = buildDigestEscalationSignals(digestScheduler, digestWorkspaceHealth);
    const collaboration = loadCollaborationState();
    const trustSignals = buildApprovalTrustSignals(
      buildApprovalTrustDashboard(
        Array.isArray(collaboration.governance?.appliedApprovalPolicies) ? collaboration.governance.appliedApprovalPolicies : [],
        Array.isArray(collaboration.governance?.approvalRecommendationObservations) ? collaboration.governance.approvalRecommendationObservations : [],
        getEnvironmentPolicy(collaboration.governance),
        Array.isArray(collaboration.governance?.approvalTrustAlertAcks) ? collaboration.governance.approvalTrustAlertAcks : []
      ),
      buildApprovalTrustTrends(collaboration.governance, buildApprovalTrustEnvironmentSummaries(collaboration.governance))
    );
    const currentItem = buildInbox(actor, collaboration, buildOwnershipSignals(workspace), digestEscalations, trustSignals).find((item) => item.id === itemId);
    updateInboxItemState(actor.id, itemId, {
      readAt: new Date().toISOString(),
      acknowledgedAt: new Date().toISOString(),
    });
    if (currentItem) {
      recordInboxHistoryItem(actor.id, {
        ...currentItem,
        read: true,
        acknowledged: true,
        updatedAt: new Date().toISOString(),
      });
    }
    appendAuditEvent({ type: action, message: `Acknowledged inbox item ${itemId}.`, payload: { itemId, actorId: actor.id } });
    return { ok: true, output: `Acknowledged ${itemId}.`, overview: buildOverview(options) };
  }

  if (action === "collaboration:automation-assign") {
    const workspaceId = String(payload.workspaceId || parseAutomationInboxItem(payload.itemId)?.workspaceId || "");
    const owner = String(payload.owner || "").trim();
    if (!workspaceId || !owner) {
      return { ok: false, error: "Workspace and owner are required.", overview: buildOverview(options) };
    }
    updateDigestWorkspaceState(workspaceId, {
      escalationOwner: owner,
      assignedBy: actor.id,
      assignedAt: new Date().toISOString(),
    });
    updateIncidentChecklistItem(workspaceId, "owner_assigned", {
      completed: true,
      completedAt: new Date().toISOString(),
      completedByName: actor.name,
    });
    appendDigestWorkspaceEvent(workspaceId, {
      type: "owner-assigned",
      message: `Assigned ${owner} as workspace automation owner.`,
      actorId: actor.id,
      actorName: actor.name,
      note: owner,
    });
    appendAuditEvent({ type: action, message: `Assigned automation owner for ${workspaceId}.`, payload: { workspaceId, owner, actorId: actor.id } });
    return { ok: true, output: `Assigned ${owner} to ${workspaceId}.`, overview: buildOverview(options) };
  }

  if (action === "collaboration:automation-bulk-assign") {
    const owner = String(payload.owner || "").trim();
    if (!owner) {
      return { ok: false, error: "An owner is required.", overview: buildOverview(options) };
    }
    const digestScheduler = getDigestSchedulerStatus();
    const digestWorkspaceHealth = buildDigestWorkspaceHealth(digestScheduler);
    const targets = selectBulkAutomationWorkspaces(digestWorkspaceHealth, payload);
    targets.forEach((workspaceHealth) => {
      updateDigestWorkspaceState(workspaceHealth.workspaceId, {
        escalationOwner: owner,
        assignedBy: actor.id,
        assignedAt: new Date().toISOString(),
        snoozedUntil: null,
      });
      updateIncidentChecklistItem(workspaceHealth.workspaceId, "owner_assigned", {
        completed: true,
        completedAt: new Date().toISOString(),
        completedByName: actor.name,
      });
      appendDigestWorkspaceEvent(workspaceHealth.workspaceId, {
        type: "owner-assigned",
        message: `Assigned ${owner} as workspace automation owner from the control plane.`,
        actorId: actor.id,
        actorName: actor.name,
        note: owner,
      });
    });
    appendAuditEvent({
      type: action,
      message: `Assigned automation owner ${owner} across ${targets.length} workspaces.`,
      payload: {
        workspaceIds: targets.map((item) => item.workspaceId),
        owner,
        actorId: actor.id,
        environments: Array.isArray(payload.environments) ? payload.environments : payload.environment ? [payload.environment] : [],
        statuses: Array.isArray(payload.statuses) ? payload.statuses : ["error", "stalled"],
      },
    });
    return { ok: true, output: `Assigned ${owner} to ${targets.length} matching workspaces.`, overview: buildOverview(options) };
  }

  if (action === "collaboration:automation-assign-approver") {
    const workspaceId = String(payload.workspaceId || "");
    const approverTarget = String(payload.approverTarget || "").trim();
    if (!workspaceId) {
      return { ok: false, error: "Workspace is required.", overview: buildOverview(options) };
    }
    updateDigestWorkspaceState(workspaceId, {
      incidentApproverTarget: approverTarget || null,
      approverAssignedBy: actor.id,
      approverAssignedAt: new Date().toISOString(),
    });
    appendDigestWorkspaceEvent(workspaceId, {
      type: "incident-approver",
      message: approverTarget ? `Assigned ${approverTarget} as the required incident approver.` : "Cleared the required incident approver.",
      actorId: actor.id,
      actorName: actor.name,
      note: approverTarget || null,
    });
    appendAuditEvent({
      type: action,
      message: `${approverTarget ? "Assigned" : "Cleared"} incident approver target for ${workspaceId}.`,
      payload: { workspaceId, approverTarget: approverTarget || null, actorId: actor.id },
    });
    return {
      ok: true,
      output: approverTarget ? `Assigned ${approverTarget} as the incident approver for ${workspaceId}.` : `Cleared the incident approver for ${workspaceId}.`,
      overview: buildOverview(options),
    };
  }

  if (action === "collaboration:automation-bulk-assign-approver") {
    const approverTarget = String(payload.approverTarget || "").trim();
    const digestScheduler = getDigestSchedulerStatus();
    const digestWorkspaceHealth = buildDigestWorkspaceHealth(digestScheduler);
    const targets = selectBulkAutomationWorkspaces(digestWorkspaceHealth, payload);
    targets.forEach((workspaceHealth) => {
      updateDigestWorkspaceState(workspaceHealth.workspaceId, {
        incidentApproverTarget: approverTarget || null,
        approverAssignedBy: actor.id,
        approverAssignedAt: new Date().toISOString(),
      });
      appendDigestWorkspaceEvent(workspaceHealth.workspaceId, {
        type: "incident-approver",
        message: approverTarget
          ? `Assigned ${approverTarget} as the required incident approver from the control plane.`
          : "Cleared the required incident approver from the control plane.",
        actorId: actor.id,
        actorName: actor.name,
        note: approverTarget || null,
      });
    });
    appendAuditEvent({
      type: action,
      message: `${approverTarget ? "Assigned" : "Cleared"} required incident approver across ${targets.length} workspaces.`,
      payload: {
        workspaceIds: targets.map((item) => item.workspaceId),
        approverTarget: approverTarget || null,
        actorId: actor.id,
        environments: Array.isArray(payload.environments) ? payload.environments : payload.environment ? [payload.environment] : [],
        statuses: Array.isArray(payload.statuses) ? payload.statuses : ["error", "stalled"],
      },
    });
    return {
      ok: true,
      output: approverTarget
        ? `Assigned ${approverTarget} as the incident approver for ${targets.length} matching workspaces.`
        : `Cleared the incident approver for ${targets.length} matching workspaces.`,
      overview: buildOverview(options),
    };
  }

  if (action === "collaboration:automation-assign-backup-approver") {
    const workspaceId = String(payload.workspaceId || "");
    const backupApproverTarget = String(payload.backupApproverTarget || "").trim();
    if (!workspaceId) {
      return { ok: false, error: "Workspace is required.", overview: buildOverview(options) };
    }
    updateDigestWorkspaceState(workspaceId, {
      backupApproverTarget: backupApproverTarget || null,
      backupApproverAssignedBy: actor.id,
      backupApproverAssignedAt: new Date().toISOString(),
    });
    appendDigestWorkspaceEvent(workspaceId, {
      type: "incident-backup-approver",
      message: backupApproverTarget ? `Assigned ${backupApproverTarget} as the backup incident approver.` : "Cleared the backup incident approver.",
      actorId: actor.id,
      actorName: actor.name,
      note: backupApproverTarget || null,
    });
    appendAuditEvent({
      type: action,
      message: `${backupApproverTarget ? "Assigned" : "Cleared"} backup incident approver target for ${workspaceId}.`,
      payload: { workspaceId, backupApproverTarget: backupApproverTarget || null, actorId: actor.id },
    });
    return {
      ok: true,
      output: backupApproverTarget
        ? `Assigned ${backupApproverTarget} as the backup incident approver for ${workspaceId}.`
        : `Cleared the backup incident approver for ${workspaceId}.`,
      overview: buildOverview(options),
    };
  }

  if (action === "collaboration:automation-bulk-assign-backup-approver") {
    const backupApproverTarget = String(payload.backupApproverTarget || "").trim();
    const digestScheduler = getDigestSchedulerStatus();
    const digestWorkspaceHealth = buildDigestWorkspaceHealth(digestScheduler);
    const targets = selectBulkAutomationWorkspaces(digestWorkspaceHealth, payload);
    targets.forEach((workspaceHealth) => {
      updateDigestWorkspaceState(workspaceHealth.workspaceId, {
        backupApproverTarget: backupApproverTarget || null,
        backupApproverAssignedBy: actor.id,
        backupApproverAssignedAt: new Date().toISOString(),
      });
      appendDigestWorkspaceEvent(workspaceHealth.workspaceId, {
        type: "incident-backup-approver",
        message: backupApproverTarget
          ? `Assigned ${backupApproverTarget} as the backup incident approver from the control plane.`
          : "Cleared the backup incident approver from the control plane.",
        actorId: actor.id,
        actorName: actor.name,
        note: backupApproverTarget || null,
      });
    });
    appendAuditEvent({
      type: action,
      message: `${backupApproverTarget ? "Assigned" : "Cleared"} backup incident approver across ${targets.length} workspaces.`,
      payload: {
        workspaceIds: targets.map((item) => item.workspaceId),
        backupApproverTarget: backupApproverTarget || null,
        actorId: actor.id,
        environments: Array.isArray(payload.environments) ? payload.environments : payload.environment ? [payload.environment] : [],
        statuses: Array.isArray(payload.statuses) ? payload.statuses : ["error", "stalled"],
      },
    });
    return {
      ok: true,
      output: backupApproverTarget
        ? `Assigned ${backupApproverTarget} as the backup incident approver for ${targets.length} matching workspaces.`
        : `Cleared the backup incident approver for ${targets.length} matching workspaces.`,
      overview: buildOverview(options),
    };
  }

  if (action === "collaboration:automation-bulk-apply-policy-override") {
    const digestScheduler = getDigestSchedulerStatus();
    const digestWorkspaceHealth = buildDigestWorkspaceHealth(digestScheduler);
    const targets = selectBulkAutomationWorkspaces(digestWorkspaceHealth, payload);
    const collaboration = loadCollaborationState();
    const governance = collaboration.governance || {};
    const currentOverrides =
      governance.workspacePolicyOverrides && typeof governance.workspacePolicyOverrides === "object"
        ? governance.workspacePolicyOverrides
        : {};
    const nextOverrides = { ...currentOverrides };
    const environment = String(payload.overrideEnvironment || payload.environment || governance.currentEnvironment || "development");
    const overrideTemplate = {
      environment,
      requireApprovalForResolved: Boolean(payload.requireApprovalForResolved),
      incidentApprovalCapacityLimit: Math.max(1, Number(payload.incidentApprovalCapacityLimit || 1)),
      trustDropAction: String(payload.trustDropAction || "notify"),
      promoteTrustDropToIncident: Boolean(payload.promoteTrustDropToIncident),
    };

    targets.forEach((workspaceHealth) => {
      nextOverrides[workspaceHealth.workspaceId] = {
        ...(currentOverrides[workspaceHealth.workspaceId] || {}),
        ...overrideTemplate,
      };
      appendDigestWorkspaceEvent(workspaceHealth.workspaceId, {
        type: "workspace-policy-override",
        message: "Applied workspace policy override from the control plane.",
        actorId: actor.id,
        actorName: actor.name,
        note: summarizeWorkspacePolicyOverride(nextOverrides[workspaceHealth.workspaceId]) || environment,
      });
    });

    updateGovernance({
      ...governance,
      workspacePolicyOverrides: nextOverrides,
    });
    appendAuditEvent({
      type: action,
      message: `Applied workspace policy override across ${targets.length} workspaces.`,
      payload: {
        actorId: actor.id,
        environments: Array.isArray(payload.environments) ? payload.environments : payload.environment ? [payload.environment] : [],
        statuses: Array.isArray(payload.statuses) ? payload.statuses : ["error", "stalled"],
        workspaceIds: targets.map((item) => item.workspaceId),
        override: overrideTemplate,
      },
    });
    return {
      ok: true,
      output: `Applied a workspace policy override across ${targets.length} matching workspaces.`,
      overview: buildOverview(options),
    };
  }

  if (action === "collaboration:automation-bulk-reset-policy-override") {
    const digestScheduler = getDigestSchedulerStatus();
    const digestWorkspaceHealth = buildDigestWorkspaceHealth(digestScheduler);
    const targets = selectBulkAutomationWorkspaces(digestWorkspaceHealth, payload);
    const collaboration = loadCollaborationState();
    const governance = collaboration.governance || {};
    const currentOverrides =
      governance.workspacePolicyOverrides && typeof governance.workspacePolicyOverrides === "object"
        ? governance.workspacePolicyOverrides
        : {};
    const nextOverrides = { ...currentOverrides };

    targets.forEach((workspaceHealth) => {
      delete nextOverrides[workspaceHealth.workspaceId];
      appendDigestWorkspaceEvent(workspaceHealth.workspaceId, {
        type: "workspace-policy-override",
        message: "Cleared workspace policy override from the control plane.",
        actorId: actor.id,
        actorName: actor.name,
      });
    });

    updateGovernance({
      ...governance,
      workspacePolicyOverrides: nextOverrides,
    });
    appendAuditEvent({
      type: action,
      message: `Cleared workspace policy override across ${targets.length} workspaces.`,
      payload: {
        actorId: actor.id,
        environments: Array.isArray(payload.environments) ? payload.environments : payload.environment ? [payload.environment] : [],
        statuses: Array.isArray(payload.statuses) ? payload.statuses : ["error", "stalled"],
        workspaceIds: targets.map((item) => item.workspaceId),
      },
    });
    return {
      ok: true,
      output: `Cleared workspace policy overrides across ${targets.length} matching workspaces.`,
      overview: buildOverview(options),
    };
  }

  if (action === "collaboration:save-policy-playbook") {
    const collaboration = loadCollaborationState();
    const governance = collaboration.governance || {};
    const normalized = normalizePolicyPlaybookPayload(payload, actor);
    if (!normalized.ok) {
      return { ok: false, error: normalized.error, overview: buildOverview(options) };
    }
    const existing = Array.isArray(governance.workspacePolicyPlaybooks) ? governance.workspacePolicyPlaybooks : [];
    const nextPlaybooks = [
      normalized.playbook,
      ...existing.filter((item) => String(item.id) !== normalized.playbook.id && String(item.name) !== normalized.playbook.name),
    ];
    updateGovernance({
      ...governance,
      workspacePolicyPlaybooks: nextPlaybooks,
    });
    appendAuditEvent({
      type: action,
      message: `Saved workspace policy playbook ${normalized.playbook.name}.`,
      payload: { actorId: actor.id, playbook: normalized.playbook },
    });
    return { ok: true, output: `Saved policy playbook ${normalized.playbook.name}.`, overview: buildOverview(options) };
  }

  if (action === "collaboration:delete-policy-playbook") {
    const collaboration = loadCollaborationState();
    const governance = collaboration.governance || {};
    const playbookId = String(payload.playbookId || "").trim();
    const existing = Array.isArray(governance.workspacePolicyPlaybooks) ? governance.workspacePolicyPlaybooks : [];
    const target = existing.find((item) => String(item.id) === playbookId);
    if (!target) {
      return { ok: false, error: "Policy playbook not found.", overview: buildOverview(options) };
    }
    updateGovernance({
      ...governance,
      workspacePolicyPlaybooks: existing.filter((item) => String(item.id) !== playbookId),
    });
    appendAuditEvent({
      type: action,
      message: `Deleted workspace policy playbook ${target.name}.`,
      payload: { actorId: actor.id, playbookId },
    });
    return { ok: true, output: `Deleted policy playbook ${target.name}.`, overview: buildOverview(options) };
  }

  if (action === "collaboration:automation-bulk-apply-policy-playbook") {
    const collaboration = loadCollaborationState();
    const playbooks = Array.isArray(collaboration.governance?.workspacePolicyPlaybooks)
      ? collaboration.governance.workspacePolicyPlaybooks
      : [];
    const playbookId = String(payload.playbookId || "").trim();
    const playbook = playbooks.find((item) => String(item.id) === playbookId);
    if (!playbook) {
      return { ok: false, error: "Policy playbook not found.", overview: buildOverview(options) };
    }
    const targets = selectBulkAutomationWorkspaces(buildDigestWorkspaceHealth(getDigestSchedulerStatus()), {
      environment: payload.environment,
      environments: payload.environments,
      statuses: payload.statuses,
    });
    const result = await executeAction(
      "collaboration:automation-bulk-apply-policy-override",
      {
        ...payload,
        overrideEnvironment: playbook.environment,
        incidentApprovalCapacityLimit: playbook.incidentApprovalCapacityLimit,
        trustDropAction: playbook.trustDropAction,
        requireApprovalForResolved: playbook.requireApprovalForResolved,
        promoteTrustDropToIncident: playbook.promoteTrustDropToIncident,
      },
      options
    );
    if (!result.ok) {
      return result;
    }
    const refreshed = loadCollaborationState();
    const governance = refreshed.governance || {};
    const rollout = {
      id: `policy_playbook_rollout_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      playbookId: playbook.id,
      playbookName: playbook.name,
      environment: String(payload.environment || payload.environments?.[0] || playbook.environment || "development"),
      workspaceCount: targets.length,
      workspaceIds: targets.map((item) => item.workspaceId),
      workspaceNames: targets.map((item) => item.workspaceName),
      appliedAt: new Date().toISOString(),
      appliedById: actor.id,
      appliedByName: actor.name,
    };
    updateGovernance({
      ...governance,
      workspacePolicyPlaybookRollouts: [
        rollout,
        ...(Array.isArray(governance.workspacePolicyPlaybookRollouts)
          ? governance.workspacePolicyPlaybookRollouts
          : []),
      ],
    });
    appendAuditEvent({
      type: action,
      message: `Applied workspace policy playbook ${playbook.name} across ${targets.length} workspaces.`,
      payload: {
        actorId: actor.id,
        playbookId: playbook.id,
        environment: rollout.environment,
        workspaceIds: rollout.workspaceIds,
      },
    });
    return { ok: true, output: `Applied policy playbook ${playbook.name} across ${targets.length} matching workspaces.`, overview: buildOverview(options) };
  }

  if (action === "collaboration:automation-snooze") {
    const workspaceId = String(payload.workspaceId || parseAutomationInboxItem(payload.itemId)?.workspaceId || "");
    const minutes = Math.max(5, Number(payload.minutes || 60));
    if (!workspaceId) {
      return { ok: false, error: "Workspace is required.", overview: buildOverview(options) };
    }
    const snoozedUntil = new Date(Date.now() + minutes * 60 * 1000).toISOString();
    updateDigestWorkspaceState(workspaceId, {
      snoozedUntil,
      snoozedBy: actor.id,
      snoozedAt: new Date().toISOString(),
    });
    appendDigestWorkspaceEvent(workspaceId, {
      type: "escalation-snoozed",
      message: `Snoozed workspace automation escalation for ${minutes} minutes.`,
      actorId: actor.id,
      actorName: actor.name,
      note: snoozedUntil,
    });
    appendAuditEvent({ type: action, message: `Snoozed automation escalation for ${workspaceId}.`, payload: { workspaceId, minutes, actorId: actor.id } });
    return { ok: true, output: `Snoozed ${workspaceId} for ${minutes} minutes.`, overview: buildOverview(options) };
  }

  if (action === "collaboration:automation-bulk-snooze") {
    const minutes = Math.max(5, Number(payload.minutes || 60));
    const digestScheduler = getDigestSchedulerStatus();
    const digestWorkspaceHealth = buildDigestWorkspaceHealth(digestScheduler);
    const targets = selectBulkAutomationWorkspaces(digestWorkspaceHealth, payload);
    const snoozedUntil = new Date(Date.now() + minutes * 60 * 1000).toISOString();
    targets.forEach((workspaceHealth) => {
      updateDigestWorkspaceState(workspaceHealth.workspaceId, {
        snoozedUntil,
        snoozedBy: actor.id,
        snoozedAt: new Date().toISOString(),
      });
      appendDigestWorkspaceEvent(workspaceHealth.workspaceId, {
        type: "escalation-snoozed",
        message: `Snoozed workspace automation escalation for ${minutes} minutes from the control plane.`,
        actorId: actor.id,
        actorName: actor.name,
        note: snoozedUntil,
      });
    });
    appendAuditEvent({
      type: action,
      message: `Snoozed ${targets.length} workspace escalations from the control plane.`,
      payload: {
        workspaceIds: targets.map((item) => item.workspaceId),
        minutes,
        snoozedUntil,
        actorId: actor.id,
        environments: Array.isArray(payload.environments) ? payload.environments : payload.environment ? [payload.environment] : [],
        statuses: Array.isArray(payload.statuses) ? payload.statuses : ["error", "stalled"],
      },
    });
    return { ok: true, output: `Snoozed ${targets.length} matching workspaces for ${minutes} minutes.`, overview: buildOverview(options) };
  }

  if (action === "collaboration:automation-run-sweep") {
    const targetWorkspace = String(payload.workspaceId || parseAutomationInboxItem(payload.itemId)?.workspaceId || workspace);
    const job = enqueueJob("digest:run-due", { workspace: targetWorkspace }, actor);
    updateDigestWorkspaceState(targetWorkspace, {
      lastSweepQueuedAt: new Date().toISOString(),
      queuedBy: actor.id,
      snoozedUntil: null,
    });
    appendDigestWorkspaceEvent(targetWorkspace, {
      type: "sweep-queued",
      message: `Queued a manual digest sweep.`,
      actorId: actor.id,
      actorName: actor.name,
      note: job.id,
    });
    appendAuditEvent({ type: action, message: `Queued automation sweep for ${targetWorkspace}.`, payload: { workspaceId: targetWorkspace, actorId: actor.id, jobId: job.id } });
    return { ok: true, output: `Queued automation sweep for ${targetWorkspace} as ${job.id}.`, overview: buildOverview(options) };
  }

  if (action === "collaboration:automation-bulk-run-sweep") {
    const digestScheduler = getDigestSchedulerStatus();
    const digestWorkspaceHealth = buildDigestWorkspaceHealth(digestScheduler);
    const targets = selectBulkAutomationWorkspaces(digestWorkspaceHealth, payload);
    const jobs = [];
    targets.forEach((workspaceHealth) => {
      const existing = listJobs(200).some(
        (job) =>
          job.type === "digest:run-due" &&
          ["queued", "running"].includes(job.status) &&
          String(job.payload?.workspace || "") === workspaceHealth.workspaceId
      );
      if (existing) {
        return;
      }
      const job = enqueueJob("digest:run-due", { workspace: workspaceHealth.workspaceId }, actor);
      jobs.push(job);
      updateDigestWorkspaceState(workspaceHealth.workspaceId, {
        lastSweepQueuedAt: new Date().toISOString(),
        queuedBy: actor.id,
        snoozedUntil: null,
      });
      appendDigestWorkspaceEvent(workspaceHealth.workspaceId, {
        type: "sweep-queued",
        message: `Queued a bulk digest sweep from the control plane.`,
        actorId: actor.id,
        actorName: actor.name,
        note: job.id,
      });
    });
    appendAuditEvent({
      type: action,
      message: `Queued ${jobs.length} bulk automation sweeps.`,
      payload: {
        actorId: actor.id,
        environments: Array.isArray(payload.environments) ? payload.environments : payload.environment ? [payload.environment] : [],
        statuses: Array.isArray(payload.statuses) ? payload.statuses : ["error", "stalled"],
        workspaceIds: targets.map((item) => item.workspaceId),
        jobIds: jobs.map((item) => item.id),
      },
    });
    return {
      ok: true,
      output: `Queued ${jobs.length} automation sweeps across ${targets.length} matching workspaces.`,
      overview: buildOverview(options),
    };
  }

  if (action === "collaboration:automation-bulk-create-followup") {
    const digestScheduler = getDigestSchedulerStatus();
    const digestWorkspaceHealth = buildDigestWorkspaceHealth(digestScheduler);
    const targets = selectBulkAutomationWorkspaces(digestWorkspaceHealth, payload);
    const owner = String(payload.owner || "").trim() || actor.name;
    const agentName = String(payload.agentName || "planner").trim();
    const descriptionTemplate = String(payload.description || "Investigate automation health for {{workspaceName}} and report the next remediation step.").trim();
    const tasks = targets.map((workspaceHealth) => {
      const description = descriptionTemplate
        .replaceAll("{{workspaceId}}", workspaceHealth.workspaceId)
        .replaceAll("{{workspaceName}}", workspaceHealth.workspaceName);
      const task = addTask(agentName, description, {
        priority: Number(payload.priority || 2),
        sourceAgent: "automation-escalation",
        delegationReason: `Created from control-plane bulk follow-up for workspace ${workspaceHealth.workspaceId}.`,
        tags: ["automation-escalation", "workspace-ops", "bulk-followup"],
        callbackEnabled: true,
        notifyAgent: "manager",
        workspaceId: workspaceHealth.workspaceId,
        linkedWorkspaceId: workspaceHealth.workspaceId,
        ownerId: actor.id,
        ownerName: owner,
      });
      appendDigestWorkspaceEvent(workspaceHealth.workspaceId, {
        type: "followup-created",
        message: `Created automation follow-up task ${task.id} from the control plane.`,
        actorId: actor.id,
        actorName: actor.name,
        note: description,
      });
      updateIncidentChecklistItem(workspaceHealth.workspaceId, "followup_created", {
        completed: true,
        completedAt: new Date().toISOString(),
        completedByName: actor.name,
      });
      return task;
    });
    appendAuditEvent({
      type: action,
      message: `Created ${tasks.length} automation follow-up tasks from the control plane.`,
      payload: {
        actorId: actor.id,
        owner,
        agentName,
        environments: Array.isArray(payload.environments) ? payload.environments : payload.environment ? [payload.environment] : [],
        statuses: Array.isArray(payload.statuses) ? payload.statuses : ["error", "stalled"],
        workspaceIds: targets.map((item) => item.workspaceId),
        taskIds: tasks.map((item) => item.id),
      },
    });
    return {
      ok: true,
      output: `Created ${tasks.length} follow-up tasks across ${targets.length} matching workspaces.`,
      overview: buildOverview(options),
    };
  }

  if (action === "collaboration:automation-bulk-stabilize") {
    const digestScheduler = getDigestSchedulerStatus();
    const digestWorkspaceHealth = buildDigestWorkspaceHealth(digestScheduler);
    const targets = selectBulkAutomationWorkspaces(digestWorkspaceHealth, payload);
    const owner = String(payload.owner || "").trim();
    const approverTarget = String(payload.approverTarget || "").trim();
    const backupApproverTarget = String(payload.backupApproverTarget || "").trim();
    const createFollowup = Boolean(payload.createFollowup);
    const queueSweep = payload.queueSweep !== false;
    const followupOwner = owner || actor.name;
    const followupAgentName = String(payload.agentName || "planner").trim();
    const followupTemplate = String(
      payload.description || "Investigate automation health for {{workspaceName}} and report the next remediation step."
    ).trim();
    const jobs = [];
    const tasks = [];

    targets.forEach((workspaceHealth) => {
      if (owner) {
        updateDigestWorkspaceState(workspaceHealth.workspaceId, {
          escalationOwner: owner,
          assignedBy: actor.id,
          assignedAt: new Date().toISOString(),
          snoozedUntil: null,
        });
        updateIncidentChecklistItem(workspaceHealth.workspaceId, "owner_assigned", {
          completed: true,
          completedAt: new Date().toISOString(),
          completedByName: actor.name,
        });
        appendDigestWorkspaceEvent(workspaceHealth.workspaceId, {
          type: "owner-assigned",
          message: `Assigned ${owner} as workspace automation owner from the stabilization playbook.`,
          actorId: actor.id,
          actorName: actor.name,
          note: owner,
        });
      }

      if (approverTarget || payload.approverTarget === "") {
        updateDigestWorkspaceState(workspaceHealth.workspaceId, {
          incidentApproverTarget: approverTarget || null,
          approverAssignedBy: actor.id,
          approverAssignedAt: new Date().toISOString(),
        });
        appendDigestWorkspaceEvent(workspaceHealth.workspaceId, {
          type: "incident-approver",
          message: approverTarget
            ? `Assigned ${approverTarget} as the required incident approver from the stabilization playbook.`
            : "Cleared the required incident approver from the stabilization playbook.",
          actorId: actor.id,
          actorName: actor.name,
          note: approverTarget || null,
        });
      }

      if (backupApproverTarget || payload.backupApproverTarget === "") {
        updateDigestWorkspaceState(workspaceHealth.workspaceId, {
          backupApproverTarget: backupApproverTarget || null,
          backupApproverAssignedBy: actor.id,
          backupApproverAssignedAt: new Date().toISOString(),
        });
        appendDigestWorkspaceEvent(workspaceHealth.workspaceId, {
          type: "incident-backup-approver",
          message: backupApproverTarget
            ? `Assigned ${backupApproverTarget} as the backup incident approver from the stabilization playbook.`
            : "Cleared the backup incident approver from the stabilization playbook.",
          actorId: actor.id,
          actorName: actor.name,
          note: backupApproverTarget || null,
        });
      }

      if (queueSweep) {
        const existing = listJobs(200).some(
          (job) =>
            job.type === "digest:run-due" &&
            ["queued", "running"].includes(job.status) &&
            String(job.payload?.workspace || "") === workspaceHealth.workspaceId
        );
        if (!existing) {
          const job = enqueueJob("digest:run-due", { workspace: workspaceHealth.workspaceId }, actor);
          jobs.push(job);
          updateDigestWorkspaceState(workspaceHealth.workspaceId, {
            lastSweepQueuedAt: new Date().toISOString(),
            queuedBy: actor.id,
            snoozedUntil: null,
          });
          appendDigestWorkspaceEvent(workspaceHealth.workspaceId, {
            type: "sweep-queued",
            message: `Queued a stabilization digest sweep.`,
            actorId: actor.id,
            actorName: actor.name,
            note: job.id,
          });
        }
      }

      if (createFollowup) {
        const description = followupTemplate
          .replaceAll("{{workspaceId}}", workspaceHealth.workspaceId)
          .replaceAll("{{workspaceName}}", workspaceHealth.workspaceName);
        const task = addTask(followupAgentName, description, {
          priority: Number(payload.priority || 2),
          sourceAgent: "automation-escalation",
          delegationReason: `Created from stabilization playbook for workspace ${workspaceHealth.workspaceId}.`,
          tags: ["automation-escalation", "workspace-ops", "stabilize-playbook"],
          callbackEnabled: true,
          notifyAgent: "manager",
          workspaceId: workspaceHealth.workspaceId,
          linkedWorkspaceId: workspaceHealth.workspaceId,
          ownerId: actor.id,
          ownerName: followupOwner,
        });
        tasks.push(task);
        appendDigestWorkspaceEvent(workspaceHealth.workspaceId, {
          type: "followup-created",
          message: `Created automation follow-up task ${task.id} from the stabilization playbook.`,
          actorId: actor.id,
          actorName: actor.name,
          note: description,
        });
        updateIncidentChecklistItem(workspaceHealth.workspaceId, "followup_created", {
          completed: true,
          completedAt: new Date().toISOString(),
          completedByName: actor.name,
        });
      }
    });

    appendAuditEvent({
      type: action,
      message: `Ran stabilization playbook across ${targets.length} workspaces.`,
      payload: {
        actorId: actor.id,
        workspaceIds: targets.map((item) => item.workspaceId),
        environments: Array.isArray(payload.environments) ? payload.environments : payload.environment ? [payload.environment] : [],
        statuses: Array.isArray(payload.statuses) ? payload.statuses : ["error", "stalled"],
        owner: owner || null,
        approverTarget: approverTarget || null,
        backupApproverTarget: backupApproverTarget || null,
        queueSweep,
        createFollowup,
        jobIds: jobs.map((item) => item.id),
        taskIds: tasks.map((item) => item.id),
      },
    });

    return {
      ok: true,
      output: `Stabilized ${targets.length} matching workspaces with ${jobs.length} sweeps and ${tasks.length} follow-up tasks.`,
      overview: buildOverview(options),
    };
  }

  if (action === "collaboration:automation-create-followup") {
    const targetWorkspace = String(payload.workspaceId || parseAutomationInboxItem(payload.itemId)?.workspaceId || workspace);
    const owner = String(payload.owner || "").trim() || actor.name;
    const agentName = String(payload.agentName || "planner").trim();
    const description = String(payload.description || `Investigate automation escalation for workspace ${targetWorkspace} and report the next remediation step.`).trim();
    if (!targetWorkspace || !description) {
      return { ok: false, error: "Workspace and description are required.", overview: buildOverview(options) };
    }
    const task = addTask(agentName, description, {
      priority: Number(payload.priority || 2),
      sourceAgent: "automation-escalation",
      delegationReason: `Created from automation escalation for workspace ${targetWorkspace}.`,
      tags: ["automation-escalation", "workspace-ops"],
      callbackEnabled: true,
      notifyAgent: "manager",
      workspaceId: targetWorkspace,
      linkedWorkspaceId: targetWorkspace,
      linkedInboxItemId: String(payload.itemId || ""),
      ownerId: actor.id,
      ownerName: owner,
    });
    appendDigestWorkspaceEvent(targetWorkspace, {
      type: "followup-created",
      message: `Created automation follow-up task ${task.id}.`,
      actorId: actor.id,
      actorName: actor.name,
      note: description,
    });
    updateIncidentChecklistItem(targetWorkspace, "followup_created", {
      completed: true,
      completedAt: new Date().toISOString(),
      completedByName: actor.name,
    });
    appendAuditEvent({
      type: action,
      message: `Created automation follow-up task ${task.id} for ${targetWorkspace}.`,
      summary: description,
      payload: { workspaceId: targetWorkspace, actorId: actor.id, taskId: task.id, owner, agentName },
    });
    return { ok: true, output: `Created follow-up task ${task.id} for ${targetWorkspace}.`, overview: buildOverview(options) };
  }

  if (action === "collaboration:automation-add-note") {
    const workspaceId = String(payload.workspaceId || "");
    const note = String(payload.note || "").trim();
    if (!workspaceId || !note) {
      return { ok: false, error: "Workspace and note are required.", overview: buildOverview(options) };
    }
    appendDigestWorkspaceEvent(workspaceId, {
      type: "workspace-note",
      message: `Added workspace note.`,
      actorId: actor.id,
      actorName: actor.name,
      note,
    });
    appendAuditEvent({ type: action, message: `Added workspace automation note for ${workspaceId}.`, summary: note, payload: { workspaceId, actorId: actor.id } });
    return { ok: true, output: `Added note for ${workspaceId}.`, overview: buildOverview(options) };
  }

  if (action === "collaboration:automation-generate-summary") {
    const workspaceId = String(payload.workspaceId || "");
    if (!workspaceId) {
      return { ok: false, error: "Workspace is required.", overview: buildOverview(options) };
    }
    const digestScheduler = getDigestSchedulerStatus();
    const workspaceHealth = buildDigestWorkspaceHealth(digestScheduler).find((item) => item.workspaceId === workspaceId);
    if (!workspaceHealth) {
      return { ok: false, error: `Workspace not found: ${workspaceId}`, overview: buildOverview(options) };
    }
    const followups = listAutomationFollowups(workspaceId);
    const summary = generateWorkspaceIncidentSummary(workspaceHealth, followups);
    updateDigestWorkspaceState(workspaceId, {
      incidentSummary: summary,
      incidentSummaryUpdatedAt: new Date().toISOString(),
    });
    updateIncidentChecklistItem(workspaceId, "summary_generated", {
      completed: true,
      completedAt: new Date().toISOString(),
      completedByName: actor.name,
    });
    appendDigestWorkspaceEvent(workspaceId, {
      type: "incident-summary",
      message: "Generated workspace incident summary.",
      actorId: actor.id,
      actorName: actor.name,
      note: summary,
    });
    appendAuditEvent({ type: action, message: `Generated workspace incident summary for ${workspaceId}.`, summary, payload: { workspaceId, actorId: actor.id } });
    return { ok: true, output: `Generated incident summary for ${workspaceId}.`, overview: buildOverview(options) };
  }

  if (action === "collaboration:automation-set-status") {
    const workspaceId = String(payload.workspaceId || "");
    const incidentStatus = String(payload.incidentStatus || "").trim() || "open";
    const governance = loadCollaborationState().governance;
    const validation = validateIncidentStatusChange(workspaceId, incidentStatus, governance);
    if (!validation.ok) {
      return { ok: false, error: validation.error, overview: buildOverview(options) };
    }
    updateDigestWorkspaceState(workspaceId, {
      incidentStatus,
      incidentStatusUpdatedAt: new Date().toISOString(),
    });
    appendDigestWorkspaceEvent(workspaceId, {
      type: "incident-status",
      message: `Set incident status to ${incidentStatus}.`,
      actorId: actor.id,
      actorName: actor.name,
      note: incidentStatus,
    });
    appendAuditEvent({ type: action, message: `Updated incident status for ${workspaceId}.`, payload: { workspaceId, incidentStatus, actorId: actor.id } });
    return { ok: true, output: `Updated incident status for ${workspaceId}.`, overview: buildOverview(options) };
  }

  if (action === "collaboration:automation-checklist-toggle") {
    const workspaceId = String(payload.workspaceId || "");
    const itemId = String(payload.itemId || "");
    const completed = Boolean(payload.completed);
    if (!workspaceId || !itemId) {
      return { ok: false, error: "Workspace and checklist item are required.", overview: buildOverview(options) };
    }
    updateIncidentChecklistItem(workspaceId, itemId, {
      completed,
      completedAt: completed ? new Date().toISOString() : null,
      completedByName: completed ? actor.name : null,
    });
    appendDigestWorkspaceEvent(workspaceId, {
      type: "incident-checklist",
      message: `${completed ? "Completed" : "Reopened"} checklist item ${itemId}.`,
      actorId: actor.id,
      actorName: actor.name,
      note: itemId,
    });
    appendAuditEvent({ type: action, message: `Updated incident checklist item for ${workspaceId}.`, payload: { workspaceId, itemId, completed, actorId: actor.id } });
    return { ok: true, output: `Updated checklist item ${itemId} for ${workspaceId}.`, overview: buildOverview(options) };
  }

  if (action === "collaboration:automation-share-summary") {
    const workspaceId = String(payload.workspaceId || "");
    const assignedTo = String(payload.assignedTo || "team").trim();
    const useHandoffDraft = Boolean(payload.useHandoffDraft);
    if (!workspaceId) {
      return { ok: false, error: "Workspace is required.", overview: buildOverview(options) };
    }
    const digestScheduler = getDigestSchedulerStatus();
    const workspaceHealth = buildDigestWorkspaceHealth(digestScheduler).find((item) => item.workspaceId === workspaceId);
    if (!workspaceHealth) {
      return { ok: false, error: `Workspace not found: ${workspaceId}`, overview: buildOverview(options) };
    }
    const summary = useHandoffDraft
      ? workspaceHealth.incidentHandoffDraft ||
        workspaceHealth.incidentSummary ||
        generateWorkspaceIncidentSummary(workspaceHealth, listAutomationFollowups(workspaceId))
      : workspaceHealth.incidentSummary || generateWorkspaceIncidentSummary(workspaceHealth, listAutomationFollowups(workspaceId));
    const handoff = createHandoff({
      title: useHandoffDraft ? `Trust recovery handoff: ${workspaceHealth.workspaceName}` : `Incident summary: ${workspaceHealth.workspaceName}`,
      note: summary,
      assignedTo,
      assignedById: actor.id,
      assignedByName: actor.name,
    });
    updateDigestWorkspaceState(workspaceId, {
      incidentStatus: "shared",
      incidentStatusUpdatedAt: new Date().toISOString(),
      incidentSummary: summary,
      incidentSummaryUpdatedAt: workspaceHealth.incidentSummaryUpdatedAt || new Date().toISOString(),
    });
    updateIncidentChecklistItem(workspaceId, "shared_handoff", {
      completed: true,
      completedAt: new Date().toISOString(),
      completedByName: actor.name,
    });
    appendDigestWorkspaceEvent(workspaceId, {
      type: "incident-shared",
      message: useHandoffDraft ? `Shared trust recovery handoff with ${assignedTo}.` : `Shared incident summary with ${assignedTo}.`,
      actorId: actor.id,
      actorName: actor.name,
      note: handoff.id,
    });
    appendAuditEvent({
      type: action,
      message: `${useHandoffDraft ? "Shared trust recovery handoff" : "Shared incident summary"} for ${workspaceId}.`,
      payload: { workspaceId, assignedTo, handoffId: handoff.id, actorId: actor.id, useHandoffDraft },
    });
    return {
      ok: true,
      output: `${useHandoffDraft ? "Shared trust recovery handoff" : "Shared incident summary"} for ${workspaceId} with ${assignedTo}.`,
      overview: buildOverview(options),
    };
  }

  if (action === "collaboration:digest-preferences") {
    const preferences = updateDigestPreferences(actor.id, {
      enabled: Boolean(payload.enabled),
      cadence: String(payload.cadence || "manual"),
      preferredChannel: String(payload.preferredChannel || "inbox"),
      includeTrustReport: Boolean(payload.includeTrustReport),
      trustAudience: String(payload.trustAudience || "self"),
      trustEnvironment: String(payload.trustEnvironment || "all"),
      immediateOnTrustDrop: Boolean(payload.immediateOnTrustDrop),
    });
    appendAuditEvent({ type: action, message: `Updated digest preferences for ${actor.name}.`, payload: { actorId: actor.id, preferences } });
    return { ok: true, output: "Updated digest preferences.", overview: buildOverview(options) };
  }

  if (action === "collaboration:digest-generate") {
    const digest = recordDigestRun(
      actor.id,
      buildDigestRun(actor, loadCollaborationState(), buildOwnershipSignals(workspace), getDigestPreferences(actor.id))
    );
    appendAuditEvent({ type: action, message: `Generated notification digest ${digest.id}.`, payload: { actorId: actor.id, digestId: digest.id } });
    return { ok: true, output: `Generated digest ${digest.id}.`, overview: buildOverview(options) };
  }

  if (action === "collaboration:digest-run-due") {
    const job = enqueueJob("digest:run-due", { workspace }, actor);
    appendAuditEvent({ type: action, message: `Queued digest sweep as ${job.id}.`, payload: { actorId: actor.id, jobId: job.id, workspace } });
    return { ok: true, output: `Queued digest sweep as ${job.id}.`, overview: buildOverview(options) };
  }

  if (action === "collaboration:update-governance") {
    const governance = updateGovernance({
      sensitiveActionsRequireApproval: payload.sensitiveActionsRequireApproval,
      currentEnvironment: payload.currentEnvironment,
      environmentPolicies: payload.environmentPolicies,
    });
    appendAuditEvent({ type: action, message: "Updated collaboration governance.", payload: { ...governance, actorId: actor.id } });
    return { ok: true, output: "Updated collaboration governance.", overview: buildOverview(options) };
  }

  if (action === "collaboration:apply-approval-policy-recommendation") {
    return applyApprovalPolicyRecommendationChange(actor, payload, options, { persistPromotion: false });
  }

  if (action === "collaboration:promote-approval-policy-recommendation") {
    return applyApprovalPolicyRecommendationChange(actor, payload, options, { persistPromotion: true });
  }

  if (action === "collaboration:rollback-approval-policy") {
    return rollbackApprovalPolicyPromotion(actor, payload, options);
  }

  if (action === "collaboration:acknowledge-trust-alert") {
    const result = acknowledgeApprovalTrustAlert(actor, payload);
    appendAuditEvent({
      type: action,
      message: result.ok ? `Acknowledged trust alert ${String(payload.alertId || "")}.` : "Failed to acknowledge trust alert.",
      payload: { ...payload, actorId: actor.id },
    });
    return result.ok
      ? { ...result, overview: buildOverview(options) }
      : { ok: false, error: result.error, overview: buildOverview(options) };
  }

  if (action === "collaboration:restart-approval-recommendation-observation") {
    const result = restartApprovalRecommendationObservation(actor, payload);
    appendAuditEvent({
      type: action,
      message: result.ok ? `Restarted observation for ${String(payload.recommendationId || "")}.` : "Failed to restart approval observation.",
      payload: { ...payload, actorId: actor.id },
    });
    return result.ok
      ? { ...result, overview: buildOverview(options) }
      : { ok: false, error: result.error, overview: buildOverview(options) };
  }

  if (action === "collaboration:extend-approval-recommendation-cooldown") {
    const result = extendApprovalRecommendationCooldown(actor, payload);
    appendAuditEvent({
      type: action,
      message: result.ok
        ? `Extended cooldown for ${String(payload.recommendationId || "")}.`
        : "Failed to extend recommendation cooldown.",
      payload: { ...payload, actorId: actor.id },
    });
    return result.ok
      ? { ...result, overview: buildOverview(options) }
      : { ok: false, error: result.error, overview: buildOverview(options) };
  }

  throw new Error(`Unknown action: ${action}`);
}

async function handleConsoleRequest(body, options = {}) {
  if ("action" in body && body.action) {
    const action = String(body.action);
    const payload = body.payload || {};
    const actor = getActor(options);
    const startedAt = Date.now();
    const governance = loadCollaborationState().governance;

    if (
      !canUseConsoleAction(actor.role, action) ||
      (action.startsWith("approval:") && !canApproveInEnvironment(actor.role, governance)) ||
      ((action === "collaboration:update-governance" ||
        action === "collaboration:apply-approval-policy-recommendation" ||
        action === "collaboration:promote-approval-policy-recommendation" ||
        action === "collaboration:rollback-approval-policy" ||
        action === "collaboration:acknowledge-trust-alert" ||
        action === "collaboration:restart-approval-recommendation-observation" ||
        action === "collaboration:extend-approval-recommendation-cooldown") &&
        !canManageGovernanceInEnvironment(actor.role, governance))
    ) {
      recordTelemetry({ type: action, status: "error", durationMs: Date.now() - startedAt, actorId: actor.id, meta: { reason: "forbidden", role: actor.role } });
      return {
        ok: false,
        error: `Role "${actor.role}" is not allowed to perform ${action}.`,
        overview: buildOverview(options),
      };
    }

    if (action === "approval:approve") {
      const approvalId = String(payload.approvalId || "");
      const request = getApprovalRequest(approvalId);
      if (!request) {
        recordTelemetry({ type: action, status: "error", durationMs: Date.now() - startedAt, actorId: actor.id, meta: { approvalId } });
        return { ok: false, error: `Approval request not found: ${approvalId}`, overview: buildOverview(options) };
      }
      if (request.status !== "pending") {
        recordTelemetry({ type: action, status: "error", durationMs: Date.now() - startedAt, actorId: actor.id, meta: { approvalId, status: request.status } });
        return { ok: false, error: `Approval request is already ${request.status}.`, overview: buildOverview(options) };
      }
      if (!canActorHandleApproval(actor, request, governance)) {
        recordTelemetry({ type: action, status: "error", durationMs: Date.now() - startedAt, actorId: actor.id, meta: { approvalId, reason: "wrong-approver" } });
        return { ok: false, error: `This approval is assigned to ${request.approverTarget}.`, overview: buildOverview(options) };
      }
      resolveApprovalRequest(approvalId, {
        status: "approved",
        approvedById: actor.id,
        approvedByName: actor.name,
      });
      const closedReminders = closeIncidentApprovalReminderHandoffs(approvalId);
      if (request.action === "collaboration:automation-set-status" && request.payload?.workspaceId) {
        appendDigestWorkspaceEvent(String(request.payload.workspaceId), {
          type: "incident-approval",
          message: `Approved incident transition to ${String(request.payload.incidentStatus || "open")}.`,
          actorId: actor.id,
          actorName: actor.name,
          note: closedReminders.length ? `${approvalId} • closed ${closedReminders.length} reminder(s)` : approvalId,
        });
      }
      appendAuditEvent({ type: action, message: `Approved request ${approvalId}.`, payload: { approvalId, actorId: actor.id } });
      const result = await executeAction(request.action, request.payload || {}, { ...options, bypassApproval: true });
      recordTelemetry({ type: action, status: result.ok ? "ok" : "error", durationMs: Date.now() - startedAt, actorId: actor.id, meta: { approvalId, action: request.action } });
      if (result.ok && request.action === "collaboration:automation-set-status" && request.payload?.workspaceId) {
        const requestedStatus = String(request.payload.incidentStatus || "").trim().toLowerCase();
        if (requestedStatus === "resolved") {
          finalizeRecoveredTrustIncidentCloseout(String(request.payload.workspaceId), actor.name);
        }
        if (requestedStatus === "archived") {
          finalizeArchivedTrustIncident(String(request.payload.workspaceId), actor.name);
        }
        return {
          ...result,
          overview: buildOverview(options),
        };
      }
      return result;
    }

    if (
      action === "approval:reassign-target" ||
      action === "approval:take-over" ||
      action === "approval:bulk-reassign-target" ||
      action === "approval:bulk-take-over"
    ) {
      if (action === "approval:bulk-reassign-target" || action === "approval:bulk-take-over") {
        const currentTarget = String(payload.currentTarget || "").trim();
        const nextTarget =
          action === "approval:bulk-take-over"
            ? `user:${actor.id}`
            : String(payload.approverTarget || "").trim();
        if (!currentTarget) {
          recordTelemetry({ type: action, status: "error", durationMs: Date.now() - startedAt, actorId: actor.id, meta: { reason: "missing-current-target" } });
          return { ok: false, error: "A current approver target is required.", overview: buildOverview(options) };
        }
        if (!nextTarget) {
          recordTelemetry({ type: action, status: "error", durationMs: Date.now() - startedAt, actorId: actor.id, meta: { reason: "missing-target" } });
          return { ok: false, error: "A new approver target is required.", overview: buildOverview(options) };
        }
        const collaboration = loadCollaborationState();
        const pendingRequests = (Array.isArray(collaboration.approvals) ? collaboration.approvals : []).filter(
          (request) => request.status === "pending" && String(request.approverTarget || "").trim() === currentTarget
        );
        const touched = pendingRequests
          .map((request) => reroutePendingApproval(request, nextTarget, actor, action))
          .filter(Boolean);
        recordTelemetry({
          type: action,
          status: "ok",
          durationMs: Date.now() - startedAt,
          actorId: actor.id,
          meta: { currentTarget, nextTarget, count: touched.length },
        });
        return {
          ok: true,
          output:
            action === "approval:bulk-take-over"
              ? `Took ownership of ${touched.length} approvals from ${currentTarget}.`
              : `Reassigned ${touched.length} approvals from ${currentTarget} to ${nextTarget}.`,
          overview: buildOverview(options),
        };
      }

      const approvalId = String(payload.approvalId || "");
      const request = getApprovalRequest(approvalId);
      if (!request) {
        recordTelemetry({ type: action, status: "error", durationMs: Date.now() - startedAt, actorId: actor.id, meta: { approvalId } });
        return { ok: false, error: `Approval request not found: ${approvalId}`, overview: buildOverview(options) };
      }
      if (request.status !== "pending") {
        recordTelemetry({ type: action, status: "error", durationMs: Date.now() - startedAt, actorId: actor.id, meta: { approvalId, status: request.status } });
        return { ok: false, error: `Approval request is already ${request.status}.`, overview: buildOverview(options) };
      }
      const nextTarget =
        action === "approval:take-over"
          ? `user:${actor.id}`
          : String(payload.approverTarget || "").trim();
      if (!nextTarget) {
        recordTelemetry({ type: action, status: "error", durationMs: Date.now() - startedAt, actorId: actor.id, meta: { approvalId, reason: "missing-target" } });
        return { ok: false, error: "A new approver target is required.", overview: buildOverview(options) };
      }
      reroutePendingApproval(request, nextTarget, actor, action);
      recordTelemetry({ type: action, status: "ok", durationMs: Date.now() - startedAt, actorId: actor.id, meta: { approvalId, approverTarget: nextTarget } });
      return {
        ok: true,
        output: action === "approval:take-over" ? `Took ownership of approval ${approvalId}.` : `Reassigned approval ${approvalId} to ${nextTarget}.`,
        overview: buildOverview(options),
      };
    }

    if (action === "approval:reject") {
      const approvalId = String(payload.approvalId || "");
      const request = getApprovalRequest(approvalId);
      if (!request) {
        recordTelemetry({ type: action, status: "error", durationMs: Date.now() - startedAt, actorId: actor.id, meta: { approvalId } });
        return { ok: false, error: `Approval request not found: ${approvalId}`, overview: buildOverview(options) };
      }
      if (request.status !== "pending") {
        recordTelemetry({ type: action, status: "error", durationMs: Date.now() - startedAt, actorId: actor.id, meta: { approvalId, status: request.status } });
        return { ok: false, error: `Approval request is already ${request.status}.`, overview: buildOverview(options) };
      }
      if (!canActorHandleApproval(actor, request, governance)) {
        recordTelemetry({ type: action, status: "error", durationMs: Date.now() - startedAt, actorId: actor.id, meta: { approvalId, reason: "wrong-approver" } });
        return { ok: false, error: `This approval is assigned to ${request.approverTarget}.`, overview: buildOverview(options) };
      }
      resolveApprovalRequest(approvalId, {
        status: "rejected",
        rejectedById: actor.id,
        rejectedByName: actor.name,
        rejectionNote: String(payload.note || "").trim(),
      });
      const closedReminders = closeIncidentApprovalReminderHandoffs(approvalId);
      if (request.action === "collaboration:automation-set-status" && request.payload?.workspaceId) {
        appendDigestWorkspaceEvent(String(request.payload.workspaceId), {
          type: "incident-approval",
          message: `Rejected incident transition to ${String(request.payload.incidentStatus || "open")}.`,
          actorId: actor.id,
          actorName: actor.name,
          note: String(payload.note || "").trim() || (closedReminders.length ? `${approvalId} • closed ${closedReminders.length} reminder(s)` : approvalId),
        });
      }
      appendAuditEvent({ type: action, message: `Rejected request ${approvalId}.`, summary: String(payload.note || ""), payload: { approvalId, actorId: actor.id } });
      recordTelemetry({ type: action, status: "ok", durationMs: Date.now() - startedAt, actorId: actor.id, meta: { approvalId } });
      return { ok: true, output: `Rejected approval request ${approvalId}.`, overview: buildOverview(options) };
    }

    if (action === "collaboration:automation-set-status") {
      const validation = validateIncidentStatusChange(
        String(payload.workspaceId || ""),
        String(payload.incidentStatus || ""),
        governance
      );
      if (!validation.ok) {
        recordTelemetry({ type: action, status: "error", durationMs: Date.now() - startedAt, actorId: actor.id, meta: { reason: "invalid-transition" } });
        return { ok: false, error: validation.error, overview: buildOverview(options) };
      }
    }

    if (requiresApproval(action, payload, options)) {
      const workspaceState = getDigestWorkspaceState(String(payload.workspaceId || ""));
      const approvalRouting =
        action === "collaboration:automation-set-status"
          ? selectAdaptiveApprovalTarget(
              String(payload.workspaceId || ""),
              String(payload.approverTarget || workspaceState.incidentApproverTarget || "").trim() || null,
              String(workspaceState.backupApproverTarget || "").trim() || null,
              governance
            )
          : { approverTarget: null, routedByCapacity: false, routedAdaptively: false, reason: null, mode: "unassigned", routedFromTarget: null };
      const approvalPayload =
        action === "collaboration:automation-set-status" &&
        String(payload.incidentStatus || "").trim().toLowerCase() === "archived"
          ? {
              ...payload,
              archiveRationale: buildTrustArchiveRationale(String(payload.workspaceId || "")) || String(payload.archiveRationale || "").trim() || null,
            }
          : payload;
      const approvalTarget = approvalRouting.approverTarget;
      const approvalLabel =
        action === "collaboration:automation-set-status"
          ? `Approve incident ${String(payload.incidentStatus || "open")} for ${getWorkspaceName(String(payload.workspaceId || workspace))}`
          : String(payload.label || action);
      const approval = createApprovalRequest({
        action,
        payload: approvalTarget ? { ...approvalPayload, approverTarget: approvalTarget } : approvalPayload,
        label: approvalLabel,
        requestedById: actor.id,
        requestedByName: actor.name,
        approverTarget: approvalTarget,
        routingMode: approvalRouting.mode,
        routingReason: approvalRouting.reason,
        routedFromTarget: approvalRouting.routedFromTarget,
      });
      if (action === "collaboration:automation-set-status" && payload.workspaceId) {
        appendDigestWorkspaceEvent(String(payload.workspaceId), {
          type: "incident-approval",
          message:
            approvalRouting.routedByCapacity
              ? `Requested approval to move incident to ${String(payload.incidentStatus || "open")} using capacity-aware routing.`
              : approvalRouting.routedAdaptively
                ? `Requested approval to move incident to ${String(payload.incidentStatus || "open")} using adaptive routing.`
                : `Requested approval to move incident to ${String(payload.incidentStatus || "open")}.`,
          actorId: actor.id,
          actorName: actor.name,
          note: approvalRouting.reason ? `${approval.id} • ${approvalRouting.reason}` : approval.id,
        });
      }
      appendAuditEvent({ type: "approval:requested", message: `Queued approval for ${action}.`, payload: { approvalId: approval.id, actorId: actor.id, action } });
      return {
        ok: true,
        output: `Approval requested for ${action}. Request ID: ${approval.id}.`,
        overview: buildOverview(options),
      };
    }

    const result = await executeAction(action, payload, options);
    recordTelemetry({ type: action, status: result.ok ? "ok" : "error", durationMs: Date.now() - startedAt, actorId: actor.id, meta: { action } });
    return result;
  }

  const command = "command" in body ? String(body.command || "") : "";
  const startedAt = Date.now();
  const actor = getActor(options);
  const governance = loadCollaborationState().governance;
  if (!canExecuteCommands(actor.role, governance)) {
    recordTelemetry({ type: "command", status: "error", durationMs: Date.now() - startedAt, actorId: actor.id, meta: { reason: "forbidden", role: actor.role } });
    return {
      ok: false,
      error: `Role "${actor.role}" cannot execute console commands.`,
      overview: buildOverview(options),
    };
  }
  const output = await executeCommand(command, options);
  appendAuditEvent({ type: "command", message: `Executed console command: ${command || "help"}.`, summary: command || "help", payload: { actorId: actor.id } });
  recordTelemetry({ type: "command", status: "ok", durationMs: Date.now() - startedAt, actorId: actor.id, meta: { command: command || "help" } });
  return { ok: true, output, overview: buildOverview(options) };
}

module.exports = {
  buildOverview,
  handleConsoleRequest,
  queueDueDigestSweepIfNeeded,
};
