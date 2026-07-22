export type BenchmarkOutcome = "PASS" | "FAIL" | "REQUIRES_REVIEW";
export type BenchmarkCategory = "FUNCTIONAL" | "OPERATIONAL" | "GOVERNANCE" | "PERFORMANCE" | "RESILIENCE" | "INTEROPERABILITY" | "TRUST" | "CERTIFICATION" | "MATURITY" | "ECOSYSTEM";
export type ComparativeDimension = "IMPLEMENTATION" | "RELEASE" | "VERSION" | "ARCHITECTURE" | "CAPABILITY" | "DEPLOYMENT" | "CONFIGURATION" | "MODEL" | "SIMULATION_VS_PRODUCTION" | "BASELINE_VS_CANDIDATE";
export type CapabilityDimension = "COMPLETENESS" | "CORRECTNESS" | "DETERMINISM" | "EXPLAINABILITY" | "RESILIENCE" | "SCALABILITY" | "OBSERVABILITY" | "MAINTAINABILITY" | "INTEROPERABILITY" | "GOVERNANCE_COMPLIANCE";
export type MaturityDimension = "ARCHITECTURE" | "ENGINEERING" | "GOVERNANCE" | "OPERATIONAL" | "DEPLOYMENT" | "ECOSYSTEM" | "CERTIFICATION" | "ORGANIZATIONAL";
export type BenchmarkFailure =
  | "P6_12_REHEARSAL_PREPARATION_INVALID"
  | "BENCHMARK_FRAMEWORK_MISSING"
  | "BENCHMARK_STANDARDS_NOT_APPROVED"
  | "BENCHMARK_REGISTRY_MISSING"
  | "BENCHMARK_EXECUTION_ENGINE_MISSING"
  | "BENCHMARK_EXECUTION_NONDETERMINISTIC"
  | "BENCHMARK_NORMALIZATION_FAILED"
  | "COMPARATIVE_ANALYSIS_MISSING"
  | "NON_EQUIVALENT_CONDITIONS_COMPARED"
  | "CAPABILITY_BENCHMARKING_MISSING"
  | "CAPABILITY_SCORING_MISSING"
  | "MATURITY_ASSESSMENT_MISSING"
  | "TREND_ANALYSIS_MISSING"
  | "EVIDENCE_CORRELATION_MISSING"
  | "BENCHMARK_EVIDENCE_MISSING"
  | "BENCHMARK_EVIDENCE_MUTATED"
  | "BENCHMARK_LINEAGE_INCOMPLETE"
  | "BENCHMARK_NOT_REPRODUCIBLE"
  | "SCORING_NOT_REPRODUCIBLE"
  | "SCORING_NOT_EXPLAINABLE"
  | "SUBJECTIVE_SCORING_ATTEMPTED"
  | "BENCHMARK_GOVERNANCE_MISSING"
  | "BENCHMARK_VERSIONING_FAILED"
  | "BENCHMARK_APPROVAL_MISSING"
  | "BENCHMARK_BASELINE_INFLUENCED"
  | "ENVIRONMENT_PROVISIONING_OWNERSHIP_VIOLATION"
  | "SCENARIO_CREATION_OWNERSHIP_VIOLATION"
  | "SYNTHETIC_DATA_GENERATION_OWNERSHIP_VIOLATION"
  | "SIMULATION_EXECUTION_OWNERSHIP_VIOLATION"
  | "REPLAY_VALIDATION_OWNERSHIP_VIOLATION"
  | "ADVERSARIAL_TESTING_OWNERSHIP_VIOLATION"
  | "RESILIENCE_VALIDATION_OWNERSHIP_VIOLATION"
  | "PERFORMANCE_QUALIFICATION_OWNERSHIP_VIOLATION"
  | "INTEROPERABILITY_VALIDATION_OWNERSHIP_VIOLATION"
  | "OPERATIONAL_EXERCISE_OWNERSHIP_VIOLATION"
  | "CERTIFICATION_REHEARSAL_OWNERSHIP_VIOLATION"
  | "FORMAL_QUALIFICATION_ATTEMPTED"
  | "GOVERNANCE_REVIEW_REQUIRED";
