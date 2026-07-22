export type HistoricalReasoningStatus = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type HistoricalReasoningType = "HISTORICAL_COMPARISON" | "RECOMMENDATION_LOOKUP" | "OUTCOME_CORRELATION" | "STRATEGY_EVOLUTION" | "FAILURE_ANALYSIS" | "SUCCESS_ANALYSIS" | "TEMPORAL_ANALYSIS" | "COUNTERFACTUAL_REFERENCE" | "HISTORICAL_CONFIDENCE" | "HISTORICAL_RECOMMENDATION";
export type HistoricalReasoningFailure =
  | "GRAPH_NOT_CERTIFIED"
  | "CONTRACT_INVALID"
  | "RETRIEVAL_NONDETERMINISTIC"
  | "QUALIFICATION_BYPASS"
  | "VERSION_INCORRECT"
  | "LINEAGE_INCOMPLETE"
  | "SIMILARITY_NONREPRODUCIBLE"
  | "CONTEXT_INCONSISTENT"
  | "RECOMMENDATION_LOOKUP_INVALID"
  | "ADVISORY_ONLY_VIOLATION"
  | "OUTCOME_CORRELATION_INVALID"
  | "STRATEGY_CORRELATION_INVALID"
  | "CONFIDENCE_CORRELATION_INVALID"
  | "TEMPORAL_NONDETERMINISTIC"
  | "COUNTERFACTUAL_CONTAMINATION"
  | "CONFIDENCE_INCONSISTENT"
  | "GOVERNANCE_VALIDATION_MISSING"
  | "CONSTITUTIONAL_VALIDATION_MISSING"
  | "TENANT_ISOLATION_BREACH"
  | "HISTORICAL_MUTATION_ATTEMPT"
  | "REPLAY_DIVERGENCE"
  | "LEDGER_MUTATION"
  | "INTEGRITY_HASH_MISMATCH"
  | "OBSERVABILITY_INCOMPLETE";
export type HistoricalReasoningScenario = "BASELINE" | HistoricalReasoningFailure;

export type HistoricalReasoningContract = Readonly<{
  contract_id: string;
  lifecycle: readonly ("HISTORICAL_REQUEST" | "MISSION_QUALIFICATION" | "HISTORICAL_RETRIEVAL" | "SIMILARITY_ANALYSIS" | "RECOMMENDATION_LOOKUP" | "OUTCOME_CORRELATION" | "STRATEGY_EVOLUTION_ANALYSIS" | "SUCCESS_ANALYSIS" | "FAILURE_ANALYSIS" | "TEMPORAL_REASONING" | "COUNTERFACTUAL_REFERENCE" | "HISTORICAL_CONFIDENCE_CALCULATION" | "HISTORICAL_RECOMMENDATION_GENERATION" | "GOVERNANCE_VALIDATION" | "CONSTITUTIONAL_VALIDATION" | "OPERATOR_VISIBILITY" | "LEDGER_RECORDING")[];
  advisory_only: boolean;
  mutation_supported: false;
  autonomous_learning_supported: false;
  deterministic_retrieval_required: boolean;
  replay_required: boolean;
  governance_required: boolean;
  constitutional_required: boolean;
  tenant_isolation_required: boolean;
  counterfactual_separation_required: boolean;
  integrity_hash: string;
}>;

export type HistoricalReport = Readonly<{
  report_id: string;
  score: number;
  deterministic: boolean;
  refs: readonly string[];
  explanation: string;
  integrity_hash: string;
}>;

export type CounterfactualReferenceReport = HistoricalReport & Readonly<{
  simulated_refs: readonly string[];
  actual_history_refs: readonly string[];
  separated_from_history: boolean;
}>;

export type HistoricalRecommendation = Readonly<{
  recommendation_id: string;
  title: string;
  advisory_only: boolean;
  lineage_refs: readonly string[];
  governance_required: boolean;
  constitutional_required: boolean;
  auto_execute: false;
  integrity_hash: string;
}>;

