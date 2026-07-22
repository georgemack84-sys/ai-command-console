export type ExplainabilityStatus = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type ExplainabilityFailure =
  | "GOVERNANCE_NOT_CERTIFIED"
  | "CONTRACT_INVALID"
  | "ARTIFACT_UNEXPLAINED"
  | "PERSISTENCE_RATIONALE_MISSING"
  | "STRUCTURED_EXPLANATION_INCONSISTENT"
  | "HUMAN_EXPLANATION_MISSING"
  | "EVIDENCE_CHAIN_INCOMPLETE"
  | "SOURCE_REFERENCE_MISSING"
  | "DUPLICATE_EVIDENCE_UNRESOLVED"
  | "QUALIFICATION_HISTORY_MISSING"
  | "QUALIFICATION_REPLAY_FAILED"
  | "REVIEWER_DECISION_MISSING"
  | "CERTIFICATION_TRACE_MISSING"
  | "CONFIDENCE_HISTORY_MISSING"
  | "CONFIDENCE_CHANGE_UNSUPPORTED"
  | "CALIBRATION_HISTORY_MISSING"
  | "CONFIDENCE_INCONSISTENT"
  | "GOVERNANCE_HISTORY_MISSING"
  | "CONSTITUTIONAL_HISTORY_MISSING"
  | "AUTHORITY_BOUNDARY_MISSING"
  | "OVERRIDE_TRACE_MISSING"
  | "LINEAGE_GRAPH_BROKEN"
  | "VERSION_TREE_INCONSISTENT"
  | "REPLAY_HISTORY_NONDETERMINISTIC"
  | "PARENT_CHILD_RELATION_INVALID"
  | "USAGE_ATTRIBUTION_MISSING"
  | "MISSION_REFERENCE_MISSING"
  | "RECOMMENDATION_USAGE_MISSING"
  | "IMPACT_REPRODUCTION_FAILED"
  | "LEDGER_MUTATION"
  | "TENANT_ISOLATION_BREACH"
  | "INTEGRITY_HASH_MISMATCH"
  | "OBSERVABILITY_INCOMPLETE"
  | "DASHBOARD_INCONSISTENT";
export type ExplainabilityScenario = "BASELINE" | ExplainabilityFailure;

export type ExplainabilityContract = Readonly<{
  contract_id: string;
  required_metadata: readonly string[];
  mandatory_evidence: readonly string[];
  lineage_required: boolean;
  governance_required: boolean;
  replay_required: boolean;
  certification_required: boolean;
  human_readable_required: boolean;
  machine_readable_required: boolean;
  black_box_supported: false;
  integrity_hash: string;
}>;

export type ArtifactExplanation = Readonly<{
  explanation_id: string;
  artifact_id: string;
  title: string;
  human_readable: string;
  machine_readable: Readonly<Record<string, string>>;
  persistence_rationale: string;
  retention_rationale: string;
  evidence_rationale: string;
  qualification_rationale: string;
  governance_rationale: string;
  confidence_rationale: string;
  historical_rationale: string;
  usage_rationale: string;
  lifecycle_rationale: string;
  replay_ref: string;
  complete: boolean;
  integrity_hash: string;
}>;

export type ExplainabilityGraph = Readonly<{
  graph_id: string;
  artifact_id: string;
  nodes: readonly string[];
  edges: readonly Readonly<{ from: string; to: string; relation: string }>[];
  navigable_forward: boolean;
  navigable_backward: boolean;
  complete: boolean;
  integrity_hash: string;
}>;

export type EvidenceTrace = Readonly<{
  trace_id: string;
  evidence_refs: readonly string[];
  source_refs: readonly string[];
  observation_refs: readonly string[];
  outcome_refs: readonly string[];
  simulation_refs: readonly string[];
  approval_refs: readonly string[];
  certification_refs: readonly string[];
  immutable_links: boolean;
  duplicate_evidence_resolved: boolean;
  complete: boolean;
  integrity_hash: string;
}>;

export type QualificationHistory = Readonly<{
  history_id: string;
  qualification_scores: readonly number[];
  reviewer_decisions: readonly string[];
  replay_validated: boolean;
  trust_qualified: boolean;
  duplicate_consolidation: boolean;
  certification_status: "CERTIFIED" | "UNCERTIFIED";
  complete: boolean;
  integrity_hash: string;
}>;

export type ConfidenceEvolution = Readonly<{
  evolution_id: string;
  timeline: readonly Readonly<{ event: string; confidence: number; evidence_ref: string }>[];
  evidence_backed_changes: boolean;
  calibration_history_valid: boolean;
  consistent: boolean;
  complete: boolean;
  integrity_hash: string;
}>;

