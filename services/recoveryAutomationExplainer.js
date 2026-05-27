"use strict";

function explainAutomationDecision({ advisory, policy, throttle }) {
  return {
    summary: `Automation reviewed recovery advisory for execution ${String(advisory?.executionId || "unknown")}.`,
    actionTaken: String(policy?.action || "block"),
    reason: String(policy?.reason || throttle?.reason || "automation_blocked"),
    safetyNotes: [
      "D-9 is a controlled automation layer only.",
      "Any real recovery request still routes through D-8 and D-7.",
      "D-9 does not approve or commit recovery.",
    ],
  };
}

module.exports = {
  explainAutomationDecision,
};
