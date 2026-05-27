import type { EscalationSeverity, EscalationState } from "./escalationStates";

export interface EscalationAuthorityContract {
  mayAuthorizeExecution: false;
  mayAdvanceLifecycle: false;
  mayRepairReplay: false;
  mayRestoreTrust: false;
  mayResumeCoordination: false;
  mayBypassGovernance: false;
  mayGenerateApproval: false;
  mayModifyPolicy: false;
}

export interface EscalationDecision {
  escalationId: string;
  coordinationId: string;
  trigger:
    | "confidence_collapse"
    | "replay_uncertainty"
    | "governance_mismatch"
    | "approval_ambiguity"
    | "stale_coordination"
    | "policy_uncertainty"
    | "unknown_state";
  resultingState: EscalationState;
  severity: EscalationSeverity;
  freezeRecommended: boolean;
  pauseRecommended: boolean;
  escalationReason: string;
  governanceValidated: boolean;
  replaySafe: boolean;
  requiresHumanOversight: boolean;
  createdAt: string;
}

export interface ConfidenceRiskProfile {
  profileId: string;
  coordinationId: string;
  confidenceScore: number;
  uncertaintyScore: number;
  replayIntegrityScore: number;
  governanceAlignmentScore: number;
  approvalClarityScore: number;
  driftRiskScore: number;
  escalationState: EscalationState;
  frozen: boolean;
  paused: boolean;
  createdAt: string;
  updatedAt: string;
}

export type FreezeRecommendationPropagation = Readonly<{
  recommendationId: string;
  coordinationId: string;
  freezeRecommended: boolean;
  terminalContainmentOnly: true;
  visibilityOnly: true;
  reasonCodes: readonly string[];
  createdAt: string;
}>;

export type PauseRecommendationPropagation = Readonly<{
  recommendationId: string;
  coordinationId: string;
  pauseRecommended: boolean;
  visibilityOnly: true;
  runtimeControl: false;
  reasonCodes: readonly string[];
  createdAt: string;
}>;
