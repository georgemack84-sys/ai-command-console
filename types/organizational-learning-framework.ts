export type OrganizationalLearningStatus = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type LearningCategory = "STRATEGIC" | "OPERATIONAL" | "GOVERNANCE" | "RISK" | "CONFIDENCE" | "ORGANIZATIONAL";
export type LearningFailure =
  | "RETRIEVAL_NOT_CERTIFIED"
  | "CONTRACT_INVALID"
  | "EVIDENCE_INSUFFICIENT"
  | "CONFIDENCE_NOT_QUALIFIED"
  | "DUPLICATE_NOT_CONSOLIDATED"
  | "QUALIFICATION_INCONSISTENT"
  | "RECOMMENDATION_NONREPRODUCIBLE"
  | "GOVERNANCE_RECOMMENDATION_LOW_QUALITY"
  | "RISK_REDUCTION_NOT_VALIDATED"
  | "CONFIDENCE_IMPROVEMENT_INVALID"
  | "REPLAY_DIVERGENCE"
  | "LINEAGE_INCOMPLETE"
  | "OUTCOME_INCONSISTENT"
  | "CONSTITUTIONAL_VIOLATION"
  | "HUMAN_APPROVAL_MISSING"
  | "POLICY_NONCOMPLIANCE"
  | "AUTHORITY_BOUNDARY_VIOLATION"
  | "TENANT_ISOLATION_BREACH"
  | "LEDGER_MUTATION"
  | "ACCESS_CONTROL_FAILURE"
  | "AUDIT_INCOMPLETE"
  | "TREND_NONREPRODUCIBLE"
  | "STRATEGIC_EVOLUTION_INCONSISTENT"
  | "METRICS_NONDETERMINISTIC"
  | "LESSON_EXPLAINABILITY_INCOMPLETE"
  | "INTEGRITY_HASH_MISMATCH"
  | "OBSERVABILITY_INCOMPLETE";
export type LearningScenario = "BASELINE" | LearningFailure;

export type LearningContract = Readonly<{
  contract_id: string;
  lifecycle: readonly ("QUALIFIED_MISSION_HISTORY" | "HISTORICAL_ANALYSIS" | "PATTERN_CONSOLIDATION" | "LESSON_QUALIFICATION" | "RECOMMENDATION_GENERATION" | "GOVERNANCE_VALIDATION" | "REPLAY_VALIDATION" | "INSTITUTIONAL_INTELLIGENCE")[];
  advisory_only: boolean;
  self_executing_changes_supported: false;
  governance_required: boolean;
  constitutional_required: boolean;
  human_authority_required: boolean;
  tenant_isolation_required: boolean;
  replay_required: boolean;
  integrity_hash: string;
}>;

export type QualifiedLesson = Readonly<{
  lesson_id: string;
  category: LearningCategory;
  evidence_refs: readonly string[];
  confidence_score: number;
  replay_validated: boolean;
  governance_approved: boolean;
  constitutional_valid: boolean;
  duplicate_consolidated: boolean;
  operator_review_complete: boolean;
  lineage_refs: readonly string[];
  explainable: boolean;
  integrity_hash: string;
}>;

export type OrganizationalRecommendation = Readonly<{
  recommendation_id: string;
  category: LearningCategory;
  title: string;
  evidence_refs: readonly string[];
  reproducible: boolean;
  advisory_only: boolean;
  governance_required: boolean;
  auto_execute: false;
  expected_improvement: number;
  integrity_hash: string;
}>;

export type TrendIntelligence = Readonly<{
  trend_id: string;
  category: LearningCategory;
  pattern_refs: readonly string[];
  reproducible: boolean;
  explanation: string;
  integrity_hash: string;
}>;

export type StrategicEvolutionRecord = Readonly<{
  evolution_id: string;
  strategy_lineage: readonly string[];
  recommendation_lineage: readonly string[];
  improvement_history: readonly string[];
  evolution_confidence: number;
  governance_evolution: readonly string[];
  effectiveness_trend: readonly number[];
  traceable: boolean;
  integrity_hash: string;
}>;

