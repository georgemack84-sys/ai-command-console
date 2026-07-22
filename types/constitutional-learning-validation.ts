import type { ConstitutionalBaselineContract } from "@/types/constitutional-baseline-contract";
import type { ConstitutionalReplayValidationRepository } from "@/types/constitutional-replay-validation";

export type ConstitutionalLearningDomain = "LEARNING_BOUNDARY" | "APPROVED_TEMPLATE" | "APPROVED_HEURISTIC" | "OPERATOR_APPROVAL" | "GOVERNANCE_APPROVAL" | "KNOWLEDGE_PROVENANCE" | "CONFIDENCE_ADJUSTMENT" | "OPTIMIZATION_SAFETY";
export type ConstitutionalLearningArtifactType = "TEMPLATE" | "HEURISTIC" | "CONFIDENCE_CALIBRATION" | "OPTIMIZATION_INSIGHT" | "KNOWLEDGE_EVOLUTION";
export type ConstitutionalLearningStatus = "PASS" | "PENDING" | "FAIL";
export type ConstitutionalLearningValidationState = "VERIFIED" | "APPROVED_FOR_REVIEW" | "PENDING" | "RESTRICTED" | "REJECTED" | "BLOCKED";
export type ConstitutionalLearningScenario = "BASELINE" | "PENDING_APPROVALS" | "POLICY_MUTATION" | "CONSTITUTIONAL_MUTATION" | "AUTHORITY_CHANGES" | "UNAUTHORIZED_HEURISTICS" | "HIDDEN_MODEL_UPDATES" | "SELF_MODIFYING_BEHAVIOR" | "GOVERNANCE_BYPASS" | "OPERATOR_APPROVAL_BYPASS" | "PROVENANCE_CORRUPTION" | "REPLAY_INCONSISTENCY" | "NONDETERMINISTIC_VALIDATION" | "INTEGRITY_VERIFICATION_FAILURE" | "TENANT_ISOLATION_VIOLATION" | "MISSING_CONSTITUTIONAL_EVIDENCE" | "INCOMPLETE_VALIDATION_LINEAGE";
export type ConstitutionalLearningFailure = "POLICY_MUTATION_DETECTED" | "CONSTITUTIONAL_MUTATION_DETECTED" | "AUTHORITY_CHANGE_DETECTED" | "UNAUTHORIZED_HEURISTIC_DETECTED" | "HIDDEN_MODEL_UPDATE_DETECTED" | "SELF_MODIFYING_BEHAVIOR_DETECTED" | "GOVERNANCE_BYPASS_DETECTED" | "OPERATOR_APPROVAL_BYPASS_DETECTED" | "PROVENANCE_CORRUPTION_DETECTED" | "LEARNING_REPLAY_INCONSISTENCY_DETECTED" | "NONDETERMINISTIC_LEARNING_VALIDATION_DETECTED" | "LEARNING_INTEGRITY_VERIFICATION_FAILED" | "LEARNING_TENANT_ISOLATION_VIOLATION" | "CONSTITUTIONAL_EVIDENCE_MISSING" | "LEARNING_VALIDATION_LINEAGE_INCOMPLETE";

export type ConstitutionalLearningValidationRecord = Readonly<{
  learning_validation_id: string;
  mission_id: string;
  execution_id: string;
  tenant_id: string;
  constitution_version: "constitutional-baseline-contract/v8ALT.10.1";
  validation_timestamp: "1970-01-01T00:00:00.000Z";
  learning_artifact_id: string;
  artifact_type: ConstitutionalLearningArtifactType;
  boundary_status: ConstitutionalLearningStatus;
  template_status: ConstitutionalLearningStatus;
  heuristic_status: ConstitutionalLearningStatus;
  operator_approval_status: ConstitutionalLearningStatus;
  governance_approval_status: ConstitutionalLearningStatus;
  provenance_status: ConstitutionalLearningStatus;
  confidence_status: ConstitutionalLearningStatus;
  optimization_status: ConstitutionalLearningStatus;
  overall_validation_status: ConstitutionalLearningValidationState;
  rejection_rationale: string | null;
  constitutional_reference: string;
  governance_reference: string;
  operator_reference: string;
  evidence_reference: string;
  replay_reference: string;
  lineage_reference: string;
  validation_only: true;
  advisory_only: true;
  learning_activation_authorized: false;
  model_update_authorized: false;
  heuristic_deployment_authorized: false;
  policy_modification_authorized: false;
  constitutional_modification_authorized: false;
  authority_change_authorized: false;
  execution_behavior_change_authorized: false;
  integrity_hash: string;
}>;

