import type { GovernanceReviewProposal } from "./governanceReview";
import type { KnowledgeAuditEvent } from "./durableKnowledge";
import type { OperationalPolicyEffectivenessAssessment } from "./operationalPolicyMonitoring";
import type { OperationalPolicyVersion } from "./operationalPolicy";

export type OperationalPolicyExplanationRequest = Readonly<{
  policyId: string;
  scopeKey: string;
  version?: string;
  effectivenessAssessment?: OperationalPolicyEffectivenessAssessment;
}>;

export type OperationalPolicyExplanationTrace = Readonly<{
  activeVersion: OperationalPolicyVersion;
  versionHistory: readonly OperationalPolicyVersion[];
  auditEvents: readonly KnowledgeAuditEvent[];
  governanceProposal?: GovernanceReviewProposal;
  effectivenessAssessment?: OperationalPolicyEffectivenessAssessment;
}>;

export type OperationalPolicyExplanationResult = Readonly<{
  status: "COMPLETE" | "INCOMPLETE_HISTORY" | "NOT_FOUND" | "EXPLANATION_FAILED";
  reasonCode: "POLICY_HISTORY_EXPLAINED" | "POLICY_ACTIVATION_HISTORY_MISSING" | "POLICY_NOT_FOUND" | "EXPLANATION_FAILED";
  trace?: OperationalPolicyExplanationTrace;
  persistenceEffect: "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;

export interface OperationalPolicyExplanationService {
  explain(request: OperationalPolicyExplanationRequest): Promise<OperationalPolicyExplanationResult>;
}
