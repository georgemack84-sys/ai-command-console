"use strict";

function explainAutonomyDecision({ recoveryRequest, policy, riskScore, gate }) {
  return {
    summary: `Recovery autonomy evaluated request ${String(recoveryRequest?.recoveryRequestId || recoveryRequest?.executionId || "unknown")}.`,
    actionTaken: String(policy?.action || "block"),
    riskSummary: `Risk level ${String(riskScore?.riskLevel || "UNKNOWN")} with score ${Number(riskScore?.score || 0).toFixed(2)}.`,
    reason: String(policy?.reason || gate?.reason || "autonomy_blocked"),
    safetyNotes: [
      "D-10 never commits recovery directly.",
      "Any approval must still route through D-7.",
      "D-6 remains the only recovery commit boundary.",
    ],
  };
}

module.exports = {
  explainAutonomyDecision,
};
