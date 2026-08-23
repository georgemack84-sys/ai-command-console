import type { ClassificationProvenance } from "./informationClassification";
import type { KnowledgeQualityMetricsReport } from "./knowledgeQualityMetrics";

export const GOVERNANCE_REVIEW_PROPOSAL_STATES = [
  "PROPOSED",
  "UNDER_REVIEW",
  "APPROVED_FOR_POLICY_CHANGE",
  "REJECTED",
  "WITHDRAWN",
] as const;
export type GovernanceReviewProposalState = (typeof GOVERNANCE_REVIEW_PROPOSAL_STATES)[number];

export type GovernanceReviewProposal = Readonly<{
  proposalId: string;
  reportId: string;
  scopeKey: string;
  alertCodes: readonly string[];
  rationale: string;
  evidenceIds: readonly string[];
  affectedPolicyIds: readonly string[];
  expectedImpact: string;
  state: GovernanceReviewProposalState;
  createdAt: string;
  decidedAt?: string;
  decidedBy?: string;
  policyVersion: string;
  constitutionVersion: string;
  provenance: ClassificationProvenance;
}>;

export type GovernanceReviewProposalRepository = Readonly<{
  create(proposal: GovernanceReviewProposal): Promise<GovernanceReviewProposal>;
  getById(proposalId: string): Promise<GovernanceReviewProposal | undefined>;
  transition(proposalId: string, state: GovernanceReviewProposalState, reviewerId: string, decidedAt: string): Promise<GovernanceReviewProposal>;
}>;

export interface GovernanceReviewerAuthorizer {
  isAuthorized(reviewerId: string, action: "BEGIN_REVIEW" | "APPROVE" | "REJECT" | "WITHDRAW"): Promise<boolean>;
}

export type GovernanceReviewProposalRequest = Readonly<{
  proposalId: string;
  report: KnowledgeQualityMetricsReport;
  rationale: string;
  evidenceIds: readonly string[];
  affectedPolicyIds: readonly string[];
  expectedImpact: string;
  provenance: ClassificationProvenance;
  policyVersion: string;
  constitutionVersion: string;
}>;

export type GovernanceReviewDecisionRequest = Readonly<{
  proposalId: string;
  reviewerId: string;
  action: "BEGIN_REVIEW" | "APPROVE" | "REJECT" | "WITHDRAW";
}>;

export const GOVERNANCE_REVIEW_REASON_CODES = [
  "GOVERNANCE_REVIEW_PROPOSED",
  "GOVERNANCE_REVIEW_DECIDED",
  "IDEMPOTENT_REPLAY",
  "PROPOSAL_NOT_FOUND",
  "PROPOSAL_ID_CONFLICT",
  "EVIDENCE_MISSING",
  "RATIONALE_MISSING",
  "IMPACT_MISSING",
  "UNAUTHORIZED_REVIEWER",
  "INVALID_STATE_TRANSITION",
  "PERSISTENCE_FAILED",
] as const;
export type GovernanceReviewReasonCode = (typeof GOVERNANCE_REVIEW_REASON_CODES)[number];

export type GovernanceReviewResult = Readonly<{
  status: "PROPOSED" | "DECIDED" | "REJECTED" | "PERSISTENCE_FAILED";
  reasonCode: GovernanceReviewReasonCode;
  proposal?: GovernanceReviewProposal;
  created: boolean;
  idempotentReplay: boolean;
  persistenceEffect: "CREATED" | "UPDATED" | "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;

export interface GovernanceReviewService {
  propose(request: GovernanceReviewProposalRequest): Promise<GovernanceReviewResult>;
  decide(request: GovernanceReviewDecisionRequest): Promise<GovernanceReviewResult>;
}
