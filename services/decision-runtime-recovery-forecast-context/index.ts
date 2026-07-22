import { createDecisionContext } from "@/services/decision-context-contract";
import { generateDecisionIntegrityHash } from "@/services/decision-integrity";
import { normalizeDecisionCandidateInput } from "@/services/decision-input-normalization";
import { createMissionTenantContextRequest, resolveMissionTenantContext } from "@/services/decision-mission-tenant-context";
import { createAuthorityOperatorContextRequest, resolveAuthorityOperatorContext } from "@/services/decision-authority-operator-context";
import { createEvidenceDependencyContextRequest, resolveEvidenceDependencyContext } from "@/services/decision-evidence-dependency-context";
import { createRiskConfidenceContextRequest, resolveRiskConfidenceContext } from "@/services/decision-risk-confidence-context";
import { createGovernanceConstitutionalContextRequest, resolveGovernanceConstitutionalContext } from "@/services/decision-governance-constitutional-context";
import type { DecisionCandidate } from "@/types/decision-input-normalization";
import type { DecisionContextDomain } from "@/types/decision-context-contract";
import type {
  ContinuityStatus,
  ForecastContext,
  ForecastImpact,
  ForecastRecord,
  OperationalExplainability,
  RecoveryContext,
  RecoveryReadiness,
  RecoveryRecord,
  ResourceAvailability,
  RollbackCapability,
  RuntimeContext,
  RuntimeHealth,
  RuntimeRecoveryForecastContextPackage,
  RuntimeRecoveryForecastContextRequest,
  RuntimeRecoveryForecastFailureReason,
  RuntimeRecoveryForecastObservability,
  RuntimeRecoveryForecastReplayResult,
  RuntimeRecoveryForecastResolutionState,
  RuntimeRecoveryForecastValidationResult,
  RuntimeTelemetryRecord,
  SystemStability,
} from "@/types/decision-runtime-recovery-forecast-context";

const NOW = "2026-07-02T09:34:00.000Z";
const RESOLVER_VERSION = "runtime-recovery-forecast-context-resolver/v1" as const;
const RESOLUTION_ORDER: readonly RuntimeRecoveryForecastResolutionState[] = Object.freeze([
  "RUNTIME_TELEMETRY_RESOLVED",
  "RUNTIME_HEALTH_RESOLVED",
  "SYSTEM_STABILITY_RESOLVED",
  "RESOURCE_AVAILABILITY_RESOLVED",
  "OPERATIONAL_CAPACITY_RESOLVED",
  "RECOVERY_READINESS_RESOLVED",
  "ROLLBACK_CAPABILITY_RESOLVED",
  "CONTINUITY_STATUS_RESOLVED",
  "FORECAST_IMPACT_RESOLVED",
  "MISSION_EFFECTS_PROJECTED",
  "PROJECTED_RISKS_RESOLVED",
  "LINEAGE_PRESERVED",
  "PASSED",
] as const);

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function recordHash<T extends Record<string, unknown>>(value: T): string {
  const copy = { ...value };
  delete copy.integrity_hash;
  return hash(copy);
}

function makeTelemetry(input: Omit<RuntimeTelemetryRecord, "integrity_hash">): RuntimeTelemetryRecord {
  return Object.freeze({ ...input, integrity_hash: recordHash(input) });
}

function makeRecovery(input: Omit<RecoveryRecord, "integrity_hash">): RecoveryRecord {
  return Object.freeze({ ...input, integrity_hash: recordHash(input) });
}

function makeForecast(input: Omit<ForecastRecord, "integrity_hash">): ForecastRecord {
  return Object.freeze({ ...input, integrity_hash: recordHash(input) });
}

