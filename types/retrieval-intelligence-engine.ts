export type RetrievalIntelligenceStatus = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type RetrievalLifecycleStage = "REQUESTED" | "IDENTITY_VALIDATED" | "TENANT_VALIDATED" | "CONSTITUTION_VALIDATED" | "GOVERNANCE_VALIDATED" | "FILTERED" | "SEMANTIC_SEARCH" | "RANKED" | "VERIFIED" | "CERTIFIED" | "RETURNED" | "LEDGERED";
export type RetrievalFailure =
  | "HISTORICAL_REASONING_NOT_CERTIFIED"
  | "CONTRACT_INVALID"
  | "IDENTITY_INVALID"
  | "TENANT_ISOLATION_BREACH"
  | "CONSTITUTIONAL_POLICY_VIOLATION"
  | "GOVERNANCE_POLICY_VIOLATION"
  | "QUALIFICATION_BYPASS"
  | "CONFIDENCE_THRESHOLD_BYPASS"
  | "TEMPORAL_FILTER_INVALID"
  | "CONTEXT_RESOLUTION_NONDETERMINISTIC"
  | "SEMANTIC_RETRIEVAL_NONDETERMINISTIC"
  | "RANKING_NONREPRODUCIBLE"
  | "EVIDENCE_INCOMPLETE"
  | "EXPLANATION_INCOMPLETE"
  | "UNAUTHORIZED_EXPOSURE"
  | "REVOKED_KNOWLEDGE_RETRIEVED"
  | "EXPIRED_KNOWLEDGE_RETRIEVED"
  | "QUARANTINED_KNOWLEDGE_RETRIEVED"
  | "REPLAY_DIVERGENCE"
  | "LEDGER_MUTATION"
  | "INTEGRITY_HASH_MISMATCH"
  | "OBSERVABILITY_INCOMPLETE";
export type RetrievalScenario = "BASELINE" | RetrievalFailure;

export type RetrievalIntelligenceContract = Readonly<{
  contract_id: string;
  lifecycle: readonly RetrievalLifecycleStage[];
  governance_first: true;
  certified_only: boolean;
  deterministic_retrieval_required: boolean;
  constitutional_filter_required: boolean;
  governance_filter_required: boolean;
  tenant_filter_required: boolean;
  qualification_filter_required: boolean;
  confidence_filter_required: boolean;
  temporal_filter_required: boolean;
  explanation_required: boolean;
  replay_required: boolean;
  minimum_confidence: number;
  integrity_hash: string;
}>;

export type RetrievalCandidate = Readonly<{
  candidate_id: string;
  source_ref: string;
  tenant_id: string;
  qualified: boolean;
  certified: boolean;
  governance_approved: boolean;
  constitutional_permitted: boolean;
  temporal_valid: boolean;
  confidence: number;
  evidence_refs: readonly string[];
  rejected_reason: RetrievalFailure | null;
  integrity_hash: string;
}>;

export type RankingResult = Readonly<{
  ranking_id: string;
  record_ref: string;
  rank: number;
  semantic_similarity: number;
  qualification_score: number;
  confidence: number;
  evidence_quality: number;
  governance_priority: number;
  recency: number;
  mission_relevance: number;
  historical_effectiveness: number;
  final_score: number;
  integrity_hash: string;
}>;

export type RetrievalRecord = Readonly<{
  retrieval_id: string;
  tenant_id: string;
  request_id: string;
  query: string;
  semantic_vector: readonly number[];
  retrieval_scope: string;
  context_scope: string;
  filters_applied: readonly string[];
  qualification_filters: readonly string[];
  confidence_filters: readonly string[];
  governance_filters: readonly string[];
  constitutional_filters: readonly string[];
  temporal_filters: readonly string[];
  candidate_records: readonly string[];
  approved_records: readonly string[];
  rejected_records: readonly string[];
  ranking_results: readonly string[];
  retrieval_confidence: number;
  retrieval_reason: string;
  evidence_refs: readonly string[];
  retrieval_timestamp: string;
  operator_id: string;
  integrity_hash: string;
}>;

export type RetrievalExplanation = Readonly<{
  explanation_id: string;
  why_retrieved: readonly string[];
  why_rejected: readonly string[];
  applied_filters: readonly string[];
  evidence_chain: readonly string[];
  confidence_summary: string;
  governance_rationale: string;
  constitutional_rationale: string;
  lineage_report: readonly string[];
  complete: boolean;
  integrity_hash: string;
}>;

export type RetrievalLedgerEntry = Readonly<{
  ledger_entry_id: string;
  sequence: number;
  event: "RETRIEVAL_REQUESTED" | "IDENTITY_VALIDATED" | "POLICY_VALIDATED" | "CANDIDATES_FILTERED" | "SEMANTIC_SEARCHED" | "RANKED" | "EVIDENCE_VERIFIED" | "EXPLAINED" | "CERTIFIED" | "REPLAY_RECORDED";
  retrieval_id: string;
  candidate_refs: readonly string[];
  replay_refs: readonly string[];
  append_only: boolean;
  integrity_hash: string;
}>;

export type RetrievalObservability = Readonly<{
  observability_id: string;
  retrieval_latency_ms: number;
  failed_retrievals: number;
  unauthorized_attempts: number;
  policy_violations: number;
  stale_intelligence: number;
  replay_divergence: number;
  ranking_drift: number;
  semantic_index_health: number;
  ledger_integrity: boolean;
  operational: boolean;
  integrity_hash: string;
}>;

export type RetrievalCertificationTest = Readonly<{
  test_id: string;
  name: string;
  expected: "PASS";
  actual: "PASS" | "FAIL";
  passed: boolean;
  failure_reason: RetrievalFailure | null;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type RetrievalCertification = Readonly<{
  certification_id: string;
  status: RetrievalIntelligenceStatus;
  production_ready: boolean;
  failures: readonly RetrievalFailure[];
  tests: readonly RetrievalCertificationTest[];
  integrity_hash: string;
}>;

export type RetrievalInput = Readonly<{ scenario?: RetrievalScenario; tenant_id?: string; query?: string }>;

export type RetrievalResult = Readonly<{
  retrieval_version: "retrieval-intelligence-engine/v11.6";
  retrieval_identifier: "RetrievalIntelligenceEngine";
  historical_reasoning_certified: boolean;
  contract: RetrievalIntelligenceContract;
  candidates: readonly RetrievalCandidate[];
  approved_records: readonly RetrievalCandidate[];
  rejected_records: readonly RetrievalCandidate[];
  rankings: readonly RankingResult[];
  explanation: RetrievalExplanation;
  record: RetrievalRecord;
  ledger: readonly RetrievalLedgerEntry[];
  observability: RetrievalObservability;
  certification: RetrievalCertification;
  replay_hash: string;
  integrity_hash: string;
}>;

export type RetrievalValidation = Readonly<{
  retrieval_id: string | null;
  valid: boolean;
  status: RetrievalIntelligenceStatus;
  production_ready: boolean;
  failures: readonly RetrievalFailure[];
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  validation_hash: string;
}>;

export type RetrievalContractBundle = Readonly<{
  doctrine: Readonly<{
    version: "retrieval-intelligence-engine/v11.6";
    governance_first: true;
    conventional_rag: false;
    certified_only: true;
    never_retrieve_rules: readonly string[];
  }>;
  result: RetrievalResult;
  validation: RetrievalValidation;
  observability: RetrievalObservability;
}>;
