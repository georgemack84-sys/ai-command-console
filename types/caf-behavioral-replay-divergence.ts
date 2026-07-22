export type BehavioralDivergenceType =
  | "NONE"
  | "DECISION"
  | "REASONING"
  | "PLANNING"
  | "MEMORY"
  | "COLLABORATION"
  | "GOVERNANCE"
  | "AUTHORITY"
  | "POLICY"
  | "SAFETY"
  | "OPERATOR_INTERACTION"
  | "EXECUTION_ORDER"
  | "OUTCOME"
  | "EXTERNAL_DEPENDENCY"
  | "UNEXPLAINED";
export type BehavioralReplayStatus = "REQUESTED" | "RUNNING" | "CONTEXT_ASSEMBLY" | "RECONSTRUCTING" | "COMPARING" | "ANALYZING" | "EVIDENCE_GENERATION" | "COMPLETED" | "FAILED" | "CANCELLED";
export type ReplayCertificationOutcome = "PASS" | "FAIL" | "PRUNED";

export type BehavioralReplayDivergenceFailure =
  | "P3_1_AGENT_IDENTITY_INVALID"
  | "P3_2_CAPABILITY_INVALID"
  | "P3_3_RUNTIME_INVALID"
  | "P3_4_MEMORY_INVALID"
  | "P3_5_PLANNING_INVALID"
  | "P3_6_COLLABORATION_INVALID"
  | "P3_7_GOVERNANCE_INVALID"
  | "P3_8_SAFETY_INVALID"
  | "P3_9_INTERACTION_INVALID"
  | "P3_10_OBSERVABILITY_INVALID"
  | "CCI_REPLAY_NOT_CONSUMED"
  | "CCI_REPLAY_DUPLICATED"
  | "REPLAY_CONTEXT_NON_DETERMINISTIC"
  | "REPLAY_CONTEXT_INCOMPLETE"
  | "BEHAVIOR_RECONSTRUCTION_INCOMPLETE"
  | "MULTIPLE_BEHAVIORAL_INTERPRETATIONS"
  | "COMPARISON_ENGINE_INVALID"
  | "DIVERGENCE_ANALYSIS_INCOMPLETE"
  | "UNKNOWN_DIVERGENCE_NOT_UNEXPLAINED"
  | "REPLAY_EVIDENCE_MISSING"
  | "DIVERGENCE_REPORT_NON_REPRODUCIBLE"
  | "REPLAY_LINEAGE_INCOMPLETE"
  | "FAIL_CLOSED_NOT_ENFORCED"
  | "CERTIFICATION_PRUNED";

export type BehavioralReplayDivergenceScenario = "BASELINE" | BehavioralReplayDivergenceFailure;
export type BehavioralReplayDivergenceInput = Readonly<{ scenario?: BehavioralReplayDivergenceScenario; tenant_id?: string }>;

export type BehavioralReplayContext = Readonly<{
  context_id: string;
  cci_replay_session_id: string;
  source_refs: readonly string[];
  deterministic: boolean;
  complete: boolean;
  consumes_cci_replay: boolean;
  duplicates_cci_replay: boolean;
  integrity_hash: string;
}>;

export type ReconstructedBehavior = Readonly<{
  reconstructed_behavior_id: string;
  reasoning_ref: string;
  planning_ref: string;
  memory_ref: string;
  execution_ref: string;
  interaction_ref: string;
  single_interpretation: boolean;
  complete: boolean;
  integrity_hash: string;
}>;

export type BehavioralComparisonResult = Readonly<{
  comparison_id: string;
  reconstructed_behavior_ref: string;
  expected_behavior_ref: string;
  behavioral_match: boolean;
  reasoning_match: boolean;
  decision_match: boolean;
  workflow_match: boolean;
  execution_match: boolean;
  valid: boolean;
  integrity_hash: string;
}>;

export type DivergenceAnalysis = Readonly<{
  analysis_id: string;
  divergence_detected: boolean;
  divergence_types: readonly BehavioralDivergenceType[];
  root_cause_summary: string;
  governance_impact: string;
  safety_impact: string;
  confidence: number;
  complete: boolean;
  integrity_hash: string;
}>;

export type BehavioralReplayEvidence = Readonly<{
  evidence_id: string;
  cci_replay_evidence_refs: readonly string[];
  lineage_refs: readonly string[];
  replay_refs: readonly string[];
  divergence_evidence_refs: readonly string[];
  immutable: boolean;
  complete: boolean;
  integrity_hash: string;
}>;

export type DivergenceReport = Readonly<{
  report_id: string;
  summary: string;
  behavioral_explanation: string;
  impact_report: string;
  recommendations: readonly string[];
  replay_traceability_refs: readonly string[];
  reproducible: boolean;
  integrity_hash: string;
}>;

