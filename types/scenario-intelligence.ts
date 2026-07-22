export type ScenarioIntelligenceCertificationStatus = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type ScenarioType = "BASE_CASE" | "BEST_CASE" | "WORST_CASE" | "EXPECTED_CASE" | "STRESS_CASE" | "ADVERSARIAL_CASE" | "CONSTRAINT_CASE" | "POLICY_CASE" | "RESOURCE_CASE" | "TEMPORAL_CASE";
export type ScenarioQualificationStatus = "QUALIFIED" | "REQUIRES_MORE_EVIDENCE" | "REQUIRES_POLICY_REVIEW" | "REQUIRES_GOVERNANCE_REVIEW" | "REJECTED";
export type ScenarioLifecycleState = "REGISTERED" | "UNDER_CONSTRUCTION" | "UNDER_VALIDATION" | "QUALIFIED" | "REJECTED" | "ARCHIVED";
export type AssumptionLifecycleState = "ACTIVE" | "SUPERSEDED" | "ARCHIVED";
export type ScenarioClosureState = "OPEN" | "CONSTRUCTING" | "VALIDATING" | "QUALIFYING" | "CLOSED" | "FAILED";
export type ScenarioIntelligenceFailure =
  | "SCENARIO_ARTIFACT_CONTRACT_INVALID"
  | "SCENARIO_IDENTITY_NONDETERMINISTIC"
  | "LIFECYCLE_NONDETERMINISTIC"
  | "TAXONOMY_INCOMPLETE"
  | "UNKNOWN_SCENARIO_TYPE"
  | "DUPLICATE_TAXONOMY_ENTRY"
  | "AMBIGUOUS_CLASSIFICATION"
  | "CONSTRUCTION_POLICY_INCOMPLETE"
  | "NONDETERMINISTIC_CONSTRUCTION"
  | "EVIDENCE_MISSING"
  | "ASSUMPTION_MISSING"
  | "HIDDEN_ASSUMPTION"
  | "UNSUPPORTED_ASSUMPTION"
  | "DUPLICATE_ASSUMPTION"
  | "CONFLICTING_ASSUMPTION"
  | "POLICY_MANIFEST_MISSING"
  | "GOVERNANCE_APPROVAL_MISSING"
  | "CONSTITUTIONAL_VIOLATION"
  | "CROSS_TENANT_INPUT"
  | "COVERAGE_INCOMPLETE"
  | "DUPLICATE_COVERAGE"
  | "UNSUPPORTED_COVERAGE_GAP"
  | "QUALIFICATION_NONDETERMINISTIC"
  | "REPLAY_NOT_REPRODUCIBLE"
  | "INTEGRITY_VALIDATION_FAILED"
  | "ORIGIN_INCOMPLETE"
  | "LINEAGE_MUTABLE"
  | "ADVISORY_BOUNDARY_VIOLATION"
  | "LEDGER_NOT_APPEND_ONLY"
  | "OBSERVABILITY_MISSING";
export type ScenarioIntelligenceScenario = "BASELINE" | ScenarioIntelligenceFailure;

export type ScenarioIntelligenceInput = Readonly<{
  scenario?: ScenarioIntelligenceScenario;
  tenant_id?: string;
  recommendation_cycle_id?: string;
  scope?: string;
}>;

export type ScenarioArtifact = Readonly<{
  scenario_id: string;
  scenario_type: ScenarioType;
  recommendation_cycle_id: string;
  candidate_strategy_refs: readonly string[];
  objective_refs: readonly string[];
  scope: string;
  temporal_range: Readonly<{ start: string; end: string }>;
  assumptions_ref: readonly string[];
  variables: readonly string[];
  constraints: readonly string[];
  evidence_refs: readonly string[];
  policy_manifest_ref: string;
  governance_refs: readonly string[];
  qualification_status: ScenarioQualificationStatus;
  confidence: number;
  uncertainty: number;
  origin_ref: string;
  parent_scenario_refs: readonly string[];
  lifecycle_state: ScenarioLifecycleState;
  advisory_only: boolean;
  tenant_id: string;
  integrity_hash: string;
  creation_timestamp: string;
}>;

export type ScenarioTaxonomy = Readonly<{
  taxonomy_id: string;
  version: "12.5.0";
  scenario_types: readonly ScenarioType[];
  semantics: Readonly<Record<ScenarioType, string>>;
  immutable: boolean;
  duplicate_entries: readonly ScenarioType[];
  ambiguous_classifications: readonly string[];
  integrity_hash: string;
}>;

export type ScenarioConstructionPolicy = Readonly<{
  policy_id: string;
  approved_methods: readonly string[];
  prohibited_methods: readonly string[];
  evidence_required: boolean;
  assumptions_required: boolean;
  policy_binding_required: boolean;
  governance_validation_required: boolean;
  deterministic_generation_required: boolean;
  complete: boolean;
  integrity_hash: string;
}>;

export type ScenarioAssumptionArtifact = Readonly<{
  assumption_id: string;
  scenario_ref: string;
  description: string;
  category: string;
  evidence_refs: readonly string[];
  confidence: number;
  uncertainty: number;
  policy_refs: readonly string[];
  origin_ref: string;
  version: "1.0.0";
  lifecycle: AssumptionLifecycleState;
  governance_approved: boolean;
  integrity_hash: string;
}>;

