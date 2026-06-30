import type {
  RecommendationAlternativePathType,
  RecommendationCertificationState,
  RecommendationGovernanceConstraints,
  RecommendationReplayState,
  RecommendationSeverityLevel,
  RecommendationValidationState,
} from "./recommendation-contract";
import type { GeneratedRecommendation, RecommendationGenerationFailureReason, RecommendationGenerationPriority, RecommendationGenerationResult, RecommendationGenerationScenario } from "./recommendation-generation";

export type AlternativePathType = RecommendationAlternativePathType;
export type AlternativePathLifecycleState = "CREATED" | "EVIDENCE_BOUND" | "RISK_BOUND" | "CONFIDENCE_BOUND" | "GOVERNANCE_CONSTRAINED" | "COMPARISON_READY" | "VALIDATED" | "REJECTED" | "PRESENTED" | "SUPERSEDED" | "ARCHIVED";
export type PathConfidenceBand = "LOW" | "MODERATE" | "HIGH" | "CERTIFICATION_READY";
export type RecommendationPathScenario = RecommendationGenerationScenario | "CRITICAL_RISK" | "INCOMPLETE_EVIDENCE" | "MISSING_PREFERRED" | "MISSING_CONSERVATIVE" | "MISSING_ESCALATION" | "MISSING_REMEDIATION" | "MISSING_PATH_EVIDENCE" | "MISSING_RISK_RATIONALE" | "CONFIDENCE_MISMATCH" | "PRIORITY_MISMATCH" | "ORDERING_MISMATCH" | "COMPARISON_MISMATCH" | "PATH_LEDGER_FAILURE" | "PATH_REPLAY_MISMATCH" | "HIDDEN_PATH_STATE";

export type AlternativeGovernancePath = Readonly<{
  path_id: string;
  recommendation_id: string;
  tenant_id: string;
  mission_id: string;
  governance_intelligence_id: string;
  path_type: AlternativePathType;
  path_title: string;
  path_summary: string;
  path_rationale: string;
  path_priority: RecommendationGenerationPriority;
  path_confidence: PathConfidenceBand;
  path_confidence_score: number;
  path_risk_score: number;
  addressed_risks: readonly string[];
  introduced_risks: readonly string[];
  residual_risk: string;
  evidence_refs: readonly string[];
  policy_refs: readonly string[];
  compliance_refs: readonly string[];
  control_refs: readonly string[];
  governance_constraints: RecommendationGovernanceConstraints;
  constitutional_constraints: readonly string[];
  advisory_only: true;
  execution_authority: false;
  mutation_authority: false;
  approval_authority: false;
  deployment_authority: false;
  operator_action_required: true;
  validation_requirements: readonly string[];
  replay_refs: readonly string[];
  truth_ledger_refs: readonly string[];
  ordering_rationale: string;
  created_timestamp: string;
  path_version: "ALTERNATIVE-PATH-V1";
  lifecycle_state: AlternativePathLifecycleState;
  path_hash: string;
}>;

export type PathComparisonDimension = "risk_reduction" | "residual_risk" | "confidence" | "evidence_strength" | "governance_impact" | "compliance_impact" | "certification_impact" | "operator_burden" | "implementation_complexity" | "replay_status";

export type AlternativePathComparison = Readonly<{
  comparison_id: string;
  recommendation_id: string;
  dimensions: readonly PathComparisonDimension[];
  matrix: Readonly<Record<AlternativePathType, Readonly<Record<PathComparisonDimension, string>>>>;
  comparison_rationale: string;
  comparison_hash: string;
}>;

export type AlternativePathLedgerRecord = Readonly<{
  path_ledger_id: string;
  tenant_id: string;
  mission_id: string;
  recommendation_ids: readonly string[];
  path_ids: readonly string[];
  evidence_refs: readonly string[];
  lineage_refs: readonly string[];
  replay_refs: readonly string[];
  truth_ledger_refs: readonly string[];
  comparison_refs: readonly string[];
  created_timestamp: string;
  path_ledger_hash: string;
}>;

