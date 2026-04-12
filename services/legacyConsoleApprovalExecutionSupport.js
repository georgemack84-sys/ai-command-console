function buildApprovalTelemetryMeta(base = {}, extras = {}) {
  return {
    ...base,
    ...Object.fromEntries(Object.entries(extras).filter(([, value]) => value !== undefined)),
  };
}

async function executeApprovedAction(request, actor, options, deps) {
  const result = await deps.executeAction(request.action, request.payload || {}, {
    ...options,
    bypassApproval: true,
  });

  if (result.ok && request.action === "collaboration:automation-set-status" && request.payload?.workspaceId) {
    const workspaceId = String(request.payload.workspaceId);
    const requestedStatus = String(request.payload.incidentStatus || "").trim().toLowerCase();
    if (requestedStatus === "resolved") {
      deps.finalizeRecoveredTrustIncidentCloseout(workspaceId, actor.name);
    }
    if (requestedStatus === "archived") {
      deps.finalizeArchivedTrustIncident(workspaceId, actor.name);
    }
  }

  return result;
}

function buildBulkApprovalOutput(action, currentTarget, nextTarget, touchedCount) {
  return action === "approval:bulk-take-over"
    ? `Took ownership of ${touchedCount} approvals from ${currentTarget}.`
    : `Reassigned ${touchedCount} approvals from ${currentTarget} to ${nextTarget}.`;
}

function buildSingleApprovalOutput(action, approvalId, nextTarget) {
  return action === "approval:take-over"
    ? `Took ownership of approval ${approvalId}.`
    : `Reassigned approval ${approvalId} to ${nextTarget}.`;
}

module.exports = {
  buildApprovalTelemetryMeta,
  executeApprovedAction,
  buildBulkApprovalOutput,
  buildSingleApprovalOutput,
};
