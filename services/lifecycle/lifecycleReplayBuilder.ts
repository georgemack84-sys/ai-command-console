import type { LifecycleReplayBinding, LifecycleTransitionRequest } from "@/types/lifecycle";
import { buildLifecycleHash } from "./lifecycleHasher";
import { createLifecycleError } from "./lifecycleBoundaryGuards";

export function buildLifecycleReplayBinding(request: LifecycleTransitionRequest): Readonly<{
  replayBinding: LifecycleReplayBinding;
  errors: readonly ReturnType<typeof createLifecycleError>[];
}> {
  const errors = [];
  const readinessCertificationHash = request.readinessGate.readinessHash;
  const proposalLineageHash = buildLifecycleHash("proposal-lineage-binding", request.proposal.lineage);
  const escalationLineageHash = buildLifecycleHash("escalation-lineage-binding", request.escalation.lineage);
  const correlationLineageHash = buildLifecycleHash("correlation-lineage-binding", request.correlationComputation.lineage);
  const coordinationLineageHash = buildLifecycleHash("coordination-lineage-binding", request.coordinationRecord.lineage);

  if (!request.readinessGate.replayBinding.valid) {
    errors.push(createLifecycleError(
      "LIFECYCLE_REPLAY_BINDING_MISSING",
      "Readiness replay binding must be valid before lifecycle progression can be reconstructed.",
      "readinessGate.replayBinding",
    ));
  }

  const replayBinding: LifecycleReplayBinding = Object.freeze({
    replayBindingId: buildLifecycleHash("lifecycle-replay-binding-id", {
      proposalId: request.proposal.proposalId,
      createdAt: request.createdAt,
    }),
    governanceSnapshotHash: request.proposal.governanceBinding.policySnapshotHash,
    readinessCertificationHash,
    proposalLineageHash,
    escalationLineageHash,
    correlationLineageHash,
    coordinationLineageHash,
    currentLifecycleHash: request.currentRecord.lifecycleHash,
    replaySnapshotHash: request.proposal.replayBinding.replaySnapshotHash,
    reconstructionHash: buildLifecycleHash("lifecycle-replay-reconstruction", {
      governanceSnapshotHash: request.proposal.governanceBinding.policySnapshotHash,
      readinessCertificationHash,
      proposalLineageHash,
      escalationLineageHash,
      correlationLineageHash,
      coordinationLineageHash,
      currentLifecycleHash: request.currentRecord.lifecycleHash,
      replaySnapshotHash: request.proposal.replayBinding.replaySnapshotHash,
    }),
    valid: request.proposal.replayBinding.valid
      && request.readinessGate.replayBinding.valid
      && request.escalation.replayBinding.valid
      && request.coordinationRecord.replayBinding.valid,
    createdAt: request.createdAt,
  });

  return Object.freeze({
    replayBinding,
    errors: Object.freeze(errors),
  });
}
