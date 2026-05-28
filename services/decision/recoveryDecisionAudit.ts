// eslint-disable-next-line @typescript-eslint/no-require-imports
const { appendAuditEvent } = require("../auditTrail.js");

import type { RecoveryDecisionIntelligenceResult } from "./recoveryDecisionTypes";

export function buildRecoveryDecisionAudit(result: RecoveryDecisionIntelligenceResult) {
  return {
    eventType: result.constitutionallyAllowed ? "decision.generated" : "decision.blocked",
    executionId: result.executionId,
    recommendedAction: result.recommendedAction,
    constitutionalAction: result.constitutionalAction,
    reasons: result.reasons,
    blockedReasons: result.blockedReasons,
    timestamp: result.generatedAt,
  };
}

export function appendRecoveryDecisionAudit(result: RecoveryDecisionIntelligenceResult) {
  const record = buildRecoveryDecisionAudit(result);
  return appendAuditEvent({
    actor: "system",
    type: record.eventType,
    message: `${record.eventType} for ${record.executionId}.`,
    payload: record,
  });
}