const TELEMETRY_REGISTRY: readonly RuntimeTelemetryRecord[] = Object.freeze([
  makeTelemetry({
    telemetry_id: "telemetry_tenant_alpha_phase_9_orchestration_core",
    tenant_id: "tenant_alpha",
    mission_id: "mission_phase_9_decision_orchestration",
    subsystem: "orchestration-core",
    service_available: true,
    health_score: 0.88,
    stability_score: 0.9,
    compute_available: 0.72,
    memory_available: 0.69,
    storage_available: 0.81,
    network_capacity: 0.76,
    queue_capacity: 0.64,
    alerts: Object.freeze(["queue_watch"]),
    constraints: Object.freeze(["advisory_only_no_execution"]),
    lineage_refs: Object.freeze(["lineage_runtime_orchestration_core_001"]),
    replay_refs: Object.freeze(["replay_runtime_orchestration_core_001"]),
  }),
  makeTelemetry({
    telemetry_id: "telemetry_tenant_alpha_phase_9_evidence_services",
    tenant_id: "tenant_alpha",
    mission_id: "mission_phase_9_decision_orchestration",
    subsystem: "evidence-services",
    service_available: true,
    health_score: 0.92,
    stability_score: 0.86,
    compute_available: 0.79,
    memory_available: 0.74,
    storage_available: 0.83,
    network_capacity: 0.78,
    queue_capacity: 0.7,
    alerts: Object.freeze([]),
    constraints: Object.freeze(["preserve_conflicting_evidence"]),
    lineage_refs: Object.freeze(["lineage_runtime_evidence_services_001"]),
    replay_refs: Object.freeze(["replay_runtime_evidence_services_001"]),
  }),
  makeTelemetry({
    telemetry_id: "telemetry_tenant_beta_phase_9_external",
    tenant_id: "tenant_beta",
    mission_id: "mission_phase_9_decision_orchestration",
    subsystem: "external-runtime",
    service_available: true,
    health_score: 0.95,
    stability_score: 0.93,
    compute_available: 0.9,
    memory_available: 0.88,
    storage_available: 0.91,
    network_capacity: 0.9,
    queue_capacity: 0.89,
    alerts: Object.freeze([]),
    constraints: Object.freeze(["external_tenant_reference"]),
    lineage_refs: Object.freeze(["lineage_runtime_beta_001"]),
    replay_refs: Object.freeze(["replay_runtime_beta_001"]),
  }),
]);

const RECOVERY_REGISTRY: readonly RecoveryRecord[] = Object.freeze([
  makeRecovery({
    recovery_id: "recovery_tenant_alpha_phase_9_primary",
    tenant_id: "tenant_alpha",
    mission_id: "mission_phase_9_decision_orchestration",
    backup_available: true,
    recovery_plan: "phase_9_context_rebuild_plan",
    rollback_available: true,
    rollback_scope: "context_package_only",
    recovery_dependencies: Object.freeze(["backup_phase_9_context_registry", "operator_recovery_review"]),
    recovery_confidence: 0.84,
    lineage_refs: Object.freeze(["lineage_recovery_phase_9_primary_001"]),
    replay_refs: Object.freeze(["replay_recovery_phase_9_primary_001"]),
  }),
  makeRecovery({
    recovery_id: "recovery_tenant_beta_phase_9_external",
    tenant_id: "tenant_beta",
    mission_id: "mission_phase_9_decision_orchestration",
    backup_available: true,
    recovery_plan: "external_recovery_plan",
    rollback_available: false,
    rollback_scope: "external_only",
    recovery_dependencies: Object.freeze(["external_dependency"]),
    recovery_confidence: 0.5,
    lineage_refs: Object.freeze(["lineage_recovery_beta_001"]),
    replay_refs: Object.freeze(["replay_recovery_beta_001"]),
  }),
]);

const FORECAST_REGISTRY: readonly ForecastRecord[] = Object.freeze([
  makeForecast({
    forecast_id: "forecast_tenant_alpha_phase_9_operational_context",
    tenant_id: "tenant_alpha",
    mission_id: "mission_phase_9_decision_orchestration",
    forecast_model: "mission-operational-forecast/v1",
    projected_mission_effects: Object.freeze(["improved_context_certification", "increased_operator_review_load"]),
    downstream_dependencies: Object.freeze(["historical_lineage_replay_context_phase_9_3_8", "decision_orchestration_certification"]),
    projected_risks: Object.freeze(["queue_capacity_watch", "governance_review_delay"]),
    projected_recovery_effects: Object.freeze(["rollback_scope_preserved", "recovery_plan_ready"]),
    confidence_projection: 0.82,
    lineage_refs: Object.freeze(["lineage_forecast_phase_9_operational_context_001"]),
    replay_refs: Object.freeze(["replay_forecast_phase_9_operational_context_001"]),
  }),
  makeForecast({
    forecast_id: "forecast_tenant_beta_phase_9_external",
    tenant_id: "tenant_beta",
    mission_id: "mission_phase_9_decision_orchestration",
    forecast_model: "mission-operational-forecast/v1",
    projected_mission_effects: Object.freeze(["external_mission_effect"]),
    downstream_dependencies: Object.freeze(["external_dependency"]),
    projected_risks: Object.freeze(["external_tenant_risk"]),
    projected_recovery_effects: Object.freeze(["external_recovery_effect"]),
    confidence_projection: 0.75,
    lineage_refs: Object.freeze(["lineage_forecast_beta_001"]),
    replay_refs: Object.freeze(["replay_forecast_beta_001"]),
  }),
]);

