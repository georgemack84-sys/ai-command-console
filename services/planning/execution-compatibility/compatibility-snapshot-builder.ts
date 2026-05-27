import type {
  ApprovalContract,
  AuthorityGraph,
  CompatibilitySnapshot,
  CompensationContract,
  EscalationGraph,
  RollbackContract,
} from "./execution-compatibility-types";

export function buildCompatibilitySnapshot(input: {
  planId: string;
  executionTruthHash: string;
  dependencyGraphFingerprint: string;
  approvalContracts: ApprovalContract[];
  rollbackContracts: RollbackContract[];
  compensationContracts: CompensationContract[];
  authorityGraph: AuthorityGraph;
  escalationGraph: EscalationGraph;
}): CompatibilitySnapshot {
  return {
    planId: input.planId,
    executionTruthHash: input.executionTruthHash,
    dependencyGraphFingerprint: input.dependencyGraphFingerprint,
    authorityGraph: input.authorityGraph,
    escalationGraph: input.escalationGraph,
    scopeBoundaries: Object.fromEntries(input.approvalContracts.map((contract) => [contract.stepId, contract.scope])),
    rollbackOrder: Object.fromEntries(input.rollbackContracts.map((contract) => [contract.stepId, contract.rollbackOrder ?? -1])),
  };
}
