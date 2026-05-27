import type {
  ApprovalDependencyGraphInput,
  ApprovalDependencyNode,
  ApprovalDependencyState,
} from "@/types/approval-dependency-graph";
import { hashApprovalGraphValue } from "./approvalGraphHasher";

function deriveApprovalState(input: ApprovalDependencyGraphInput): ApprovalDependencyState {
  if (input.proposal.revocation.status === "revoked") {
    return "revoked";
  }
  if (input.proposal.approval.status === "expired") {
    return "expired";
  }
  if (input.proposal.approval.valid) {
    return "satisfied";
  }
  if (input.proposal.approval.status === "required") {
    return "required";
  }
  return "blocked";
}

function buildNode(input: {
  proposalId: string;
  approvalId: string;
  dependencyType: ApprovalDependencyNode["dependencyType"];
  requiredBefore?: readonly string[];
  inheritedFrom?: readonly string[];
  approvalState: ApprovalDependencyState;
  validFrom: string;
  validUntil: string;
  replayBindingHash: string;
  governanceBindingHash: string;
}): ApprovalDependencyNode {
  const node = {
    approvalId: input.approvalId,
    proposalId: input.proposalId,
    dependencyType: input.dependencyType,
    requiredBefore: Object.freeze([...(input.requiredBefore ?? [])].sort((left, right) => left.localeCompare(right))),
    inheritedFrom: Object.freeze([...(input.inheritedFrom ?? [])].sort((left, right) => left.localeCompare(right))),
    approvalState: input.approvalState,
    timeWindow: Object.freeze({
      validFrom: input.validFrom,
      validUntil: input.validUntil,
    }),
    replayBindingHash: input.replayBindingHash,
    governanceBindingHash: input.governanceBindingHash,
  } as const;

  return Object.freeze({
    ...node,
    immutableHash: hashApprovalGraphValue("approval-node", node),
  });
}

export function resolveApprovalDependencyNodes(input: {
  proposal: ApprovalDependencyGraphInput["proposal"];
  governanceHash: string;
  replayHash: string;
}): readonly ApprovalDependencyNode[] {
  const proposalState = deriveApprovalState({
    proposal: input.proposal,
  } as ApprovalDependencyGraphInput);
  const validFrom = input.proposal.approval.approvedAt ?? input.proposal.createdAt;
  const validUntil = input.proposal.approval.expiresAt ?? input.proposal.updatedAt;

  const governanceNode = buildNode({
    proposalId: input.proposal.proposalId,
    approvalId: `approval:governance:${input.proposal.proposalId}`,
    dependencyType: "governance_prerequisite",
    approvalState: input.proposal.governanceBinding.valid ? "satisfied" : "blocked",
    validFrom: input.proposal.createdAt,
    validUntil,
    replayBindingHash: input.replayHash,
    governanceBindingHash: input.governanceHash,
  });

  const proposalNode = buildNode({
    proposalId: input.proposal.proposalId,
    approvalId: input.proposal.approval.approvalId,
    dependencyType: "proposal_approval",
    requiredBefore: Object.freeze([governanceNode.approvalId]),
    approvalState: proposalState,
    validFrom,
    validUntil,
    replayBindingHash: input.replayHash,
    governanceBindingHash: input.governanceHash,
  });

  const nodes: ApprovalDependencyNode[] = [governanceNode, proposalNode];
  if (
    input.proposal.safeActionBinding.category === "prepare_handoff"
    || input.proposal.resultingState === "prepared_handoff"
  ) {
    nodes.push(
      buildNode({
        proposalId: input.proposal.proposalId,
        approvalId: `approval:handoff:${input.proposal.proposalId}`,
        dependencyType: "handoff_prerequisite",
        requiredBefore: Object.freeze([proposalNode.approvalId]),
        approvalState: proposalNode.approvalState === "satisfied" ? "satisfied" : "blocked",
        validFrom,
        validUntil,
        replayBindingHash: input.replayHash,
        governanceBindingHash: input.governanceHash,
      }),
    );
  }

  return Object.freeze(nodes.sort((left, right) => left.approvalId.localeCompare(right.approvalId)));
}
