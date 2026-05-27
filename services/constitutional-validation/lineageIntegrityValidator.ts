import type {
  ConstitutionalCoordinationError,
  ConstitutionalEscalationBinding,
  ConstitutionalGovernanceBinding,
  ConstitutionalReplayBinding,
} from "@/types/constitutional-coordination";
import { createConstitutionalCoordinationError } from "@/services/constitutional-coordination/coordinationBoundaryEnforcer";

export function validateLineageIntegrity(input: {
  governanceBinding: ConstitutionalGovernanceBinding;
  replayBinding: ConstitutionalReplayBinding;
  escalationBinding?: ConstitutionalEscalationBinding;
}): readonly ConstitutionalCoordinationError[] {
  const errors: ConstitutionalCoordinationError[] = [];
  if (!input.governanceBinding.governanceLineageId) {
    errors.push(createConstitutionalCoordinationError(
      "CONSTITUTIONAL_COORDINATION_LINEAGE_CORRUPTION",
      "Governance lineage id is missing.",
      "governanceBinding.governanceLineageId",
    ));
  }
  if (!input.replayBinding.replayLineageId) {
    errors.push(createConstitutionalCoordinationError(
      "CONSTITUTIONAL_COORDINATION_LINEAGE_CORRUPTION",
      "Replay lineage id is missing.",
      "replayBinding.replayLineageId",
    ));
  }
  if (input.escalationBinding && !input.escalationBinding.escalationLineageId) {
    errors.push(createConstitutionalCoordinationError(
      "CONSTITUTIONAL_COORDINATION_LINEAGE_CORRUPTION",
      "Escalation lineage id is missing.",
      "escalationBinding.escalationLineageId",
    ));
  }
  return Object.freeze(errors);
}
