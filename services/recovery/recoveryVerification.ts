import type { FailureClassification } from "../failure/failureClassifier";
import type { FailureRecoveryMapping } from "../failure/failureRecoveryMapping";

export function buildRecoveryVerificationRequirements({
  classification,
  mapping,
}: {
  classification: FailureClassification;
  mapping: FailureRecoveryMapping;
}) {
  return {
    required: true,
    checks: [
      "evidence_consistency",
      "ledger_consistency",
      "replay_safety",
      ...(classification.category === "lease expiration" ? ["lease_validity"] : []),
      ...(classification.category === "approval expiration" ? ["approval_renewed"] : []),
      ...(mapping.quarantineRequired ? ["containment_confirmed"] : []),
    ],
  };
}
