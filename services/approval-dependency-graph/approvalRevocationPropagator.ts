import type {
  ApprovalDependencyNode,
  ApprovalRevocationPropagation,
  ApprovalDependencyState,
} from "@/types/approval-dependency-graph";
import { hashApprovalGraphValue } from "./approvalGraphHasher";

function revokeState(state: ApprovalDependencyState): ApprovalDependencyState {
  return state === "satisfied" ? "revoked" : "blocked";
}

export function propagateApprovalRevocations(input: {
  nodes: readonly ApprovalDependencyNode[];
  revoked: boolean;
  revokedAt?: string;
}): {
  nodes: readonly ApprovalDependencyNode[];
  propagations: readonly ApprovalRevocationPropagation[];
} {
  if (!input.revoked) {
    return { nodes: input.nodes, propagations: Object.freeze([]) };
  }

  const root = input.nodes.find((node) => node.dependencyType === "proposal_approval") ?? input.nodes[0];
  if (!root) {
    return { nodes: input.nodes, propagations: Object.freeze([]) };
  }

  const affected = new Set<string>([root.approvalId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const node of input.nodes) {
      if (node.requiredBefore.some((dependency) => affected.has(dependency)) && !affected.has(node.approvalId)) {
        affected.add(node.approvalId);
        changed = true;
      }
    }
  }

  const nodes = Object.freeze(
    input.nodes.map((node) =>
      affected.has(node.approvalId)
        ? Object.freeze({
            ...node,
            approvalState: revokeState(node.approvalState),
            immutableHash: hashApprovalGraphValue("approval-node-revoked", {
              ...node,
              approvalState: revokeState(node.approvalState),
            }),
          })
        : node),
  );
  const propagationBase = {
    sourceApprovalId: root.approvalId,
    affectedApprovalIds: Object.freeze([...affected].sort((left, right) => left.localeCompare(right))),
    revokedAt: input.revokedAt,
    valid: true,
  } as const;

  return {
    nodes,
    propagations: Object.freeze([
      Object.freeze({
        propagationId: hashApprovalGraphValue("approval-revocation-id", propagationBase),
        ...propagationBase,
        immutableHash: hashApprovalGraphValue("approval-revocation", propagationBase),
      }),
    ]),
  };
}
