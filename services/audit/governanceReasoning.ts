import { hashEvidence } from "./evidenceHashing";
import type { GovernanceReasoning } from "../../types/audit";

export function buildGovernanceReasoning(input: {
  governanceAction: string;
  constitutionalRules: string[];
  evaluatedConstraints: string[];
  violatedPolicies?: string[];
  coordinationConstraints?: string[];
  approvalsRequired: boolean;
  escalationRequired: boolean;
  denialReason?: string;
  governanceConfidence: number;
  explanation: string[];
}) : GovernanceReasoning {
  const requiresReasoning = ["DENY", "FREEZE", "COORDINATION_BLOCK"].includes(input.governanceAction);
  if (requiresReasoning && (!input.explanation.length || (!input.denialReason && input.governanceAction !== "FREEZE"))) {
    throw new Error("governance_reasoning_incomplete");
  }

  return {
    reasoningId: `reasoning:${hashEvidence({
      governanceAction: input.governanceAction,
      constitutionalRules: input.constitutionalRules,
      explanation: input.explanation,
    }).slice(0, 16)}`,
    constitutionalRules: Array.from(new Set(input.constitutionalRules)).sort(),
    evaluatedConstraints: Array.from(new Set(input.evaluatedConstraints)).sort(),
    violatedPolicies: Array.from(new Set(input.violatedPolicies ?? [])).sort(),
    coordinationConstraints: Array.from(new Set(input.coordinationConstraints ?? [])).sort(),
    approvalsRequired: input.approvalsRequired,
    escalationRequired: input.escalationRequired,
    denialReason: input.denialReason,
    governanceConfidence: input.governanceConfidence,
    explanation: Array.from(new Set(input.explanation)),
  };
}
