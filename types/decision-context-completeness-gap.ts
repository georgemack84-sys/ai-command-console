import type { DecisionContext, DecisionContextDomainName } from "@/types/decision-context-contract";
import type { DecisionCandidate } from "@/types/decision-input-normalization";
import type { MissionTenantContextPackage } from "@/types/decision-mission-tenant-context";
import type { AuthorityOperatorContextPackage } from "@/types/decision-authority-operator-context";
import type { EvidenceDependencyContextPackage } from "@/types/decision-evidence-dependency-context";
import type { RiskConfidenceContextPackage } from "@/types/decision-risk-confidence-context";
import type { GovernanceConstitutionalContextPackage } from "@/types/decision-governance-constitutional-context";
import type { RuntimeRecoveryForecastContextPackage } from "@/types/decision-runtime-recovery-forecast-context";
import type { HistoricalReplayContextPackage } from "@/types/decision-historical-replay-context";

export type ContextReadinessStatus = "READY_FOR_ORCHESTRATION" | "REQUIRES_CONTEXT_COMPLETION" | "BLOCK_ORCHESTRATION" | "FAIL_CLOSED";
export type GapSeverity = "NONE" | "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
export type ContextCompletenessValidationState = "PASSED" | "FAILED_MISSING_CONTEXT" | "FAILED_CONSISTENCY" | "FAILED_AUTHORITY" | "FAILED_GOVERNANCE" | "FAILED_REPLAY" | "FAILED_INTEGRITY" | "FAILED_ISOLATION";

export type ContextCompletenessFailureReason =
  | "MANDATORY_CONTEXT_UNAVAILABLE"
  | "COMPLETENESS_UNCALCULABLE"
  | "REPLAY_ARTIFACTS_UNAVAILABLE"
  | "GOVERNANCE_VALIDATION_INCOMPLETE"
  | "CONSTITUTIONAL_VALIDATION_INCOMPLETE"
  | "AUTHORITY_UNRESOLVED"
  | "EVIDENCE_INCOMPLETE"
  | "CONFLICTING_CONTEXT_DETECTED"
  | "STALE_CONTEXT_DETECTED"
  | "LINEAGE_INCOMPLETE"
  | "CROSS_TENANT_CONTEXT"
  | "INTEGRITY_VERIFICATION_FAILED";

export type ContextDomainScore = Readonly<Record<DecisionContextDomainName, number>>;

export type ContextCompleteness = Readonly<{
  completeness_id: string;
  decision_candidate_id: string;
  mission_score: number;
  tenant_score: number;
  authority_score: number;
  operator_score: number;
  evidence_score: number;
  dependency_score: number;
  risk_score: number;
  confidence_score: number;
  governance_score: number;
  constitutional_score: number;
  runtime_score: number;
  recovery_score: number;
  forecast_score: number;
  historical_score: number;
  replay_score: number;
  overall_completeness_score: number;
  readiness_status: ContextReadinessStatus;
  validation_state: ContextCompletenessValidationState;
  integrity_hash: string;
}>;

export type MissingContextRegistry = Readonly<{
  registry_id: string;
  decision_candidate_id: string;
  missing_context_items: readonly string[];
  conflicting_context_items: readonly string[];
  stale_context_items: readonly string[];
  unresolved_dependencies: readonly string[];
  unresolved_authority: readonly string[];
  unresolved_governance: readonly string[];
  unresolved_replay: readonly string[];
  unresolved_evidence: readonly string[];
  severity: GapSeverity;
  validation_state: ContextCompletenessValidationState;
  integrity_hash: string;
}>;

export type GapResolutionRecommendation = Readonly<{
  recommendation_id: string;
  decision_candidate_id: string;
  identified_gap: string;
  recommended_resolution: string;
  governing_rule: string;
  authority_required: boolean;
  replay_requirement: string;
  evidence_requirement: string;
  operator_action: string;
  advisory_only: true;
  integrity_hash: string;
}>;

export type CompletenessExplainability = Readonly<{
  score_calculation: readonly string[];
  missing_context: readonly string[];
  conflicting_context: readonly string[];
  stale_context: readonly string[];
  validation_failures: readonly ContextCompletenessFailureReason[];
  readiness_determination: string;
  governing_policies: readonly string[];
  constitutional_influence: readonly string[];
  replay_implications: readonly string[];
  recommended_remediation: readonly string[];
  integrity_hash: string;
}>;

export type ContextCompletenessGapRequest = Readonly<{
  assessment_id: string;
  candidate: DecisionCandidate;
  decision_context?: DecisionContext;
  mission_tenant_package?: MissionTenantContextPackage;
  authority_operator_package?: AuthorityOperatorContextPackage;
  evidence_dependency_package?: EvidenceDependencyContextPackage;
  risk_confidence_package?: RiskConfidenceContextPackage;
  governance_constitutional_package?: GovernanceConstitutionalContextPackage;
  runtime_recovery_forecast_package?: RuntimeRecoveryForecastContextPackage;
  historical_replay_package?: HistoricalReplayContextPackage;
  engine_version: "context-completeness-gap-engine/v1";
}>;

export type ContextCompletenessValidationResult = Readonly<{
  validation_status: "PASS" | "FAIL";
  validation_state: ContextCompletenessValidationState;
  failure_reason?: ContextCompletenessFailureReason;
  failure_reasons: readonly ContextCompletenessFailureReason[];
  checks: Readonly<{
    all_mandatory_context_resolved: boolean;
    context_internally_consistent: boolean;
    context_sufficiently_fresh: boolean;
    required_evidence_available: boolean;
    required_authority_available: boolean;
    governance_complete: boolean;
    constitutional_complete: boolean;
    replay_available: boolean;
    lineage_complete: boolean;
    integrity_verified: boolean;
    tenant_isolated: boolean;
  }>;
}>;

export type ContextCompletenessGapPackage = Readonly<{
  assessment_id: string;
  candidate_id: string;
  decision_context: DecisionContext;
  domain_scores: ContextDomainScore;
  completeness: ContextCompleteness;
  missing_context_registry: MissingContextRegistry;
  recommendations: readonly GapResolutionRecommendation[];
  validation: ContextCompletenessValidationResult;
  explainability: CompletenessExplainability;
  replay_ref: string;
  timestamp: string;
  integrity_hash: string;
}>;

export type ContextCompletenessReplayResult = Readonly<{
  replay_id: string;
  replay_valid: boolean;
  assessment_id: string;
  reconstructed_hash: string;
  expected_hash: string;
  reconstructed_state: ContextCompletenessValidationState;
  reconstructed_score: number;
  failures: readonly ContextCompletenessFailureReason[];
  integrity_hash: string;
}>;

export type ContextCompletenessObservability = Readonly<{
  assessment_attempts: number;
  successful_assessments: number;
  failed_assessments: number;
  average_completeness_score: number;
  missing_context_failures: number;
  authority_failures: number;
  governance_failures: number;
  replay_failures: number;
  integrity_failures: number;
  isolation_failures: number;
  replay_success_rate: number;
}>;
