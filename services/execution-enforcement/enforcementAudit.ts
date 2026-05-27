import { hashStableContent } from "@/services/planning/versioning/stable-content-hasher";
import type { ExecutionEnforcementDecision, EnforcementAuditRecord } from "./enforcementTypes";

export function buildExecutionEnforcementAudit(decision: ExecutionEnforcementDecision): EnforcementAuditRecord {
  const base: Omit<EnforcementAuditRecord, "eventHash"> = {
    eventType: "execution.enforcement.decision",
    toolId: decision.toolId,
    toolVersion: decision.toolVersion,
    decision: decision.decision,
    reasonCode: decision.reasonCode,
    evidenceHash: decision.evidenceHash,
    violationCodes: decision.violations.map((violation) => violation.reasonCode).sort(),
  };

  return {
    ...base,
    eventHash: hashStableContent(
      "EVIDENCE_BUNDLE",
      Object.fromEntries(Object.entries(base).filter(([, value]) => value !== undefined)),
    ),
  };
}