export type ReplayQualificationEvidence = Readonly<{
  qualification_id: string;
  replay_verified: boolean;
  behavior_qualified: boolean;
  completeness_validated: boolean;
  evidence_verified: boolean;
  integrity_hash: string;
}>;

export type AgentBehavioralReplayRecord = Readonly<{
  replay_id: string;
  execution_id: string;
  replay_session_id: string;
  replay_context_ref: string;
  reconstructed_behavior_ref: string;
  expected_behavior_ref: string;
  comparison_result: string;
  divergence_detected: boolean;
  divergence_types: readonly BehavioralDivergenceType[];
  root_cause_summary: string;
  governance_impact: string;
  safety_impact: string;
  evidence_refs: readonly string[];
  replay_status: BehavioralReplayStatus;
  integrity_hash: string;
}>;

export type BehavioralReplayValidation = Readonly<{
  replay_validation_id: string;
  context_replayed: boolean;
  reconstruction_replayed: boolean;
  comparison_replayed: boolean;
  divergence_replayed: boolean;
  evidence_replayed: boolean;
  report_replayed: boolean;
  deterministic: boolean;
  integrity_hash: string;
}>;

export type BehavioralReplayCertification = Readonly<{
  certification_id: string;
  outcome: ReplayCertificationOutcome;
  certified: boolean;
  consumes_cci_replay: boolean;
  does_not_duplicate_cci_replay: boolean;
  context_deterministic: boolean;
  context_complete: boolean;
  reconstruction_complete: boolean;
  single_behavioral_interpretation: boolean;
  comparison_valid: boolean;
  divergence_analysis_complete: boolean;
  evidence_complete: boolean;
  report_reproducible: boolean;
  lineage_complete: boolean;
  fail_closed_enforced: boolean;
  failures: readonly BehavioralReplayDivergenceFailure[];
  integrity_hash: string;
}>;

export type BehavioralReplayDivergenceResult = Readonly<{
  phase_version: "caf-behavioral-replay-divergence/v3.11";
  phase_identifier: "CafBehavioralReplayDivergence";
  cci_replay_ref: "Program 2 - CCI Replay Infrastructure";
  agent_identity_lifecycle_ref: "caf-agent-identity-lifecycle/v3.1";
  capability_composition_ref: "caf-capability-composition/v3.2";
  runtime_orchestration_ref: "caf-runtime-orchestration/v3.3";
  memory_knowledge_ref: "caf-memory-knowledge/v3.4";
  planning_reasoning_ref: "caf-planning-reasoning/v3.5";
  collaboration_federation_ref: "caf-collaboration-federation/v3.6";
  governance_authority_policy_ref: "caf-governance-authority-policy/v3.7";
  safety_behavioral_constraints_ref: "caf-safety-behavioral-constraints/v3.8";
  human_operator_interaction_ref: "caf-human-operator-interaction/v3.9";
  observability_telemetry_ref: "caf-observability-telemetry/v3.10";
  replay_context: BehavioralReplayContext;
  reconstructed_behavior: ReconstructedBehavior;
  comparison_result: BehavioralComparisonResult;
  divergence_analysis: DivergenceAnalysis;
  replay_evidence: BehavioralReplayEvidence;
  divergence_report: DivergenceReport;
  replay_qualification: ReplayQualificationEvidence;
  replay_record: AgentBehavioralReplayRecord;
  replay_validation: BehavioralReplayValidation;
  certification: BehavioralReplayCertification;
  replay_hash: string;
  integrity_hash: string;
}>;

export type BehavioralReplayDivergenceResultValidation = Readonly<{
  valid: boolean;
  outcome: ReplayCertificationOutcome;
  replay_hash_valid: boolean;
  integrity_hash_valid: boolean;
  context_valid: boolean;
  reconstruction_valid: boolean;
  comparison_valid: boolean;
  divergence_valid: boolean;
  evidence_valid: boolean;
  report_valid: boolean;
  qualification_valid: boolean;
  certification_valid: boolean;
  failures: readonly BehavioralReplayDivergenceFailure[];
  integrity_hash: string;
}>;

export type BehavioralReplayDivergenceBundle = Readonly<{
  doctrine: Readonly<{
    version: "caf-behavioral-replay-divergence/v3.11";
    owns_behavioral_replay_orchestration: true;
    owns_divergence_analysis: true;
    owns_replay_evidence: true;
    consumes_cci_replay: true;
    implements_replay_infrastructure: false;
    single_behavioral_interpretation_required: true;
    fail_closed_required: true;
  }>;
  result: BehavioralReplayDivergenceResult;
  validation: BehavioralReplayDivergenceResultValidation;
}>;
