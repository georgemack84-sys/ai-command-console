export type ExerciseOutcome = "PASS" | "FAIL" | "REQUIRES_REVIEW";
export type ExerciseCategory = "TABLETOP" | "MISSION_REHEARSAL" | "OPERATOR_DRILL" | "GOVERNANCE_EXERCISE" | "EMERGENCY_SIMULATION";
export type ExerciseLifecycleState = "DRAFT" | "APPROVED" | "PROVISIONED" | "PREPARED" | "EXECUTING" | "COMPLETED" | "EVALUATED" | "REPORTED" | "ARCHIVED";
export type ReadinessDimension = "OPERATIONAL" | "GOVERNANCE" | "MISSION" | "TRUST" | "COORDINATION" | "PROCEDURAL" | "RESILIENCE" | "ECOSYSTEM";
export type OperationalExerciseFailure =
  | "P6_10_INTEGRATION_VALIDATION_INVALID"
  | "EXERCISE_ARCHITECTURE_MISSING"
  | "EXERCISE_REGISTRY_MISSING"
  | "EXERCISE_NOT_APPROVED"
  | "TABLETOP_FRAMEWORK_MISSING"
  | "MISSION_REHEARSAL_FRAMEWORK_MISSING"
  | "OPERATOR_DRILL_FRAMEWORK_MISSING"
  | "GOVERNANCE_EXERCISE_FRAMEWORK_MISSING"
  | "EMERGENCY_SIMULATION_FRAMEWORK_MISSING"
  | "EXECUTION_ENGINE_MISSING"
  | "EXERCISE_EXECUTION_NONDETERMINISTIC"
  | "PARTICIPANT_COORDINATION_FAILED"
  | "ENVIRONMENT_PROVISIONING_FAILED"
  | "EVENT_SYNCHRONIZATION_FAILED"
  | "OPERATIONAL_EVALUATION_MISSING"
  | "OBJECTIVE_COMPLETION_FAILED"
  | "PROCEDURAL_COMPLIANCE_FAILED"
  | "MISSION_SUCCESS_FAILED"
  | "GOVERNANCE_CORRECTNESS_FAILED"
  | "OPERATOR_EFFECTIVENESS_FAILED"
  | "COORDINATION_QUALITY_FAILED"
  | "READINESS_METRICS_MISSING"
  | "READINESS_METRICS_NOT_REPRODUCIBLE"
  | "EVIDENCE_COLLECTION_MISSING"
  | "EXERCISE_EVIDENCE_MUTATED"
  | "EXERCISE_LINEAGE_INCOMPLETE"
  | "REPLAY_VALIDATION_FAILED"
  | "REPORTING_FRAMEWORK_MISSING"
  | "REPORT_GENERATION_FAILED"
  | "IMPROVEMENT_RECOMMENDATIONS_MISSING"
  | "SIMULATION_ENGINE_OWNERSHIP_VIOLATION"
  | "REPLAY_VALIDATION_OWNERSHIP_VIOLATION"
  | "ADVERSARIAL_TESTING_OWNERSHIP_VIOLATION"
  | "RESILIENCE_VALIDATION_OWNERSHIP_VIOLATION"
  | "PERFORMANCE_TESTING_OWNERSHIP_VIOLATION"
  | "CROSS_PROGRAM_INTEGRATION_OWNERSHIP_VIOLATION"
  | "PRODUCTION_OPERATIONS_OWNERSHIP_VIOLATION"
  | "OPERATOR_CERTIFICATION_ATTEMPTED"
  | "TRUST_EVALUATION_ATTEMPTED"
  | "APPLICATION_GOVERNANCE_ATTEMPTED"
  | "GOVERNANCE_REVIEW_REQUIRED";
