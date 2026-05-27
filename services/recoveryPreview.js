"use strict";

const { classifyReplayCandidate } = require("./recoveryReplayClassifier");
const { createRecoveryPlanHash } = require("./recoveryPlanHash");
const { explainRecoveryPlan } = require("./recoveryExplainer");

function failure(code, message, details = {}) {
  return {
    ok: false,
    code: String(code || "INVALID_RECOVERY_PREVIEW"),
    message: String(message || "Recovery preview failed."),
    ...details,
  };
}

function success(data) {
  return {
    ok: true,
    data,
  };
}

function getCandidateSteps(plan) {
  const checkpoint = plan?.checkpoint || null;
  const recoveredPlanSteps = Array.isArray(plan?.recoveredPlan?.steps) ? plan.recoveredPlan.steps : [];
  const currentStepIndex = Number.isFinite(Number(checkpoint?.currentStep)) ? Number(checkpoint.currentStep) : 0;

  return recoveredPlanSteps.filter((step) => Number(step.sequence || 0) - 1 >= currentStepIndex);
}

/**
 * @param {{ plan: object, db?: object }} input
 * @returns {{ ok: false, code: string, message: string } | { ok: true, data: object }}
 */
function previewRecoveryPlan(input) {
  if (!input || typeof input !== "object") {
    return failure("INVALID_RECOVERY_PREVIEW_INPUT", "Recovery preview input is required.");
  }

  if (!input.plan || typeof input.plan !== "object") {
    return failure("INVALID_RECOVERY_PLAN", "Recovery plan object is required for preview.");
  }

  const plan = input.plan;
  const hash = createRecoveryPlanHash(plan);
  if (!hash.ok) {
    return failure(hash.code, hash.message, {
      staleToken: null,
    });
  }

  const explanation = explainRecoveryPlan(plan);
  if (!explanation.ok) {
    return failure(explanation.code, explanation.message, {
      staleToken: hash.data,
    });
  }

  const ledgerEvents = Array.isArray(plan?.source?.ledgerEvents) ? plan.source.ledgerEvents : [];
  const replayCandidates = getCandidateSteps(plan).map((step) => {
    const classification = classifyReplayCandidate({
      stepRow: {
        id: String(step.id || ""),
        status: step.status || "pending",
        isIdempotent: Boolean(step?.metadata?.idempotent),
        idempotencyClass: step?.metadata?.idempotent ? "safe_repeat" : "unknown",
        idempotencyKey: step?.metadata?.idempotencyKey || null,
        sideEffects: Array.isArray(step?.metadata?.sideEffects) ? step.metadata.sideEffects : [],
      },
      ledgerEvents,
    });

    return {
      stepId: String(step.id || ""),
      sequence: Number(step.sequence || 0),
      classification: classification.ok ? classification.data.classification : "REQUIRES_OPERATOR",
      reason: classification.ok ? classification.data.reason : classification.message,
    };
  });

  const blocked = replayCandidates.some((candidate) =>
    ["CORRUPTED", "UNSAFE_REPLAY", "REQUIRES_OPERATOR"].includes(String(candidate.classification || ""))
  );

  return success({
    executionId: String(plan.executionId || ""),
    planId: String(plan.planId || ""),
    recoveryMode: String(plan.recoveryMode || ""),
    staleToken: hash.data,
    explanation: explanation.data,
    replayCandidates,
    blocked,
    nextStep: plan.nextStep || null,
  });
}

module.exports = {
  previewRecoveryPlan,
};
