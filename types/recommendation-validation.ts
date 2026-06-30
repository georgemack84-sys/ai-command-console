import type { RecommendationReplayState } from "./recommendation-contract";
import type { GeneratedRecommendation } from "./recommendation-generation";
import type { AlternativePathGenerationResult, RecommendationPathScenario } from "./recommendation-paths";

export type RecommendationValidationScenario =
  | RecommendationPathScenario
  | "VALID"
  | "PARTIAL_EVIDENCE"
  | "MISSING_CONTRACT"
  | "UNSUPPORTED_RECOMMENDATION"
  | "MISSING_RISK"
  | "CRITICAL_WITHOUT_ESCALATION"
  | "UNSUPPORTED_CONFIDENCE"
  | "INFLATED_CONFIDENCE"
  | "POLICY_VIOLATION"
  | "CONSTITUTIONAL_CONFLICT"
  | "MUTATION_AUTHORITY"
  | "MISSING_REPLAY_REFS"
  | "REPLAY_IMPOSSIBLE"
  | "MISSING_LEDGER_LINKAGE"
  | "LEDGER_MUTATION_ATTEMPT"
  | "VALIDATION_MISMATCH";

export type RecommendationValidationDecisionState = "VALIDATED" | "CONDITIONAL_VALIDATION" | "REJECTED" | "BLOCKED";
export type RecommendationValidationAreaStatus = "PASS" | "WARNING" | "FAIL" | "BLOCK";

export type RecommendationValidationArea =
  | "contract"
  | "evidence"
  | "risk"
  | "confidence"
  | "governance"
  | "advisory_only"
  | "alternative_path"
  | "tenant_isolation"
  | "replay_readiness"
  | "truth_ledger";

export type RecommendationValidationFindingCode =
  | "CONTRACT_MISSING"
  | "UNSUPPORTED_RECOMMENDATION_TYPE"
  | "SCOPE_MISSING"
  | "IDENTITY_MISSING"
  | "EVIDENCE_MISSING"
  | "EVIDENCE_INCOMPLETE"
  | "EVIDENCE_UNSUPPORTED"
  | "EVIDENCE_LINEAGE_BROKEN"
  | "CONFLICTING_EVIDENCE_UNDISCLOSED"
  | "RISK_ASSESSMENT_MISSING"
  | "RESIDUAL_RISK_MISSING"
  | "RISK_SCORE_UNEXPLAINED"
  | "CRITICAL_ESCALATION_MISSING"
  | "CONFIDENCE_MISSING"
  | "CONFIDENCE_UNSUPPORTED"
  | "CONFIDENCE_INFLATED"
  | "CONFIDENCE_REPLAY_MISMATCH"
  | "GOVERNANCE_CONSTRAINTS_MISSING"
  | "POLICY_VIOLATION"
  | "CONSTITUTIONAL_CONFLICT"
  | "AUTHORITY_EXPANSION"
  | "CERTIFICATION_BYPASS"
  | "PREFERRED_PATH_MISSING"
  | "CONSERVATIVE_PATH_MISSING"
  | "REQUIRED_ESCALATION_PATH_MISSING"
  | "REQUIRED_REMEDIATION_PATH_MISSING"
  | "PATH_EVIDENCE_MISSING"
  | "PATH_CONFIDENCE_UNSUPPORTED"
  | "PATH_ORDERING_MISMATCH"
  | "PATH_COMPARISON_MISMATCH"
  | "EXECUTION_AUTHORITY_DETECTED"
  | "MUTATION_AUTHORITY_DETECTED"
  | "TENANT_BOUNDARY_VIOLATION"
  | "REPLAY_REFS_MISSING"
  | "REPLAY_IMPOSSIBLE"
  | "HIDDEN_STATE_DEPENDENCY"
  | "LEDGER_LINKAGE_MISSING"
  | "LEDGER_MUTATION_ATTEMPT"
  | "VALIDATION_HASH_MISMATCH";

export type RecommendationValidationFinding = Readonly<{
  finding_id: string;
  area: RecommendationValidationArea;
  code: RecommendationValidationFindingCode;
  severity: RecommendationValidationAreaStatus;
  field_path: string;
  message: string;
  corrective_reference: string;
}>;

