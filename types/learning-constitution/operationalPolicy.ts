import type { ClassificationProvenance } from "./informationClassification";
import type { GovernanceReviewProposalRepository } from "./governanceReview";

export type OperationalPolicyVersion = Readonly<{
  policyId: string;
  version: string;
  scopeKey: string;
  contentHash: string;
  impactAnalysis: string;
  migrationPlan: string;
  rollbackPlan: string;
  effectiveAt: string;
  activatedAt: string;
  activatedBy: string;
  proposalId: string;
  constitutionVersion: string;
  provenance: ClassificationProvenance;
}>;

export type OperationalPolicyRepository = Readonly<{
  getByPolicyVersion(policyId: string, version: string, scopeKey: string): Promise<OperationalPolicyVersion | undefined>;
  getActive(policyId: string, scopeKey: string): Promise<OperationalPolicyVersion | undefined>;
  findAllByPolicyScope(policyId: string, scopeKey: string): Promise<readonly OperationalPolicyVersion[]>;
  activate(version: OperationalPolicyVersion): Promise<OperationalPolicyVersion>;
  reactivate(policyId: string, version: string, scopeKey: string): Promise<OperationalPolicyVersion>;
}>;

export interface PolicyActivatorAuthorizer {
  isAuthorized(activatorId: string, policyId: string, scopeKey: string): Promise<boolean>;
}

export interface PolicyRollbackAuthorizer {
  isAuthorized(rollbackActorId: string, policyId: string, scopeKey: string): Promise<boolean>;
}

export type OperationalPolicyActivationRequest = Readonly<{
  proposalId: string;
  policyId: string;
  version: string;
  scopeKey: string;
  contentHash: string;
  impactAnalysis: string;
  migrationPlan: string;
  rollbackPlan: string;
  effectiveAt: string;
  activatorId: string;
  constitutionVersion: string;
  provenance: ClassificationProvenance;
}>;

export const OPERATIONAL_POLICY_ACTIVATION_REASON_CODES = [
  "OPERATIONAL_POLICY_ACTIVATED",
  "IDEMPOTENT_REPLAY",
  "PROPOSAL_NOT_FOUND",
  "PROPOSAL_NOT_APPROVED",
  "CONSTITUTION_MUTATION_PROHIBITED",
  "UNAUTHORIZED_ACTIVATOR",
  "ACTIVATION_INPUT_MISSING",
  "ACTIVATION_VERSION_CONFLICT",
  "PERSISTENCE_FAILED",
] as const;
export type OperationalPolicyActivationReasonCode = (typeof OPERATIONAL_POLICY_ACTIVATION_REASON_CODES)[number];

export type OperationalPolicyActivationResult = Readonly<{
  status: "ACTIVATED" | "REJECTED" | "PERSISTENCE_FAILED";
  reasonCode: OperationalPolicyActivationReasonCode;
  policyVersion?: OperationalPolicyVersion;
  created: boolean;
  idempotentReplay: boolean;
  persistenceEffect: "CREATED" | "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;

export type OperationalPolicyActivationDependencies = Readonly<{
  proposalRepository: GovernanceReviewProposalRepository;
  policyRepository: OperationalPolicyRepository;
  authorizer: PolicyActivatorAuthorizer;
}>;

export interface OperationalPolicyActivationService {
  activate(request: OperationalPolicyActivationRequest): Promise<OperationalPolicyActivationResult>;
}

export type OperationalPolicyRollbackRequest = Readonly<{
  policyId: string;
  scopeKey: string;
  targetVersion: string;
  rollbackActorId: string;
  reason: string;
}>;

export const OPERATIONAL_POLICY_ROLLBACK_REASON_CODES = [
  "OPERATIONAL_POLICY_ROLLED_BACK",
  "IDEMPOTENT_REPLAY",
  "CONSTITUTION_MUTATION_PROHIBITED",
  "ACTIVE_POLICY_NOT_FOUND",
  "ROLLBACK_TARGET_NOT_FOUND",
  "ROLLBACK_TARGET_INVALID",
  "ROLLBACK_REASON_MISSING",
  "UNAUTHORIZED_ROLLBACK_ACTOR",
  "PERSISTENCE_FAILED",
] as const;
export type OperationalPolicyRollbackReasonCode = (typeof OPERATIONAL_POLICY_ROLLBACK_REASON_CODES)[number];

export type OperationalPolicyRollbackResult = Readonly<{
  status: "ROLLED_BACK" | "REJECTED" | "PERSISTENCE_FAILED";
  reasonCode: OperationalPolicyRollbackReasonCode;
  activePolicyVersion?: OperationalPolicyVersion;
  created: boolean;
  idempotentReplay: boolean;
  persistenceEffect: "UPDATED" | "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;

export interface OperationalPolicyRollbackService {
  rollback(request: OperationalPolicyRollbackRequest): Promise<OperationalPolicyRollbackResult>;
}
