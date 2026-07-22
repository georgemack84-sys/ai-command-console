export type ProductionReplayDeterminismOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type ReplayDivergenceCategory = "NO_DIVERGENCE" | "INPUT_DIVERGENCE" | "CONFIGURATION_DIVERGENCE" | "DEPENDENCY_DIVERGENCE" | "POLICY_DIVERGENCE" | "MODEL_DIVERGENCE" | "ORDERING_DIVERGENCE" | "EVIDENCE_DIVERGENCE" | "EXPLANATION_DIVERGENCE" | "OUTPUT_DIVERGENCE" | "UNEXPLAINED_DIVERGENCE";
export type ReplayDeterminismStatus = "DETERMINISTIC" | "NON_DETERMINISTIC" | "BLOCKED";
export type ReplayCertificationStatus = "CERTIFIED" | "BLOCKED" | "REQUIRES_REVIEW";
export type ProductionReplayDeterminismFailure = "REPLAY_NOT_DETERMINISTIC" | "DIVERGENCE_NOT_GOVERNED" | "REPLAY_NOT_REPRODUCIBLE" | "EXPLANATIONS_NOT_CONSISTENT" | "EVIDENCE_INTEGRITY_NOT_VERIFIED" | "REPLAY_LINEAGE_INCOMPLETE" | "REPLAY_EVIDENCE_MUTABLE" | "UNEXPLAINED_DIVERGENCE_NOT_BLOCKING" | "ADVISORY_BOUNDARY_NOT_PRESERVED" | "TENANT_ISOLATION_NOT_MAINTAINED" | "EVIDENCE_PLATFORM_NOT_REUSED" | "PHASE_16_4_EVIDENCE_NOT_VALID" | "NON_CONSTITUTIONAL_REPLAY_WARNING";
export type ProductionReplayDeterminismScenario = "BASELINE" | ProductionReplayDeterminismFailure;

export type ProductionReplayDeterminismInput = Readonly<{ scenario?: ProductionReplayDeterminismScenario; tenant_id?: string; operator_id?: string; mission_id?: string; replay_session_id?: string }>;

export type ProductionReplayEngineRecord = Readonly<{
  replay_engine_id: string;
  replay_session_id: string;
  replay_inputs: readonly string[];
  replay_outputs: readonly string[];
  reconstructed_recommendations: readonly string[];
  reconstructed_explanations: readonly string[];
  reconstructed_confidence: readonly number[];
  reconstructed_evidence: readonly string[];
  reconstructed_governance: readonly string[];
  reconstructed_operator_workflow: readonly string[];
  reconstructed_certification_context: readonly string[];
  reconstructed_lineage: readonly string[];
  deterministic: boolean;
  advisory_only: boolean;
  mutates_production_state: boolean;
  integrity_hash: string;
}>;

export type ReplayComparatorRecord = Readonly<{
  comparator_id: string;
  recommendation_equal: boolean;
  explanation_equal: boolean;
  confidence_equal: boolean;
  evidence_equal: boolean;
  governance_equal: boolean;
  ordering_equal: boolean;
  policy_equal: boolean;
  operator_interaction_equal: boolean;
  replay_references_equal: boolean;
  certification_references_equal: boolean;
  deterministic_behavior: boolean;
  integrity_hash: string;
}>;

export type ProductionReplayDivergenceRecord = Readonly<{
  divergence_id: string;
  tenant_id: string;
  pilot_id: string;
  recommendation_id: string;
  replay_id: string;
  replay_session_id: string;
  divergence_category: ReplayDivergenceCategory;
  severity: "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  expected_behavior: string;
  observed_behavior: string;
  root_cause: string | null;
  evidence_refs: readonly string[];
  policy_refs: readonly string[];
  replay_refs: readonly string[];
  certification_refs: readonly string[];
  classification_status: "CLASSIFIED" | "UNCLASSIFIED";
  resolution_status: "RESOLVED" | "UNRESOLVED" | "NOT_REQUIRED";
  detected_timestamp: string;
  blocks_certification: boolean;
  deterministic_classification: boolean;
  integrity_hash: string;
}>;