export type AlternativePathGenerationResult = Readonly<{
  contract_version: "ALTERNATIVE-GOVERNANCE-PATHS-V1";
  tenant_id: string;
  mission_id: string;
  source_generation: RecommendationGenerationResult;
  paths: readonly AlternativeGovernancePath[];
  comparison: AlternativePathComparison;
  ledger_record: AlternativePathLedgerRecord;
  ordering: readonly AlternativePathType[];
  ordering_rationale: string;
  validation_state: RecommendationValidationState;
  replay_state: RecommendationReplayState;
  certification_state: RecommendationCertificationState;
  path_generation_hash: string;
}>;

export type AlternativePathFailureReason =
  | RecommendationGenerationFailureReason
  | "PATH_RESULT_MISSING"
  | "PREFERRED_PATH_MISSING"
  | "CONSERVATIVE_PATH_MISSING"
  | "REQUIRED_ESCALATION_PATH_MISSING"
  | "REQUIRED_REMEDIATION_PATH_MISSING"
  | "PATH_EVIDENCE_MISSING"
  | "PATH_RISK_RATIONALE_MISSING"
  | "PATH_CONFIDENCE_MISMATCH"
  | "PATH_PRIORITY_MISMATCH"
  | "PATH_ORDERING_MISMATCH"
  | "PATH_COMPARISON_MISMATCH"
  | "ADVISORY_ONLY_BOUNDARY_MISSING"
  | "EXECUTION_AUTHORITY_DETECTED"
  | "TENANT_SCOPE_VIOLATION"
  | "PATH_LEDGER_RECORD_MISSING"
  | "PATH_REPLAY_MISMATCH"
  | "HIDDEN_PATH_STATE_DETECTED"
  | "PATH_HASH_MISMATCH";

export type AlternativePathValidationFailure = Readonly<{
  failure_id: string;
  reason: AlternativePathFailureReason;
  field_path: string;
  message: string;
  fail_closed: true;
}>;

export type AlternativePathValidationResult = Readonly<{
  validation_state: RecommendationValidationState;
  validator_version: "ALTERNATIVE-PATH-VALIDATOR-V1";
  checks: Readonly<{
    preferred_path_generated: boolean;
    conservative_path_generated: boolean;
    escalation_path_generated_when_required: boolean;
    remediation_path_generated_when_required: boolean;
    evidence_bound: boolean;
    risk_rationale_present: boolean;
    confidence_reproducible: boolean;
    priority_reproducible: boolean;
    ordering_deterministic: boolean;
    comparison_reproducible: boolean;
    advisory_only_enforced: boolean;
    tenant_isolated: boolean;
    ledger_recorded: boolean;
    replay_ready: boolean;
    hidden_state_absent: boolean;
    hash_valid: boolean;
  }>;
  errors: readonly AlternativePathValidationFailure[];
  warnings: readonly string[];
  validation_timestamp: string;
}>;

export type AlternativePathReplayResult = Readonly<{
  replay_id: string;
  replay_state: RecommendationReplayState;
  reconstructed_hash: string;
  expected_hash: string;
  reconstructed_ordering: readonly AlternativePathType[];
  expected_ordering: readonly AlternativePathType[];
  failure_reason: AlternativePathFailureReason | null;
}>;

export type AlternativePathObservabilitySurface = Readonly<{
  path_count: number;
  path_types: readonly AlternativePathType[];
  preferred_path: string | null;
  ordering_rationale: string;
  path_summaries: readonly string[];
  evidence_by_path: Readonly<Record<AlternativePathType, readonly string[]>>;
  risk_by_path: Readonly<Record<AlternativePathType, string>>;
  confidence_by_path: Readonly<Record<AlternativePathType, PathConfidenceBand>>;
  comparison: AlternativePathComparison;
  replay_state: RecommendationReplayState;
  advisory_only_notice: string;
  validation_failures: readonly AlternativePathFailureReason[];
}>;

export type AlternativePathDoctrine = Readonly<{
  principles: readonly ("deterministic" | "evidence-supported" | "risk-differentiated" | "confidence-scored" | "governance-constrained" | "advisory-only" | "tenant-safe" | "truth-ledger-recorded" | "replayable" | "operator-visible" | "fail-closed")[];
  path_types: readonly AlternativePathType[];
  lifecycle_states: readonly AlternativePathLifecycleState[];
  contract_version: "ALTERNATIVE-GOVERNANCE-PATHS-V1";
}>;
