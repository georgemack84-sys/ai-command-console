import type { ConstitutionalReadinessError } from "@/types/constitutional-autonomy-readiness-gate";
import type { ConstitutionalGovernanceView } from "@/types/constitutional-governance";
import { createReadinessError } from "./readinessErrors";

export function validateReadinessGovernance(governanceView: ConstitutionalGovernanceView): Readonly<{
  governanceValid: boolean;
  reasons: readonly string[];
  errors: readonly ConstitutionalReadinessError[];
}> {
  const governanceValid =
    governanceView.state !== "DENY"
    && governanceView.policy.failClosed === true
    && governanceView.policy.unknownAuthorityDisposition === "DENY"
    && governanceView.errors.length === 0
    && governanceView.violations.length === 0
    && governanceView.decisions.every((decision) => !decision.disputed);

  return Object.freeze({
    governanceValid,
    reasons: Object.freeze(
      governanceValid
        ? ["Governance completeness and fail-closed posture are intact."]
        : ["Governance state is denied, disputed, or incomplete."],
    ),
    errors: Object.freeze(
      governanceValid
        ? []
        : [createReadinessError(
            governanceView.state === "DENY" ? "AUTONOMY_POLICY_DENIED" : "AUTONOMY_GOVERNANCE_MISMATCH",
            "Autonomy readiness requires constitutional governance completeness.",
            "governanceView",
          )],
    ),
  });
}
