import type {
  AttackEvidenceRecord,
  ConstitutionalAttackEngineInput,
  DependencyAttackInspection,
  EscalationAttackInspection,
  GovernanceAttackInspection,
  ReplayAttackInspection,
} from "@/types/constitutional-attack-engine";
import { hashConstitutionalAttackValue } from "./deterministicAttackHasher";

export function buildAttackEvidence(input: {
  attackInput: ConstitutionalAttackEngineInput;
  governanceInspection: GovernanceAttackInspection;
  escalationInspection: EscalationAttackInspection;
  dependencyInspection: DependencyAttackInspection;
  replayInspection: ReplayAttackInspection;
  reasons: readonly string[];
}): AttackEvidenceRecord {
  const base = Object.freeze({
    attackId: input.attackInput.attackId,
    coordinationId: input.attackInput.coordinationRecord.coordinationId,
    readinessCertificationId: input.attackInput.readinessResult.record.certificationId,
    governanceSnapshotId: input.attackInput.coordinationRecord.governanceSnapshotId,
    replaySnapshotId: input.attackInput.coordinationRecord.replaySnapshotId,
    escalationSnapshotId: input.attackInput.coordinationRecord.escalationSnapshotId,
    certificationLineageId: input.attackInput.readinessResult.lineage.lineageId,
    boundaryLineageId: input.attackInput.boundaryResult.lineage.lineageId,
    reasons: Object.freeze([...input.reasons]),
  });

  return Object.freeze({
    evidenceId: hashConstitutionalAttackValue("evidence-id", base),
    ...base,
    evidenceHash: hashConstitutionalAttackValue("evidence", {
      ...base,
      governanceInspectionHash: input.governanceInspection.inspectionHash,
      escalationInspectionHash: input.escalationInspection.inspectionHash,
      dependencyInspectionHash: input.dependencyInspection.inspectionHash,
      replayInspectionHash: input.replayInspection.inspectionHash,
    }),
  });
}
