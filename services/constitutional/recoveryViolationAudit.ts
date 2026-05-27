// eslint-disable-next-line @typescript-eslint/no-require-imports
const { appendAuditEvent } = require("../auditTrail.js");

import type { ConstitutionalEnforcementAction } from "../decision/recoveryDecisionTypes";

function mapEventType(action: ConstitutionalEnforcementAction) {
  switch (action) {
    case "DENY":
      return "constitution.denied";
    case "FREEZE":
      return "constitution.freeze_enforced";
    case "CONTAIN":
      return "constitution.contained";
    case "ESCALATE":
      return "constitution.escalated";
    case "REQUIRE_APPROVAL":
      return "constitution.approval_required";
    default:
      return "constitution.denied";
  }
}

export function buildRecoveryViolationAudit(input: {
  executionId: string;
  constitutionalAction: ConstitutionalEnforcementAction;
  violations: string[];
  reasons: string[];
  evidence: string[];
  generatedAt: string;
}) {
  return {
    eventType: mapEventType(input.constitutionalAction),
    executionId: input.executionId,
    constitutionalAction: input.constitutionalAction,
    violations: input.violations,
    reasons: input.reasons,
    evidence: input.evidence,
    timestamp: input.generatedAt,
  };
}

export function appendRecoveryViolationAudit(input: Parameters<typeof buildRecoveryViolationAudit>[0]) {
  const record = buildRecoveryViolationAudit(input);
  return appendAuditEvent({
    actor: "system",
    type: record.eventType,
    message: `${record.eventType} for ${record.executionId}.`,
    payload: {
      executionId: record.executionId,
      constitutionalAction: record.constitutionalAction,
      violations: record.violations,
      reasons: record.reasons,
      evidence: record.evidence,
    },
  });
}
