import { hashProposalRevocationValue } from "./proposalRevocationHasher";
import type { ProposalRevocationInput, ProposalRevocationInvalidationRecord } from "./proposalRevocationTypes";

export function buildDependencyInvalidations(
  input: ProposalRevocationInput,
): readonly ProposalRevocationInvalidationRecord[] {
  const records: ProposalRevocationInvalidationRecord[] = [];
  const proposalId = input.request.proposalId;

  const dependencyIds = new Set<string>([
    input.request.dependencySnapshotId,
    ...input.proposalIntegrityResult.proposal.approvalDependencyIds,
  ].filter(Boolean));
  for (const targetId of dependencyIds) {
    records.push(Object.freeze({
      invalidationId: `revocation-invalidation:${proposalId}:dependency:${targetId}`,
      proposalId,
      category: "dependency" as const,
      targetId,
      invalidated: true as const,
      deterministicHash: hashProposalRevocationValue("proposal-revocation-dependency-invalidation", { proposalId, targetId }),
    }));
  }

  records.push(Object.freeze({
    invalidationId: `revocation-invalidation:${proposalId}:approval:${input.proposalIntegrityResult.approvalBinding.approvalHash}`,
    proposalId,
    category: "approval" as const,
    targetId: input.proposalIntegrityResult.approvalBinding.approvalHash,
    invalidated: true as const,
    deterministicHash: hashProposalRevocationValue("proposal-revocation-approval-invalidation", {
      proposalId,
      targetId: input.proposalIntegrityResult.approvalBinding.approvalHash,
    }),
  }));

  records.push(Object.freeze({
    invalidationId: `revocation-invalidation:${proposalId}:replay:${input.request.replaySnapshotId}`,
    proposalId,
    category: "replay" as const,
    targetId: input.request.replaySnapshotId,
    invalidated: true as const,
    deterministicHash: hashProposalRevocationValue("proposal-revocation-replay-invalidation", {
      proposalId,
      targetId: input.request.replaySnapshotId,
    }),
  }));

  records.push(Object.freeze({
    invalidationId: `revocation-invalidation:${proposalId}:governance:${input.request.governanceSnapshotId}`,
    proposalId,
    category: "governance" as const,
    targetId: input.request.governanceSnapshotId,
    invalidated: true as const,
    deterministicHash: hashProposalRevocationValue("proposal-revocation-governance-invalidation", {
      proposalId,
      targetId: input.request.governanceSnapshotId,
    }),
  }));

  return Object.freeze(records);
}
