import type {
  ApprovalDependencyGraphInput,
  ApprovalDependencyNode,
  ApprovalInheritanceRecord,
  ApprovalLifecycleError,
  ApprovalReplayBinding,
  ApprovalTimeWindow,
} from "@/types/approval-dependency-graph";

function hasCycle(nodes: readonly ApprovalDependencyNode[]): boolean {
  const graph = new Map(nodes.map((node) => [node.approvalId, node.requiredBefore]));
  const visiting = new Set<string>();
  const visited = new Set<string>();

  function visit(nodeId: string): boolean {
    if (visiting.has(nodeId)) {
      return true;
    }
    if (visited.has(nodeId)) {
      return false;
    }
    visiting.add(nodeId);
    for (const dependency of graph.get(nodeId) ?? []) {
      if (visit(dependency)) {
        return true;
      }
    }
    visiting.delete(nodeId);
    visited.add(nodeId);
    return false;
  }

  return nodes.some((node) => visit(node.approvalId));
}

export function validateApprovalDependencyGraph(input: {
  graphInput: ApprovalDependencyGraphInput;
  nodes: readonly ApprovalDependencyNode[];
  replay: ApprovalReplayBinding;
  inheritance: readonly ApprovalInheritanceRecord[];
  timeWindows: readonly ApprovalTimeWindow[];
  metadata?: Readonly<Record<string, unknown>>;
}): readonly ApprovalLifecycleError[] {
  const errors: ApprovalLifecycleError[] = [];

  if (!input.graphInput.proposal.governanceBinding.valid) {
    errors.push({
      code: "APPROVAL_DEPENDENCY_GOVERNANCE_MISSING",
      message: "Approval graph requires valid governance binding.",
      path: "governanceBinding",
    });
  }
  if (!input.replay.valid || !input.replay.deterministic) {
    errors.push({
      code: "APPROVAL_DEPENDENCY_REPLAY_MISSING",
      message: "Approval graph requires valid deterministic replay binding.",
      path: "replayBinding",
    });
  }
  if (!input.graphInput.proposal.lineage.entries.length) {
    errors.push({
      code: "APPROVAL_DEPENDENCY_PROPOSAL_LINEAGE_MISSING",
      message: "Approval graph requires proposal lifecycle lineage.",
      path: "proposal.lineage",
    });
  }
  if (!input.graphInput.proposal.safeActionBinding.safeActionHash) {
    errors.push({
      code: "APPROVAL_DEPENDENCY_SAFE_ACTION_MISSING",
      message: "Approval graph requires safe action lineage.",
      path: "proposal.safeActionBinding",
    });
  }
  if (input.graphInput.proposal.safeActionBinding.futureBound) {
    errors.push({
      code: "APPROVAL_DEPENDENCY_FUTURE_BOUND_ESCALATION",
      message: "Future-bound safe actions may not escalate approval topology.",
      path: "proposal.safeActionBinding",
    });
  }
  if (input.graphInput.proposal.safeActionBinding.forbidden) {
    errors.push({
      code: "APPROVAL_DEPENDENCY_SAFE_ACTION_MISSING",
      message: "Forbidden safe actions may not enter the approval dependency graph.",
      path: "proposal.safeActionBinding",
    });
  }
  if (hasCycle(input.nodes)) {
    errors.push({
      code: "APPROVAL_DEPENDENCY_CYCLE",
      message: "Cyclic approval dependencies are forbidden.",
      path: "nodes",
    });
  }
  if (input.inheritance.some((record) => !record.valid)) {
    errors.push({
      code: "APPROVAL_DEPENDENCY_INVALID_INHERITANCE",
      message: "Invalid inherited approvals fail closed.",
      path: "inheritance",
    });
  }
  if (input.timeWindows.some((window) => !window.validAtTimestamp)) {
    errors.push({
      code: "APPROVAL_DEPENDENCY_TIME_WINDOW_INVALID",
      message: "Approval validity windows are not satisfied at the replay timestamp.",
      path: "timeWindows",
    });
  }
  if (input.nodes.some((node) => node.approvalState === "blocked" && node.dependencyType === "proposal_approval" && input.graphInput.proposal.approval.explicit === false)) {
    errors.push({
      code: "APPROVAL_DEPENDENCY_IMPLICIT_APPROVAL",
      message: "Implicit approvals are constitutionally forbidden.",
      path: "proposal.approval",
    });
  }

  const metadata = input.metadata ?? {};
  if ("execute" in metadata) {
    errors.push({
      code: "APPROVAL_DEPENDENCY_EXECUTION_METADATA_FORBIDDEN",
      message: "Execution metadata may not appear in approval graphs.",
      path: "metadata",
    });
  }
  if ("runtimeBridge" in metadata) {
    errors.push({
      code: "APPROVAL_DEPENDENCY_RUNTIME_BRIDGE_FORBIDDEN",
      message: "Runtime bridge metadata is forbidden.",
      path: "metadata",
    });
  }
  if ("approvalGranted" in metadata || "authorityInflation" in metadata) {
    errors.push({
      code: "APPROVAL_DEPENDENCY_AUTHORITY_INFLATION",
      message: "Authority inflation and implicit approval signals are forbidden.",
      path: "metadata",
    });
  }
  if (input.graphInput.proposal.revocation.status === "revoked") {
    errors.push({
      code: "APPROVAL_DEPENDENCY_REVOKED",
      message: "Revoked proposal approvals invalidate dependency chains.",
      path: "proposal.revocation",
    });
  }

  return Object.freeze(errors);
}
