import type { DelegationContract, DelegationDelegateType, DelegationFailureReason } from "@/types/delegation-contract";

export type TaskExecutionCategory = "OPERATOR" | "AGENT" | "EXTERNAL" | "DEFERRED" | "BLOCKED";

export type TaskClassificationState =
  | "UNCLASSIFIED"
  | "ANALYZING"
  | "AUTHORITY_VALIDATION"
  | "DEPENDENCY_VALIDATION"
  | "CLASSIFIED"
  | "GOVERNANCE_APPROVED"
  | "READY_FOR_DELEGATION"
  | "DEFERRED"
  | "BLOCKED"
  | "INVALID"
  | "REJECTED"
  | "FAILED";

export type TaskClassificationConfidenceLevel = "HIGH" | "MEDIUM" | "LOW" | "INSUFFICIENT";

export type TaskClassificationFailureReason =
  | "AMBIGUOUS_CLASSIFICATION"
  | "MULTIPLE_EXECUTION_OWNERS"
  | "MISSING_AUTHORITY"
  | "UNCERTIFIED_AGENT"
  | "POLICY_CONFLICT"
  | "CONSTITUTIONAL_VIOLATION"
  | "REPLAY_INCONSISTENCY"
  | "CROSS_TENANT_ROUTING"
  | "NONDETERMINISTIC_DECISION"
  | "INCOMPLETE_DEPENDENCY_ANALYSIS"
  | "INVALID_DELEGATION_CONTRACT"
  | "GOVERNANCE_VALIDATION_FAILED"
  | "INTEGRITY_HASH_MISMATCH";

export type TaskClassificationScenario =
  | "BASELINE"
  | "OPERATOR_REQUIRED"
  | "EXTERNAL_REQUIRED"
  | "DEPENDENCY_INCOMPLETE"
  | "AUTHORITY_FAILURE"
  | "UNCERTIFIED_AGENT"
  | "POLICY_CONFLICT"
  | "CONSTITUTIONAL_VIOLATION"
  | "LOW_CONFIDENCE"
  | "AMBIGUOUS_CLASSIFICATION"
  | "MULTIPLE_OWNERS"
  | "REPLAY_INCONSISTENCY"
  | "CROSS_TENANT_ROUTING"
  | "NONDETERMINISTIC_DECISION"
  | "INCOMPLETE_DEPENDENCY_ANALYSIS"
  | "INVALID_DELEGATION_CONTRACT"
  | "HASH_MISMATCH";

export type TaskClassificationRule = Readonly<{
  rule_id: string;
  rule_name: string;
  condition: string;
  classification: TaskExecutionCategory;
  priority: number;
  version: "task-classification-rule/v8D.2";
  immutable: true;
  replay_compatible: true;
  rule_hash: string;
}>;

export type TaskDecisionMatrixEntry = Readonly<{
  matrix_entry_id: string;
  condition: "HUMAN_JUDGMENT_REQUIRED" | "CERTIFIED_CAPABILITY_AVAILABLE" | "EXTERNAL_SERVICE_REQUIRED" | "DEPENDENCY_INCOMPLETE" | "AUTHORITY_OR_POLICY_FAILURE";
  classification: TaskExecutionCategory;
  explanation: string;
  entry_hash: string;
}>;

export type TaskEvaluationEvidence = Readonly<{
  evidence_id: string;
  task_complexity: "LOW" | "MEDIUM" | "HIGH";
  required_authority: DelegationContract["authority"]["authority_level"];
  governance_policy: string;
  constitutional_reference: string;
  agent_capability: string;
  external_dependency: string | null;
  execution_timing: "READY" | "WAITING" | "WINDOW_UNAVAILABLE";
  risk_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  dependency_readiness: "COMPLETE" | "INCOMPLETE" | "UNKNOWN";
  operator_involvement: boolean;
  evidence_hash: string;
}>;

export type TaskClassificationDecision = Readonly<{
  classification_id: string;
  task_id: string;
  delegation_id: string;
  tenant_id: string;
  mission_id: string;
  classification: TaskExecutionCategory;
  execution_owner_type: DelegationDelegateType;
  execution_owner_id: string;
  classification_state: TaskClassificationState;
  matched_rule_ids: readonly string[];
  evidence: TaskEvaluationEvidence;
  authority_validation: Readonly<{
    authority_valid: boolean;
    authority_reference: string;
    failures: readonly (DelegationFailureReason | TaskClassificationFailureReason)[];
  }>;
  policy_references: readonly string[];
  dependency_analysis: Readonly<{
    dependencies_complete: boolean;
    dependency_refs: readonly string[];
    deferred_reason: string | null;
  }>;
  confidence: Readonly<{
    score: number;
    level: TaskClassificationConfidenceLevel;
    factors: readonly string[];
  }>;
  governance_outcome: Readonly<{
    approved: boolean;
    alerts: readonly string[];
    review_required: boolean;
  }>;
  explanation: string;
  timestamp: string;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
}>;

export type TaskClassificationValidationResult = Readonly<{
  validation_id: string;
  classification_id: string;
  validation_state: "PASS" | "FAIL";
  failures: readonly TaskClassificationFailureReason[];
  exactly_one_owner: boolean;
  authority_validated: boolean;
  capability_validated: boolean;
  dependency_analysis_complete: boolean;
  governance_validated: boolean;
  confidence_present: boolean;
  replay_ready: boolean;
  lineage_complete: boolean;
  integrity_verified: boolean;
  ready_for_authority_validation_engine: boolean;
  validation_hash: string;
}>;

export type TaskClassificationReplayResult = Readonly<{
  replay_id: string;
  classification_id: string;
  reconstructed_classification: TaskExecutionCategory;
  reconstructed_owner_id: string;
  reconstructed_rule_ids: readonly string[];
  reconstructed_evidence_hash: string;
  validation_state: "PASS" | "FAIL";
  failure_reason: TaskClassificationFailureReason | null;
  replay_hash: string;
}>;

export type TaskClassificationPackage = Readonly<{
  package_id: string;
  engine_version: "task-classification-engine/v8D.2";
  source_delegation: DelegationContract;
  rule_library: readonly TaskClassificationRule[];
  decision_matrix: readonly TaskDecisionMatrixEntry[];
  classification: TaskClassificationDecision;
  validation: TaskClassificationValidationResult;
  replay: TaskClassificationReplayResult;
  immutable_evidence_refs: readonly string[];
  package_hash: string;
}>;

export type TaskClassificationVisibilitySurface = Readonly<{
  classification_id: string;
  task_id: string;
  classification: TaskExecutionCategory;
  execution_owner_id: string;
  classification_state: TaskClassificationState;
  confidence_level: TaskClassificationConfidenceLevel;
  review_required: boolean;
  governance_alerts: readonly string[];
  failure_reasons: readonly TaskClassificationFailureReason[];
  replay_reference: string;
  lineage_reference: string;
  integrity_status: "VALID" | "INVALID";
}>;

export type TaskClassificationFramework = Readonly<{
  doctrine: Readonly<{
    principles: readonly string[];
    engine_version: "task-classification-engine/v8D.2";
    categories: readonly TaskExecutionCategory[];
    states: readonly TaskClassificationState[];
  }>;
  package: TaskClassificationPackage;
  visibility: TaskClassificationVisibilitySurface;
}>;
