import type {
  RecommendationCertificationState,
  RecommendationConfidenceBand,
  RecommendationContractRecord,
  RecommendationReplayState,
  RecommendationRiskCategory,
  RecommendationSeverityLevel,
  RecommendationType,
  RecommendationValidationFailureReason,
  RecommendationValidationState,
} from "./recommendation-contract";

export type RecommendationGenerationPriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFORMATIONAL";
export type RecommendationGenerationScenario =
  | "BASELINE"
  | "POLICY_CONFLICT"
  | "CONTROL_GAP"
  | "ESCALATION_REQUIRED"
  | "COMPLIANCE_GAP"
  | "REMEDIATION_REQUIRED"
  | "MONITORING_GAP"
  | "CERTIFICATION_READY"
  | "EVIDENCE_CONFLICT"
  | "MISSING_EVIDENCE"
  | "UNSUPPORTED_EVIDENCE"
  | "DUPLICATE_FINDINGS"
  | "CROSS_TENANT"
  | "EXECUTION_AUTHORITY"
  | "LEDGER_FAILURE"
  | "REPLAY_MISMATCH"
  | "HIDDEN_STATE";

export type GovernanceFinding = Readonly<{
  finding_id: string;
  tenant_id: string;
  mission_id: string;
  finding_type: "POLICY" | "CONTROL" | "RISK" | "COMPLIANCE" | "REMEDIATION" | "MONITORING" | "CERTIFICATION";
  severity: RecommendationSeverityLevel;
  description: string;
  policy_refs: readonly string[];
  control_refs: readonly string[];
  compliance_refs: readonly string[];
  risk_refs: readonly string[];
  evidence_refs: readonly string[];
  lineage_refs: readonly string[];
  replay_refs: readonly string[];
  truth_ledger_refs: readonly string[];
}>;

export type AggregatedEvidence = Readonly<{
  evidence_refs: readonly string[];
  lineage_refs: readonly string[];
  replay_refs: readonly string[];
  truth_ledger_refs: readonly string[];
  conflicting_evidence_refs: readonly string[];
  unsupported_evidence_refs: readonly string[];
  evidence_complete: boolean;
  evidence_integrity_valid: boolean;
  aggregation_hash: string;
}>;

export type GovernanceCorrelation = Readonly<{
  policy_to_compliance: readonly string[];
  policy_to_risk: readonly string[];
  risk_to_evidence: readonly string[];
  compliance_to_controls: readonly string[];
  governance_to_certification: readonly string[];
  historical_outcome_refs: readonly string[];
  correlation_hash: string;
}>;

export type RecommendationCandidate = Readonly<{
  candidate_id: string;
  source_findings: readonly string[];
  recommendation_type: RecommendationType;
  supporting_evidence: readonly string[];
  supporting_risk: readonly string[];
  supporting_policies: readonly string[];
  supporting_compliance: readonly string[];
  rationale: string;
  candidate_hash: string;
}>;

export type GeneratedRecommendation = RecommendationContractRecord & Readonly<{
  priority: RecommendationGenerationPriority;
  generation_rationale: string;
  source_findings: readonly string[];
  correlation_hash: string;
  priority_hash: string;
  generation_hash: string;
  truth_record_ref: string;
  advisory_notice: string;
}>;

export type RecommendationGenerationLedgerRecord = Readonly<{
  generation_ledger_id: string;
  tenant_id: string;
  mission_id: string;
  recommendation_ids: readonly string[];
  evidence_refs: readonly string[];
  confidence_refs: readonly string[];
  priority_refs: readonly string[];
  lineage_refs: readonly string[];
  replay_refs: readonly string[];
  truth_ledger_refs: readonly string[];
  generator_version: "RECOMMENDATION-GENERATION-V1";
  generation_timestamp: string;
  generation_hash: string;
}>;

export type RecommendationGenerationResult = Readonly<{
  contract_version: "RECOMMENDATION-GENERATION-V1";
  tenant_id: string;
  mission_id: string;
  generator_version: "RECOMMENDATION-GENERATION-V1";
  intake_findings: readonly GovernanceFinding[];
  aggregated_evidence: AggregatedEvidence;
  governance_correlation: GovernanceCorrelation;
  candidates: readonly RecommendationCandidate[];
  recommendations: readonly GeneratedRecommendation[];
  ledger_record: RecommendationGenerationLedgerRecord;
  validation_state: RecommendationValidationState;
  replay_state: RecommendationReplayState;
  certification_state: RecommendationCertificationState;
  generation_hash: string;
}>;

export type RecommendationGenerationFailureReason =
  | RecommendationValidationFailureReason
  | "GENERATION_RESULT_MISSING"
  | "NO_RECOMMENDATIONS_GENERATED"
  | "UNSUPPORTED_EVIDENCE_ACCEPTED"
  | "DUPLICATE_RECOMMENDATIONS_GENERATED"
  | "PRIORITY_MISMATCH"
  | "CONFIDENCE_MISMATCH"
  | "TRUTH_LEDGER_RECORD_MISSING"
  | "GENERATION_HASH_MISMATCH";

export type RecommendationGenerationValidationFailure = Readonly<{
  failure_id: string;
  reason: RecommendationGenerationFailureReason;
  field_path: string;
  message: string;
  fail_closed: true;
}>;

export type RecommendationGenerationValidationResult = Readonly<{
  validation_state: RecommendationValidationState;
  validator_version: "RECOMMENDATION-GENERATION-VALIDATOR-V1";
  checks: Readonly<{
    recommendations_generated: boolean;
    evidence_aggregated: boolean;
    conflicts_detected: boolean;
    unsupported_evidence_rejected: boolean;
    priorities_deterministic: boolean;
    confidence_deterministic: boolean;
    governance_constraints_preserved: boolean;
    advisory_only_enforced: boolean;
    duplicate_free: boolean;
    replay_ready: boolean;
    lineage_preserved: boolean;
    truth_ledger_recorded: boolean;
    tenant_isolated: boolean;
    hidden_state_absent: boolean;
    hash_valid: boolean;
  }>;
  errors: readonly RecommendationGenerationValidationFailure[];
  warnings: readonly string[];
  validation_timestamp: string;
}>;

export type RecommendationGenerationReplayResult = Readonly<{
  replay_id: string;
  replay_state: RecommendationReplayState;
  reconstructed_generation_hash: string;
  expected_generation_hash: string;
  reconstructed_recommendation_ids: readonly string[];
  expected_recommendation_ids: readonly string[];
  failure_reason: RecommendationGenerationFailureReason | null;
}>;

export type RecommendationGenerationObservabilitySurface = Readonly<{
  recommendation_count: number;
  recommendation_summaries: readonly string[];
  recommendation_types: readonly RecommendationType[];
  priorities: readonly RecommendationGenerationPriority[];
  confidence: readonly RecommendationConfidenceBand[];
  evidence_refs: readonly string[];
  risk_refs: readonly string[];
  policy_refs: readonly string[];
  compliance_refs: readonly string[];
  replay_state: RecommendationReplayState;
  certification_state: RecommendationCertificationState;
  validation_failures: readonly RecommendationGenerationFailureReason[];
}>;

export type RecommendationGenerationDoctrine = Readonly<{
  principles: readonly ("deterministic" | "evidence-backed" | "risk-informed" | "confidence-justified" | "governance-constrained" | "advisory-only" | "tenant-safe" | "truth-ledger-recorded" | "replayable" | "fail-closed")[];
  supported_recommendation_types: readonly RecommendationType[];
  priority_levels: readonly RecommendationGenerationPriority[];
  generator_version: "RECOMMENDATION-GENERATION-V1";
}>;
