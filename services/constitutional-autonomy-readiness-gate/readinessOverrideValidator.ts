import type { ConstitutionalReadinessError } from "@/types/constitutional-autonomy-readiness-gate";
import type { OverrideContractRecord } from "@/services/human-override-contract";
import { createReadinessError } from "./readinessErrors";

export function validateReadinessOverride(
  overrideContract: OverrideContractRecord,
): Readonly<{
  overrideValid: boolean;
  reasons: readonly string[];
  errors: readonly ConstitutionalReadinessError[];
}> {
  const overrideValid =
    overrideContract.lineage.entries.length > 0
    && !overrideContract.freezeState.active
    && !overrideContract.killSwitch
    && overrideContract.authority.every((authority) => authority.valid)
    && !overrideContract.errors.some((error) => error.code === "OVERRIDE_AUTHORITY_INVALID");

  return Object.freeze({
    overrideValid,
    reasons: Object.freeze(
      overrideValid ? ["Human override supremacy is reachable without active suppression state."] : ["Override state is active, invalid, or constitutionally blocking readiness."],
    ),
    errors: Object.freeze(
      overrideValid ? [] : [createReadinessError("AUTONOMY_OPERATOR_OVERRIDE", "Human override state prevents readiness certification.", "overrideContract")],
    ),
  });
}
