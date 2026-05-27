import type { ConstitutionalGovernanceBinding, ConstitutionalCoordinationError } from "@/types/constitutional-coordination";
import { createConstitutionalCoordinationError } from "@/services/constitutional-coordination/coordinationBoundaryEnforcer";

export function bindConstitutionalPolicy(binding: ConstitutionalGovernanceBinding): readonly ConstitutionalCoordinationError[] {
  if (binding.valid) {
    return Object.freeze([]);
  }
  return Object.freeze([
    createConstitutionalCoordinationError(
      "CONSTITUTIONAL_COORDINATION_GOVERNANCE_MISMATCH",
      "Governance binding is invalid or disputed.",
      "governanceBinding.valid",
    ),
  ]);
}
