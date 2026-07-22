import type { DecisionCandidate } from "@/types/decision-input-normalization";
import type { DecisionContext, DecisionContextDomain } from "@/types/decision-context-contract";
import type { MissionTenantContextPackage } from "@/types/decision-mission-tenant-context";
import type { AuthorityOperatorContextPackage } from "@/types/decision-authority-operator-context";
import type { EvidenceDependencyContextPackage } from "@/types/decision-evidence-dependency-context";
import type { RiskConfidenceContextPackage } from "@/types/decision-risk-confidence-context";
import type { GovernanceConstitutionalContextPackage } from "@/types/decision-governance-constitutional-context";

export type RuntimeHealth = "Healthy" | "Stable" | "Degraded" | "Critical" | "Recovering" | "Unavailable";
export type SystemStability = "STABLE" | "WATCH" | "DEGRADED" | "UNSTABLE" | "UNKNOWN";
export type ResourceAvailability = "AVAILABLE" | "CONSTRAINED" | "SATURATED" | "UNKNOWN";
export type RecoveryReadiness = "READY" | "PARTIAL" | "ACTIVE" | "UNAVAILABLE" | "UNKNOWN";
export type RollbackCapability = "AVAILABLE" | "LIMITED" | "UNAVAILABLE" | "UNKNOWN";
export type ContinuityStatus = "Operational" | "Degraded" | "Recovery Ready" | "Recovery Active" | "Continuity Risk" | "Continuity Failed";
export type ForecastImpact = "Positive" | "Neutral" | "Watch" | "Negative" | "Critical";

export type RuntimeRecoveryForecastResolutionState =
  | "PENDING"
  | "RUNTIME_TELEMETRY_RESOLVED"
  | "RUNTIME_HEALTH_RESOLVED"
  | "SYSTEM_STABILITY_RESOLVED"
  | "RESOURCE_AVAILABILITY_RESOLVED"
  | "OPERATIONAL_CAPACITY_RESOLVED"
  | "RECOVERY_READINESS_RESOLVED"
  | "ROLLBACK_CAPABILITY_RESOLVED"
  | "CONTINUITY_STATUS_RESOLVED"
  | "FORECAST_IMPACT_RESOLVED"
  | "MISSION_EFFECTS_PROJECTED"
  | "PROJECTED_RISKS_RESOLVED"
  | "LINEAGE_PRESERVED"
  | "PASSED"
  | "FAILED_RUNTIME"
  | "FAILED_RECOVERY"
  | "FAILED_FORECAST"
  | "FAILED_ISOLATION"
  | "FAILED_INTEGRITY";

export type RuntimeRecoveryForecastFailureReason =
  | "RUNTIME_TELEMETRY_UNAVAILABLE"
  | "RUNTIME_HEALTH_UNRESOLVED"
  | "SYSTEM_STABILITY_UNDETERMINED"
  | "RESOURCE_AVAILABILITY_UNKNOWN"
  | "RECOVERY_READINESS_UNRESOLVED"
  | "ROLLBACK_CAPABILITY_UNAVAILABLE"
  | "FORECAST_ENGINE_UNAVAILABLE"
  | "MISSION_EFFECTS_UNPROJECTABLE"
  | "DOWNSTREAM_DEPENDENCIES_UNKNOWN"
  | "PROJECTED_RISKS_UNDOCUMENTED"
  | "LINEAGE_INCOMPLETE"
  | "REPLAY_INCOMPATIBLE"
  | "CROSS_TENANT_OPERATIONAL_REFERENCE"
  | "INTEGRITY_VERIFICATION_FAILED";

