import type { LifecycleComputation } from "@/types/lifecycle";
import type { ProposalRecord } from "@/types/proposal-lifecycle-engine";
import type { GovernanceInspection } from "@/types/human-supremacy";
import { hashInterventionValue } from "@/services/human-supremacy/interventionHasher";

export function inspectGovernanceLineage(input: {
  coordinationId: string;
  proposal: ProposalRecord;
  lifecycle: LifecycleComputation;
}): GovernanceInspection {
  return Object.freeze({
    governanceLineageId: hashInterventionValue("governance-inspection-id", {
      coordinationId: input.coordinationId,
      governance: input.proposal.governanceBinding.governanceLineageHash,
    }),
    coordinationId: input.coordinationId,
    governanceSnapshotHash: input.lifecycle.record.replayBinding.governanceSnapshotHash,
    readinessHash: input.proposal.replayBinding.readinessHash,
    governanceVisible: true as const,
    inspectionHash: hashInterventionValue("governance-inspection", {
      coordinationId: input.coordinationId,
      governanceSnapshotHash: input.lifecycle.record.replayBinding.governanceSnapshotHash,
      readinessHash: input.proposal.replayBinding.readinessHash,
    }),
  });
}
