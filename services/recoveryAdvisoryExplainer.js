"use strict";

function success(data) {
  return { ok: true, data };
}

function failure(message) {
  return { ok: false, error: "BLOCKED_UNSAFE_RECOVERY_ADVISORY", message: String(message || "Recovery advisory explanation blocked.") };
}

function explainRecoveryAdvisory({ candidate, signal, recommendation }) {
  if (!candidate || !signal || !recommendation) {
    return failure("Candidate, signal, and recommendation are required.");
  }

  const signalType = String(signal.signalType || "UNKNOWN");
  const action = String(recommendation.recommendation || "none");
  const requiresOperator = Boolean(recommendation.requiresOperator);

  return success({
    summary: `D-8 advisory only: execution ${String(candidate.executionId || "unknown")} produced a ${signalType} signal.`,
    evidenceSummary: `Signal ${signalType} was detected with ${String(signal.severity || "UNKNOWN")} severity and confidence ${Number(signal.confidence || 0).toFixed(2)}.`,
    recommendedAction: action,
    operatorWarning: requiresOperator
      ? "Operator approval is required through D-7 before any recovery can proceed."
      : "This remains advisory only. Any real recovery must still route through D-7 and D-6.",
    safetyNotes: action === "none"
      ? [
          "No recovery action is recommended.",
          "D-8 does not approve or commit recovery.",
        ]
      : [
          "D-8 never commits recovery directly.",
          "D-7 controls approval, audit, and lifecycle state.",
          "D-6 remains the only recovery mutation path.",
        ],
  });
}

module.exports = {
  explainRecoveryAdvisory,
};
