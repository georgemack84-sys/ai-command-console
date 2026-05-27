"use strict";

const { buildRecoveryPlan } = require("./recoveryPlanBuilder");
const { previewRecoveryPlan } = require("./recoveryPreview");
const { commitRecoveryPlan } = require("./recoveryCommitter");
const { createRecoveryPlanHash } = require("./recoveryPlanHash");
const { evaluateRecoveryPolicy } = require("./recoveryPolicyEngine");
const { validateApproval } = require("./recoveryApprovalGate");
const auditStore = require("./recoveryAuditStore");

function success(data) {
  return { ok: true, data };
}

function failure(message, details = {}) {
  return { ok: false, error: "BLOCKED_UNSAFE_RECOVERY", message: String(message || "Recovery operation blocked."), ...details };
}

function createRecoveryRequestId() {
  return `recovery_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function requestRecovery({ executionId, recoveryMode, requestedBy }) {
  const normalizedExecutionId = String(executionId || "").trim();
  const normalizedRequestedBy = String(requestedBy || "").trim() || "operator";
  if (!normalizedExecutionId || !String(recoveryMode || "").trim()) {
    return failure("Recovery request requires executionId and recoveryMode.");
  }

  const existing = auditStore.findActiveRecoveryForExecution(normalizedExecutionId);
  if (existing) {
    return failure("Only one active recovery request is allowed per execution.", {
      recoveryRequestId: existing.recoveryRequestId,
    });
  }

  const built = await buildRecoveryPlan({
    executionId: normalizedExecutionId,
    recoveryMode,
  });
  if (!built.ok) {
    return failure(built.message || "Recovery plan could not be built.", {
      code: built.code,
    });
  }

  const planHash = createRecoveryPlanHash(built.data);
  if (!planHash.ok) {
    return failure(planHash.message || "Recovery plan hash could not be created.", {
      code: planHash.code,
    });
  }

  const recoveryRequestId = createRecoveryRequestId();
  auditStore.recordRecoveryRequest({
    recoveryRequestId,
    executionId: normalizedExecutionId,
    recoveryMode,
    requestedBy: normalizedRequestedBy,
    plan: built.data,
    planHash: planHash.data,
  });

  return success({
    recoveryRequestId,
    executionId: normalizedExecutionId,
    recoveryMode: String(recoveryMode),
    status: "REQUESTED",
  });
}

async function previewRecovery({ recoveryRequestId }) {
  const request = auditStore.getRecoveryRequest(recoveryRequestId);
  if (!request) {
    return failure("Recovery request was not found.");
  }

  const preview = previewRecoveryPlan({ plan: request.plan });
  if (!preview.ok) {
    return failure(preview.message || "Recovery preview failed.", { code: preview.code });
  }

  const policy = evaluateRecoveryPolicy({
    plan: request.plan,
    preview: preview.data,
    modes: {},
    requestedBy: request.requestedBy,
  });

  auditStore.recordPreview({
    recoveryRequestId: request.recoveryRequestId,
    executionId: request.executionId,
    preview: preview.data,
    requestedBy: request.requestedBy,
  });
  auditStore.recordPolicyDecision({
    recoveryRequestId: request.recoveryRequestId,
    executionId: request.executionId,
    policy,
    requestedBy: request.requestedBy,
  });

  return success({
    recoveryRequestId: request.recoveryRequestId,
    executionId: request.executionId,
    status: policy.allowed ? (policy.requiresApproval ? "AWAITING_APPROVAL" : "PREVIEWED") : "BLOCKED",
    preview: preview.data,
    policy,
  });
}

async function approveRecovery({ recoveryRequestId, approvedBy }) {
  const request = auditStore.getRecoveryRequest(recoveryRequestId);
  const validation = validateApproval({ request, approvedBy });
  if (!validation.ok) {
    return failure(validation.message);
  }

  auditStore.recordApproval({
    recoveryRequestId: request.recoveryRequestId,
    executionId: request.executionId,
    approvedBy: validation.data.approvedBy,
  });

  return success({
    recoveryRequestId: request.recoveryRequestId,
    executionId: request.executionId,
    status: "APPROVED",
  });
}

async function commitRecovery({ recoveryRequestId, requestedBy, dryRun = false }) {
  const request = auditStore.getRecoveryRequest(recoveryRequestId);
  if (!request) {
    return failure("Recovery request was not found.");
  }

  if (!dryRun && request.policy?.requiresApproval && request.status !== "APPROVED") {
    return failure("Recovery approval is required before commit.");
  }

  if (!request.preview?.staleToken) {
    return failure("Recovery preview is required before commit.");
  }

  auditStore.recordCommitAttempt({
    recoveryRequestId: request.recoveryRequestId,
    executionId: request.executionId,
    requestedBy: String(requestedBy || "").trim() || "operator",
    dryRun,
  });

  const result = await commitRecoveryPlan({
    plan: {
      ...request.plan,
      staleToken: request.preview.staleToken,
    },
    requestedBy: String(requestedBy || "").trim() || "operator",
    dryRun: Boolean(dryRun),
  });

  if (dryRun) {
    return result.ok ? success(result.data) : failure(result.message || "Recovery dry-run failed.", { code: result.code });
  }

  auditStore.recordCommitResult({
    recoveryRequestId: request.recoveryRequestId,
    executionId: request.executionId,
    requestedBy: String(requestedBy || "").trim() || "operator",
    result,
  });

  if (!result.ok) {
    return failure(result.message || "Recovery commit failed.", { code: result.code });
  }

  return success(result.data);
}

async function cancelRecovery({ recoveryRequestId }) {
  const request = auditStore.getRecoveryRequest(recoveryRequestId);
  if (!request) {
    return failure("Recovery request was not found.");
  }

  auditStore.recordCancellation({
    recoveryRequestId: request.recoveryRequestId,
    executionId: request.executionId,
  });

  return success({
    recoveryRequestId: request.recoveryRequestId,
    executionId: request.executionId,
    status: "CANCELLED",
  });
}

module.exports = {
  approveRecovery,
  cancelRecovery,
  commitRecovery,
  previewRecovery,
  requestRecovery,
};
