import { createDecisionContext } from "@/services/decision-context-contract";
import { generateDecisionIntegrityHash } from "@/services/decision-integrity";
import { normalizeDecisionCandidateInput } from "@/services/decision-input-normalization";
import type { DecisionCandidate } from "@/types/decision-input-normalization";
import type { DecisionContextDomain } from "@/types/decision-context-contract";
import type {
  MissionContext,
  MissionContextCache,
  MissionHealth,
  MissionTenantContextPackage,
  MissionTenantContextRequest,
  MissionTenantFailureReason,
  MissionTenantObservability,
  MissionTenantReplayResult,
  MissionTenantResolutionState,
  MissionTenantValidationResult,
  ResolutionExplainability,
  TenantContext,
  TenantContextRegistry,
} from "@/types/decision-mission-tenant-context";

const NOW = "2026-07-02T09:29:00.000Z";
const RESOLVER_VERSION = "mission-tenant-context-resolver/v1" as const;
const RESOLUTION_ORDER: readonly MissionTenantResolutionState[] = Object.freeze([
  "MISSION_IDENTITY_RESOLVED",
  "MISSION_LIFECYCLE_RESOLVED",
  "MISSION_PHASE_RESOLVED",
  "MISSION_HEALTH_RESOLVED",
  "MISSION_PRIORITY_RESOLVED",
  "MISSION_VALIDATED",
  "TENANT_IDENTITY_RESOLVED",
  "TENANT_POLICY_RESOLVED",
  "TENANT_GOVERNANCE_RESOLVED",
  "TENANT_BOUNDARY_VALIDATED",
  "CACHE_RECORDED",
  "REGISTRY_REFERENCED",
  "PASSED",
] as const);

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function recordHash<T extends Record<string, unknown>>(value: T): string {
  const copy = { ...value };
  delete copy.integrity_hash;
  delete copy.mission_integrity_hash;
  delete copy.tenant_integrity_hash;
  return hash(copy);
}

const MISSION_REGISTRY = Object.freeze({
  mission_phase_9_decision_orchestration: Object.freeze({
    mission_id: "mission_phase_9_decision_orchestration",
    tenant_id: "tenant_alpha",
    mission_name: "Phase 9 Decision Orchestration",
    mission_objective: "Build deterministic advisory decision orchestration.",
    mission_phase: "Decision Orchestration" as const,
    mission_lifecycle_state: "ACTIVE" as const,
    mission_priority: "High" as const,
    mission_status: "READY" as const,
    mission_owner: "mission-control",
    mission_constraints: Object.freeze(["advisory_only", "operator_supremacy", "tenant_isolation"]),
    mission_dependencies: Object.freeze(["decision-intake", "decision-context-contract"]),
    mission_governance_state: "COMPLIANT" as const,
    mission_start_time: "2026-07-02T00:00:00.000Z",
    mission_last_update: NOW,
    mission_version: "mission-context/v1",
  }),
  mission_archived: Object.freeze({
    mission_id: "mission_archived",
    tenant_id: "tenant_alpha",
    mission_name: "Archived Mission",
    mission_objective: "Preserved historical mission.",
    mission_phase: "Certification" as const,
    mission_lifecycle_state: "ARCHIVED" as const,
    mission_priority: "Low" as const,
    mission_status: "COMPLETE" as const,
    mission_owner: "mission-control",
    mission_constraints: Object.freeze(["read_only"]),
    mission_dependencies: Object.freeze([]),
    mission_governance_state: "COMPLIANT" as const,
    mission_start_time: "2026-01-01T00:00:00.000Z",
    mission_last_update: "2026-06-01T00:00:00.000Z",
    mission_version: "mission-context/v1",
  }),
});

