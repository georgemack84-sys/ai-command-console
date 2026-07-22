export type OpportunityLifecycleState = "OBSERVED" | "IDENTIFIED" | "CLASSIFIED" | "BASELINED" | "EVIDENCE_COLLECTED" | "READY_FOR_ANALYSIS";
export type OptimizationDiscoveryCategory = "PLANNING" | "EXECUTION" | "DELEGATION" | "ORCHESTRATION" | "REPLAY" | "RESOURCE_UTILIZATION";
export type OptimizationOpportunityType = "LATENCY_OPTIMIZATION" | "THROUGHPUT_OPTIMIZATION" | "RESOURCE_OPTIMIZATION" | "ROUTING_OPTIMIZATION" | "REPLAY_OPTIMIZATION" | "SCHEDULING_OPTIMIZATION";
export type OptimizationDiscoveryScenario = "BASELINE" | "METRIC_DRIFT" | "REPLAY_MISMATCH" | "GOVERNANCE_VALIDATION_FAILURE" | "CONSTITUTIONAL_VALIDATION_FAILURE" | "AUTHORITY_BOUNDARY_VIOLATION" | "TENANT_LEAKAGE_ATTEMPT" | "HIDDEN_EVIDENCE" | "MUTABLE_RECORD_ATTEMPT" | "AUTOMATIC_OPTIMIZATION_ATTEMPT" | "LIFECYCLE_SKIP" | "INCOMPLETE_BASELINE";
export type OptimizationDiscoveryFailure = "METRIC_DRIFT_DETECTED" | "REPLAY_FIDELITY_LOST" | "GOVERNANCE_VALIDATION_FAILED" | "CONSTITUTIONAL_VALIDATION_FAILED" | "AUTHORITY_BOUNDARY_VIOLATED" | "TENANT_ISOLATION_BROKEN" | "OPTIMIZATION_EVIDENCE_HIDDEN" | "IMMUTABILITY_VIOLATED" | "AUTOMATIC_OPTIMIZATION_ATTEMPTED" | "LIFECYCLE_ORDER_INVALID" | "BASELINE_INCOMPLETE";

export type OptimizationOpportunityRecord = Readonly<{
  opportunity_id: string;
  mission_id: string;
  execution_id: string;
  tenant_id: string;
  subsystem: string;
  optimization_category: OptimizationDiscoveryCategory;
  opportunity_type: OptimizationOpportunityType;
  lifecycle_state: OpportunityLifecycleState;
  lifecycle_history: readonly OpportunityLifecycleState[];
  description: string;
  current_metric: number;
  baseline_metric: number;
  projected_metric: number;
  projected_improvement: number;
  confidence_score: number;
  evidence_reference: string;
  replay_reference: string;
  governance_reference: string;
  constitutional_reference: string;
  authority_validation: "PRESERVED" | "VIOLATED";
  advisory_only: true;
  execution_authority: false;
  automatic_optimization: boolean;
  mission_outcome_preserved: boolean;
  integrity_hash: string;
  timestamp: string;
}>;

export type PerformanceBaselineRecord = Readonly<{
  baseline_id: string;
  subsystem: string;
  metric_name: string;
  metric_value: number;
  confidence_score: number;
  historical_average: number;
  variance: number;
  replay_reference: string;
  immutable: boolean;
  integrity_hash: string;
  timestamp: string;
}>;

export type DiscoveryEvidenceRecord = Readonly<{
  evidence_id: string;
  opportunity_id: string;
  evidence_type: "PERFORMANCE_METRIC" | "HISTORICAL_TREND" | "REPLAY_COMPARISON" | "RESOURCE_PROFILE" | "GOVERNANCE_CHECK" | "CONSTITUTIONAL_CHECK" | "AUTHORITY_CHECK";
  subsystem: string;
  observed_metric: number;
  baseline_metric: number;
  replay_reference: string;
  historical_reference: string;
  confidence_score: number;
  governance_validation: "PASS" | "FAIL";
  constitutional_validation: "PASS" | "FAIL";
  authority_validation: "PASS" | "FAIL";
  integrity_hash: string;
  timestamp: string;
}>;

export type OptimizationOpportunityRegistry = Readonly<{
  registry_id: string;
  final_state: "OPTIMIZATION_OPPORTUNITIES_DISCOVERED" | "OPTIMIZATION_DISCOVERY_BLOCKED";
  opportunities: readonly OptimizationOpportunityRecord[];
  baselines: readonly PerformanceBaselineRecord[];
  evidence: readonly DiscoveryEvidenceRecord[];
  failures: readonly OptimizationDiscoveryFailure[];
  advisory_only: true;
  execution_authority: false;
  automatic_optimization: false;
  integrity_hash: string;
}>;

export type OptimizationDiscoveryValidationResult = Readonly<{
  registry_id: string;
  valid: boolean;
  deterministic_discovery: boolean;
  lifecycle_order_valid: boolean;
  baselines_reproducible: boolean;
  evidence_complete: boolean;
  replay_fidelity_preserved: boolean;
  governance_compliant: boolean;
  constitutional_compliant: boolean;
  authority_boundaries_preserved: boolean;
  tenant_isolated: boolean;
  immutable_records: boolean;
  mission_outcomes_preserved: boolean;
  advisory_only: true;
  execution_authority_absent: boolean;
  automatic_optimization_absent: boolean;
  hidden_evidence_absent: boolean;
  ready_for_impact_analysis: boolean;
  fail_closed: boolean;
  failures: readonly OptimizationDiscoveryFailure[];
  validation_hash: string;
}>;

export type OptimizationDiscoveryObservabilitySurface = Readonly<{
  registry_id: string;
  final_state: string;
  opportunity_count: number;
  baseline_count: number;
  evidence_count: number;
  failure_count: number;
  advisory_only: true;
  execution_authority: false;
  integrity_hash: string;
}>;

export type OptimizationDiscoveryInput = Readonly<{ scenario?: OptimizationDiscoveryScenario; registry?: OptimizationOpportunityRegistry }>;

export type OptimizationOpportunityDiscoveryBundle = Readonly<{
  doctrine: Readonly<{
    contract_version: "optimization-opportunity-discovery/v8ALT.8.1";
    final_state: "OPTIMIZATION_OPPORTUNITIES_DISCOVERED";
    lifecycle: readonly OpportunityLifecycleState[];
    principles: readonly string[];
  }>;
  registry: OptimizationOpportunityRegistry;
  validation: OptimizationDiscoveryValidationResult;
  observability: OptimizationDiscoveryObservabilitySurface;
}>;