export type GovernanceHistory = Readonly<{
  history_id: string;
  governance_approvals: readonly string[];
  constitutional_validations: readonly string[];
  operator_approvals: readonly string[];
  policy_validations: readonly string[];
  authority_verifications: readonly string[];
  overrides: readonly string[];
  revocations: readonly string[];
  complete: boolean;
  integrity_hash: string;
}>;

export type ReplayLineageHistory = Readonly<{
  history_id: string;
  originating_missions: readonly string[];
  parent_artifacts: readonly string[];
  child_artifacts: readonly string[];
  related_artifacts: readonly string[];
  version_tree: readonly string[];
  supersession_chain: readonly string[];
  archival_history: readonly string[];
  replay_executions: readonly string[];
  deterministic: boolean;
  complete: boolean;
  integrity_hash: string;
}>;

export type UsageIntelligence = Readonly<{
  usage_id: string;
  retrievals: number;
  recommendation_refs: readonly string[];
  mission_refs: readonly string[];
  operator_refs: readonly string[];
  certification_refs: readonly string[];
  replay_session_refs: readonly string[];
  simulation_refs: readonly string[];
  governance_review_refs: readonly string[];
  organizational_impact_score: number;
  attributable: boolean;
  integrity_hash: string;
}>;

export type ExplainabilityLedgerEntry = Readonly<{
  ledger_entry_id: string;
  sequence: number;
  event: "EXPLANATION_RECORDED" | "EVIDENCE_TRACED" | "QUALIFICATION_EXPLAINED" | "CONFIDENCE_EXPLAINED" | "GOVERNANCE_EXPLAINED" | "LINEAGE_EXPLAINED" | "USAGE_EXPLAINED" | "OBSERVABILITY_RECORDED" | "CERTIFICATION_RECORDED";
  artifact_id: string;
  replay_refs: readonly string[];
  append_only: boolean;
  tenant_isolated: boolean;
  integrity_hash: string;
}>;

export type ExplainabilityObservability = Readonly<{
  observability_id: string;
  explainability_coverage: number;
  evidence_trace_completeness: number;
  lineage_integrity_score: number;
  governance_traceability_score: number;
  confidence_history_completeness: number;
  replay_explainability_success_rate: number;
  usage_attribution_coverage: number;
  ledger_consistency: number;
  api_latency_ms: number;
  dashboard_available: boolean;
  operational: boolean;
  integrity_hash: string;
}>;

export type ExplainabilityCertificationTest = Readonly<{
  test_id: string;
  name: string;
  expected: "PASS";
  actual: "PASS" | "FAIL";
  passed: boolean;
  failure_reason: ExplainabilityFailure | null;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type ExplainabilityCertification = Readonly<{
  certification_id: string;
  status: ExplainabilityStatus;
  production_ready: boolean;
  failures: readonly ExplainabilityFailure[];
  tests: readonly ExplainabilityCertificationTest[];
  integrity_hash: string;
}>;

export type ExplainabilityInput = Readonly<{ scenario?: ExplainabilityScenario; tenant_id?: string; artifact_id?: string }>;

export type ExplainabilityResult = Readonly<{
  explainability_version: "persistent-intelligence-explainability/v11.10";
  explainability_identifier: "PersistentIntelligenceExplainability";
  governance_certified: boolean;
  contract: ExplainabilityContract;
  explanation: ArtifactExplanation;
  graph: ExplainabilityGraph;
  evidence_trace: EvidenceTrace;
  qualification_history: QualificationHistory;
  confidence_evolution: ConfidenceEvolution;
  governance_history: GovernanceHistory;
  replay_lineage: ReplayLineageHistory;
  usage: UsageIntelligence;
  ledger: readonly ExplainabilityLedgerEntry[];
  observability: ExplainabilityObservability;
  certification: ExplainabilityCertification;
  replay_hash: string;
  integrity_hash: string;
}>;

export type ExplainabilityValidation = Readonly<{
  explanation_id: string | null;
  valid: boolean;
  status: ExplainabilityStatus;
  production_ready: boolean;
  failures: readonly ExplainabilityFailure[];
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  validation_hash: string;
}>;

export type ExplainabilityContractBundle = Readonly<{
  doctrine: Readonly<{
    version: "persistent-intelligence-explainability/v11.10";
    black_box_intelligence_supported: false;
    every_artifact_explained: true;
    evidence_required: true;
    governance_history_required: true;
    replay_required: true;
    usage_attribution_required: true;
  }>;
  result: ExplainabilityResult;
  validation: ExplainabilityValidation;
  observability: ExplainabilityObservability;
}>;
