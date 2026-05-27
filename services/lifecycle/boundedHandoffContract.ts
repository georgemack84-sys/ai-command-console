import type { BoundedHandoffContractRecord, LifecycleLineageLedger, LifecycleReplayBinding, LifecycleTransitionRequest } from "@/types/lifecycle";
import { buildLifecycleHash } from "./lifecycleHasher";

export function buildBoundedHandoffContract(input: {
  request: LifecycleTransitionRequest;
  replayBinding: LifecycleReplayBinding;
  lineage: LifecycleLineageLedger;
}): BoundedHandoffContractRecord {
  return Object.freeze({
    handoffId: buildLifecycleHash("bounded-handoff-id", {
      proposalId: input.request.proposal.proposalId,
      createdAt: input.request.createdAt,
    }),
    proposalId: input.request.proposal.proposalId,
    lifecycleState: "bounded_handoff",
    governanceSnapshotHash: input.request.proposal.governanceBinding.policySnapshotHash,
    replayBindingHash: input.replayBinding.reconstructionHash,
    lifecycleLineageHash: input.lineage.lineageHash,
    executionAuthorized: false,
    orchestrationAuthorized: false,
    schedulingAuthorized: false,
    dispatchAuthorized: false,
    createdAt: input.request.createdAt,
    handoffHash: buildLifecycleHash("bounded-handoff-contract", {
      proposalId: input.request.proposal.proposalId,
      replayBindingHash: input.replayBinding.reconstructionHash,
      lifecycleLineageHash: input.lineage.lineageHash,
      createdAt: input.request.createdAt,
    }),
  });
}
