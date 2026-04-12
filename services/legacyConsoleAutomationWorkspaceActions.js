function resolvePayloadValues(payload = {}) {
  return {
    environments: Array.isArray(payload.environments) ? payload.environments : payload.environment ? [payload.environment] : [],
    statuses: Array.isArray(payload.statuses) ? payload.statuses : ["error", "stalled"],
  };
}

function assignWorkspaceOwner(workspaceId, owner, actor, deps, message = "Assigned {owner} as workspace automation owner.", note = null) {
  deps.updateDigestWorkspaceState(workspaceId, {
    escalationOwner: owner,
    assignedBy: actor.id,
    assignedAt: new Date().toISOString(),
    snoozedUntil: null,
  });
  deps.updateIncidentChecklistItem(workspaceId, "owner_assigned", {
    completed: true,
    completedAt: new Date().toISOString(),
    completedByName: actor.name,
  });
  deps.appendDigestWorkspaceEvent(workspaceId, {
    type: "owner-assigned",
    message: message.replace("{owner}", owner),
    actorId: actor.id,
    actorName: actor.name,
    note: note ?? owner,
  });
}

function assignIncidentApprover(workspaceId, approverTarget, actor, deps, message) {
  deps.updateDigestWorkspaceState(workspaceId, {
    incidentApproverTarget: approverTarget || null,
    approverAssignedBy: actor.id,
    approverAssignedAt: new Date().toISOString(),
  });
  deps.appendDigestWorkspaceEvent(workspaceId, {
    type: "incident-approver",
    message,
    actorId: actor.id,
    actorName: actor.name,
    note: approverTarget || null,
  });
}

function assignBackupApprover(workspaceId, backupApproverTarget, actor, deps, message) {
  deps.updateDigestWorkspaceState(workspaceId, {
    backupApproverTarget: backupApproverTarget || null,
    backupApproverAssignedBy: actor.id,
    backupApproverAssignedAt: new Date().toISOString(),
  });
  deps.appendDigestWorkspaceEvent(workspaceId, {
    type: "incident-backup-approver",
    message,
    actorId: actor.id,
    actorName: actor.name,
    note: backupApproverTarget || null,
  });
}

function applyWorkspacePolicyOverride(targets, payload, actor, deps) {
  const collaboration = deps.loadCollaborationState();
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
    deps.appendDigestWorkspaceEvent(workspaceHealth.workspaceId, {
      type: "workspace-policy-override",
      message: "Applied workspace policy override from the control plane.",
      actorId: actor.id,
      actorName: actor.name,
      note: deps.summarizeWorkspacePolicyOverride(nextOverrides[workspaceHealth.workspaceId]) || environment,
    });
  });

  deps.updateGovernance({
    ...governance,
    workspacePolicyOverrides: nextOverrides,
  });

  return {
    overrideTemplate,
    workspaceIds: targets.map((item) => item.workspaceId),
  };
}

function resetWorkspacePolicyOverride(targets, actor, deps) {
  const collaboration = deps.loadCollaborationState();
  const governance = collaboration.governance || {};
  const currentOverrides =
    governance.workspacePolicyOverrides && typeof governance.workspacePolicyOverrides === "object"
      ? governance.workspacePolicyOverrides
      : {};
  const nextOverrides = { ...currentOverrides };

  targets.forEach((workspaceHealth) => {
    delete nextOverrides[workspaceHealth.workspaceId];
    deps.appendDigestWorkspaceEvent(workspaceHealth.workspaceId, {
      type: "workspace-policy-override",
      message: "Cleared workspace policy override from the control plane.",
      actorId: actor.id,
      actorName: actor.name,
    });
  });

  deps.updateGovernance({
    ...governance,
    workspacePolicyOverrides: nextOverrides,
  });

  return {
    workspaceIds: targets.map((item) => item.workspaceId),
  };
}

function savePolicyPlaybook(payload, actor, deps) {
  const collaboration = deps.loadCollaborationState();
  const governance = collaboration.governance || {};
  const normalized = deps.normalizePolicyPlaybookPayload(payload, actor);
  if (!normalized.ok) {
    return normalized;
  }
  const existing = Array.isArray(governance.workspacePolicyPlaybooks) ? governance.workspacePolicyPlaybooks : [];
  const nextPlaybooks = [
    normalized.playbook,
    ...existing.filter((item) => String(item.id) !== normalized.playbook.id && String(item.name) !== normalized.playbook.name),
  ];
  deps.updateGovernance({
    ...governance,
    workspacePolicyPlaybooks: nextPlaybooks,
  });
  return normalized;
}

function deletePolicyPlaybook(payload, deps) {
  const collaboration = deps.loadCollaborationState();
  const governance = collaboration.governance || {};
  const playbookId = String(payload.playbookId || "").trim();
  const existing = Array.isArray(governance.workspacePolicyPlaybooks) ? governance.workspacePolicyPlaybooks : [];
  const target = existing.find((item) => String(item.id) === playbookId);
  if (!target) {
    return { ok: false, error: "Policy playbook not found." };
  }
  deps.updateGovernance({
    ...governance,
    workspacePolicyPlaybooks: existing.filter((item) => String(item.id) !== playbookId),
  });
  return { ok: true, playbookId, target };
}

module.exports = {
  resolvePayloadValues,
  assignWorkspaceOwner,
  assignIncidentApprover,
  assignBackupApprover,
  applyWorkspacePolicyOverride,
  resetWorkspacePolicyOverride,
  savePolicyPlaybook,
  deletePolicyPlaybook,
};
