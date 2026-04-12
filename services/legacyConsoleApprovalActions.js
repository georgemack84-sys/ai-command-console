const {
  approveApprovalRequest,
  rejectApprovalRequest,
  rerouteApprovalRequest,
  rerouteBulkApprovalRequests,
} = require("./legacyConsoleApprovalTransitionSupport");
const {
  buildApprovalTelemetryMeta,
  executeApprovedAction,
  buildBulkApprovalOutput,
  buildSingleApprovalOutput,
} = require("./legacyConsoleApprovalExecutionSupport");

async function handleLegacyApprovalAction({
  action,
  payload = {},
  options = {},
  actor,
  governance,
  startedAt,
  deps,
}) {
  const {
    getApprovalRequest,
    recordTelemetry,
    canActorHandleApproval,
    resolveApprovalRequest,
    closeIncidentApprovalReminderHandoffs,
    appendDigestWorkspaceEvent,
    appendAuditEvent,
    executeAction,
    finalizeRecoveredTrustIncidentCloseout,
    finalizeArchivedTrustIncident,
    reroutePendingApproval,
    loadCollaborationState,
    buildOverview,
  } = deps;

  if (action === "approval:approve") {
    const approvalId = String(payload.approvalId || "");
    const decision = approveApprovalRequest(approvalId, actor, governance, {
      getApprovalRequest,
      canActorHandleApproval,
      resolveApprovalRequest,
      closeIncidentApprovalReminderHandoffs,
      appendDigestWorkspaceEvent,
      appendAuditEvent,
    });
    if (!decision.ok) {
      recordTelemetry({
        type: action,
        status: "error",
        durationMs: Date.now() - startedAt,
        actorId: actor.id,
        meta: buildApprovalTelemetryMeta({ approvalId }, { reason: decision.reason, status: decision.status }),
      });
      return { ok: false, error: decision.error, overview: buildOverview(options) };
    }
    const { request } = decision;
    const result = await executeApprovedAction(request, actor, options, {
      executeAction,
      finalizeRecoveredTrustIncidentCloseout,
      finalizeArchivedTrustIncident,
    });
    recordTelemetry({
      type: action,
      status: result.ok ? "ok" : "error",
      durationMs: Date.now() - startedAt,
      actorId: actor.id,
      meta: buildApprovalTelemetryMeta({ approvalId }, { action: request.action }),
    });
    return request.action === "collaboration:automation-set-status" && request.payload?.workspaceId
      ? { ...result, overview: buildOverview(options) }
      : result;
  }

  if (
    action === "approval:reassign-target" ||
    action === "approval:take-over" ||
    action === "approval:bulk-reassign-target" ||
    action === "approval:bulk-take-over"
  ) {
    if (action === "approval:bulk-reassign-target" || action === "approval:bulk-take-over") {
      const result = rerouteBulkApprovalRequests(action, payload, actor, {
        loadCollaborationState,
        reroutePendingApproval,
      });
      if (!result.ok) {
        recordTelemetry({
          type: action,
          status: "error",
          durationMs: Date.now() - startedAt,
          actorId: actor.id,
          meta: buildApprovalTelemetryMeta({}, { reason: result.reason }),
        });
        return { ok: false, error: result.error, overview: buildOverview(options) };
      }
      const { currentTarget, nextTarget, touched } = result;
      recordTelemetry({
        type: action,
        status: "ok",
        durationMs: Date.now() - startedAt,
        actorId: actor.id,
        meta: { currentTarget, nextTarget, count: touched.length },
      });
      return {
        ok: true,
        output: buildBulkApprovalOutput(action, currentTarget, nextTarget, touched.length),
        overview: buildOverview(options),
      };
    }

    const approvalId = String(payload.approvalId || "");
    const result = rerouteApprovalRequest(approvalId, action, payload, actor, {
      getApprovalRequest,
      reroutePendingApproval,
    });
    if (!result.ok) {
      recordTelemetry({
        type: action,
        status: "error",
        durationMs: Date.now() - startedAt,
        actorId: actor.id,
        meta: buildApprovalTelemetryMeta({ approvalId }, { reason: result.reason, status: result.status }),
      });
      return { ok: false, error: result.error, overview: buildOverview(options) };
    }
    recordTelemetry({ type: action, status: "ok", durationMs: Date.now() - startedAt, actorId: actor.id, meta: { approvalId, approverTarget: result.nextTarget } });
    return {
      ok: true,
      output: buildSingleApprovalOutput(action, approvalId, result.nextTarget),
      overview: buildOverview(options),
    };
  }

  if (action === "approval:reject") {
    const approvalId = String(payload.approvalId || "");
    const result = rejectApprovalRequest(approvalId, actor, governance, payload.note, {
      getApprovalRequest,
      canActorHandleApproval,
      resolveApprovalRequest,
      closeIncidentApprovalReminderHandoffs,
      appendDigestWorkspaceEvent,
      appendAuditEvent,
    });
    if (!result.ok) {
      recordTelemetry({
        type: action,
        status: "error",
        durationMs: Date.now() - startedAt,
        actorId: actor.id,
        meta: buildApprovalTelemetryMeta({ approvalId }, { reason: result.reason, status: result.status }),
      });
      return { ok: false, error: result.error, overview: buildOverview(options) };
    }
    recordTelemetry({ type: action, status: "ok", durationMs: Date.now() - startedAt, actorId: actor.id, meta: { approvalId } });
    return { ok: true, output: `Rejected approval request ${approvalId}.`, overview: buildOverview(options) };
  }

  return null;
}

module.exports = {
  handleLegacyApprovalAction,
};
