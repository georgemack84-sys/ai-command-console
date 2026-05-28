import type { ConstitutionalEscalationError } from "@/types/constitutional-escalation-layer";
import type { ConstitutionalGovernanceView } from "@/types/constitutional-governance";
import { createEscalationError } from "./escalationErrors";

export function validateEscalationPolicy(governanceView: ConstitutionalGovernanceView): Readonly<{
  policyMismatch: boolean;
  errors: readonly ConstitutionalEscalationError[];
}> {
  const policyMismatch =
    governanceView.state !== "ALLOW"
    || governanceView.violations.length > 0
    || governanceView.decisions.some((decision) => decision.disputed || decision.outcome !== "ALLOW");

  return Object.freeze({
    policyMismatch,
    errors: Object.freeze(
      policyMismatch
        ? [createEscalationError("ESCALATION_POLICY_MISMATCH", "Governance policy state requires escalated oversight.", "governanceView")]
        : [],
    ),
  });
}
