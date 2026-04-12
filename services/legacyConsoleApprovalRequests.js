function handleLegacyApprovalRequest({
  action,
  payload = {},
  options = {},
  actor,
  governance,
  startedAt,
  deps,
}) {
  const {
    validateIncidentStatusChange,
    recordTelemetry,
    buildOverview,
    requiresApproval,
    getDigestWorkspaceState,
    selectAdaptiveApprovalTarget,
    buildTrustArchiveRationale,
    getWorkspaceName,
    createApprovalRequest,
    appendDigestWorkspaceEvent,
    appendAuditEvent,
  } = deps;

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

  if (!requiresApproval(action, payload, options)) {
    return null;
  }

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
      ? `Approve incident ${String(payload.incidentStatus || "open")} for ${getWorkspaceName(String(payload.workspaceId || ""))}`
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

module.exports = {
  handleLegacyApprovalRequest,
};
