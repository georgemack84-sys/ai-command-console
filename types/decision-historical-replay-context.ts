import type { DecisionCandidate } from "@/types/decision-input-normalization";
import type { DecisionContext, DecisionContextDomain } from "@/types/decision-context-contract";
import type { MissionTenantContextPackage } from "@/types/decision-mission-tenant-context";
import type { AuthorityOperatorContextPackage } from "@/types/decision-authority-operator-context";
import type { EvidenceDependencyContextPackage } from "@/types/decision-evidence-dependency-context";
import type { RiskConfidenceContextPackage } from "@/types/decision-risk-confidence-context";
import type { GovernanceConstitutionalContextPackage } from "@/types/decision-governance-constitutional-context";
import type { RuntimeRecoveryForecastContextPackage } from "@/types/decision-runtime-recovery-forecast-context";

export type ReplayAvailability = "AVAILABLE" | "PARTIAL" | "MISSING" | "CORRUPTED" | "UNVERIFIED";

export type HistoricalReplayResolutionState =
  | "PENDING"
  | "HISTORICAL_REGISTRY_RESOLVED"
  | "HISTORICAL_DECISIONS_RESOLVED"
  | "OUTCOMES_RESOLVED"
  | "CERTIFICATION_HISTORY_RESOLVED"
  | "ANCESTRY_BUILT"
  | "LINEAGE_GRAPH_BUILT"
  | "REPLAY_REFERENCES_RESOLVED"
  | "REPLAY_ARTIFACTS_VERIFIED"
  | "LINEAGE_VALIDATED"
  | "PASSED"
  | "FAILED_HISTORICAL"
  | "FAILED_REPLAY"
  | "FAILED_LINEAGE"
  | "FAILED_ISOLATION"
  | "FAILED_INTEGRITY";

export type HistoricalReplayFailureReason =
  | "HISTORICAL_REGISTRY_UNAVAILABLE"
  | "HISTORICAL_DECISIONS_UNRESOLVED"
  | "PREVIOUS_OUTCOMES_UNLINKED"
  | "DECISION_ANCESTRY_INCOMPLETE"
  | "LINEAGE_GRAPH_CYCLIC"
  | "REPLAY_REFERENCES_MISSING"
  | "REPLAY_ARTIFACTS_UNAVAILABLE"
  | "REPLAY_INTEGRITY_FAILED"
  | "CERTIFICATION_HISTORY_UNRESOLVED"
  | "LINEAGE_INCOMPLETE"
  | "CROSS_TENANT_LINEAGE"
  | "INTEGRITY_HASH_MISMATCH";

export type HistoricalDecisionRecord = Readonly<{
  decision_id: string;
  tenant_id: string;
  mission_id: string;
  decision_type: string;
  decision_state: "APPROVED" | "REJECTED" | "DEFERRED" | "ESCALATED" | "CERTIFIED";
  parent_decision_refs: readonly string[];
  child_decision_refs: readonly string[];
  evidence_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  certification_refs: readonly string[];
  outcome_ref: string;
  lineage_refs: readonly string[];
  integrity_hash: string;
}>;

export type HistoricalOutcomeRecord = Readonly<{
  outcome_id: string;
  decision_id: string;
  mission_impact: string;
  risk_impact: string;
  recovery_impact: string;
  runtime_impact: string;
  governance_impact: string;
  operator_response: string;
  certification_outcome: "PASSED" | "CONDITIONAL" | "FAILED";
  replay_result: "VALID" | "INVALID";
  integrity_hash: string;
}>;

export type CertificationHistoryRecord = Readonly<{
  certification_id: string;
  decision_id: string;
  certification_state: "CERTIFIED" | "CONDITIONAL_PASS" | "FAILED";
  certification_gate: string;
  certification_evidence: readonly string[];
  certification_failures: readonly string[];
  replay_validation_result: "VALID" | "INVALID";
  integrity_validation_result: "VALID" | "INVALID";
  integrity_hash: string;
}>;

export type ReplayArtifactRecord = Readonly<{
  replay_artifact_id: string;
  replay_ref: string;
  tenant_id: string;
  mission_id: string;
  source_component: string;
  artifact_available: boolean;
  artifact_hash: string;
  artifact_lineage: readonly string[];
  artifact_version: "replay/v1";
  schema_version: "9.3";
  certified: boolean;
  integrity_hash: string;
}>;

