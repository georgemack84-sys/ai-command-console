import type { InformationClassificationResult } from "./informationClassification";
import type { KnowledgeScopeResolutionResult } from "./knowledgeScope";
import type { AuthoritySourceClass, AuthorityType } from "./authorityTaxonomy";

export const AUTHORITY_RESOLUTION_STATUSES = ["CANDIDATE_ASSIGNED", "REQUIRE_REVIEW"] as const;
export type AuthorityResolutionStatus = (typeof AUTHORITY_RESOLUTION_STATUSES)[number];

export const AUTHORITY_RESOLUTION_REASON_CODES = [
  "HUMAN_DIRECTIVE_IDENTIFIED",
  "HUMAN_DECISION_IDENTIFIED",
  "HUMAN_CORRECTION_IDENTIFIED",
  "HUMAN_PREFERENCE_IDENTIFIED",
  "APPROVED_POLICY_IDENTIFIED",
  "APPROVED_REFERENCE_IDENTIFIED",
  "VERIFIED_EXTERNAL_INFORMATION_IDENTIFIED",
  "AGENT_DERIVATION_IDENTIFIED",
  "AGENT_INFERENCE_IDENTIFIED",
  "AGENT_HYPOTHESIS_IDENTIFIED",
  "CLASSIFICATION_UNRESOLVED",
  "SCOPE_UNRESOLVED",
  "SEMANTICS_DO_NOT_ESTABLISH_AUTHORITY",
  "APPROVAL_MISSING",
  "REFERENCE_DESIGNATION_MISSING",
  "EXTERNAL_VERIFICATION_MISSING",
  "AGENT_KNOWLEDGE_KIND_MISSING",
] as const;
export type AuthorityResolutionReasonCode = (typeof AUTHORITY_RESOLUTION_REASON_CODES)[number];

export type AuthoritySourceDescriptor = Readonly<{
  sourceClass: AuthoritySourceClass;
  sourceIdentity: string;
  sourceReference: string;
  approval?: Readonly<{ approvedBy: string; approvalRecord: string }>;
  referenceDesignated?: boolean;
  externallyVerified?: boolean;
  agentKnowledgeKind?: "DERIVED" | "INFERRED" | "HYPOTHESIS";
}>;

export type AuthorityResolutionRequest = Readonly<{
  classification: InformationClassificationResult;
  scopeResolution: KnowledgeScopeResolutionResult;
  source: AuthoritySourceDescriptor;
}>;

export type AuthorityResolutionResult = Readonly<{
  status: AuthorityResolutionStatus;
  reasonCode: AuthorityResolutionReasonCode;
  authorityType?: AuthorityType;
  source: AuthoritySourceDescriptor;
  persistenceEffect: "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;

export interface AuthorityResolver {
  resolve(request: AuthorityResolutionRequest): AuthorityResolutionResult;
}