const TENANT_REGISTRY = Object.freeze({
  tenant_alpha: Object.freeze({
    tenant_id: "tenant_alpha",
    tenant_name: "Tenant Alpha",
    tenant_type: "ENTERPRISE" as const,
    tenant_owner: "mission-control",
    tenant_policies: Object.freeze(["policy_tenant_alpha_decision_orchestration_v1", "policy_tenant_alpha_advisory_only_v1"]),
    tenant_governance_profile: "governance_profile_tenant_alpha",
    tenant_security_profile: "security_profile_tenant_alpha_isolated",
    tenant_isolation_boundary: "isolation_boundary_tenant_alpha",
    tenant_authority_model: "ADVISORY_ONLY" as const,
    tenant_operational_state: "ACTIVE" as const,
    tenant_version: "tenant-context/v1",
  }),
  tenant_inactive: Object.freeze({
    tenant_id: "tenant_inactive",
    tenant_name: "Tenant Inactive",
    tenant_type: "ENTERPRISE" as const,
    tenant_owner: "mission-control",
    tenant_policies: Object.freeze([]),
    tenant_governance_profile: "governance_profile_tenant_inactive",
    tenant_security_profile: "security_profile_tenant_inactive",
    tenant_isolation_boundary: "isolation_boundary_tenant_inactive",
    tenant_authority_model: "ADVISORY_ONLY" as const,
    tenant_operational_state: "INACTIVE" as const,
    tenant_version: "tenant-context/v1",
  }),
});

function defaultCandidate(): DecisionCandidate {
  const result = normalizeDecisionCandidateInput();
  if (!result.candidate) throw new Error("default normalized candidate unavailable");
  return result.candidate;
}

export function createMissionTenantContextRequest(overrides: Partial<MissionTenantContextRequest> = {}): MissionTenantContextRequest {
  const candidate = overrides.candidate ?? defaultCandidate();
  return Object.freeze({
    resolution_id: overrides.resolution_id ?? `mission_tenant_resolution_${candidate.candidate_id}`,
    candidate,
    base_context: overrides.base_context ?? createDecisionContext({ candidate }),
    expected_tenant_id: overrides.expected_tenant_id ?? candidate.tenant_id,
    expected_mission_id: overrides.expected_mission_id ?? candidate.mission_id,
    mission_version: overrides.mission_version ?? "mission-context/v1",
    resolver_version: overrides.resolver_version ?? RESOLVER_VERSION,
  });
}

