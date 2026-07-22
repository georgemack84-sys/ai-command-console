import type { AdaptiveSimulationCertificationResult } from "@/types/adaptive-simulation-certification-gate";

export type DriftDefenseStatus = "AUTHORITATIVE" | "FAIL_CLOSED";

export type DriftType =
  | "STRATEGIC_DRIFT"
  | "CONFIDENCE_DRIFT"
  | "RISK_DRIFT"
  | "GOVERNANCE_DRIFT"
  | "AUTHORITY_DRIFT"
  | "REPLAY_DRIFT"
  | "EVIDENCE_DRIFT"
  | "OPERATOR_FEEDBACK_DRIFT"
  | "OPTIMIZATION_DRIFT"
  | "TENANT_ISOLATION_DRIFT"
  | "BEHAVIORAL_DRIFT"
  | "RECOMMENDATION_DRIFT"
  | "CALIBRATION_DRIFT"
  | "POLICY_DRIFT"
  | "ESCALATION_DRIFT"
  | "SIMULATION_DRIFT"
  | "CERTIFICATION_DRIFT"
  | "EXPLAINABILITY_DRIFT"
  | "AUDIT_DRIFT"
  | "LINEAGE_DRIFT"
  | "INTEGRITY_DRIFT"
  | "DECISION_DRIFT";

export type DriftSeverity = "INFORMATIONAL" | "LOW" | "MODERATE" | "HIGH" | "CRITICAL" | "CATASTROPHIC";

export type DriftResponse =
  | "MONITOR"
  | "ESCALATE"
  | "SUPPRESS_ADAPTATION"
  | "REQUIRE_REVIEW"
  | "REQUIRE_SIMULATION"
  | "REQUIRE_CERTIFICATION"
  | "ROLLBACK"
  | "FAIL_CLOSED";

export type ContainmentLevel = "LEVEL_0_OBSERVE" | "LEVEL_1_MONITOR" | "LEVEL_2_RESTRICT_ADAPTATION" | "LEVEL_3_SUSPEND_PROPOSAL" | "LEVEL_4_REQUIRE_GOVERNANCE_REVIEW" | "LEVEL_5_REQUIRE_CERTIFICATION" | "LEVEL_6_ROLLBACK" | "LEVEL_7_FAIL_CLOSED";

export type EscalationDestination = "GOVERNANCE_REVIEW" | "SIMULATION_VALIDATION" | "CERTIFICATION_REVIEW" | "OPERATOR_REVIEW" | "EXECUTIVE_REVIEW";

export type DriftDefenseFailure =
  | "SIMULATION_CERTIFICATION_UNAVAILABLE"
  | "UNSUPPORTED_DRIFT_DEFINITION"
  | "DUPLICATE_DRIFT_IDENTIFIER"
  | "CONFLICTING_RESPONSE_POLICY"
  | "MISSING_GOVERNANCE_MAPPING"
  | "INCOMPLETE_REPLAY_DEFINITION"
  | "INVALID_SEVERITY_MAPPING"
  | "UNKNOWN_DRIFT_CONDITION"
  | "AMBIGUOUS_DRIFT_CONDITION"
  | "UNSUPPORTED_DRIFT_CONDITION"
  | "GOVERNANCE_BYPASS_ATTEMPT"
  | "OPERATOR_AUTHORITY_BYPASS_ATTEMPT"
  | "CERTIFICATION_BYPASS_ATTEMPT"
  | "TENANT_ISOLATION_BREACH"
  | "IMMUTABLE_EVIDENCE_MISSING"
  | "NONDETERMINISTIC_DETECTION"
  | "NONREPLAYABLE_CONTAINMENT"
  | "AUDIT_REQUIREMENT_INCOMPLETE";

export type DriftDefenseScenario =
  | "BASELINE"
  | "CERTIFICATION_UNAVAILABLE"
  | "UNSUPPORTED_DRIFT"
  | "DUPLICATE_IDENTIFIER"
  | "CONFLICTING_POLICY"
  | "MISSING_GOVERNANCE"
  | "INCOMPLETE_REPLAY"
  | "INVALID_SEVERITY"
  | "UNKNOWN_DRIFT"
  | "AMBIGUOUS_DRIFT"
  | "UNSUPPORTED_CONDITION"
  | "GOVERNANCE_BYPASS"
  | "OPERATOR_AUTHORITY_BYPASS"
  | "CERTIFICATION_BYPASS"
  | "TENANT_BREACH"
  | "MISSING_EVIDENCE"
  | "NONDETERMINISTIC"
  | "NONREPLAYABLE_CONTAINMENT"
  | "INCOMPLETE_AUDIT";