export type ScenarioCoverageReport = Readonly<{
  report_id: string;
  required_scenario_classes: readonly ScenarioType[];
  present_scenario_classes: readonly ScenarioType[];
  missing_scenario_classes: readonly ScenarioType[];
  objective_coverage: boolean;
  strategy_coverage: boolean;
  constraint_coverage: boolean;
  temporal_coverage: boolean;
  governance_coverage: boolean;
  policy_coverage: boolean;
  adversarial_coverage: boolean;
  duplicate_coverage: readonly string[];
  complete: boolean;
  integrity_hash: string;
}>;

export type ScenarioQualificationRecord = Readonly<{
  qualification_id: string;
  scenario_id: string;
  status: ScenarioQualificationStatus;
  evidence_sufficient: boolean;
  policy_compliant: boolean;
  governance_eligible: boolean;
  assumptions_valid: boolean;
  relevant: boolean;
  replay_reproducible: boolean;
  integrity_valid: boolean;
  origin_complete: boolean;
  integrity_hash: string;
}>;

export type ScenarioRegistry = Readonly<{
  registry_id: string;
  tenant_id: string;
  scenarios: readonly ScenarioArtifact[];
  assumptions: readonly ScenarioAssumptionArtifact[];
  qualifications: readonly ScenarioQualificationRecord[];
  complete: boolean;
  integrity_hash: string;
}>;

export type ScenarioClosureCertificate = Readonly<{
  closure_id: string;
  state: ScenarioClosureState;
  required_scenario_classes_exist: boolean;
  coverage_validated: boolean;
  assumptions_registered: boolean;
  evidence_linked: boolean;
  policy_manifest_bound: boolean;
  governance_validation_complete: boolean;
  qualification_completed: boolean;
  integrity_verified: boolean;
  replay_reproducible: boolean;
  immutable: boolean;
  integrity_hash: string;
}>;

export type ScenarioConstructionLedger = Readonly<{
  ledger_id: string;
  append_only: boolean;
  immutable: boolean;
  entries: readonly Readonly<{ entry_id: string; type: string; subject_id: string; integrity_hash: string }>[];
  integrity_hash: string;
}>;

export type ScenarioReplayReport = Readonly<{
  replay_id: string;
  identical_scenarios_constructed: boolean;
  identical_assumptions_registered: boolean;
  identical_coverage_report: boolean;
  identical_qualifications: boolean;
  identical_closure: boolean;
  identical_ledger: boolean;
  integrity_hashes_reproduced: boolean;
  integrity_hash: string;
}>;

export type ScenarioObservabilityReport = Readonly<{
  report_id: string;
  scenarios_generated: number;
  qualification_failures: number;
  coverage_gaps: number;
  replay_failures: number;
  governance_failures: number;
  integrity_violations: number;
  alerts: readonly string[];
  observable: boolean;
  integrity_hash: string;
}>;

export type ScenarioIntelligenceCertificationTest = Readonly<{
  test_id: string;
  name: string;
  expected: "PASS";
  actual: "PASS" | "FAIL";
  passed: boolean;
  failure_reason: ScenarioIntelligenceFailure | null;
  evidence_refs: readonly string[];
  integrity_hash: string;
}>;

export type ScenarioIntelligenceCertification = Readonly<{
  certification_id: string;
  status: ScenarioIntelligenceCertificationStatus;
  ready_for_forecast_intelligence: boolean;
  failures: readonly ScenarioIntelligenceFailure[];
  tests: readonly ScenarioIntelligenceCertificationTest[];
  integrity_hash: string;
}>;

export type ScenarioIntelligenceResult = Readonly<{
  phase_version: "scenario-intelligence/v12.5";
  phase_identifier: "ScenarioIntelligence";
  taxonomy: ScenarioTaxonomy;
  construction_policy: ScenarioConstructionPolicy;
  scenarios: readonly ScenarioArtifact[];
  assumptions: readonly ScenarioAssumptionArtifact[];
  coverage: ScenarioCoverageReport;
  qualifications: readonly ScenarioQualificationRecord[];
  registry: ScenarioRegistry;
  closure: ScenarioClosureCertificate;
  ledger: ScenarioConstructionLedger;
  replay: ScenarioReplayReport;
  observability: ScenarioObservabilityReport;
  certification: ScenarioIntelligenceCertification;
  replay_hash: string;
  integrity_hash: string;
}>;

export type ScenarioIntelligenceValidation = Readonly<{
  registry_id: string | null;
  valid: boolean;
  status: ScenarioIntelligenceCertificationStatus;
  ready_for_forecast_intelligence: boolean;
  failures: readonly ScenarioIntelligenceFailure[];
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  closure_valid: boolean;
  coverage_valid: boolean;
  validation_hash: string;
}>;

export type ScenarioIntelligenceContractBundle = Readonly<{
  doctrine: Readonly<{
    version: "scenario-intelligence/v12.5";
    advisory_only: true;
    bounded_taxonomy_required: true;
    explicit_assumptions_required: true;
    policy_bound_scenarios_required: true;
    governance_qualification_required: true;
    coverage_validation_required: true;
    replay_required: true;
  }>;
  result: ScenarioIntelligenceResult;
  validation: ScenarioIntelligenceValidation;
}>;