export type OperationalExerciseScenario = "BASELINE" | OperationalExerciseFailure;
export type OperationalExerciseInput = Readonly<{ scenario?: OperationalExerciseScenario; seed?: string }>;
export type ExerciseArchitecture = Readonly<{ architecture_id: string; lifecycle: readonly ExerciseLifecycleState[]; execution_architecture: boolean; participant_coordination: boolean; evidence_collection: boolean; exercise_governance: boolean; reporting_pipeline: boolean; deterministic: boolean; integrity_hash: string }>;
export type ExerciseRegistry = Readonly<{ registry_id: string; categories: readonly ExerciseCategory[]; definitions: readonly string[]; objectives: readonly string[]; prerequisites: readonly string[]; participants: readonly string[]; approval_status: "APPROVED" | "BLOCKED"; execution_history: readonly string[]; evidence_lineage: readonly string[]; integrity_hash: string }>;
export type ExerciseFrameworkReport = Readonly<{ report_id: string; category: ExerciseCategory; supported: boolean; validates: readonly string[]; findings: readonly string[]; evidence_refs: readonly string[]; integrity_hash: string }>;
export type ExerciseExecution = Readonly<{ execution_id: string; initialized: boolean; environments_provisioned: boolean; participants_assigned: boolean; events_synchronized: boolean; evidence_collected: boolean; progress_monitored: boolean; finalized: boolean; deterministic: boolean; execution_logs: readonly string[]; timeline_evidence: readonly string[]; integrity_hash: string }>;
export type OperationalEvaluation = Readonly<{ evaluation_id: string; objective_completion: boolean; procedural_compliance: boolean; mission_success: boolean; governance_correctness: boolean; operator_effectiveness: boolean; coordination_quality: boolean; findings: readonly string[]; readiness_score: number; integrity_hash: string }>;
export type ReadinessMetrics = Readonly<{ metrics_id: string; dimensions: readonly ReadinessDimension[]; operator_readiness: number; governance_readiness: number; application_readiness: number; ecosystem_readiness: number; trust_readiness: number; operational_maturity: number; trend_analysis: readonly string[]; reproducible: boolean; integrity_hash: string }>;
export type ExerciseEvidence = Readonly<{ evidence_id: string; scenario: string; participants: readonly string[]; objectives: readonly string[]; timeline: readonly string[]; decisions: readonly string[]; governance_actions: readonly string[]; replay_references: readonly string[]; audit_records: readonly string[]; metrics: readonly string[]; findings: readonly string[]; recommendations: readonly string[]; immutable: boolean; lineage_complete: boolean; replayable: boolean; integrity_hash: string }>;
export type ExerciseReporting = Readonly<{ reporting_id: string; exercise_reports: readonly string[]; operational_findings: readonly string[]; readiness_metrics: readonly string[]; executive_summaries: readonly string[]; improvement_recommendations: readonly string[]; generated: boolean; integrity_hash: string }>;
export type ExerciseGates = Readonly<{ gate_id: string; architecture_gate: boolean; registry_gate: boolean; category_support_gate: boolean; execution_gate: boolean; evaluation_gate: boolean; metrics_gate: boolean; evidence_gate: boolean; reporting_gate: boolean; replay_gate: boolean; boundaries_gate: boolean; passed: boolean; integrity_hash: string }>;
export type ExerciseBoundaries = Readonly<{ boundary_id: string; owns_simulation_engine: false; owns_replay_validation: false; owns_adversarial_testing: false; owns_resilience_validation: false; owns_performance_testing: false; owns_cross_program_integration: false; owns_production_operations: false; owns_operator_certification: false; owns_trust_evaluation: false; owns_application_governance: false; integrity_hash: string }>;
export type ExerciseReadiness = Readonly<{ readiness_id: string; outcome: ExerciseOutcome; phase_ready: boolean; architecture_ready: boolean; registry_ready: boolean; tabletop_ready: boolean; mission_rehearsal_ready: boolean; operator_drill_ready: boolean; governance_exercise_ready: boolean; emergency_simulation_ready: boolean; execution_ready: boolean; evaluation_ready: boolean; metrics_ready: boolean; evidence_ready: boolean; reporting_ready: boolean; gates_passed: boolean; boundaries_respected: boolean; failures: readonly OperationalExerciseFailure[]; integrity_hash: string }>;
export type OperationalExerciseResult = Readonly<{ phase_version: "proving-operational-exercise-framework/v6.11"; phase_identifier: "ProvingOperationalExerciseFramework"; integration_validation_ref: "proving-cross-program-integration-validation/v6.10"; architecture: ExerciseArchitecture; registry: ExerciseRegistry; tabletop_report: ExerciseFrameworkReport; mission_rehearsal_report: ExerciseFrameworkReport; operator_drill_report: ExerciseFrameworkReport; governance_exercise_report: ExerciseFrameworkReport; emergency_simulation_report: ExerciseFrameworkReport; execution: ExerciseExecution; evaluation: OperationalEvaluation; readiness_metrics: ReadinessMetrics; evidence: ExerciseEvidence; reporting: ExerciseReporting; gates: ExerciseGates; boundaries: ExerciseBoundaries; readiness: ExerciseReadiness; replay_hash: string; integrity_hash: string }>;
export type OperationalExerciseValidation = Readonly<{ valid: boolean; outcome: ExerciseOutcome; replay_hash_valid: boolean; integrity_hash_valid: boolean; architecture_valid: boolean; registry_valid: boolean; tabletop_valid: boolean; mission_rehearsal_valid: boolean; operator_drill_valid: boolean; governance_exercise_valid: boolean; emergency_simulation_valid: boolean; execution_valid: boolean; evaluation_valid: boolean; metrics_valid: boolean; evidence_valid: boolean; reporting_valid: boolean; gates_valid: boolean; boundaries_valid: boolean; readiness_valid: boolean; failures: readonly OperationalExerciseFailure[]; integrity_hash: string }>;
export type OperationalExerciseBundle = Readonly<{ doctrine: Readonly<{ version: "proving-operational-exercise-framework/v6.11"; owns_tabletop_exercises: true; owns_mission_rehearsals: true; owns_operator_drills: true; owns_governance_exercises: true; owns_emergency_simulations: true; owns_simulation_engine: false; owns_replay_validation: false; owns_adversarial_testing: false; owns_resilience_validation: false; owns_performance_testing: false; owns_cross_program_integration: false; owns_production_operations: false; owns_operator_certification: false; owns_trust_evaluation: false; owns_application_governance: false }>; result: OperationalExerciseResult; validation: OperationalExerciseValidation }>;