function defaultCandidate(): DecisionCandidate {
  const result = normalizeDecisionCandidateInput();
  if (!result.candidate) throw new Error("default normalized candidate unavailable");
  return result.candidate;
}

export function createRuntimeRecoveryForecastContextRequest(overrides: Partial<RuntimeRecoveryForecastContextRequest> = {}): RuntimeRecoveryForecastContextRequest {
  const candidate = overrides.candidate ?? defaultCandidate();
  const mission_tenant_package = overrides.mission_tenant_package ?? resolveMissionTenantContext(createMissionTenantContextRequest({ candidate }));
  const authority_operator_package = overrides.authority_operator_package ?? resolveAuthorityOperatorContext(createAuthorityOperatorContextRequest({ candidate, mission_tenant_package }));
  const evidence_dependency_package = overrides.evidence_dependency_package ?? resolveEvidenceDependencyContext(createEvidenceDependencyContextRequest({ candidate, mission_tenant_package, authority_operator_package }));
  const risk_confidence_package = overrides.risk_confidence_package ?? resolveRiskConfidenceContext(createRiskConfidenceContextRequest({ candidate, mission_tenant_package, authority_operator_package, evidence_dependency_package }));
  return Object.freeze({
    resolution_id: overrides.resolution_id ?? `runtime_recovery_forecast_resolution_${candidate.candidate_id}`,
    candidate,
    base_context: overrides.base_context ?? createDecisionContext({ candidate }),
    mission_tenant_package,
    authority_operator_package,
    evidence_dependency_package,
    risk_confidence_package,
    governance_constitutional_package: overrides.governance_constitutional_package ?? resolveGovernanceConstitutionalContext(createGovernanceConstitutionalContextRequest({ candidate, mission_tenant_package, authority_operator_package, evidence_dependency_package, risk_confidence_package })),
    resolver_version: overrides.resolver_version ?? RESOLVER_VERSION,
  });
}

function scopedTelemetry(candidate: DecisionCandidate): readonly RuntimeTelemetryRecord[] {
  const includeBeta = candidate.replay_refs.some((ref) => ref.includes("tenant_beta") || ref.includes("external_runtime"));
  const scoped = TELEMETRY_REGISTRY.filter((record) => record.tenant_id === candidate.tenant_id && record.mission_id === candidate.mission_id);
  const direct = includeBeta ? TELEMETRY_REGISTRY.filter((record) => record.tenant_id === "tenant_beta") : [];
  return Object.freeze([...scoped, ...direct].sort((left, right) => left.telemetry_id.localeCompare(right.telemetry_id)));
}

function scopedRecovery(candidate: DecisionCandidate): readonly RecoveryRecord[] {
  const includeBeta = candidate.replay_refs.some((ref) => ref.includes("tenant_beta") || ref.includes("external_runtime"));
  const scoped = RECOVERY_REGISTRY.filter((record) => record.tenant_id === candidate.tenant_id && record.mission_id === candidate.mission_id);
  const direct = includeBeta ? RECOVERY_REGISTRY.filter((record) => record.tenant_id === "tenant_beta") : [];
  return Object.freeze([...scoped, ...direct].sort((left, right) => left.recovery_id.localeCompare(right.recovery_id)));
}

function scopedForecast(candidate: DecisionCandidate): readonly ForecastRecord[] {
  const includeBeta = candidate.replay_refs.some((ref) => ref.includes("tenant_beta") || ref.includes("external_runtime"));
  const scoped = FORECAST_REGISTRY.filter((record) => record.tenant_id === candidate.tenant_id && record.mission_id === candidate.mission_id);
  const direct = includeBeta ? FORECAST_REGISTRY.filter((record) => record.tenant_id === "tenant_beta") : [];
  return Object.freeze([...scoped, ...direct].sort((left, right) => left.forecast_id.localeCompare(right.forecast_id)));
}

