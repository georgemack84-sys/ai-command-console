import type { EscalationReason, EscalationState } from "./escalationStates";

export type CoordinationRiskLevel =
  | "low"
  | "moderate"
  | "high"
  | "critical";

export type CoordinationRiskProfile = Readonly<{
  riskId: string;
  coordinationId: string;
  riskLevel: CoordinationRiskLevel;
  confidenceScore: number;
  uncertaintyScore: number;
  replayRiskScore: number;
  governanceRiskScore: number;
  orchestrationRiskScore: number;
  approvalRiskScore: number;
  escalationState: EscalationState;
  escalationReason: EscalationReason;
  freezeRequired: boolean;
  reviewRequired: boolean;
  deterministicHash: string;
}>;