export type ConstitutionalLearningRejectionRecord = Readonly<{
  rejection_id: string;
  learning_validation_id: string;
  failure: ConstitutionalLearningFailure;
  domain: ConstitutionalLearningDomain;
  rejection_rule: "Policy Mutation" | "Constitutional Mutation" | "Authority Changes" | "Unauthorized Heuristics" | "Hidden Model Updates" | "Self-Modifying Behavior" | "Governance Bypass" | "Operator Approval Bypass" | "Provenance Corruption" | "Replay Inconsistency" | "Nondeterministic Validation" | "Integrity Verification Failure" | "Tenant Isolation Violation" | "Missing Constitutional Evidence" | "Incomplete Validation Lineage";
  fail_closed: true;
  evidence_reference: string;
  replay_reference: string;
  integrity_hash: string;
}>;

export type ConstitutionalLearningExplanation = Readonly<{
  explanation_id: string;
  learning_validation_id: string;
  constitutional_rules_evaluated: readonly string[];
  learning_boundaries_assessed: readonly string[];
  supporting_evidence: readonly string[];
  governance_references: readonly string[];
  operator_approval_references: readonly string[];
  provenance_analysis: string;
  confidence_calculations: readonly string[];
  optimization_assessment: string;
  validation_rationale: string;
  rejection_rationale: string | null;
  complete: boolean;
  deterministic: true;
  replayable: true;
  integrity_hash: string;
}>;

export type ConstitutionalLearningValidationLedgerRecord = Readonly<{
  validation_record_id: string;
  learning_validation_id: string;
  mission_id: string;
  execution_id: string;
  tenant_id: string;
  timestamp: "1970-01-01T00:00:00.000Z";
  artifact_type: ConstitutionalLearningArtifactType;
  validation_state: ConstitutionalLearningValidationState;
  constitutional_reference: string;
  governance_reference: string;
  evidence_reference: string;
  replay_reference: string;
  lineage_reference: string;
  immutable: true;
  append_only: true;
  integrity_hash: string;
}>;

export type ConstitutionalLearningValidationRepository = Readonly<{
  repository_id: string;
  baseline_contract_id: string;
  replay_validation_repository_id: string;
  final_state: "CONSTITUTIONAL_LEARNING_VALIDATION_COMPLETE" | "CONSTITUTIONAL_LEARNING_VALIDATION_FAIL_CLOSED";
  records: readonly ConstitutionalLearningValidationRecord[];
  rejections: readonly ConstitutionalLearningRejectionRecord[];
  explanations: readonly ConstitutionalLearningExplanation[];
  ledger: readonly ConstitutionalLearningValidationLedgerRecord[];
  failures: readonly ConstitutionalLearningFailure[];
  validation_only: true;
  advisory_only: true;
  learning_activation_authorized: false;
  model_update_authorized: false;
  heuristic_deployment_authorized: false;
  policy_modification_authorized: false;
  constitutional_modification_authorized: false;
  authority_change_authorized: false;
  execution_behavior_change_authorized: false;
  integrity_hash: string;
}>;

export type ConstitutionalLearningValidationResult = Readonly<{
  repository_id: string;
  valid: boolean;
  deterministic_validation: boolean;
  replay_identical: boolean;
  evidence_complete: boolean;
  explainability_complete: boolean;
  lineage_complete: boolean;
  integrity_verified: boolean;
  tenant_isolated: boolean;
  governance_compliant: boolean;
  operator_authorized: boolean;
  validation_only: true;
  fail_closed_ready: boolean;
  no_learning_activation: boolean;
  no_constitutional_mutation: boolean;
  failures: readonly ConstitutionalLearningFailure[];
  validation_hash: string;
}>;

export type ConstitutionalLearningObservabilitySurface = Readonly<{
  repository_id: string;
  final_state: string;
  record_count: number;
  rejection_count: number;
  explanation_count: number;
  ledger_count: number;
  failure_count: number;
  validation_state: ConstitutionalLearningValidationState;
  validation_only: true;
  learning_activation_authorized: false;
  model_update_authorized: false;
  integrity_hash: string;
}>;

export type ConstitutionalLearningValidationInput = Readonly<{ scenario?: ConstitutionalLearningScenario; artifactType?: ConstitutionalLearningArtifactType; baseline?: ConstitutionalBaselineContract; replayRepository?: ConstitutionalReplayValidationRepository; repository?: ConstitutionalLearningValidationRepository }>;

export type ConstitutionalLearningValidationBundle = Readonly<{
  doctrine: Readonly<{
    engine_version: "constitutional-learning-validation/v8ALT.10.8";
    final_state: "CONSTITUTIONAL_LEARNING_VALIDATION_READY";
    validation_domains: readonly ConstitutionalLearningDomain[];
    principles: readonly string[];
  }>;
  repository: ConstitutionalLearningValidationRepository;
  validation: ConstitutionalLearningValidationResult;
  observability: ConstitutionalLearningObservabilitySurface;
}>;
