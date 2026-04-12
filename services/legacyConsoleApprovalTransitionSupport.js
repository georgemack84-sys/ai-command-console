function getPendingApprovalOrError(approvalId, deps) {
  const request = deps.getApprovalRequest(approvalId);
  if (!request) {
    return { ok: false, error: `Approval request not found: ${approvalId}` };
  }
  if (request.status !== "pending") {
    return { ok: false, error: `Approval request is already ${request.status}.`, status: request.status };
  }
  return { ok: true, request };
}

function approveApprovalRequest(approvalId, actor, governance, deps) {
  const lookup = getPendingApprovalOrError(approvalId, deps);
  if (!lookup.ok) {
    return lookup;
  }
  const { request } = lookup;
  if (!deps.canActorHandleApproval(actor, request, governance)) {
    return { ok: false, error: `This approval is assigned to ${request.approverTarget}.`, reason: "wrong-approver", request };
  }

  deps.resolveApprovalRequest(approvalId, {
    status: "approved",
    approvedById: actor.id,
    approvedByName: actor.name,
  });
  const closedReminders = deps.closeIncidentApprovalReminderHandoffs(approvalId);
  if (request.action === "collaboration:automation-set-status" && request.payload?.workspaceId) {
    deps.appendDigestWorkspaceEvent(String(request.payload.workspaceId), {
      type: "incident-approval",
      message: `Approved incident transition to ${String(request.payload.incidentStatus || "open")}.`,
      actorId: actor.id,
      actorName: actor.name,
      note: closedReminders.length ? `${approvalId} • closed ${closedReminders.length} reminder(s)` : approvalId,
    });
  }
  deps.appendAuditEvent({ type: "approval:approve", message: `Approved request ${approvalId}.`, payload: { approvalId, actorId: actor.id } });
  return { ok: true, request, closedReminders };
}

function rejectApprovalRequest(approvalId, actor, governance, note, deps) {
  const lookup = getPendingApprovalOrError(approvalId, deps);
  if (!lookup.ok) {
    return lookup;
  }
  const { request } = lookup;
  if (!deps.canActorHandleApproval(actor, request, governance)) {
    return { ok: false, error: `This approval is assigned to ${request.approverTarget}.`, reason: "wrong-approver", request };
  }

  const trimmedNote = String(note || "").trim();
  deps.resolveApprovalRequest(approvalId, {
    status: "rejected",
    rejectedById: actor.id,
    rejectedByName: actor.name,
    rejectionNote: trimmedNote,
  });
  const closedReminders = deps.closeIncidentApprovalReminderHandoffs(approvalId);
  if (request.action === "collaboration:automation-set-status" && request.payload?.workspaceId) {
    deps.appendDigestWorkspaceEvent(String(request.payload.workspaceId), {
      type: "incident-approval",
      message: `Rejected incident transition to ${String(request.payload.incidentStatus || "open")}.`,
      actorId: actor.id,
      actorName: actor.name,
      note: trimmedNote || (closedReminders.length ? `${approvalId} • closed ${closedReminders.length} reminder(s)` : approvalId),
    });
  }
  deps.appendAuditEvent({
    type: "approval:reject",
    message: `Rejected request ${approvalId}.`,
    summary: trimmedNote,
    payload: { approvalId, actorId: actor.id },
  });
  return { ok: true, request, closedReminders };
}

function rerouteApprovalRequest(approvalId, action, payload, actor, deps) {
  const lookup = getPendingApprovalOrError(approvalId, deps);
  if (!lookup.ok) {
    return lookup;
  }
  const nextTarget = action === "approval:take-over" ? `user:${actor.id}` : String(payload.approverTarget || "").trim();
  if (!nextTarget) {
    return { ok: false, error: "A new approver target is required.", reason: "missing-target", request: lookup.request };
  }
  const updated = deps.reroutePendingApproval(lookup.request, nextTarget, actor, action);
  return { ok: true, request: lookup.request, updated, nextTarget };
}

function rerouteBulkApprovalRequests(action, payload, actor, deps) {
  const currentTarget = String(payload.currentTarget || "").trim();
  const nextTarget = action === "approval:bulk-take-over" ? `user:${actor.id}` : String(payload.approverTarget || "").trim();
  if (!currentTarget) {
    return { ok: false, error: "A current approver target is required.", reason: "missing-current-target" };
  }
  if (!nextTarget) {
    return { ok: false, error: "A new approver target is required.", reason: "missing-target" };
  }
  const collaboration = deps.loadCollaborationState();
  const pendingRequests = (Array.isArray(collaboration.approvals) ? collaboration.approvals : []).filter(
    (request) => request.status === "pending" && String(request.approverTarget || "").trim() === currentTarget
  );
  const touched = pendingRequests.map((request) => deps.reroutePendingApproval(request, nextTarget, actor, action)).filter(Boolean);
  return { ok: true, currentTarget, nextTarget, touched };
}

module.exports = {
  getPendingApprovalOrError,
  approveApprovalRequest,
  rejectApprovalRequest,
  rerouteApprovalRequest,
  rerouteBulkApprovalRequests,
};
