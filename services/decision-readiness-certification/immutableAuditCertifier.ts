import { verifyImmutableLedgerChain } from "@/services/audit/immutableAuditLedger";
import type { DecisionReadinessCertificationInput, DecisionReadinessCertificationError } from "./types/decisionReadinessCertificationTypes";

export function certifyImmutableAudit(input: DecisionReadinessCertificationInput): readonly DecisionReadinessCertificationError[] {
  const chainsValid =
    verifyImmutableLedgerChain([...input.deterministicReplayResult.auditLedger])
    && verifyImmutableLedgerChain([...input.decisionAuditEpisodeResult.auditLedger])
    && verifyImmutableLedgerChain([...input.constitutionalTransitionResult.auditLedger])
    && verifyImmutableLedgerChain([...input.operatorAuthorityResult.auditLedger])
    && verifyImmutableLedgerChain([...input.hiddenExecutionDetectionResult.auditLedger]);
  return chainsValid
    ? Object.freeze([])
    : Object.freeze([{
      code: "DECISION_READINESS_AUDIT_CORRUPTION" as const,
      message: "Immutable audit chain verification failed.",
      path: "auditLedger",
    }]);
}