export type HistoricalReasoningRecord = Readonly<{
  reasoning_id: string;
  tenant_id: string;
  mission_id: string;
  request_timestamp: string;
  reasoning_scope: string;
  reasoning_type: HistoricalReasoningType;
  historical_context_refs: readonly string[];
  mission_refs: readonly string[];
  pattern_refs: readonly string[];
  recommendation_refs: readonly string[];
  strategy_refs: readonly string[];
  outcome_refs: readonly string[];
  similarity_results: readonly string[];
  temporal_results: readonly string[];
  counterfactual_refs: readonly string[];
  confidence_result: string;
  generated_recommendations: readonly string[];
  governance_status: "APPROVED" | "REVIEW_REQUIRED";
  constitutional_status: "VALID" | "VIOLATION";
  replay_refs: readonly string[];
  ledger_refs: readonly string[];
  integrity_hash: string;
}>;

export type HistoricalReasoningLedgerEntry = Readonly<{
  ledger_entry_id: string;
  sequence: number;
  event: "REASONING_REQUESTED" | "HISTORICAL_RETRIEVED" | "COMPARISON_COMPLETED" | "CORRELATION_COMPLETED" | "CONFIDENCE_CALCULATED" | "RECOMMENDATION_GENERATED" | "GOVERNANCE_VALIDATED" | "CONSTITUTIONAL_VALIDATED" | "OPERATOR_VISIBLE" | "REPLAY_RECORDED";
  reasoning_id: string;
  replay_refs: readonly string[];
  append_only: boolean;
  integrity_hash: string;
}>;

export type HistoricalReasoningObservability = Readonly<{
  observability_id: string;
  retrieval_latency_ms: number;
  similarity_quality: number;
  replay_consistency: number;
  reasoning_failures: number;
  governance_violations: number;
  historical_drift: number;
  lineage_completeness: number;
  confidence_distribution: readonly number[];
  counterfactual_separation: boolean;
  ledger_integrity: boolean;
  operational: boolean;
  integrity_hash: string;
}>;

export type HistoricalReasoningCertificationTest = Readonly<{
  test_id: string;
  name: string;
  expected: "PASS";
  actual: "PASS" | "FAIL";
  passed: boolean;
  failure_reason: HistoricalReasoningFailure | null;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type HistoricalReasoningCertification = Readonly<{
  certification_id: string;
  status: HistoricalReasoningStatus;
  production_ready: boolean;
  failures: readonly HistoricalReasoningFailure[];
  tests: readonly HistoricalReasoningCertificationTest[];
  integrity_hash: string;
}>;

export type HistoricalReasoningInput = Readonly<{ scenario?: HistoricalReasoningScenario; tenant_id?: string; mission_id?: string }>;

export type HistoricalReasoningResult = Readonly<{
  historical_reasoning_version: "historical-reasoning-engine/v11.5";
  historical_reasoning_identifier: "HistoricalReasoningEngine";
  graph_certified: boolean;
  contract: HistoricalReasoningContract;
  retrieval: HistoricalReport;
  comparison: HistoricalReport;
  recommendation_history: HistoricalReport;
  outcome_correlation: HistoricalReport;
  strategy_evolution: HistoricalReport;
  failure_analysis: HistoricalReport;
  success_analysis: HistoricalReport;
  temporal_reasoning: HistoricalReport;
  counterfactual_reference: CounterfactualReferenceReport;
  historical_confidence: HistoricalReport;
  recommendations: readonly HistoricalRecommendation[];
  record: HistoricalReasoningRecord;
  ledger: readonly HistoricalReasoningLedgerEntry[];
  observability: HistoricalReasoningObservability;
  certification: HistoricalReasoningCertification;
  replay_hash: string;
  integrity_hash: string;
}>;

export type HistoricalReasoningValidation = Readonly<{
  reasoning_id: string | null;
  valid: boolean;
  status: HistoricalReasoningStatus;
  production_ready: boolean;
  failures: readonly HistoricalReasoningFailure[];
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  validation_hash: string;
}>;

export type HistoricalReasoningContractBundle = Readonly<{
  doctrine: Readonly<{
    version: "historical-reasoning-engine/v11.5";
    advisory_only: true;
    mutation_supported: false;
    autonomous_learning_supported: false;
    counterfactuals_are_history: false;
    reasoning_types: readonly HistoricalReasoningType[];
  }>;
  result: HistoricalReasoningResult;
  validation: HistoricalReasoningValidation;
  observability: HistoricalReasoningObservability;
}>;
