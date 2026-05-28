import type {
  ApprovalDependencyNode,
  ApprovalDependencyGraphInput,
  ApprovalInheritanceRecord,
} from "@/types/approval-dependency-graph";
import { hashApprovalGraphValue } from "./approvalGraphHasher";

const RISK_WEIGHT: Readonly<Record<string, number>> = Object.freeze({
  read_only: 0,
  advisory: 1,
  simulation_only: 2,
  operator_escalation: 3,
  handoff_preparation: 4,
  forbidden: 99,
});

export function deriveApprovalInheritance(input: {
  proposal: ApprovalDependencyGraphInput["proposal"];
  nodes: readonly ApprovalDependencyNode[];
}): readonly ApprovalInheritanceRecord[] {
  const proposalNode = input.nodes.find((node) => node.dependencyType === "proposal_approval");
  const governanceNode = input.nodes.find((node) => node.dependencyType === "governance_prerequisite");
  const handoffNode = input.nodes.find((node) => node.dependencyType === "handoff_prerequisite");
  if (!proposalNode || !governanceNode) {
    return Object.freeze([]);
  }

  const records: ApprovalInheritanceRecord[] = [];
  const riskWeight = RISK_WEIGHT[input.proposal.safeActionBinding.riskClass] ?? 99;
  if (riskWeight >= 3) {
    const base = {
      sourceApprovalId: governanceNode.approvalId,
      targetApprovalId: proposalNode.approvalId,
      inherited: true,
      valid: governanceNode.approvalState === "satisfied",
      reason: "Higher-risk actions inherit governance prerequisite visibility.",
    } as const;
    records.push(
      Object.freeze({
        inheritanceId: hashApprovalGraphValue("approval-inheritance-id", base),
        ...base,
        immutableHash: hashApprovalGraphValue("approval-inheritance", base),
      }),
    );
  }
  if (handoffNode) {
    const handoffBase = {
      sourceApprovalId: proposalNode.approvalId,
      targetApprovalId: handoffNode.approvalId,
      inherited: true,
      valid: proposalNode.approvalState === "satisfied",
      reason: "Prepared handoff inherits satisfied proposal approval prerequisites.",
    } as const;
    records.push(
      Object.freeze({
        inheritanceId: hashApprovalGraphValue("approval-inheritance-id", handoffBase),
        ...handoffBase,
        immutableHash: hashApprovalGraphValue("approval-inheritance", handoffBase),
      }),
    );
  }

  return Object.freeze(records);
}
