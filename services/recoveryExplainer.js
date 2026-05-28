"use strict";

function failure(code, message, details = {}) {
  return {
    ok: false,
    code: String(code || "INVALID_RECOVERY_EXPLANATION"),
    message: String(message || "Recovery explanation failed."),
    ...details,
  };
}

function success(data) {
  return {
    ok: true,
    data,
  };
}

/**
 * @param {object} plan
 * @returns {{ ok: false, code: string, message: string } | { ok: true, data: object }}
 */
function explainRecoveryPlan(plan) {
  if (!plan || typeof plan !== "object") {
    return failure("INVALID_RECOVERY_PLAN", "Recovery plan object is required to build an explanation.");
  }

  const checkpoint = plan.checkpoint || null;
  const nextStep = plan.nextStep || null;
  const preflight = plan?.source?.preflight || null;

  return success({
    summary: `Recovery preview for ${String(plan.executionId || "unknown")} in mode ${String(plan.recoveryMode || "unknown")}.`,
    checkpointStatus: checkpoint?.status || null,
    nextStepId: nextStep?.id || null,
    nextStepSequence: nextStep?.sequence == null ? null : Number(nextStep.sequence),
    eligible: Boolean(preflight?.eligible),
    reason: preflight?.message || null,
  });
}

module.exports = {
  explainRecoveryPlan,
};
