export type StrategicFoundationStatus = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type StrategicLifecycleState = "Draft" | "Proposed" | "Qualified" | "Certified" | "Active" | "Superseded" | "Archived" | "Revoked" | "Retired";
export type RecommendationOutcome = "Accepted" | "Rejected" | "Deferred" | "Expired" | "Withdrawn" | "Superseded";
export type StrategyType = "Operational" | "Tactical" | "Strategic" | "Preventive" | "Corrective" | "Exploratory" | "Optimization" | "Recovery";
export type ScenarioType = "Baseline" | "Alternative" | "Best Case" | "Worst Case" | "Expected" | "Stress" | "Counterfactual";
export type ForecastType = "Probability" | "Trend" | "Risk" | "Confidence" | "Capacity" | "Portfolio";
export type ComparisonOutcome = "Better" | "Equivalent" | "Inferior" | "Inconclusive" | "Conflicting";
export type PortfolioOutcome = "Diversified" | "Concentrated" | "Balanced" | "High Risk" | "Low Risk";
export type ObservationState = "Observed" | "Qualified" | "Correlated" | "Confirmed" | "Rejected" | "Archived";
export type OriginType = "Human" | "Simulation" | "Recommendation" | "Observation" | "Forecast" | "Policy" | "Governance" | "Replay" | "External";
export type AuthorityState = "Advisory" | "Governance Approved" | "Operator Approved" | "Certified" | "Revoked";
export type ConfidenceState = "Low" | "Medium" | "High" | "Qualified" | "Certified";
export type StrategicFailureReason = "MissingEvidence" | "PolicyViolation" | "AuthorityViolation" | "ReplayFailure" | "IntegrityFailure" | "DuplicateArtifact" | "BrokenReference" | "LifecycleViolation" | "OriginViolation";
export type StrategicArtifactFamily = "Recommendations" | "Strategies" | "Forecasts" | "Observations" | "Comparisons" | "Transactions" | "Portfolios" | "Policies" | "Authority Bindings" | "Recommendation Cycles" | "Lifecycle Records" | "Replay Records" | "Evidence Records";
export type StrategicFoundationFailure =
  | "GOVERNANCE_NOT_CERTIFIED"
  | "CONTRACT_INCOMPLETE"
  | "ADVISORY_BOUNDARY_VIOLATION"
  | "GOVERNANCE_BYPASS"
  | "VOCABULARY_UNBOUNDED"
  | "IDENTITY_NONDETERMINISTIC"
  | "DUPLICATE_CANONICAL_ARTIFACT"
  | "REGISTRY_INCOMPLETE"
  | "ORIGIN_CONTRACT_BROKEN"
  | "SOURCE_OF_TRUTH_VIOLATION"
  | "DERIVED_VIEW_AUTHORITATIVE"
  | "REFERENTIAL_INTEGRITY_BROKEN"
  | "SCHEMA_INTEGRITY_FAILURE"
  | "CANONICAL_OWNERSHIP_CONFLICT"
  | "REPLAY_REQUIREMENT_MISSING"
  | "TENANT_ISOLATION_BREACH"
  | "LIFECYCLE_TRANSITION_UNDOCUMENTED"
  | "INTEGRITY_HASH_MISMATCH";
export type StrategicFoundationScenario = "BASELINE" | StrategicFoundationFailure;

export type StrategicRecommendationContract = Readonly<{
  contract_id: string;
  advisory_only: boolean;
  operator_supremacy: boolean;
  governance_supremacy: boolean;
  constitutional_supremacy: boolean;
  tenant_isolation_required: boolean;
  evidence_required: boolean;
  replay_required: boolean;
  deterministic_execution_required: boolean;
  immutable_lineage_required: boolean;
  audit_required: boolean;
  policy_enforcement_required: boolean;
  authority_boundaries_required: boolean;
  execute_recommendations_supported: false;
  integrity_hash: string;
}>;

export type StrategicVocabularyRegistry = Readonly<{
  registry_id: string;
  lifecycle_states: readonly StrategicLifecycleState[];
  recommendation_outcomes: readonly RecommendationOutcome[];
  strategy_types: readonly StrategyType[];
  scenario_types: readonly ScenarioType[];
  forecast_types: readonly ForecastType[];
  comparison_outcomes: readonly ComparisonOutcome[];
  portfolio_outcomes: readonly PortfolioOutcome[];
  observation_states: readonly ObservationState[];
  origin_types: readonly OriginType[];
  authority_states: readonly AuthorityState[];
  confidence_states: readonly ConfidenceState[];
  failure_reasons: readonly StrategicFailureReason[];
  bounded: boolean;
  integrity_hash: string;
}>;

