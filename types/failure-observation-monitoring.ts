import type { FailureSeverity, ScenarioType } from "@/types/scenario-definition-framework";
import type { InjectionTarget, StressInjectionLedger } from "@/types/stress-injection-engine";

export type ObservationCategory = "PLANNING_STABILITY" | "EXECUTION_HEALTH" | "DELEGATION_QUALITY" | "ORCHESTRATION_HEALTH" | "RUNTIME_SUPERVISION" | "GOVERNANCE_COMPLIANCE" | "AUTHORITY_ENFORCEMENT" | "REPLAY_CONSISTENCY" | "INTEGRITY_VERIFICATION" | "MISSION_HEALTH" | "CONFIDENCE_STABILITY" | "RECOVERY_READINESS";
export type ObservationState = "INITIALIZING" | "OBSERVING" | "WARNING" | "DEGRADED" | "HIGH_RISK" | "FAILURE_DETECTED" | "RECOVERING" | "STABLE" | "TERMINATED";
export type FailureObservationScenario = "BASELINE" | "MISSING_STRESS_LEDGER" | "NONDETERMINISTIC_OBSERVATION_ORDERING" | "MISSING_MONITOR_DOMAIN" | "REPLAY_INCONSISTENCY" | "GOVERNANCE_VISIBILITY_FAILURE" | "CONSTITUTIONAL_VISIBILITY_FAILURE" | "AUTHORITY_VISIBILITY_FAILURE" | "INTEGRITY_FAILURE_NOT_DETECTED" | "HIDDEN_OBSERVATION" | "INCOMPLETE_TELEMETRY_EVIDENCE" | "CROSS_TENANT_OBSERVATION" | "MISSING_ANOMALY_LEDGER" | "MISSING_RECOVERY_READINESS" | "INTEGRITY_HASH_FAILURE";
export type FailureObservationFailure = "STRESS_LEDGER_MISSING" | "OBSERVATION_ORDERING_NONDETERMINISTIC" | "MONITOR_DOMAIN_MISSING" | "REPLAY_INCONSISTENCY_UNDETECTED" | "GOVERNANCE_VISIBILITY_FAILED" | "CONSTITUTIONAL_VISIBILITY_FAILED" | "AUTHORITY_VISIBILITY_FAILED" | "INTEGRITY_FAILURE_UNDETECTED" | "HIDDEN_OBSERVATION_DETECTED" | "TELEMETRY_EVIDENCE_INCOMPLETE" | "CROSS_TENANT_OBSERVATION_DETECTED" | "ANOMALY_LEDGER_MISSING" | "RECOVERY_READINESS_MISSING" | "INTEGRITY_HASH_INVALID";

export type FailureObservationRecord = Readonly<{
  observation_id: string;
  scenario_id: string;
  simulation_id: string;
  mission_id: string;
  tenant_id: string;
  observed_component: InjectionTarget | "RECOVERY_READINESS" | "CONFIDENCE_ENGINE";
  observation_category: ObservationCategory;
  observation_state: ObservationState;
  health_score: number;
  confidence_score: number;
  severity: FailureSeverity;
  failure_detected: boolean;
  failure_type: ScenarioType;
  governance_status: "VISIBLE" | "FAILED";
  constitutional_status: "VISIBLE" | "FAILED";
  authority_status: "VISIBLE" | "FAILED";
  timestamp: string;
  sequence_number: number;
  replay_reference: string;
  lineage_reference: string;
  evidence_reference: string;
  operator_visible: boolean;
  integrity_hash: string;
}>;

export type AnomalyRecord = Readonly<{
  anomaly_id: string;
  anomaly_classification: string;
  affected_subsystem: string;
  severity: FailureSeverity;
  evidence_chain: readonly string[];
  replay_reference: string;
  governance_evaluation: string;
  authority_evaluation: string;
  integrity_verification: string;
  operator_visible: boolean;
  anomaly_hash: string;
}>;

export type SubsystemHealthReport = Readonly<{
  report_id: string;
  planning_health: number;
  execution_health: number;
  orchestration_health: number;
  delegation_health: number;
  governance_health: number;
  replay_health: number;
  integrity_health: number;
  mission_health: number;
  recovery_readiness: number;
  report_hash: string;
}>;

export type DegradationGraph = Readonly<{
  graph_id: string;
  nodes: readonly string[];
  edges: readonly string[];
  graph_hash: string;
}>;

export type FailureObservationLedger = Readonly<{
  ledger_id: string;
  engine_version: "failure-observation-monitoring/v8ALT.6.3";
  tenant_id: string;
  mission_id: string;
  simulation_id: string;
  source_stress_ledger: StressInjectionLedger | null;
  observations: readonly FailureObservationRecord[];
  failure_timeline: readonly string[];
  degradation_graph: DegradationGraph;
  subsystem_health_report: SubsystemHealthReport;
  intervention_log: readonly string[];
  anomaly_ledger: readonly AnomalyRecord[];
  replay_reference: string;
  lineage_reference: string;
  append_only: true;
  ledger_hash: string;
}>;

export type FailureObservationInput = Readonly<{
  scenario?: FailureObservationScenario;
  tenant_id?: string;
  mission_id?: string;
  stress_ledger?: StressInjectionLedger;
}>;

export type FailureObservationValidationResult = Readonly<{
  ledger_id: string | null;
  valid: boolean;
  stress_ledger_present: boolean;
  deterministic_ordering: boolean;
  all_monitor_domains_present: boolean;
  replay_consistent: boolean;
  governance_visible: boolean;
  constitutional_visible: boolean;
  authority_visible: boolean;
  integrity_failures_detected: boolean;
  operator_visible: boolean;
  telemetry_evidence_complete: boolean;
  tenant_isolated: boolean;
  anomaly_ledger_present: boolean;
  recovery_readiness_present: boolean;
  integrity_valid: boolean;
  failures: readonly FailureObservationFailure[];
  validation_hash: string;
}>;

export type FailureObservationReplayResult = Readonly<{
  replay_reference: string;
  ledger_id: string;
  deterministic: boolean;
  reconstructed_hash: string;
  original_hash: string;
  observation_count: number;
  replay_result_hash: string;
}>;

export type FailureObservationObservabilitySurface = Readonly<{
  ledger_id: string;
  tenant_id: string;
  mission_id: string;
  observation_count: number;
  anomaly_count: number;
  monitor_domains: readonly ObservationCategory[];
  append_only: true;
  ledger_hash: string;
}>;

export type FailureObservationContract = Readonly<{
  doctrine: Readonly<{
    engine_version: "failure-observation-monitoring/v8ALT.6.3";
    principles: readonly string[];
    observation_categories: readonly ObservationCategory[];
    observation_states: readonly ObservationState[];
    append_only: true;
  }>;
  ledger: FailureObservationLedger;
  validation: FailureObservationValidationResult;
  replay: FailureObservationReplayResult;
  observability: FailureObservationObservabilitySurface;
}>;
