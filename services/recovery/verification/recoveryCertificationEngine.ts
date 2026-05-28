import type { RecoveryCertificationDecision, TruthReconciliationResult } from "./recoveryVerificationTypes";

export function certifyRecoveryTruth({
  reconciliationState,
  replayConsistent,
  governanceConsistent,
  continuityConsistent,
  immutableEvidenceValid,
  disputed,
  divergenceDetected,
  warnings = [],
}: Pick<
  TruthReconciliationResult,
  | "reconciliationState"
  | "replayConsistent"
  | "governanceConsistent"
  | "continuityConsistent"
  | "immutableEvidenceValid"
  | "disputed"
  | "divergenceDetected"
> & {
  warnings?: string[];
}) {
  let decision: RecoveryCertificationDecision;

  if (!immutableEvidenceValid || !governanceConsistent) {
    decision = "REJECTED";
  } else if (divergenceDetected || reconciliationState === "DIVERGED") {
    decision = "QUARANTINED";
  } else if (reconciliationState === "UNVERIFIABLE") {
    decision = "REJECTED";
  } else if (disputed || reconciliationState === "DISPUTED") {
    decision = "REQUIRES_OPERATOR_REVIEW";
  } else if (!continuityConsistent || warnings.length > 0 || reconciliationState === "PARTIALLY_RECONCILED") {
    decision = "CERTIFIED_WITH_WARNINGS";
  } else if (replayConsistent && governanceConsistent && continuityConsistent && reconciliationState === "RECONCILED") {
    decision = "CERTIFIED";
  } else {
    decision = "ESCALATED";
  }

  return {
    decision,
    continuationAllowed: decision === "CERTIFIED" || decision === "CERTIFIED_WITH_WARNINGS",
    requiresOperatorReview: decision === "REQUIRES_OPERATOR_REVIEW",
  };
}