export type ProductionReplayRecord = Readonly<{
  replay_id: string;
  tenant_id: string;
  pilot_id: string;
  replay_scope: string;
  production_reference: string;
  replay_reference: string;
  recommendation_refs: readonly string[];
  evidence_refs: readonly string[];
  operator_refs: readonly string[];
  governance_refs: readonly string[];
  comparison_result: "MATCH" | "MISMATCH";
  determinism_status: ReplayDeterminismStatus;
  divergence_summary: ReplayDivergenceCategory;
  certification_status: ReplayCertificationStatus;
  created_timestamp: string;
  integrity_hash: string;
}>;

export type ReplayLineageRecord = Readonly<{
  lineage_id: string;
  unified_lineage_ref: string;
  production_activity_refs: readonly string[];
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  comparison_refs: readonly string[];
  validation_refs: readonly string[];
  certification_refs: readonly string[];
  duplicate_lineage_created: boolean;
  complete: boolean;
  immutable: boolean;
  integrity_hash: string;
}>;

export type ReplayLedgerEntry = Readonly<{
  ledger_entry_id: string;
  sequence: number;
  event_type: "REPLAY_REQUEST" | "REPLAY_EXECUTION" | "REPLAY_OUTPUT" | "REPLAY_COMPARISON" | "DIVERGENCE_CLASSIFICATION" | "REPLAY_VALIDATION" | "LINEAGE_EXTENSION" | "CERTIFICATION_REFERENCE";
  replay_session_id: string;
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  certification_refs: readonly string[];
  append_only: boolean;
  immutable: boolean;
  integrity_hash: string;
}>;

export type ReplayObservabilityRecord = Readonly<{
  replay_success_rate: number;
  replay_latency_ms: number;
  replay_determinism: boolean;
  divergence_classifications: readonly ReplayDivergenceCategory[];
  explanation_consistency: boolean;
  evidence_integrity: boolean;
  replay_lineage_health: boolean;
  certification_blockers: number;
  tenant_replay_isolation: boolean;
  unresolved_replay_divergence: number;
  integrity_hash: string;
}>;

export type ProductionReplayDeterminismCertificationTest = Readonly<{
  test_id: string;
  name: string;
  expected: "PASS";
  actual: ProductionReplayDeterminismOutcome;
  passed: boolean;
  failure_reason: ProductionReplayDeterminismFailure | null;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type ProductionReplayDeterminismResult = Readonly<{
  phase_version: "production-replay-determinism/v16.5";
  phase_identifier: "ProductionReplayDeterminism";
  live_evidence_collection_ref: string;
  engine: ProductionReplayEngineRecord;
  comparator: ReplayComparatorRecord;
  divergence: ProductionReplayDivergenceRecord;
  replay_record: ProductionReplayRecord;
  lineage: ReplayLineageRecord;
  ledger: readonly ReplayLedgerEntry[];
  observability: ReplayObservabilityRecord;
  certification_tests: readonly ProductionReplayDeterminismCertificationTest[];
  failures: readonly ProductionReplayDeterminismFailure[];
  outcome: ProductionReplayDeterminismOutcome;
  replay_hash: string;
  integrity_hash: string;
}>;

export type ProductionReplayDeterminismValidation = Readonly<{
  valid: boolean;
  outcome: ProductionReplayDeterminismOutcome;
  engine_valid: boolean;
  comparator_valid: boolean;
  divergence_valid: boolean;
  replay_record_valid: boolean;
  lineage_valid: boolean;
  ledger_valid: boolean;
  observability_valid: boolean;
  certification_valid: boolean;
  result_replay_valid: boolean;
  failures: readonly ProductionReplayDeterminismFailure[];
  integrity_hash: string;
}>;

export type ProductionReplayDeterminismBundle = Readonly<{
  doctrine: Readonly<{
    version: "production-replay-determinism/v16.5";
    upstream_phase: "live-evidence-collection/v16.4";
    divergence_categories: readonly ReplayDivergenceCategory[];
    certification_outcomes: readonly ProductionReplayDeterminismOutcome[];
  }>;
  result: ProductionReplayDeterminismResult;
  validation: ProductionReplayDeterminismValidation;
}>;