export type InstitutionalMetrics = Readonly<{
  metrics_id: string;
  lesson_quality: number;
  recommendation_effectiveness: number;
  governance_efficiency: number;
  strategy_improvement: number;
  organizational_maturity: number;
  confidence_growth: number;
  risk_reduction: number;
  replay_stability: number;
  evidence_quality: number;
  qualification_success: number;
  operator_adoption: number;
  institutional_growth: number;
  deterministic: boolean;
  integrity_hash: string;
}>;

export type InstitutionalLearningRecord = Readonly<{
  learning_id: string;
  organization_id: string;
  tenant_id: string;
  learning_type: "INSTITUTIONAL_INTELLIGENCE";
  learning_category: LearningCategory;
  source_history_refs: readonly string[];
  qualified_lesson_refs: readonly string[];
  recommendation_refs: readonly string[];
  trend_refs: readonly string[];
  organizational_metrics: string;
  confidence_score: number;
  governance_status: "APPROVED" | "REVIEW_REQUIRED";
  operator_status: "APPROVED" | "PENDING";
  qualification_status: "QUALIFIED" | "REJECTED";
  replay_status: "VALID" | "DIVERGED";
  lineage_refs: readonly string[];
  certification_status: OrganizationalLearningStatus;
  created_at: string;
  integrity_hash: string;
}>;

export type LearningLedgerEntry = Readonly<{
  ledger_entry_id: string;
  sequence: number;
  event: "LESSON_QUALIFIED" | "RECOMMENDATION_GENERATED" | "LINEAGE_RECORDED" | "GOVERNANCE_APPROVED" | "REPLAY_VALIDATED" | "STRATEGY_EVOLVED" | "METRICS_RECORDED" | "CERTIFICATION_RECORDED";
  learning_id: string;
  replay_refs: readonly string[];
  append_only: boolean;
  integrity_hash: string;
}>;

export type LearningObservability = Readonly<{
  observability_id: string;
  learning_throughput: number;
  qualification_failures: number;
  recommendation_quality: number;
  governance_latency_ms: number;
  replay_failures: number;
  lesson_adoption: number;
  strategic_evolution: number;
  confidence_improvements: number;
  risk_reductions: number;
  institutional_growth: number;
  certification_readiness: number;
  operational: boolean;
  integrity_hash: string;
}>;

export type LearningCertificationTest = Readonly<{
  test_id: string;
  name: string;
  expected: "PASS";
  actual: "PASS" | "FAIL";
  passed: boolean;
  failure_reason: LearningFailure | null;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type LearningCertification = Readonly<{
  certification_id: string;
  status: OrganizationalLearningStatus;
  approved_for_organizational_use: boolean;
  failures: readonly LearningFailure[];
  tests: readonly LearningCertificationTest[];
  integrity_hash: string;
}>;

export type OrganizationalLearningInput = Readonly<{ scenario?: LearningScenario; tenant_id?: string; organization_id?: string }>;

export type OrganizationalLearningResult = Readonly<{
  learning_version: "organizational-learning-framework/v11.7";
  learning_identifier: "OrganizationalLearningFramework";
  retrieval_certified: boolean;
  contract: LearningContract;
  lessons: readonly QualifiedLesson[];
  recommendations: readonly OrganizationalRecommendation[];
  trends: readonly TrendIntelligence[];
  strategic_evolution: StrategicEvolutionRecord;
  metrics: InstitutionalMetrics;
  record: InstitutionalLearningRecord;
  ledger: readonly LearningLedgerEntry[];
  observability: LearningObservability;
  certification: LearningCertification;
  replay_hash: string;
  integrity_hash: string;
}>;

export type OrganizationalLearningValidation = Readonly<{
  learning_id: string | null;
  valid: boolean;
  status: OrganizationalLearningStatus;
  approved_for_organizational_use: boolean;
  failures: readonly LearningFailure[];
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  validation_hash: string;
}>;

export type OrganizationalLearningContractBundle = Readonly<{
  doctrine: Readonly<{
    version: "organizational-learning-framework/v11.7";
    advisory_only: true;
    automatic_policy_changes_supported: false;
    automatic_execution_supported: false;
    cross_tenant_learning_supported: false;
    categories: readonly LearningCategory[];
  }>;
  result: OrganizationalLearningResult;
  validation: OrganizationalLearningValidation;
  observability: LearningObservability;
}>;