export type BenchmarkScenario = "BASELINE" | BenchmarkFailure;
export type BenchmarkInput = Readonly<{ scenario?: BenchmarkScenario; seed?: string }>;
export type BenchmarkFramework = Readonly<{ framework_id: string; standards: readonly string[]; definitions: readonly string[]; policies: readonly string[]; categories: readonly BenchmarkCategory[]; approved: boolean; immutable_definitions: boolean; versioned_methodologies: boolean; integrity_hash: string }>;
export type BenchmarkExecution = Readonly<{ execution_id: string; deterministic: boolean; repeatable: boolean; evidence_collected: boolean; replay_supported: boolean; raw_measurements: readonly number[]; normalized_measurements: readonly number[]; integrity_hash: string }>;
export type CapabilityAssessment = Readonly<{ assessment_id: string; dimensions: readonly CapabilityDimension[]; functional_completeness: number; reliability: number; governance: number; interoperability: number; resilience: number; operational_readiness: number; evidence_refs: readonly string[]; integrity_hash: string }>;
export type ComparativeStudy = Readonly<{ study_id: string; dimensions: readonly ComparativeDimension[]; equivalent_conditions: boolean; implementation_comparison: boolean; release_comparison: boolean; platform_comparison: boolean; architecture_comparison: boolean; model_comparison: boolean; configuration_comparison: boolean; evidence_refs: readonly string[]; integrity_hash: string }>;
export type CapabilityScorecard = Readonly<{ scorecard_id: string; completeness: number; robustness: number; operational_quality: number; determinism: number; governance: number; trustworthiness: number; interoperability: number; maintainability: number; weighted_score: number; confidence: number; rationale: readonly string[]; explainable: boolean; integrity_hash: string }>;
export type MaturityAssessment = Readonly<{ assessment_id: string; dimensions: readonly MaturityDimension[]; architecture_maturity: number; governance_maturity: number; operational_maturity: number; engineering_maturity: number; deployment_maturity: number; ecosystem_maturity: number; certification_maturity: number; organizational_maturity: number; integrity_hash: string }>;
export type TrendReport = Readonly<{ report_id: string; release_progression: boolean; regression_detection: boolean; capability_evolution: boolean; readiness_growth: boolean; trend_lines: readonly string[]; integrity_hash: string }>;
export type BenchmarkEvidencePackage = Readonly<{ package_id: string; benchmark_definition: string; execution_record: string; scenario: string; environment: string; evidence_lineage: readonly string[]; replay_evidence: readonly string[]; scoring_methodology: string; simulations: readonly string[]; exercises: readonly string[]; adversarial: readonly string[]; performance: readonly string[]; resilience: readonly string[]; certification_rehearsal: readonly string[]; immutable: boolean; traceable: boolean; reproducible: boolean; integrity_hash: string }>;
export type BenchmarkGovernanceReport = Readonly<{ report_id: string; benchmark_versioning: boolean; reproducibility: boolean; traceability: boolean; approval: boolean; lineage: boolean; transparency: boolean; objectivity: boolean; isolation: boolean; integrity_hash: string }>;
export type BenchmarkDashboard = Readonly<{ dashboard_id: string; benchmark_reports: readonly string[]; comparative_studies: readonly string[]; capability_scorecards: readonly string[]; maturity_assessments: readonly string[]; trend_reports: readonly string[]; evidence_packages: readonly string[]; governance_reports: readonly string[]; integrity_hash: string }>;
export type BenchmarkGates = Readonly<{ gate_id: string; framework_approved: boolean; deterministic_execution: boolean; comparative_validity: boolean; score_reproducibility: boolean; evidence_completeness: boolean; lineage_integrity: boolean; governance_integrity: boolean; boundary_integrity: boolean; passed: boolean; integrity_hash: string }>;
export type BenchmarkBoundaries = Readonly<{ boundary_id: string; owns_environment_provisioning: false; owns_scenario_creation: false; owns_synthetic_data_generation: false; owns_simulation_execution: false; owns_replay_validation: false; owns_adversarial_testing: false; owns_resilience_validation: false; owns_performance_qualification: false; owns_interoperability_validation: false; owns_operational_exercises: false; owns_certification_rehearsal: false; owns_formal_qualification: false; integrity_hash: string }>;
export type BenchmarkReadiness = Readonly<{ readiness_id: string; outcome: BenchmarkOutcome; phase_ready: boolean; framework_ready: boolean; execution_ready: boolean; comparative_ready: boolean; capability_ready: boolean; scoring_ready: boolean; maturity_ready: boolean; trends_ready: boolean; evidence_ready: boolean; governance_ready: boolean; dashboard_ready: boolean; gates_passed: boolean; boundaries_respected: boolean; failures: readonly BenchmarkFailure[]; integrity_hash: string }>;
export type BenchmarkResult = Readonly<{ phase_version: "proving-benchmarking-comparative-analysis/v6.13"; phase_identifier: "ProvingBenchmarkingComparativeAnalysis"; rehearsal_preparation_ref: "proving-certification-rehearsal-qualification-preparation/v6.12"; framework: BenchmarkFramework; execution: BenchmarkExecution; capability_assessment: CapabilityAssessment; comparative_study: ComparativeStudy; scorecard: CapabilityScorecard; maturity_assessment: MaturityAssessment; trend_report: TrendReport; evidence_package: BenchmarkEvidencePackage; governance_report: BenchmarkGovernanceReport; dashboard: BenchmarkDashboard; gates: BenchmarkGates; boundaries: BenchmarkBoundaries; readiness: BenchmarkReadiness; replay_hash: string; integrity_hash: string }>;
export type BenchmarkValidation = Readonly<{ valid: boolean; outcome: BenchmarkOutcome; replay_hash_valid: boolean; integrity_hash_valid: boolean; framework_valid: boolean; execution_valid: boolean; capability_valid: boolean; comparative_valid: boolean; scorecard_valid: boolean; maturity_valid: boolean; trend_valid: boolean; evidence_valid: boolean; governance_valid: boolean; dashboard_valid: boolean; gates_valid: boolean; boundaries_valid: boolean; readiness_valid: boolean; failures: readonly BenchmarkFailure[]; integrity_hash: string }>;
export type BenchmarkBundle = Readonly<{ doctrine: Readonly<{ version: "proving-benchmarking-comparative-analysis/v6.13"; owns_benchmark_execution: true; owns_comparative_analysis: true; owns_capability_scoring: true; owns_maturity_scoring: true; owns_benchmark_normalization: true; owns_benchmark_baselines: true; owns_benchmark_catalogs: true; owns_benchmark_evidence: true; owns_benchmark_reproducibility: true; owns_benchmark_governance: true; owns_environment_provisioning: false; owns_scenario_creation: false; owns_synthetic_data_generation: false; owns_simulation_execution: false; owns_replay_validation: false; owns_adversarial_testing: false; owns_resilience_validation: false; owns_performance_qualification: false; owns_interoperability_validation: false; owns_operational_exercises: false; owns_certification_rehearsal: false; owns_formal_qualification: false }>; result: BenchmarkResult; validation: BenchmarkValidation }>;