function average(values: readonly number[]): number {
  return values.length === 0 ? 0 : Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(6));
}

function runtimeHealth(records: readonly RuntimeTelemetryRecord[]): RuntimeHealth {
  if (records.length === 0) return "Unavailable";
  if (records.some((record) => !record.service_available || record.health_score < 0.4)) return "Critical";
  const score = average(records.map((record) => record.health_score));
  if (score >= 0.9) return "Healthy";
  if (score >= 0.75) return "Stable";
  if (score >= 0.55) return "Degraded";
  return "Recovering";
}

function systemStability(records: readonly RuntimeTelemetryRecord[]): SystemStability {
  if (records.length === 0) return "UNKNOWN";
  const score = average(records.map((record) => record.stability_score));
  if (score >= 0.85) return "STABLE";
  if (score >= 0.7) return "WATCH";
  if (score >= 0.5) return "DEGRADED";
  return "UNSTABLE";
}

function resourceAvailability(records: readonly RuntimeTelemetryRecord[]): ResourceAvailability {
  if (records.length === 0) return "UNKNOWN";
  const capacity = operationalCapacity(records);
  if (capacity >= 0.7) return "AVAILABLE";
  if (capacity >= 0.45) return "CONSTRAINED";
  return "SATURATED";
}

function operationalCapacity(records: readonly RuntimeTelemetryRecord[]): number {
  const resourceScores = records.flatMap((record) => [record.compute_available, record.memory_available, record.storage_available, record.network_capacity, record.queue_capacity]);
  return average(resourceScores);
}

function recoveryReadiness(records: readonly RecoveryRecord[]): RecoveryReadiness {
  if (records.length === 0) return "UNKNOWN";
  if (records.every((record) => record.backup_available && record.recovery_plan && record.recovery_confidence >= 0.8)) return "READY";
  if (records.some((record) => record.backup_available)) return "PARTIAL";
  return "UNAVAILABLE";
}

function rollbackCapability(records: readonly RecoveryRecord[]): RollbackCapability {
  if (records.length === 0) return "UNKNOWN";
  if (records.every((record) => record.rollback_available)) return "AVAILABLE";
  if (records.some((record) => record.rollback_available)) return "LIMITED";
  return "UNAVAILABLE";
}

function continuityStatus(input: { runtime: RuntimeHealth; readiness: RecoveryReadiness; rollback: RollbackCapability }): ContinuityStatus {
  if (input.runtime === "Critical" || input.runtime === "Unavailable") return "Continuity Failed";
  if (input.runtime === "Degraded") return "Degraded";
  if (input.readiness === "READY" && input.rollback === "AVAILABLE") return "Recovery Ready";
  if (input.readiness === "UNKNOWN" || input.rollback === "UNKNOWN") return "Continuity Risk";
  return "Operational";
}

function forecastImpact(request: RuntimeRecoveryForecastContextRequest, records: readonly ForecastRecord[], capacity: number): ForecastImpact {
  if (records.length === 0) return "Critical";
  if (request.risk_confidence_package?.risk_context.risk_severity === "Critical") return "Critical";
  if (capacity < 0.5) return "Negative";
  if ((request.governance_constitutional_package?.governance_context.required_reviews.length ?? 0) > 0) return "Watch";
  return "Positive";
}

