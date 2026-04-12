function canActorHandleApproval(actor, request, governance, deps) {
  if (!deps.canApproveInEnvironment(actor.role, governance, request?.payload?.workspaceId || null)) {
    return false;
  }
  if (!request?.approverTarget) {
    return true;
  }
  return deps.matchesTargets(request.approverTarget, deps.buildActorTargets(actor));
}

function closeIncidentApprovalReminderHandoffs(approvalId, deps) {
  if (!approvalId) {
    return [];
  }
  const collaboration = deps.loadCollaborationState();
  const matching = (Array.isArray(collaboration.handoffs) ? collaboration.handoffs : []).filter(
    (handoff) =>
      handoff.status === "open" &&
      ["incident-approval-reminder", "incident-approval-escalation", "incident-approval-final-escalation"].includes(
        handoff.kind
      ) &&
      String(handoff.relatedApprovalId || "") === String(approvalId)
  );
  matching.forEach((handoff) => deps.closeHandoff(handoff.id));
  return matching;
}

function reroutePendingApproval(request, nextTarget, actor, action, deps) {
  const approvalId = String(request?.id || "");
  if (!approvalId || !request || request.status !== "pending") {
    return null;
  }
  const updatedRequest = deps.updateApprovalRequest(approvalId, {
    approverTarget: nextTarget,
    reassignedById: actor.id,
    reassignedByName: actor.name,
    reassignedAt: new Date().toISOString(),
  });
  const closedReminders = closeIncidentApprovalReminderHandoffs(approvalId, deps);
  if (updatedRequest?.action === "collaboration:automation-set-status" && updatedRequest.payload?.workspaceId) {
    deps.appendDigestWorkspaceEvent(String(updatedRequest.payload.workspaceId), {
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
  deps.appendAuditEvent({
    type: action,
    message:
      action === "approval:take-over" || action === "approval:bulk-take-over"
        ? `Took over approval ${approvalId}.`
        : `Reassigned approval ${approvalId} to ${nextTarget}.`,
    payload: { approvalId, approverTarget: nextTarget, actorId: actor.id, closedReminders: closedReminders.length },
  });
  return updatedRequest;
}

function ensureIncidentApprovalDelegation(workspaceHealth, collaboration, deps) {
  const approval = workspaceHealth?.incidentApproval;
  if (!approval || approval.state !== "pending" || !approval.id || !approval.approverTarget || !approval.createdAt) {
    return null;
  }

  const approvalSla = workspaceHealth.incidentApprovalSla || deps.buildIncidentApprovalSla(approval, workspaceHealth.incidentPolicy);
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
    handoff = deps.createHandoff({
      title: `Approval reminder: ${workspaceHealth.workspaceName}`,
      note: `${approval.label} is still pending for ${workspaceHealth.workspaceName}. Please review the requested ${approval.requestedStatus} transition.`,
      assignedTo: approval.approverTarget,
      assignedById: "system",
      assignedByName: "System",
      kind: "incident-approval-reminder",
      workspaceId: workspaceHealth.workspaceId,
      relatedApprovalId: approval.id,
    });
    deps.appendDigestWorkspaceEvent(workspaceHealth.workspaceId, {
      type: "incident-approval-reminder",
      message: `Delegated a reminder to ${approval.approverTarget} for the pending ${approval.requestedStatus} approval.`,
      actorId: "system",
      actorName: "System",
      note: handoff.id,
    });
    deps.appendAuditEvent({
      type: "incident-approval-reminder",
      message: `Created an approval reminder handoff for ${workspaceHealth.workspaceId}.`,
      payload: {
        workspaceId: workspaceHealth.workspaceId,
        approvalId: approval.id,
        handoffId: handoff.id,
        approverTarget: approval.approverTarget,
      },
    });
  }

  const escalationTarget = String(workspaceHealth.incidentPolicy?.incidentApprovalEscalationTarget || "").trim();
  if (approvalSla.escalated && escalationTarget && !deps.matchesTargets(escalationTarget, new Set([deps.normalizeTarget(approval.approverTarget)]))) {
    const existingEscalation = (Array.isArray(collaboration.handoffs) ? collaboration.handoffs : []).find(
      (candidate) =>
        candidate.status === "open" &&
        candidate.kind === "incident-approval-escalation" &&
        String(candidate.relatedApprovalId || "") === String(approval.id)
    );
    if (!existingEscalation) {
      const escalationHandoff = deps.createHandoff({
        title: `Approval escalation: ${workspaceHealth.workspaceName}`,
        note: `${approval.label} has exceeded its escalation threshold in ${workspaceHealth.workspaceName}. Please intervene or coordinate with ${approval.approverTarget}.`,
        assignedTo: escalationTarget,
        assignedById: "system",
        assignedByName: "System",
        kind: "incident-approval-escalation",
        workspaceId: workspaceHealth.workspaceId,
        relatedApprovalId: approval.id,
      });
      deps.appendDigestWorkspaceEvent(workspaceHealth.workspaceId, {
        type: "incident-approval-escalation",
        message: `Escalated the pending approval to ${escalationTarget}.`,
        actorId: "system",
        actorName: "System",
        note: escalationHandoff.id,
      });
      deps.appendAuditEvent({
        type: "incident-approval-escalation",
        message: `Escalated an approval reminder for ${workspaceHealth.workspaceId}.`,
        payload: {
          workspaceId: workspaceHealth.workspaceId,
          approvalId: approval.id,
          handoffId: escalationHandoff.id,
          escalationTarget,
        },
      });
    }
  }

  const finalEscalationTarget = String(workspaceHealth.incidentPolicy?.incidentApprovalFinalEscalationTarget || "").trim();
  if (
    approvalSla.finalEscalated &&
    finalEscalationTarget &&
    !deps.matchesTargets(
      finalEscalationTarget,
      new Set([deps.normalizeTarget(approval.approverTarget), deps.normalizeTarget(escalationTarget)])
    )
  ) {
    const existingFinalEscalation = (Array.isArray(collaboration.handoffs) ? collaboration.handoffs : []).find(
      (candidate) =>
        candidate.status === "open" &&
        candidate.kind === "incident-approval-final-escalation" &&
        String(candidate.relatedApprovalId || "") === String(approval.id)
    );
    if (!existingFinalEscalation) {
      const finalEscalationHandoff = deps.createHandoff({
        title: `Final approval escalation: ${workspaceHealth.workspaceName}`,
        note: `${approval.label} remains pending after multiple reminder windows in ${workspaceHealth.workspaceName}. Please take ownership of the closeout decision or coordinate with ${approval.approverTarget}.`,
        assignedTo: finalEscalationTarget,
        assignedById: "system",
        assignedByName: "System",
        kind: "incident-approval-final-escalation",
        workspaceId: workspaceHealth.workspaceId,
        relatedApprovalId: approval.id,
      });
      deps.appendDigestWorkspaceEvent(workspaceHealth.workspaceId, {
        type: "incident-approval-final-escalation",
        message: `Escalated the pending approval to ${finalEscalationTarget} after the final SLA window.`,
        actorId: "system",
        actorName: "System",
        note: finalEscalationHandoff.id,
      });
      deps.appendAuditEvent({
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

function autoRerouteIncidentApproval(workspaceHealth, deps) {
  const approval = workspaceHealth?.incidentApproval;
  const backupTarget = String(workspaceHealth?.backupApproverTarget || "").trim();
  if (!approval || approval.state !== "pending" || !approval.id || !backupTarget) {
    return null;
  }
  if (!workspaceHealth.incidentApprovalSla?.finalEscalated) {
    return null;
  }
  if (deps.matchesTargets(backupTarget, new Set([deps.normalizeTarget(approval.approverTarget)]))) {
    return null;
  }

  const updated = deps.updateApprovalRequest(approval.id, {
    approverTarget: backupTarget,
    autoReroutedAt: new Date().toISOString(),
    autoReroutedFrom: approval.approverTarget || null,
    autoReroutedById: "system",
    autoReroutedByName: "System",
  });
  const closedReminders = closeIncidentApprovalReminderHandoffs(approval.id, deps);
  deps.appendDigestWorkspaceEvent(workspaceHealth.workspaceId, {
    type: "incident-approval-auto-rerouted",
    message: `Automatically rerouted the pending approval to backup approver ${backupTarget}.`,
    actorId: "system",
    actorName: "System",
    note: closedReminders.length ? `${approval.id} • closed ${closedReminders.length} reminder(s)` : approval.id,
  });
  deps.appendAuditEvent({
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

module.exports = {
  canActorHandleApproval,
  closeIncidentApprovalReminderHandoffs,
  reroutePendingApproval,
  ensureIncidentApprovalDelegation,
  autoRerouteIncidentApproval,
};
