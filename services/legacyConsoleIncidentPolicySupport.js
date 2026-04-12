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
  const prior = new Map((Array.isArray(existing) ? existing : []).map((item) => [String(item.id), item]));
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

function getChecklistLabelMap(checklist = []) {
  return new Map((Array.isArray(checklist) ? checklist : []).map((item) => [String(item.id), item.label || String(item.id)]));
}

function getIncidentPolicy(governance = {}, workspaceId = null, deps) {
  const environmentPolicy = deps.getEnvironmentPolicy(governance, workspaceId);
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

function getIncidentTransitionState(workspaceHealth, governance = {}, deps) {
  const incidentPolicy = getIncidentPolicy(governance, workspaceHealth?.workspaceId || null, deps);
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

function selectAdaptiveApprovalTarget(workspaceId, requestedTarget, backupTarget, governance, deps) {
  const primaryTarget = String(requestedTarget || "").trim();
  const fallbackTarget = String(backupTarget || "").trim();
  if (!primaryTarget) {
    return { approverTarget: null, routedByCapacity: false, routedAdaptively: false, reason: null, mode: "unassigned", routedFromTarget: null };
  }

  const policy = getIncidentPolicy(governance, workspaceId, deps);
  const capacityLimit = Math.max(1, Number(policy.incidentApprovalCapacityLimit || 1));
  const digestWorkspaceHealth = deps.buildDigestWorkspaceHealth(deps.getDigestSchedulerStatus());
  const pressure = deps.buildIncidentApprovalPressure(digestWorkspaceHealth);
  const throughput = deps.buildApprovalThroughputAnalytics(deps.loadCollaborationState(), digestWorkspaceHealth);
  const primaryPressure = pressure.find((entry) => entry.target === primaryTarget);
  const atCapacity = Number(primaryPressure?.pendingCount || 0) >= capacityLimit;
  const throughputByTarget = new Map((Array.isArray(throughput.targets) ? throughput.targets : []).map((entry) => [entry.target, entry]));
  const primaryThroughput = throughputByTarget.get(primaryTarget) || null;
  const fallbackThroughput = throughputByTarget.get(fallbackTarget) || null;
  const primaryPending = Number(primaryPressure?.pendingCount || primaryThroughput?.pending || 0);
  const fallbackPending = Number(
    pressure.find((entry) => entry.target === fallbackTarget)?.pendingCount || fallbackThroughput?.pending || 0
  );

  if (atCapacity && fallbackTarget && !deps.matchesTargets(fallbackTarget, new Set([deps.normalizeTarget(primaryTarget)]))) {
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
    !deps.matchesTargets(fallbackTarget, new Set([deps.normalizeTarget(primaryTarget)])) &&
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

module.exports = {
  generateWorkspaceIncidentSummary,
  defaultIncidentChecklist,
  getIncidentPolicy,
  getIncidentTransitionState,
  buildIncidentApprovalSla,
  selectAdaptiveApprovalTarget,
};