export type RuntimeTelemetryRecord = Readonly<{
  telemetry_id: string;
  tenant_id: string;
  mission_id: string;
  subsystem: string;
  service_available: boolean;
  health_score: number;
  stability_score: number;
  compute_available: number;
  memory_available: number;
  storage_available: number;
  network_capacity: number;
  queue_capacity: number;
  alerts: readonly string[];
  constraints: readonly string[];
  lineage_refs: readonly string[];
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type RecoveryRecord = Readonly<{
  recovery_id: string;
  tenant_id: string;
  mission_id: string;
  backup_available: boolean;
  recovery_plan: string;
  rollback_available: boolean;
  rollback_scope: string;
  recovery_dependencies: readonly string[];
  recovery_confidence: number;
  lineage_refs: readonly string[];
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type ForecastRecord = Readonly<{
  forecast_id: string;
  tenant_id: string;
  mission_id: string;
  forecast_model: "mission-operational-forecast/v1";
  projected_mission_effects: readonly string[];
  downstream_dependencies: readonly string[];
  projected_risks: readonly string[];
  projected_recovery_effects: readonly string[];
  confidence_projection: number;
  lineage_refs: readonly string[];
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type OperationalExplainability = Readonly<{
  runtime_health_rationale: string;
  stability_assessment: string;
  resource_reasoning: readonly string[];
  recovery_readiness_rationale: string;
  rollback_analysis: string;
  forecast_methodology: string;
  projected_effects_rationale: readonly string[];
  projected_risk_rationale: readonly string[];
  governance_influence: readonly string[];
  constitutional_influence: readonly string[];
  validation_outcomes: readonly string[];
  replay_references: readonly string[];
  integrity_hash: string;
}>;

export type RuntimeContext = Readonly<{
  runtime_context_id: string;
  decision_candidate_id: string;
  runtime_health: RuntimeHealth;
  system_stability: SystemStability;
  subsystem_status: readonly RuntimeTelemetryRecord[];
  resource_availability: ResourceAvailability;
  operational_capacity: number;
  runtime_alerts: readonly string[];
  runtime_constraints: readonly string[];
  runtime_lineage: readonly string[];
  validation_state: RuntimeRecoveryForecastResolutionState;
  explainability: OperationalExplainability;
  integrity_hash: string;
}>;

export type RecoveryContext = Readonly<{
  recovery_context_id: string;
  decision_candidate_id: string;
  recovery_readiness: RecoveryReadiness;
  rollback_capability: RollbackCapability;
  recovery_dependencies: readonly string[];
  recovery_plan: string;
  recovery_confidence: number;
  continuity_status: ContinuityStatus;
  recovery_lineage: readonly string[];
  validation_state: RuntimeRecoveryForecastResolutionState;
  explainability: OperationalExplainability;
  integrity_hash: string;
}>;

export type ForecastContext = Readonly<{
  forecast_context_id: string;
  decision_candidate_id: string;
  forecast_impact: ForecastImpact;
  projected_mission_effects: readonly string[];
  downstream_dependencies: readonly string[];
  projected_risks: readonly string[];
  projected_recovery_effects: readonly string[];
  confidence_projection: number;
  forecast_lineage: readonly string[];
  validation_state: RuntimeRecoveryForecastResolutionState;
  explainability: OperationalExplainability;
  integrity_hash: string;
}>;

export type RuntimeRecoveryForecastContextRequest = Readonly<{
  resolution_id: string;
  candidate: DecisionCandidate;
  base_context?: DecisionContext;
  mission_tenant_package?: MissionTenantContextPackage;
  authority_operator_package?: AuthorityOperatorContextPackage;
  evidence_dependency_package?: EvidenceDependencyContextPackage;
  risk_confidence_package?: RiskConfidenceContextPackage;
  governance_constitutional_package?: GovernanceConstitutionalContextPackage;
  resolver_version: "runtime-recovery-forecast-context-resolver/v1";
}>;

export type RuntimeRecoveryForecastValidationResult = Readonly<{
  validation_status: "PASS" | "FAIL";
  validation_state: RuntimeRecoveryForecastResolutionState;
  failure_reason?: RuntimeRecoveryForecastFailureReason;
  failure_reasons: readonly RuntimeRecoveryForecastFailureReason[];
  checks: Readonly<{
    runtime_telemetry_available: boolean;
    runtime_health_resolved: boolean;
    system_stability_determined: boolean;
    resource_availability_verified: boolean;
    recovery_readiness_complete: boolean;
    rollback_capability_assessed: boolean;
    forecast_impact_generated: boolean;
    mission_effects_projected: boolean;
    downstream_dependencies_identified: boolean;
    projected_risks_documented: boolean;
    lineage_preserved: boolean;
    replay_compatible: boolean;
    tenant_isolated: boolean;
    integrity_verified: boolean;
  }>;
}>;

export type RuntimeRecoveryForecastContextPackage = Readonly<{
  resolution_id: string;
  candidate_id: string;
  runtime_context: RuntimeContext;
  recovery_context: RecoveryContext;
  forecast_context: ForecastContext;
  runtime_domain: DecisionContextDomain;
  recovery_domain: DecisionContextDomain;
  forecast_domain: DecisionContextDomain;
  validation: RuntimeRecoveryForecastValidationResult;
  replay_ref: string;
  timestamp: string;
  integrity_hash: string;
}>;

export type RuntimeRecoveryForecastReplayResult = Readonly<{
  replay_id: string;
  replay_valid: boolean;
  resolution_id: string;
  reconstructed_hash: string;
  expected_hash: string;
  reconstructed_state: RuntimeRecoveryForecastResolutionState;
  failures: readonly RuntimeRecoveryForecastFailureReason[];
  integrity_hash: string;
}>;

export type RuntimeRecoveryForecastObservability = Readonly<{
  resolution_attempts: number;
  successful_resolutions: number;
  failed_resolutions: number;
  runtime_failures: number;
  recovery_failures: number;
  forecast_failures: number;
  isolation_failures: number;
  integrity_failures: number;
  average_operational_capacity: number;
  average_forecast_confidence: number;
  replay_success_rate: number;
}>;
