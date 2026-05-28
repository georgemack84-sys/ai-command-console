import type { AuthorityBoundaryError, ConstitutionalAuthorityBoundaryInput } from "./authorityBoundaryTypes";
import { normalizeAuthorityMetadata } from "./authorityBoundarySchemas";

export function validateGovernanceSupremacy(input: ConstitutionalAuthorityBoundaryInput): readonly AuthorityBoundaryError[] {
  const errors: AuthorityBoundaryError[] = [];
  const gate = input.controlledAutonomyReadinessGateResult;
  const normalized = normalizeAuthorityMetadata(input.metadata);

  if (gate.record.certificationState === "FROZEN" || gate.record.certificationState === "INVALID") {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_AUTHORITY_GOVERNANCE_MISSING",
      message: "Governance-certified readiness is frozen or invalid, so authority cannot be preserved.",
      path: "controlledAutonomyReadinessGateResult.record.certificationState",
    }));
  }
  if (normalized.includes("governancebypass") || normalized.includes("governancesuppression") || normalized.includes("missinggovernancelineage")) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_AUTHORITY_GOVERNANCE_MISSING",
      message: "Governance bypass, suppression, or lineage disappearance markers were detected.",
      path: "metadata",
    }));
  }
  return Object.freeze(errors);
}
