import { hashEvidence } from "../audit/evidenceHashing";

export type ConstitutionalOperatorDecision = {
  decisionId: string;
  operatorId: string;
  decisionType:
    | "APPROVE"
    | "REJECT"
    | "FREEZE"
    | "ESCALATE"
    | "DISPUTE"
    | "REVIEW_REQUIRED";
  targetId: string;
  targetType: string;
  constitutionalReasoning: string[];
  governanceReferences: string[];
  riskAssessment: {
    constitutionalRisk: number;
    operationalRisk: number;
    sovereigntyImpact: number;
  };
  createdAt: number;
  immutableHash: string;
};

export function buildOperatorDecisionPreview(input: Omit<ConstitutionalOperatorDecision, "decisionId" | "immutableHash">): ConstitutionalOperatorDecision {
  const basis = {
    operatorId: input.operatorId,
    decisionType: input.decisionType,
    targetId: input.targetId,
    targetType: input.targetType,
    constitutionalReasoning: input.constitutionalReasoning,
    governanceReferences: input.governanceReferences,
    riskAssessment: input.riskAssessment,
    createdAt: input.createdAt,
  };
  const immutableHash = hashEvidence(basis);

  return {
    ...input,
    decisionId: `operator-decision:${immutableHash.slice(0, 16)}`,
    immutableHash,
  };
}
