"use strict";

function explainRecoveryExecutionDecision({ recoveryRequest, policy, gate, commitResult }) {
  const actionTaken = commitResult?.ok
    ? "committed"
    : commitResult == null
      ? "skipped"
      : String(commitResult.code || "") === "STALE_RECOVERY_PLAN"
        ? "blocked"
        : "failed";

  return {
    summary: `Recovery execution orchestration evaluated request ${String(recoveryRequest?.recoveryRequestId || recoveryRequest?.executionId || "unknown")} for execution ${String(recoveryRequest?.executionId || "unknown")}.`,
    actionTaken,
    reason: String(policy?.reason || gate?.reason || commitResult?.message || "execution_blocked"),
    safetyNotes: [
      "D-11 only orchestrates approved recovery execution.",
      "D-7 remains the commit entrypoint.",
      "D-6 remains the final commit safety boundary.",
    ],
  };
}

module.exports = {
  explainRecoveryExecutionDecision,
};
