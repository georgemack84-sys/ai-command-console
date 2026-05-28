import type {
  ProposalApproval,
  ProposalGovernanceBinding,
  ProposalHandoffPackage,
  ProposalLifecycleError,
  ProposalReplayBinding,
  ProposalSafeActionBinding,
  ProposalSnapshotBinding,
} from "@/types/proposal-lifecycle-engine";
import { hashProposalLifecycleValue } from "./proposalLifecycleHasher";

const FORBIDDEN_METADATA_KEYS = ["execute", "dispatch", "worker", "scheduler", "queue", "runtimeBridge"];

export function prepareProposalHandoff(input: {
  proposalId: string;
  missionId: string;
  executionId: string;
  resultingState: string;
  timestamp: string;
  governanceBinding: ProposalGovernanceBinding;
  replayBinding: ProposalReplayBinding;
  snapshotBinding: ProposalSnapshotBinding;
  safeActionBinding: ProposalSafeActionBinding;
  approval: ProposalApproval;
  metadata?: Readonly<Record<string, unknown>>;
}): { handoff?: ProposalHandoffPackage; errors: readonly ProposalLifecycleError[] } {
  const errors: ProposalLifecycleError[] = [];
  if (input.resultingState !== "prepared_handoff") {
    return { handoff: undefined, errors: Object.freeze(errors) };
  }
  if ((input.metadata ? Object.keys(input.metadata) : []).some((key) => FORBIDDEN_METADATA_KEYS.includes(key))) {
    errors.push({
      code: "PROPOSAL_EXECUTION_METADATA_FORBIDDEN",
      message: "Prepared handoff packaging may not contain execution or runtime metadata.",
      path: "metadata",
    });
    return { handoff: undefined, errors: Object.freeze(errors) };
  }

  const approvalHash = hashProposalLifecycleValue("proposal-handoff-approval", input.approval);
  const payload = Object.freeze({
    proposalId: input.proposalId,
    state: "prepared_handoff" as const,
    missionId: input.missionId,
    executionId: input.executionId,
    safeActionId: input.safeActionBinding.safeActionId,
    governanceDecisionHash: input.governanceBinding.governanceDecisionHash,
    replayReconstructionHash: input.replayBinding.reconstructionHash,
    snapshotLineageHash: input.snapshotBinding.snapshotLineageHash,
  });

  return {
    handoff: Object.freeze({
      handoffId: hashProposalLifecycleValue("proposal-handoff-id", {
        proposalId: input.proposalId,
        timestamp: input.timestamp,
        governanceHash: input.governanceBinding.governanceDecisionHash,
      }),
      proposalId: input.proposalId,
      preparedAt: input.timestamp,
      packageType: "governance_only",
      governanceHash: input.governanceBinding.governanceDecisionHash,
      replayHash: input.replayBinding.reconstructionHash,
      snapshotLineageHash: input.snapshotBinding.snapshotLineageHash,
      safeActionHash: input.safeActionBinding.safeActionHash,
      approvalHash,
      executionPayloadIncluded: false,
      runtimeInstructionsIncluded: false,
      schedulerMetadataIncluded: false,
      workerMetadataIncluded: false,
      dispatchMetadataIncluded: false,
      payload,
    }),
    errors: Object.freeze(errors),
  };
}