export type DriftCategory = Readonly<{
  category_id: string;
  name: DriftType;
  description: string;
  parent_category: DriftType | "ROOT";
  criticality: DriftSeverity;
  constitutional_scope: boolean;
  governance_scope: boolean;
  detection_owner: string;
  supported_responses: readonly DriftResponse[];
  severity_model: readonly DriftSeverity[];
  integrity_hash: string;
}>;

export type ResponsePolicy = Readonly<{
  policy_id: string;
  supported_drift: DriftType;
  supported_severity: DriftSeverity;
  required_response: DriftResponse;
  governance_required: boolean;
  operator_required: boolean;
  simulation_required: boolean;
  rollback_supported: boolean;
  certification_required: boolean;
  containment_level: ContainmentLevel;
  integrity_hash: string;
}>;

export type DriftDefenseContract = Readonly<{
  contract_id: "drift-defense-contract";
  version: "drift-defense-architecture/v1";
  supported_drift_types: readonly DriftType[];
  supported_severity_levels: readonly DriftSeverity[];
  supported_responses: readonly DriftResponse[];
  containment_rules: readonly ContainmentLevel[];
  governance_rules: readonly string[];
  certification_rules: readonly string[];
  replay_requirements: readonly string[];
  audit_requirements: readonly string[];
  operator_requirements: readonly string[];
  integrity_hash: string;
}>;

export type DriftDefensePipeline = Readonly<{
  stages: readonly string[];
  deterministic: true;
  explainable: true;
  replayable: true;
  evidence_backed: true;
  governance_aware: true;
  tenant_isolated: true;
  auditable: true;
  integrity_hash: string;
}>;

export type DriftDefenseMetrics = Readonly<{
  supported_drift_types_count: number;
  severity_levels_count: number;
  response_policies_count: number;
  containment_levels_count: number;
  escalation_destinations_count: number;
  governance_dependencies_count: number;
  deterministic_detection_guaranteed: boolean;
  replayability_guaranteed: boolean;
  operator_authority_preserved: boolean;
  tenant_isolation_preserved: boolean;
  fail_closed_enforced: boolean;
  failures: readonly DriftDefenseFailure[];
  integrity_hash: string;
}>;

export type DriftDefenseApiSurface = Readonly<{
  api_id: string;
  establish_architecture: "POST /drift-defense-architecture/establish";
  retrieve_contract: "GET /drift-defense-architecture/contract";
  retrieve_taxonomy: "POST /drift-defense-architecture/taxonomy";
  retrieve_policies: "POST /drift-defense-architecture/policies";
  retrieve_containment: "POST /drift-defense-architecture/containment";
  retrieve_escalation: "POST /drift-defense-architecture/escalation";
  retrieve_metrics: "POST /drift-defense-architecture/metrics";
  replay_architecture: "POST /drift-defense-architecture/replay";
  inspect_architecture: "POST /drift-defense-architecture/inspect";
  autonomous_containment_supported: false;
  governance_bypass_supported: false;
  cross_tenant_analysis_supported: false;
  fail_open_supported: false;
  advisory_only: true;
  integrity_hash: string;
}>;

export type DriftDefenseInput = Readonly<{
  scenario?: DriftDefenseScenario;
  certification_result?: AdaptiveSimulationCertificationResult;
}>;

export type DriftDefenseArchitectureResult = Readonly<{
  drift_defense_architecture_version: "drift-defense-architecture/v1";
  architecture_identifier: "DriftDefenseArchitecture";
  status: DriftDefenseStatus;
  api_surface: DriftDefenseApiSurface;
  certification_result: AdaptiveSimulationCertificationResult;
  contract: DriftDefenseContract;
  taxonomy: readonly DriftCategory[];
  detection_pipeline: DriftDefensePipeline;
  response_policies: readonly ResponsePolicy[];
  containment_levels: readonly ContainmentLevel[];
  escalation_triggers: readonly string[];
  escalation_destinations: readonly EscalationDestination[];
  certification_requirements: readonly string[];
  replay_requirements: readonly string[];
  governance_dependencies: readonly string[];
  audit_requirements: readonly string[];
  metrics: DriftDefenseMetrics;
  failures: readonly DriftDefenseFailure[];
  deterministic: boolean;
  replayable: boolean;
  explainable: boolean;
  governance_preserved: boolean;
  constitutional_preserved: boolean;
  operator_authority_preserved: boolean;
  tenant_isolated: boolean;
  immutable_evidence_required: true;
  advisory_only: true;
  authorizes_production_response: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type DriftDefenseFoundation = Readonly<{
  drift_defense_architecture_version: "drift-defense-architecture/v1";
  supported_drift_types: readonly DriftType[];
  supported_severity_levels: readonly DriftSeverity[];
  api_surface: DriftDefenseApiSurface;
  result: DriftDefenseArchitectureResult;
}>;