export type StrategicArtifactIdentity = Readonly<{
  artifact_id: string;
  family: StrategicArtifactFamily;
  canonical_owner: string;
  version_id: string;
  schema_id: string;
  origin_id: string;
  lineage_ref: string;
  deterministic: boolean;
  duplicate_detected: boolean;
  integrity_hash: string;
}>;

export type StrategicArtifactRegistration = Readonly<{
  artifact_id: string;
  family: StrategicArtifactFamily;
  schema_version: "12.1";
  lifecycle: StrategicLifecycleState;
  owner: string;
  origin_id: string;
  authority: AuthorityState;
  integrity_policy: string;
  replay_policy: string;
  governance_policy: string;
  retirement_policy: string;
  authoritative: boolean;
  integrity_hash: string;
}>;

export type ArtifactOriginRecord = Readonly<{
  origin_id: string;
  artifact_id: string;
  origin_type: OriginType;
  originating_artifact: string;
  originating_process: string;
  originating_policy: string;
  originating_authority: string;
  originating_operator: string;
  originating_governance_approval: string;
  immutable: boolean;
  lineage_complete: boolean;
  replay_deterministic: boolean;
  integrity_hash: string;
}>;

export type SourceOfTruthRecord = Readonly<{
  artifact_id: string;
  canonical_owner: string;
  authoritative: boolean;
  derived_view: boolean;
  derived_from: string | null;
  can_override_source: boolean;
  can_redefine_ownership: boolean;
  lifecycle_owner: boolean;
  governance_owner: boolean;
  integrity_hash: string;
}>;

export type LifecycleTransitionRegistry = Readonly<{
  registry_id: string;
  transitions: readonly Readonly<{ from: StrategicLifecycleState; to: StrategicLifecycleState; documented: boolean; approval_required: boolean }>[];
  complete: boolean;
  integrity_hash: string;
}>;

export type ReferentialIntegrityReport = Readonly<{
  report_id: string;
  artifact_references_valid: boolean;
  policy_references_valid: boolean;
  lifecycle_references_valid: boolean;
  authority_references_valid: boolean;
  recommendation_references_valid: boolean;
  transaction_references_valid: boolean;
  observation_references_valid: boolean;
  comparison_references_valid: boolean;
  replay_references_valid: boolean;
  unresolved_references: readonly string[];
  integrity_hash: string;
}>;

export type StrategicFoundationCertificationTest = Readonly<{
  test_id: string;
  name: string;
  expected: "PASS";
  actual: "PASS" | "FAIL";
  passed: boolean;
  failure_reason: StrategicFoundationFailure | null;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type StrategicFoundationCertification = Readonly<{
  certification_id: string;
  status: StrategicFoundationStatus;
  downstream_phase_12_enabled: boolean;
  failures: readonly StrategicFoundationFailure[];
  tests: readonly StrategicFoundationCertificationTest[];
  integrity_hash: string;
}>;

export type StrategicFoundationInput = Readonly<{ scenario?: StrategicFoundationScenario; tenant_id?: string }>;

export type StrategicFoundationResult = Readonly<{
  foundation_version: "strategic-recommendation-intelligence-foundation/v12.1";
  foundation_identifier: "StrategicRecommendationIntelligenceFoundation";
  governance_certified: boolean;
  contract: StrategicRecommendationContract;
  vocabulary_registry: StrategicVocabularyRegistry;
  identities: readonly StrategicArtifactIdentity[];
  artifact_registry: readonly StrategicArtifactRegistration[];
  origin_registry: readonly ArtifactOriginRecord[];
  source_of_truth_registry: readonly SourceOfTruthRecord[];
  lifecycle_transition_registry: LifecycleTransitionRegistry;
  referential_integrity: ReferentialIntegrityReport;
  certification: StrategicFoundationCertification;
  replay_hash: string;
  integrity_hash: string;
}>;

export type StrategicFoundationValidation = Readonly<{
  foundation_id: string | null;
  valid: boolean;
  status: StrategicFoundationStatus;
  downstream_phase_12_enabled: boolean;
  failures: readonly StrategicFoundationFailure[];
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  validation_hash: string;
}>;

export type StrategicFoundationContractBundle = Readonly<{
  doctrine: Readonly<{
    version: "strategic-recommendation-intelligence-foundation/v12.1";
    advisory_only: true;
    derived_authority_supported: false;
    src_018_origin_required: true;
    sri_005_single_source_of_truth_required: true;
    replay_required: true;
    tenant_isolation_required: true;
  }>;
  result: StrategicFoundationResult;
  validation: StrategicFoundationValidation;
}>;
