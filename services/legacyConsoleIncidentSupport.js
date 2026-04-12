const {
  generateWorkspaceIncidentSummary: generateWorkspaceIncidentSummaryImpl,
  defaultIncidentChecklist: defaultIncidentChecklistImpl,
  getIncidentPolicy: getIncidentPolicyImpl,
  getIncidentTransitionState: getIncidentTransitionStateImpl,
  buildIncidentApprovalSla: buildIncidentApprovalSlaImpl,
  selectAdaptiveApprovalTarget: selectAdaptiveApprovalTargetImpl,
} = require("./legacyConsoleIncidentPolicySupport");
const {
  canActorHandleApproval: canActorHandleApprovalImpl,
  closeIncidentApprovalReminderHandoffs: closeIncidentApprovalReminderHandoffsImpl,
  reroutePendingApproval: reroutePendingApprovalImpl,
  ensureIncidentApprovalDelegation: ensureIncidentApprovalDelegationImpl,
  autoRerouteIncidentApproval: autoRerouteIncidentApprovalImpl,
} = require("./legacyConsoleIncidentApprovalSupport");

function generateWorkspaceIncidentSummary(workspaceHealth, followups = []) {
  return generateWorkspaceIncidentSummaryImpl(workspaceHealth, followups);
}

function defaultIncidentChecklist(existing = []) {
  return defaultIncidentChecklistImpl(existing);
}

function getChecklistLabelMap(checklist = []) {
  return new Map((Array.isArray(checklist) ? checklist : []).map((item) => [String(item.id), item.label || String(item.id)]));
}

function getIncidentPolicy(governance = {}, workspaceId = null, deps) {
  return getIncidentPolicyImpl(governance, workspaceId, deps);
}

function getIncidentTransitionState(workspaceHealth, governance = {}, deps) {
  return getIncidentTransitionStateImpl(workspaceHealth, governance, deps);
}

function updateIncidentChecklistItem(workspaceId, itemId, updates = {}, deps) {
  const workspaceState = deps.getDigestWorkspaceState(workspaceId);
  const checklist = deps.defaultIncidentChecklist(workspaceState.incidentChecklist).map((item) =>
    item.id === itemId ? { ...item, ...updates } : item
  );
  return deps.updateDigestWorkspaceState(workspaceId, { incidentChecklist: checklist });
}

function buildIncidentApprovalSla(approval, incidentPolicy = {}) {
  return buildIncidentApprovalSlaImpl(approval, incidentPolicy);
}

function validateIncidentStatusChange(workspaceId, incidentStatus, governance = {}, deps) {
  if (!workspaceId) {
    return { ok: false, error: "Workspace is required." };
  }

  const digestScheduler = deps.getDigestSchedulerStatus();
  const workspaceHealth = deps.buildDigestWorkspaceHealth(digestScheduler).find((item) => item.workspaceId === workspaceId);
  if (!workspaceHealth) {
    return { ok: false, error: `Workspace not found: ${workspaceId}` };
  }

  const transitionState = getIncidentTransitionState(workspaceHealth, governance, deps);
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

function canActorHandleApproval(actor, request, governance, deps) {
  return canActorHandleApprovalImpl(actor, request, governance, deps);
}

function closeIncidentApprovalReminderHandoffs(approvalId, deps) {
  return closeIncidentApprovalReminderHandoffsImpl(approvalId, deps);
}

function reroutePendingApproval(request, nextTarget, actor, action, deps) {
  return reroutePendingApprovalImpl(request, nextTarget, actor, action, deps);
}

function ensureIncidentApprovalDelegation(workspaceHealth, collaboration, deps) {
  return ensureIncidentApprovalDelegationImpl(workspaceHealth, collaboration, {
    ...deps,
    buildIncidentApprovalSla,
  });
}

function autoRerouteIncidentApproval(workspaceHealth, deps) {
  return autoRerouteIncidentApprovalImpl(workspaceHealth, deps);
}

function selectAdaptiveApprovalTarget(workspaceId, requestedTarget, backupTarget, governance, deps) {
  return selectAdaptiveApprovalTargetImpl(workspaceId, requestedTarget, backupTarget, governance, deps);
}

module.exports = {
  generateWorkspaceIncidentSummary,
  defaultIncidentChecklist,
  updateIncidentChecklistItem,
  getIncidentPolicy,
  getIncidentTransitionState,
  validateIncidentStatusChange,
  canActorHandleApproval,
  buildIncidentApprovalSla,
  closeIncidentApprovalReminderHandoffs,
  reroutePendingApproval,
  ensureIncidentApprovalDelegation,
  autoRerouteIncidentApproval,
  selectAdaptiveApprovalTarget,
};
