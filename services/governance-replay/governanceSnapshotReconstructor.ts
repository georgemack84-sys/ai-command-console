import type { CoordinationReplayInput, GovernanceReplayView } from "@/types/coordination-replay";

export function reconstructGovernanceSnapshot(input: CoordinationReplayInput): GovernanceReplayView {
  const binding = input.coordinationRecord.governanceBinding;
  return Object.freeze({
    governanceSnapshotId: binding.governanceSnapshotId,
    governanceSnapshotHash: binding.governanceSnapshotHash,
    governanceLineageId: binding.governanceLineageId,
    readinessHash: binding.readinessHash,
    valid: binding.valid,
    bindingHash: binding.bindingHash,
  });
}
