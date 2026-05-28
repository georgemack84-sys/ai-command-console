"use strict";

function explainRecoveryVerification({ recoveryRequest, executionResult, verification }) {
  void executionResult;
  return {
    summary: `Recovery verification inspected request ${String(recoveryRequest?.recoveryRequestId || "unknown")} for execution ${String(recoveryRequest?.executionId || "unknown")}.`,
    outcome: String(verification?.outcome || "UNKNOWN"),
    confidence: Number(verification?.confidence || 0),
    reason: String(verification?.reason || "recovery_verification_ambiguous"),
    evidenceSummary: Array.isArray(verification?.evidence) ? verification.evidence.join(", ") : "",
    safetyNotes: [
      "D-12 verifies outcomes after recovery execution.",
      "D-12 does not approve, commit, or retry recovery.",
      "Manual review is recommended when verification is partial, failed, or unknown.",
    ],
  };
}

module.exports = {
  explainRecoveryVerification,
};