export type RecommendationValidationAreaResult = Readonly<{
  area: RecommendationValidationArea;
  status: RecommendationValidationAreaStatus;
  findings: readonly RecommendationValidationFinding[];
  rationale: string;
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
}>;

export type RecommendationValidationLedgerRecord = Readonly<{
  validation_ledger_id: string;
  tenant_id: string;
  mission_id: string;
  recommendation_id: string;
  validation_state: RecommendationValidationDecisionState;
  evidence_refs: readonly string[];
  risk_refs: readonly string[];
  confidence_refs: readonly string[];
  alternative_path_refs: readonly string[];
  replay_refs: readonly string[];
  lineage_refs: readonly string[];
  operator_visibility_refs: readonly string[];
  validation_timestamp: string;
  validation_hash: string;
}>;

export type RecommendationValidation = Readonly<{
  validation_id: string;
  recommendation_id: string;
  tenant_id: string;
  mission_id: string;
  governance_intelligence_id: string;
  validation_state: RecommendationValidationDecisionState;
  validation_summary: string;
  contract_result: RecommendationValidationAreaResult;
  evidence_result: RecommendationValidationAreaResult;
  risk_result: RecommendationValidationAreaResult;
  confidence_result: RecommendationValidationAreaResult;
  governance_result: RecommendationValidationAreaResult;
  advisory_only_result: RecommendationValidationAreaResult;
  alternative_path_result: RecommendationValidationAreaResult;
  tenant_isolation_result: RecommendationValidationAreaResult;
  replay_readiness_result: RecommendationValidationAreaResult;
  truth_ledger_result: RecommendationValidationAreaResult;
  blocking_findings: readonly RecommendationValidationFinding[];
  conditional_findings: readonly RecommendationValidationFinding[];
  validation_rationale: string;
  validator_version: "RECOMMENDATION-VALIDATION-V1";
  validation_timestamp: string;
  replay_refs: readonly string[];
  truth_ledger_refs: readonly string[];
  validation_hash: string;
}>;

export type RecommendationValidationResult = Readonly<{
  contract_version: "RECOMMENDATION-VALIDATION-V1";
  source_paths: AlternativePathGenerationResult;
  recommendation: GeneratedRecommendation;
  validation: RecommendationValidation;
  ledger_record: RecommendationValidationLedgerRecord;
  replay_state: RecommendationReplayState;
  certification_state: "PASS" | "CONDITIONAL_PASS" | "FAIL";
}>;

export type RecommendationValidationReplayResult = Readonly<{
  replay_id: string;
  replay_state: RecommendationReplayState;
  reconstructed_validation_hash: string;
  expected_validation_hash: string;
  reconstructed_state: RecommendationValidationDecisionState;
  expected_state: RecommendationValidationDecisionState;
  failure_reason: RecommendationValidationFindingCode | null;
}>;

export type RecommendationValidationObservabilitySurface = Readonly<{
  validation_state: RecommendationValidationDecisionState;
  validation_summary: string;
  passed_checks: readonly RecommendationValidationArea[];
  warning_checks: readonly RecommendationValidationArea[];
  failed_checks: readonly RecommendationValidationArea[];
  blocked_checks: readonly RecommendationValidationArea[];
  evidence_basis: readonly string[];
  risk_basis: readonly string[];
  confidence_basis: Readonly<{ score: number; rationale: string; refs: readonly string[] }>;
  governance_constraints: readonly string[];
  alternative_path_status: RecommendationValidationAreaStatus;
  advisory_only_status: RecommendationValidationAreaStatus;
  replay_readiness: RecommendationValidationAreaStatus;
  truth_ledger_linkage: RecommendationValidationAreaStatus;
  corrective_references: readonly string[];
}>;

export type RecommendationValidationDoctrine = Readonly<{
  principles: readonly ("deterministic" | "contract-valid" | "evidence-backed" | "risk-aware" | "confidence-justified" | "governance-compliant" | "constitutionally-permitted" | "tenant-safe" | "truth-ledger-linked" | "replay-ready" | "advisory-only" | "operator-visible" | "fail-closed")[];
  validation_states: readonly RecommendationValidationDecisionState[];
  area_statuses: readonly RecommendationValidationAreaStatus[];
  contract_version: "RECOMMENDATION-VALIDATION-V1";
}>;