export type HistoricalReplayExplainability = Readonly<{
  linked_decision_rationale: readonly string[];
  outcome_summary: readonly string[];
  replay_artifact_rationale: readonly string[];
  certification_summary: readonly string[];
  replay_availability_rationale: string;
  lineage_completeness_rationale: string;
  ancestry_reproducibility_rationale: string;
  validation_outcomes: readonly string[];
  integrity_hash: string;
}>;

export type HistoricalContext = Readonly<{
  historical_context_id: string;
  decision_candidate_id: string;
  historical_decisions: readonly HistoricalDecisionRecord[];
  previous_outcomes: readonly HistoricalOutcomeRecord[];
  related_outcomes: readonly HistoricalOutcomeRecord[];
  prior_approvals: readonly string[];
  prior_escalations: readonly string[];
  prior_rejections: readonly string[];
  prior_deferrals: readonly string[];
  certification_history: readonly CertificationHistoryRecord[];
  historical_patterns: readonly string[];
  historical_lineage: readonly string[];
  validation_state: HistoricalReplayResolutionState;
  explainability: HistoricalReplayExplainability;
  integrity_hash: string;
}>;

export type ReplayContext = Readonly<{
  replay_context_id: string;
  decision_candidate_id: string;
  replay_references: readonly string[];
  replay_availability: ReplayAvailability;
  replay_artifacts: readonly ReplayArtifactRecord[];
  replay_integrity: "VALID" | "INVALID";
  replay_lineage: readonly string[];
  replay_validation_state: HistoricalReplayResolutionState;
  replay_hash: string;
  explainability: HistoricalReplayExplainability;
  integrity_hash: string;
}>;

export type DecisionLineageGraph = Readonly<{
  lineage_graph_id: string;
  decision_candidate_id: string;
  root_decision_refs: readonly string[];
  parent_decision_refs: readonly string[];
  child_decision_refs: readonly string[];
  ancestor_decision_refs: readonly string[];
  descendant_decision_refs: readonly string[];
  sibling_decision_refs: readonly string[];
  related_recommendation_refs: readonly string[];
  replay_refs: readonly string[];
  certification_refs: readonly string[];
  graph_integrity_hash: string;
}>;

export type HistoricalReplayContextRequest = Readonly<{
  resolution_id: string;
  candidate: DecisionCandidate;
  base_context?: DecisionContext;
  mission_tenant_package?: MissionTenantContextPackage;
  authority_operator_package?: AuthorityOperatorContextPackage;
  evidence_dependency_package?: EvidenceDependencyContextPackage;
  risk_confidence_package?: RiskConfidenceContextPackage;
  governance_constitutional_package?: GovernanceConstitutionalContextPackage;
  runtime_recovery_forecast_package?: RuntimeRecoveryForecastContextPackage;
  resolver_version: "historical-replay-context-resolver/v1";
}>;

export type HistoricalReplayValidationResult = Readonly<{
  validation_status: "PASS" | "FAIL";
  validation_state: HistoricalReplayResolutionState;
  failure_reason?: HistoricalReplayFailureReason;
  failure_reasons: readonly HistoricalReplayFailureReason[];
  checks: Readonly<{
    historical_decisions_resolved: boolean;
    previous_outcomes_linked: boolean;
    decision_ancestry_complete: boolean;
    lineage_graph_acyclic: boolean;
    replay_references_present: boolean;
    replay_artifacts_available: boolean;
    replay_integrity_verified: boolean;
    certification_history_resolved: boolean;
    tenant_boundaries_preserved: boolean;
    integrity_hashes_reproducible: boolean;
  }>;
}>;

export type HistoricalReplayContextPackage = Readonly<{
  resolution_id: string;
  candidate_id: string;
  historical_context: HistoricalContext;
  replay_context: ReplayContext;
  historical_domain: DecisionContextDomain;
  replay_domain: DecisionContextDomain;
  lineage_graph: DecisionLineageGraph;
  validation: HistoricalReplayValidationResult;
  replay_ref: string;
  timestamp: string;
  integrity_hash: string;
}>;

export type HistoricalReplayResult = Readonly<{
  replay_id: string;
  replay_valid: boolean;
  resolution_id: string;
  reconstructed_hash: string;
  expected_hash: string;
  reconstructed_state: HistoricalReplayResolutionState;
  failures: readonly HistoricalReplayFailureReason[];
  integrity_hash: string;
}>;

export type HistoricalReplayObservability = Readonly<{
  resolution_attempts: number;
  successful_resolutions: number;
  failed_resolutions: number;
  historical_failures: number;
  replay_failures: number;
  lineage_failures: number;
  isolation_failures: number;
  integrity_failures: number;
  average_history_depth: number;
  replay_success_rate: number;
}>;
