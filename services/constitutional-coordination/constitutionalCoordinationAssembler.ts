import type {
  ConstitutionalCoordinationAuthorityContract,
  ConstitutionalCoordinationLineage,
  ConstitutionalCoordinationRecord,
  ConstitutionalCoordinationValidation,
  ConstitutionalEscalationBinding,
  ConstitutionalGovernanceBinding,
  ConstitutionalReplayBinding,
} from "@/types/constitutional-coordination";
import { hashConstitutionalCoordinationRecord } from "./deterministicCoordinationEngine";

export function assembleConstitutionalCoordinationRecord(input: {
  coordinationId: string;
  proposalId: string;
  governanceBinding: ConstitutionalGovernanceBinding;
  replayBinding: ConstitutionalReplayBinding;
  escalationBinding?: ConstitutionalEscalationBinding;
  authorityContract: ConstitutionalCoordinationAuthorityContract;
  coordinationState: ConstitutionalCoordinationRecord["coordinationState"];
  constitutionalCeilingLevel: ConstitutionalCoordinationRecord["constitutionalCeilingLevel"];
  chronology: ConstitutionalCoordinationLineage;
  validation: ConstitutionalCoordinationValidation;
  createdAt: string;
  warnings: readonly string[];
  errors: ConstitutionalCoordinationRecord["errors"];
}): ConstitutionalCoordinationRecord {
  const base = Object.freeze({
    coordinationId: input.coordinationId,
    proposalId: input.proposalId,
    governanceSnapshotId: input.governanceBinding.governanceSnapshotId,
    replaySnapshotId: input.replayBinding.replaySnapshotId,
    escalationSnapshotId: input.escalationBinding?.escalationSnapshotId,
    coordinationState: input.coordinationState,
    constitutionalCeilingLevel: input.constitutionalCeilingLevel,
    lineage: Object.freeze({
      governanceLineageId: input.governanceBinding.governanceLineageId,
      replayLineageId: input.replayBinding.replayLineageId,
      escalationLineageId: input.escalationBinding?.escalationLineageId,
    }),
    authorityContract: input.authorityContract,
    governanceBinding: input.governanceBinding,
    replayBinding: input.replayBinding,
    escalationBinding: input.escalationBinding,
    validation: input.validation,
    chronology: input.chronology,
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
    warnings: Object.freeze([...input.warnings]),
    errors: Object.freeze([...input.errors]),
    derivedOnly: true as const,
  });
  return Object.freeze({
    ...base,
    deterministicHash: hashConstitutionalCoordinationRecord(base),
  });
}