function explainability(input: {
  source_record: string;
  evidence: readonly string[];
  governance_refs: readonly string[];
  replay_ref: string;
  source_subsystem?: string;
}): ResolutionExplainability {
  const base: Omit<ResolutionExplainability, "integrity_hash"> = {
    source_subsystem: input.source_subsystem ?? "mission-registry",
    source_record: input.source_record,
    resolution_timestamp: NOW,
    resolver_version: RESOLVER_VERSION,
    supporting_evidence: input.evidence,
    governance_refs: input.governance_refs,
    constitutional_refs: Object.freeze(["constitution_advisory_only_v1", "constitution_tenant_isolation_v1"]),
    integrity_verified: true,
    replay_reference: input.replay_ref,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function missionHealth(mission_id: string): MissionHealth {
  const base: Omit<MissionHealth, "integrity_hash"> = {
    overall_health_score: mission_id === "mission_phase_9_decision_orchestration" ? 0.97 : 0.74,
    operational_readiness: mission_id === "mission_phase_9_decision_orchestration" ? "READY" : "DEGRADED",
    degraded_services: Object.freeze(mission_id === "mission_phase_9_decision_orchestration" ? [] : ["archival-index"]),
    critical_alerts: Object.freeze([]),
    recovery_indicators: Object.freeze(["replay_available", "lineage_available"]),
    stability_assessment: mission_id === "mission_phase_9_decision_orchestration" ? "STABLE" : "WATCH",
    health_confidence: 0.96,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function resolveMissionContext(request: MissionTenantContextRequest): MissionContext | undefined {
  const registry = MISSION_REGISTRY[request.expected_mission_id as keyof typeof MISSION_REGISTRY];
  if (!registry) return undefined;
  const base: Omit<MissionContext, "mission_integrity_hash"> = {
    mission_id: registry.mission_id,
    mission_name: registry.mission_name,
    mission_objective: registry.mission_objective,
    mission_phase: registry.mission_phase,
    mission_lifecycle_state: registry.mission_lifecycle_state,
    mission_priority: registry.mission_priority,
    mission_status: registry.mission_status,
    mission_health: missionHealth(registry.mission_id),
    mission_owner: registry.mission_owner,
    mission_constraints: registry.mission_constraints,
    mission_dependencies: registry.mission_dependencies,
    mission_governance_state: registry.mission_governance_state,
    mission_start_time: registry.mission_start_time,
    mission_last_update: registry.mission_last_update,
    mission_version: registry.mission_version,
    explainability: explainability({
      source_record: `mission_record_${registry.mission_id}`,
      evidence: request.candidate.evidence_refs,
      governance_refs: request.candidate.governance_refs,
      replay_ref: `replay_mission_context_${registry.mission_id}`,
    }),
  };
  return Object.freeze({ ...base, mission_integrity_hash: recordHash(base) });
}

function resolveTenantContext(request: MissionTenantContextRequest): TenantContext | undefined {
  const registry = TENANT_REGISTRY[request.expected_tenant_id as keyof typeof TENANT_REGISTRY];
  if (!registry) return undefined;
  const base: Omit<TenantContext, "tenant_integrity_hash"> = {
    tenant_id: registry.tenant_id,
    tenant_name: registry.tenant_name,
    tenant_type: registry.tenant_type,
    tenant_owner: registry.tenant_owner,
    tenant_policies: registry.tenant_policies,
    tenant_governance_profile: registry.tenant_governance_profile,
    tenant_security_profile: registry.tenant_security_profile,
    tenant_isolation_boundary: registry.tenant_isolation_boundary,
    tenant_authority_model: registry.tenant_authority_model,
    tenant_operational_state: registry.tenant_operational_state,
    tenant_version: registry.tenant_version,
    explainability: explainability({
      source_subsystem: "tenant-registry",
      source_record: `tenant_record_${registry.tenant_id}`,
      evidence: request.candidate.evidence_refs.slice(0, 1),
      governance_refs: registry.tenant_policies,
      replay_ref: `replay_tenant_context_${registry.tenant_id}`,
    }),
  };
  return Object.freeze({ ...base, tenant_integrity_hash: recordHash(base) });
}

function tenantLeak(value: unknown, tenant_id: string): boolean {
  if (typeof value === "string") {
    const match = value.match(/tenant_(alpha|beta|inactive|[0-9]+)/i);
    return Boolean(match && match[0] !== tenant_id);
  }
  if (Array.isArray(value)) return value.some((item) => tenantLeak(item, tenant_id));
  if (value && typeof value === "object") return Object.values(value).some((item) => tenantLeak(item, tenant_id));
  return false;
}

function validationFor(request: MissionTenantContextRequest, mission_context?: MissionContext, tenant_context?: TenantContext): MissionTenantValidationResult {
  const registryMission = MISSION_REGISTRY[request.expected_mission_id as keyof typeof MISSION_REGISTRY];
  const failures: MissionTenantFailureReason[] = [
    ...(!mission_context ? ["MISSION_NOT_FOUND" as const] : []),
    ...(mission_context && mission_context.mission_id !== request.candidate.mission_id ? ["MISSION_IDENTITY_MISMATCH" as const] : []),
    ...(mission_context && !mission_context.mission_objective ? ["MISSING_MISSION_OBJECTIVE" as const] : []),
    ...(mission_context && !mission_context.mission_lifecycle_state ? ["MISSING_MISSION_LIFECYCLE" as const] : []),
    ...(mission_context && !mission_context.mission_phase ? ["INVALID_MISSION_PHASE" as const] : []),
    ...(mission_context && !mission_context.mission_health ? ["MISSION_HEALTH_UNAVAILABLE" as const] : []),
    ...(mission_context && !mission_context.mission_priority ? ["MISSION_PRIORITY_UNDEFINED" as const] : []),
    ...(!tenant_context ? ["TENANT_NOT_FOUND" as const] : []),
    ...(tenant_context && tenant_context.tenant_id !== request.candidate.tenant_id ? ["TENANT_IDENTITY_MISMATCH" as const] : []),
    ...(tenant_context && tenant_context.tenant_policies.length === 0 ? ["TENANT_POLICIES_UNAVAILABLE" as const] : []),
    ...(registryMission && tenant_context && registryMission.tenant_id !== tenant_context.tenant_id ? ["TENANT_OWNERSHIP_MISMATCH" as const] : []),
    ...(tenant_context && tenant_context.tenant_operational_state !== "ACTIVE" ? ["TENANT_BOUNDARY_VIOLATION" as const] : []),
    ...(tenant_context && tenantLeak(request.candidate, tenant_context.tenant_id) ? ["CROSS_TENANT_REFERENCE" as const] : []),
    ...(mission_context && recordHash(mission_context as unknown as Record<string, unknown>) !== mission_context.mission_integrity_hash ? ["INTEGRITY_VERIFICATION_FAILED" as const] : []),
    ...(tenant_context && recordHash(tenant_context as unknown as Record<string, unknown>) !== tenant_context.tenant_integrity_hash ? ["INTEGRITY_VERIFICATION_FAILED" as const] : []),
  ];
  const unique = Object.freeze([...new Set(failures)]);
  const state: MissionTenantResolutionState =
    unique.some((failure) => ["TENANT_BOUNDARY_VIOLATION", "CROSS_TENANT_REFERENCE", "TENANT_OWNERSHIP_MISMATCH"].includes(failure)) ? "FAILED_ISOLATION"
      : unique.some((failure) => failure.startsWith("TENANT")) ? "FAILED_TENANT"
        : unique.some((failure) => failure === "INTEGRITY_VERIFICATION_FAILED") ? "FAILED_INTEGRITY"
          : unique.length ? "FAILED_MISSION"
            : "PASSED";
  return Object.freeze({
    validation_status: unique.length ? "FAIL" : "PASS",
    validation_state: state,
    failure_reason: unique[0],
    failure_reasons: unique,
    checks: Object.freeze({
      mission_exists: Boolean(mission_context),
      mission_identity_valid: Boolean(mission_context && mission_context.mission_id === request.candidate.mission_id),
      mission_phase_valid: Boolean(mission_context?.mission_phase),
      mission_lifecycle_valid: Boolean(mission_context?.mission_lifecycle_state),
      mission_health_available: Boolean(mission_context?.mission_health),
      mission_priority_defined: Boolean(mission_context?.mission_priority),
      tenant_exists: Boolean(tenant_context),
      tenant_identity_valid: Boolean(tenant_context && tenant_context.tenant_id === request.candidate.tenant_id),
      tenant_policies_available: Boolean(tenant_context?.tenant_policies.length),
      tenant_boundary_valid: Boolean(tenant_context && tenant_context.tenant_operational_state === "ACTIVE" && !tenantLeak(request.candidate, tenant_context.tenant_id)),
      mission_belongs_to_tenant: Boolean(registryMission && tenant_context && registryMission.tenant_id === tenant_context.tenant_id),
      integrity_verified: !unique.includes("INTEGRITY_VERIFICATION_FAILED"),
    }),
  });
}

function domainFromMission(mission: MissionContext, candidate: DecisionCandidate): DecisionContextDomain {
  const base: Omit<DecisionContextDomain, "integrity_hash"> = {
    domain_name: "mission_context",
    required: true,
    status: "COMPLETE",
    source_subsystem: mission.explainability.source_subsystem,
    originating_record: mission.explainability.source_record,
    resolver: RESOLVER_VERSION,
    supporting_evidence: candidate.evidence_refs,
    confidence: mission.mission_health.health_confidence,
    governance_rationale: `${mission.mission_governance_state} mission governance for ${mission.mission_id}.`,
    constitutional_rationale: "Mission context preserves advisory-only tenant isolation.",
    replay_reference: mission.explainability.replay_reference,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function domainFromTenant(tenant: TenantContext, candidate: DecisionCandidate): DecisionContextDomain {
  const base: Omit<DecisionContextDomain, "integrity_hash"> = {
    domain_name: "tenant_context",
    required: true,
    status: "COMPLETE",
    source_subsystem: tenant.explainability.source_subsystem,
    originating_record: tenant.explainability.source_record,
    resolver: RESOLVER_VERSION,
    supporting_evidence: candidate.evidence_refs.slice(0, 1),
    confidence: 1,
    governance_rationale: `${tenant.tenant_governance_profile} with ${tenant.tenant_policies.length} policies.`,
    constitutional_rationale: "Tenant isolation boundary is enforced.",
    replay_reference: tenant.explainability.replay_reference,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function cacheEntry(mission_context: MissionContext): MissionContextCache {
  const base: Omit<MissionContextCache, "integrity_hash"> = {
    cache_id: `mission_context_cache_${mission_context.mission_id}_${mission_context.mission_version}`,
    mission_id: mission_context.mission_id,
    mission_version: mission_context.mission_version,
    mission_context,
    created_timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function tenantRegistry(tenant_context: TenantContext): TenantContextRegistry {
  const base: Omit<TenantContextRegistry, "integrity_hash"> = {
    registry_id: `tenant_context_registry_${tenant_context.tenant_id}`,
    tenant_id: tenant_context.tenant_id,
    tenant_profile: tenant_context,
    tenant_policy_refs: tenant_context.tenant_policies,
    isolation_boundary: tenant_context.tenant_isolation_boundary,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function packageHash(pkg: Omit<MissionTenantContextPackage, "integrity_hash"> | MissionTenantContextPackage): string {
  const copy = { ...(pkg as MissionTenantContextPackage) } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(copy);
}

export function resolveMissionTenantContext(request: MissionTenantContextRequest = createMissionTenantContextRequest()): MissionTenantContextPackage {
  const mission_context = resolveMissionContext(request);
  const tenant_context = resolveTenantContext(request);
  const validation = validationFor(request, mission_context, tenant_context);
  if (validation.validation_status === "FAIL" || !mission_context || !tenant_context) {
    const fallbackMission = mission_context ?? resolveMissionContext(createMissionTenantContextRequest()) as MissionContext;
    const fallbackTenant = tenant_context ?? resolveTenantContext(createMissionTenantContextRequest()) as TenantContext;
    const baseFail: Omit<MissionTenantContextPackage, "integrity_hash"> = {
      resolution_id: request.resolution_id,
      candidate_id: request.candidate.candidate_id,
      mission_context: fallbackMission,
      tenant_context: fallbackTenant,
      mission_domain: domainFromMission(fallbackMission, request.candidate),
      tenant_domain: domainFromTenant(fallbackTenant, request.candidate),
      cache_entry: cacheEntry(fallbackMission),
      tenant_registry: tenantRegistry(fallbackTenant),
      validation,
      replay_ref: `replay_mission_tenant_context_${request.resolution_id}`,
      timestamp: NOW,
    };
    return Object.freeze({ ...baseFail, integrity_hash: packageHash(baseFail) });
  }
  const base: Omit<MissionTenantContextPackage, "integrity_hash"> = {
    resolution_id: request.resolution_id,
    candidate_id: request.candidate.candidate_id,
    mission_context,
    tenant_context,
    mission_domain: domainFromMission(mission_context, request.candidate),
    tenant_domain: domainFromTenant(tenant_context, request.candidate),
    cache_entry: cacheEntry(mission_context),
    tenant_registry: tenantRegistry(tenant_context),
    validation,
    replay_ref: `replay_mission_tenant_context_${request.resolution_id}`,
    timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: packageHash(base) });
}

export function replayMissionTenantContext(pkg: MissionTenantContextPackage): MissionTenantReplayResult {
  const reconstructed_hash = packageHash(pkg);
  const replay_valid = reconstructed_hash === pkg.integrity_hash;
  const base: Omit<MissionTenantReplayResult, "integrity_hash"> = {
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

export function buildMissionTenantObservability(packages: readonly MissionTenantContextPackage[]): MissionTenantObservability {
  const failures = packages.flatMap((pkg) => pkg.validation.failure_reasons);
  return Object.freeze({
    resolution_attempts: packages.length,
    successful_resolutions: packages.filter((pkg) => pkg.validation.validation_status === "PASS").length,
    failed_resolutions: packages.filter((pkg) => pkg.validation.validation_status === "FAIL").length,
    mission_failures: failures.filter((failure) => failure.startsWith("MISSION") || failure.startsWith("INVALID_MISSION") || failure.startsWith("MISSING_MISSION")).length,
    tenant_failures: failures.filter((failure) => failure.startsWith("TENANT")).length,
    isolation_failures: failures.filter((failure) => ["TENANT_BOUNDARY_VIOLATION", "CROSS_TENANT_REFERENCE", "TENANT_OWNERSHIP_MISMATCH"].includes(failure)).length,
    integrity_failures: failures.filter((failure) => failure === "INTEGRITY_VERIFICATION_FAILED").length,
    cache_entries_created: packages.filter((pkg) => Boolean(pkg.cache_entry)).length,
    registry_references: packages.filter((pkg) => Boolean(pkg.tenant_registry)).length,
    replay_success_rate: packages.length === 0 ? 0 : packages.filter((pkg) => replayMissionTenantContext(pkg).replay_valid).length / packages.length,
  });
}

export function getMissionTenantContextResolver() {
  const request = createMissionTenantContextRequest();
  const context_package = resolveMissionTenantContext(request);
  return Object.freeze({
    resolution_order: RESOLUTION_ORDER,
    mission_registry: MISSION_REGISTRY,
    tenant_registry: TENANT_REGISTRY,
    request,
    context_package,
    replay: replayMissionTenantContext(context_package),
    observability: buildMissionTenantObservability([context_package]),
  });
}