function explainability(input: {
  candidate: DecisionCandidate;
  telemetry: readonly RuntimeTelemetryRecord[];
  recovery: readonly RecoveryRecord[];
  forecast: readonly ForecastRecord[];
  validation: readonly string[];
  runtime: RuntimeHealth;
  stability: SystemStability;
  capacity: number;
}): OperationalExplainability {
  const base: Omit<OperationalExplainability, "integrity_hash"> = {
    runtime_health_rationale: `${input.runtime} runtime health from ${input.telemetry.length} certified telemetry records.`,
    stability_assessment: `${input.stability} stability at operational capacity ${input.capacity}.`,
    resource_reasoning: Object.freeze(input.telemetry.map((record) => `${record.subsystem}:queue_${record.queue_capacity}:compute_${record.compute_available}`)),
    recovery_readiness_rationale: `${input.recovery.length} recovery records evaluated.`,
    rollback_analysis: input.recovery.map((record) => `${record.recovery_id}:${record.rollback_scope}`).join(";"),
    forecast_methodology: "mission-operational-forecast/v1 deterministic registry projection.",
    projected_effects_rationale: Object.freeze(input.forecast.flatMap((record) => record.projected_mission_effects).sort()),
    projected_risk_rationale: Object.freeze(input.forecast.flatMap((record) => record.projected_risks).sort()),
    governance_influence: input.candidate.governance_refs,
    constitutional_influence: Object.freeze(["constitution_advisory_only_v1", "constitution_tenant_isolation_v1", "constitution_replay_integrity_v1"]),
    validation_outcomes: input.validation,
    replay_references: Object.freeze([...input.telemetry.flatMap((record) => record.replay_refs), ...input.recovery.flatMap((record) => record.replay_refs), ...input.forecast.flatMap((record) => record.replay_refs)].sort()),
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function validationFor(request: RuntimeRecoveryForecastContextRequest, telemetry: readonly RuntimeTelemetryRecord[], recovery: readonly RecoveryRecord[], forecast: readonly ForecastRecord[]): RuntimeRecoveryForecastValidationResult {
  const runtime = runtimeHealth(telemetry);
  const stability = systemStability(telemetry);
  const resources = resourceAvailability(telemetry);
  const readiness = recoveryReadiness(recovery);
  const rollback = rollbackCapability(recovery);
  const crossTenant = [...telemetry, ...recovery, ...forecast].some((record) => record.tenant_id !== request.candidate.tenant_id) || request.candidate.replay_refs.some((ref) => ref.includes("tenant_beta") || ref.includes("external_runtime"));
  const lineageComplete = [...telemetry, ...recovery, ...forecast].every((record) => record.lineage_refs.length > 0);
  const replayCompatible = request.evidence_dependency_package?.validation.validation_status === "PASS"
    && request.risk_confidence_package?.validation.validation_status === "PASS"
    && request.governance_constitutional_package?.validation.validation_status === "PASS";
  const upstreamIntegrityFailed = request.mission_tenant_package?.validation.validation_status === "FAIL" || request.authority_operator_package?.validation.validation_status === "FAIL";
  const failures: RuntimeRecoveryForecastFailureReason[] = [
    ...(telemetry.length === 0 ? ["RUNTIME_TELEMETRY_UNAVAILABLE" as const] : []),
    ...(runtime === "Unavailable" ? ["RUNTIME_HEALTH_UNRESOLVED" as const] : []),
    ...(stability === "UNKNOWN" ? ["SYSTEM_STABILITY_UNDETERMINED" as const] : []),
    ...(resources === "UNKNOWN" ? ["RESOURCE_AVAILABILITY_UNKNOWN" as const] : []),
    ...(readiness === "UNKNOWN" ? ["RECOVERY_READINESS_UNRESOLVED" as const] : []),
    ...(rollback === "UNKNOWN" || rollback === "UNAVAILABLE" ? ["ROLLBACK_CAPABILITY_UNAVAILABLE" as const] : []),
    ...(forecast.length === 0 ? ["FORECAST_ENGINE_UNAVAILABLE" as const] : []),
    ...(forecast.every((record) => record.projected_mission_effects.length === 0) ? ["MISSION_EFFECTS_UNPROJECTABLE" as const] : []),
    ...(forecast.every((record) => record.downstream_dependencies.length === 0) ? ["DOWNSTREAM_DEPENDENCIES_UNKNOWN" as const] : []),
    ...(forecast.every((record) => record.projected_risks.length === 0) ? ["PROJECTED_RISKS_UNDOCUMENTED" as const] : []),
    ...(!lineageComplete ? ["LINEAGE_INCOMPLETE" as const] : []),
    ...(!replayCompatible ? ["REPLAY_INCOMPATIBLE" as const] : []),
    ...(crossTenant ? ["CROSS_TENANT_OPERATIONAL_REFERENCE" as const] : []),
    ...(upstreamIntegrityFailed ? ["INTEGRITY_VERIFICATION_FAILED" as const] : []),
  ];
  const unique = Object.freeze([...new Set(failures)]);
  const state: RuntimeRecoveryForecastResolutionState =
    unique.includes("CROSS_TENANT_OPERATIONAL_REFERENCE") ? "FAILED_ISOLATION"
      : unique.includes("INTEGRITY_VERIFICATION_FAILED") ? "FAILED_INTEGRITY"
        : unique.some((failure) => failure.includes("RECOVERY") || failure.includes("ROLLBACK")) ? "FAILED_RECOVERY"
          : unique.some((failure) => failure.includes("FORECAST") || failure.includes("MISSION_EFFECTS") || failure.includes("DOWNSTREAM") || failure.includes("PROJECTED")) ? "FAILED_FORECAST"
            : unique.length ? "FAILED_RUNTIME"
              : "PASSED";
  return Object.freeze({
    validation_status: unique.length ? "FAIL" : "PASS",
    validation_state: state,
    failure_reason: unique[0],
    failure_reasons: unique,
    checks: Object.freeze({
      runtime_telemetry_available: telemetry.length > 0,
      runtime_health_resolved: runtime !== "Unavailable",
      system_stability_determined: stability !== "UNKNOWN",
      resource_availability_verified: resources !== "UNKNOWN",
      recovery_readiness_complete: readiness !== "UNKNOWN",
      rollback_capability_assessed: rollback !== "UNKNOWN" && rollback !== "UNAVAILABLE",
      forecast_impact_generated: forecast.length > 0,
      mission_effects_projected: forecast.some((record) => record.projected_mission_effects.length > 0),
      downstream_dependencies_identified: forecast.some((record) => record.downstream_dependencies.length > 0),
      projected_risks_documented: forecast.some((record) => record.projected_risks.length > 0),
      lineage_preserved: lineageComplete,
      replay_compatible: replayCompatible,
      tenant_isolated: !crossTenant,
      integrity_verified: !upstreamIntegrityFailed,
    }),
  });
}

function runtimeContext(request: RuntimeRecoveryForecastContextRequest, telemetry: readonly RuntimeTelemetryRecord[], validation: RuntimeRecoveryForecastValidationResult): RuntimeContext {
  const health = runtimeHealth(telemetry);
  const stability = systemStability(telemetry);
  const capacity = operationalCapacity(telemetry);
  const base: Omit<RuntimeContext, "integrity_hash"> = {
    runtime_context_id: `runtime_context_${request.candidate.candidate_id}`,
    decision_candidate_id: request.candidate.candidate_id,
    runtime_health: health,
    system_stability: stability,
    subsystem_status: telemetry,
    resource_availability: resourceAvailability(telemetry),
    operational_capacity: capacity,
    runtime_alerts: Object.freeze(telemetry.flatMap((record) => record.alerts).sort()),
    runtime_constraints: Object.freeze(telemetry.flatMap((record) => record.constraints).sort()),
    runtime_lineage: Object.freeze(telemetry.flatMap((record) => record.lineage_refs).sort()),
    validation_state: validation.validation_state,
    explainability: explainability({ candidate: request.candidate, telemetry, recovery: scopedRecovery(request.candidate), forecast: scopedForecast(request.candidate), validation: validation.failure_reasons, runtime: health, stability, capacity }),
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function recoveryContext(request: RuntimeRecoveryForecastContextRequest, recovery: readonly RecoveryRecord[], runtime: RuntimeContext, validation: RuntimeRecoveryForecastValidationResult): RecoveryContext {
  const readiness = recoveryReadiness(recovery);
  const rollback = rollbackCapability(recovery);
  const base: Omit<RecoveryContext, "integrity_hash"> = {
    recovery_context_id: `recovery_context_${request.candidate.candidate_id}`,
    decision_candidate_id: request.candidate.candidate_id,
    recovery_readiness: readiness,
    rollback_capability: rollback,
    recovery_dependencies: Object.freeze(recovery.flatMap((record) => record.recovery_dependencies).sort()),
    recovery_plan: recovery[0]?.recovery_plan ?? "recovery_plan_unavailable",
    recovery_confidence: average(recovery.map((record) => record.recovery_confidence)),
    continuity_status: continuityStatus({ runtime: runtime.runtime_health, readiness, rollback }),
    recovery_lineage: Object.freeze(recovery.flatMap((record) => record.lineage_refs).sort()),
    validation_state: validation.validation_state,
    explainability: explainability({ candidate: request.candidate, telemetry: runtime.subsystem_status, recovery, forecast: scopedForecast(request.candidate), validation: validation.failure_reasons, runtime: runtime.runtime_health, stability: runtime.system_stability, capacity: runtime.operational_capacity }),
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function forecastContext(request: RuntimeRecoveryForecastContextRequest, forecast: readonly ForecastRecord[], runtime: RuntimeContext, recovery: RecoveryContext, validation: RuntimeRecoveryForecastValidationResult): ForecastContext {
  const base: Omit<ForecastContext, "integrity_hash"> = {
    forecast_context_id: `forecast_context_${request.candidate.candidate_id}`,
    decision_candidate_id: request.candidate.candidate_id,
    forecast_impact: forecastImpact(request, forecast, runtime.operational_capacity),
    projected_mission_effects: Object.freeze(forecast.flatMap((record) => record.projected_mission_effects).sort()),
    downstream_dependencies: Object.freeze(forecast.flatMap((record) => record.downstream_dependencies).sort()),
    projected_risks: Object.freeze([...forecast.flatMap((record) => record.projected_risks), ...(runtime.runtime_alerts.length ? ["runtime_alert_continuation"] : []), ...(recovery.continuity_status === "Recovery Ready" ? ["recovery_ready_dependency"] : [])].sort()),
    projected_recovery_effects: Object.freeze(forecast.flatMap((record) => record.projected_recovery_effects).sort()),
    confidence_projection: average(forecast.map((record) => record.confidence_projection)),
    forecast_lineage: Object.freeze(forecast.flatMap((record) => record.lineage_refs).sort()),
    validation_state: validation.validation_state,
    explainability: explainability({ candidate: request.candidate, telemetry: runtime.subsystem_status, recovery: scopedRecovery(request.candidate), forecast, validation: validation.failure_reasons, runtime: runtime.runtime_health, stability: runtime.system_stability, capacity: runtime.operational_capacity }),
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function runtimeDomain(context: RuntimeContext, candidate: DecisionCandidate): DecisionContextDomain {
  const base: Omit<DecisionContextDomain, "integrity_hash"> = {
    domain_name: "runtime_context",
    required: true,
    status: context.validation_state === "PASSED" ? "COMPLETE" : "UNAVAILABLE",
    source_subsystem: "runtime-assurance",
    originating_record: context.runtime_context_id,
    resolver: RESOLVER_VERSION,
    supporting_evidence: Object.freeze(context.subsystem_status.map((record) => record.telemetry_id)),
    confidence: context.operational_capacity,
    governance_rationale: `${context.runtime_health} runtime health resolved for ${candidate.candidate_id}.`,
    constitutional_rationale: "Runtime state is observational and advisory-only.",
    replay_reference: `replay_runtime_context_${candidate.candidate_id}`,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function recoveryDomain(context: RecoveryContext, candidate: DecisionCandidate): DecisionContextDomain {
  const base: Omit<DecisionContextDomain, "integrity_hash"> = {
    domain_name: "recovery_context",
    required: true,
    status: context.validation_state === "PASSED" ? "COMPLETE" : "UNAVAILABLE",
    source_subsystem: "recovery-intelligence",
    originating_record: context.recovery_context_id,
    resolver: RESOLVER_VERSION,
    supporting_evidence: context.recovery_dependencies,
    confidence: context.recovery_confidence,
    governance_rationale: `${context.recovery_readiness} recovery readiness for ${candidate.candidate_id}.`,
    constitutional_rationale: "Rollback capability remains descriptive and advisory.",
    replay_reference: `replay_recovery_context_${candidate.candidate_id}`,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function forecastDomain(context: ForecastContext, candidate: DecisionCandidate): DecisionContextDomain {
  const base: Omit<DecisionContextDomain, "integrity_hash"> = {
    domain_name: "forecast_context",
    required: true,
    status: context.validation_state === "PASSED" ? "COMPLETE" : "UNAVAILABLE",
    source_subsystem: "predictive-intelligence",
    originating_record: context.forecast_context_id,
    resolver: RESOLVER_VERSION,
    supporting_evidence: context.forecast_lineage,
    confidence: context.confidence_projection,
    governance_rationale: `${context.forecast_impact} forecast impact is advisory for ${candidate.candidate_id}.`,
    constitutional_rationale: "Forecast does not authorize autonomous execution.",
    replay_reference: `replay_forecast_context_${candidate.candidate_id}`,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function packageHash(pkg: Omit<RuntimeRecoveryForecastContextPackage, "integrity_hash"> | RuntimeRecoveryForecastContextPackage): string {
  const copy = { ...(pkg as RuntimeRecoveryForecastContextPackage) } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(copy);
}

export function resolveRuntimeRecoveryForecastContext(request: RuntimeRecoveryForecastContextRequest = createRuntimeRecoveryForecastContextRequest()): RuntimeRecoveryForecastContextPackage {
  const telemetry = scopedTelemetry(request.candidate);
  const recovery = scopedRecovery(request.candidate);
  const forecast = scopedForecast(request.candidate);
  const validation = validationFor(request, telemetry, recovery, forecast);
  const runtime_context = runtimeContext(request, telemetry, validation);
  const recovery_context = recoveryContext(request, recovery, runtime_context, validation);
  const forecast_context = forecastContext(request, forecast, runtime_context, recovery_context, validation);
  const base: Omit<RuntimeRecoveryForecastContextPackage, "integrity_hash"> = {
    resolution_id: request.resolution_id,
    candidate_id: request.candidate.candidate_id,
    runtime_context,
    recovery_context,
    forecast_context,
    runtime_domain: runtimeDomain(runtime_context, request.candidate),
    recovery_domain: recoveryDomain(recovery_context, request.candidate),
    forecast_domain: forecastDomain(forecast_context, request.candidate),
    validation,
    replay_ref: `replay_runtime_recovery_forecast_${request.resolution_id}`,
    timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: packageHash(base) });
}

export function replayRuntimeRecoveryForecastContext(pkg: RuntimeRecoveryForecastContextPackage): RuntimeRecoveryForecastReplayResult {
  const reconstructed_hash = packageHash(pkg);
  const replay_valid = reconstructed_hash === pkg.integrity_hash;
  const base: Omit<RuntimeRecoveryForecastReplayResult, "integrity_hash"> = {
    replay_id: `replay_validation_${pkg.resolution_id}`,
    replay_valid,
    resolution_id: pkg.resolution_id,
    reconstructed_hash,
    expected_hash: pkg.integrity_hash,
    reconstructed_state: pkg.validation.validation_state,
    failures: replay_valid ? Object.freeze([]) : Object.freeze(["INTEGRITY_VERIFICATION_FAILED"] as const),
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

export function buildRuntimeRecoveryForecastObservability(packages: readonly RuntimeRecoveryForecastContextPackage[]): RuntimeRecoveryForecastObservability {
  const failures = packages.flatMap((pkg) => pkg.validation.failure_reasons);
  return Object.freeze({
    resolution_attempts: packages.length,
    successful_resolutions: packages.filter((pkg) => pkg.validation.validation_status === "PASS").length,
    failed_resolutions: packages.filter((pkg) => pkg.validation.validation_status === "FAIL").length,
    runtime_failures: failures.filter((failure) => failure.includes("RUNTIME") || failure.includes("STABILITY") || failure.includes("RESOURCE")).length,
    recovery_failures: failures.filter((failure) => failure.includes("RECOVERY") || failure.includes("ROLLBACK")).length,
    forecast_failures: failures.filter((failure) => failure.includes("FORECAST") || failure.includes("MISSION_EFFECTS") || failure.includes("DOWNSTREAM") || failure.includes("PROJECTED")).length,
    isolation_failures: failures.filter((failure) => failure === "CROSS_TENANT_OPERATIONAL_REFERENCE").length,
    integrity_failures: failures.filter((failure) => failure === "INTEGRITY_VERIFICATION_FAILED").length,
    average_operational_capacity: packages.length === 0 ? 0 : packages.reduce((sum, pkg) => sum + pkg.runtime_context.operational_capacity, 0) / packages.length,
    average_forecast_confidence: packages.length === 0 ? 0 : packages.reduce((sum, pkg) => sum + pkg.forecast_context.confidence_projection, 0) / packages.length,
    replay_success_rate: packages.length === 0 ? 0 : packages.filter((pkg) => replayRuntimeRecoveryForecastContext(pkg).replay_valid).length / packages.length,
  });
}

export function getRuntimeRecoveryForecastContextResolver() {
  const request = createRuntimeRecoveryForecastContextRequest();
  const context_package = resolveRuntimeRecoveryForecastContext(request);
  return Object.freeze({
    resolution_order: RESOLUTION_ORDER,
    telemetry_registry: TELEMETRY_REGISTRY,
    recovery_registry: RECOVERY_REGISTRY,
    forecast_registry: FORECAST_REGISTRY,
    request,
    context_package,
    replay: replayRuntimeRecoveryForecastContext(context_package),
    observability: buildRuntimeRecoveryForecastObservability([context_package]),
  });
}
