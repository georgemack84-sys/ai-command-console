function addWorkspaceAutomationNote(workspaceId, note, actor, deps) {
  deps.appendDigestWorkspaceEvent(workspaceId, {
    type: "workspace-note",
    message: "Added workspace note.",
    actorId: actor.id,
    actorName: actor.name,
    note,
  });

  return {
    ok: true,
    output: `Added note for ${workspaceId}.`,
    audit: {
      message: `Added workspace automation note for ${workspaceId}.`,
      summary: note,
      payload: { workspaceId },
    },
  };
}

function generateIncidentSummary(workspaceId, actor, deps) {
  const digestScheduler = deps.getDigestSchedulerStatus();
  const workspaceHealth = deps.buildDigestWorkspaceHealth(digestScheduler).find((item) => item.workspaceId === workspaceId);
  if (!workspaceHealth) {
    return { ok: false, error: `Workspace not found: ${workspaceId}` };
  }

  const followups = deps.listAutomationFollowups(workspaceId);
  const summary = deps.generateWorkspaceIncidentSummary(workspaceHealth, followups);
  deps.updateDigestWorkspaceState(workspaceId, {
    incidentSummary: summary,
    incidentSummaryUpdatedAt: new Date().toISOString(),
  });
  deps.updateIncidentChecklistItem(workspaceId, "summary_generated", {
    completed: true,
    completedAt: new Date().toISOString(),
    completedByName: actor.name,
  });
  deps.appendDigestWorkspaceEvent(workspaceId, {
    type: "incident-summary",
    message: "Generated workspace incident summary.",
    actorId: actor.id,
    actorName: actor.name,
    note: summary,
  });

  return {
    ok: true,
    output: `Generated incident summary for ${workspaceId}.`,
    audit: {
      message: `Generated workspace incident summary for ${workspaceId}.`,
      summary,
      payload: { workspaceId },
    },
  };
}

function setIncidentStatus(workspaceId, incidentStatus, actor, deps) {
  const governance = deps.loadCollaborationState().governance;
  const validation = deps.validateIncidentStatusChange(workspaceId, incidentStatus, governance);
  if (!validation.ok) {
    return { ok: false, error: validation.error };
  }

  deps.updateDigestWorkspaceState(workspaceId, {
    incidentStatus,
    incidentStatusUpdatedAt: new Date().toISOString(),
  });
  deps.appendDigestWorkspaceEvent(workspaceId, {
    type: "incident-status",
    message: `Set incident status to ${incidentStatus}.`,
    actorId: actor.id,
    actorName: actor.name,
    note: incidentStatus,
  });

  return {
    ok: true,
    output: `Updated incident status for ${workspaceId}.`,
    audit: {
      message: `Updated incident status for ${workspaceId}.`,
      payload: { workspaceId, incidentStatus },
    },
  };
}

function toggleIncidentChecklistItem(workspaceId, itemId, completed, actor, deps) {
  deps.updateIncidentChecklistItem(workspaceId, itemId, {
    completed,
    completedAt: completed ? new Date().toISOString() : null,
    completedByName: completed ? actor.name : null,
  });
  deps.appendDigestWorkspaceEvent(workspaceId, {
    type: "incident-checklist",
    message: `${completed ? "Completed" : "Reopened"} checklist item ${itemId}.`,
    actorId: actor.id,
    actorName: actor.name,
    note: itemId,
  });

  return {
    ok: true,
    output: `Updated checklist item ${itemId} for ${workspaceId}.`,
    audit: {
      message: `Updated incident checklist item for ${workspaceId}.`,
      payload: { workspaceId, itemId, completed },
    },
  };
}

function shareIncidentSummary(workspaceId, assignedTo, useHandoffDraft, actor, deps) {
  const digestScheduler = deps.getDigestSchedulerStatus();
  const workspaceHealth = deps.buildDigestWorkspaceHealth(digestScheduler).find((item) => item.workspaceId === workspaceId);
  if (!workspaceHealth) {
    return { ok: false, error: `Workspace not found: ${workspaceId}` };
  }

  const summary = useHandoffDraft
    ? workspaceHealth.incidentHandoffDraft ||
      workspaceHealth.incidentSummary ||
      deps.generateWorkspaceIncidentSummary(workspaceHealth, deps.listAutomationFollowups(workspaceId))
    : workspaceHealth.incidentSummary || deps.generateWorkspaceIncidentSummary(workspaceHealth, deps.listAutomationFollowups(workspaceId));
  const handoff = deps.createHandoff({
    title: useHandoffDraft ? `Trust recovery handoff: ${workspaceHealth.workspaceName}` : `Incident summary: ${workspaceHealth.workspaceName}`,
    note: summary,
    assignedTo,
    assignedById: actor.id,
    assignedByName: actor.name,
  });
  deps.updateDigestWorkspaceState(workspaceId, {
    incidentStatus: "shared",
    incidentStatusUpdatedAt: new Date().toISOString(),
    incidentSummary: summary,
    incidentSummaryUpdatedAt: workspaceHealth.incidentSummaryUpdatedAt || new Date().toISOString(),
  });
  deps.updateIncidentChecklistItem(workspaceId, "shared_handoff", {
    completed: true,
    completedAt: new Date().toISOString(),
    completedByName: actor.name,
  });
  deps.appendDigestWorkspaceEvent(workspaceId, {
    type: "incident-shared",
    message: useHandoffDraft ? `Shared trust recovery handoff with ${assignedTo}.` : `Shared incident summary with ${assignedTo}.`,
    actorId: actor.id,
    actorName: actor.name,
    note: handoff.id,
  });

  return {
    ok: true,
    output: `${useHandoffDraft ? "Shared trust recovery handoff" : "Shared incident summary"} for ${workspaceId} with ${assignedTo}.`,
    audit: {
      message: `${useHandoffDraft ? "Shared trust recovery handoff" : "Shared incident summary"} for ${workspaceId}.`,
      payload: { workspaceId, assignedTo, handoffId: handoff.id, useHandoffDraft },
    },
  };
}

module.exports = {
  addWorkspaceAutomationNote,
  generateIncidentSummary,
  setIncidentStatus,
  toggleIncidentChecklistItem,
  shareIncidentSummary,
};
