import { generateDecisionIntegrityHash } from "@/services/decision-integrity";
import { normalizeDecisionCandidateInput } from "@/services/decision-input-normalization";
import { createContextRegistryRequest, registerContext } from "@/services/decision-context-registry-ledger-replay";
import type { DecisionCandidate } from "@/types/decision-input-normalization";
import type {
  ContextIntegration,
  DownstreamIntegrationRegistry,
  DownstreamInterfaceName,
  InterfaceCompatibilityStatus,
  IntegrationValidationState,
  OrchestrationEntryPackage,
  OrchestrationReadiness,
  OrchestrationReadinessFailureReason,
  OrchestrationReadinessObservability,
  OrchestrationReadinessPackage,
  OrchestrationReadinessReplayResult,
  OrchestrationReadinessRequest,
  OrchestrationReadinessState,
  OrchestrationReadinessValidationResult,
  ReadinessReport,
} from "@/types/decision-context-orchestration-readiness";

const NOW = "2026-07-03T09:39:00.000Z";
const READINESS_VERSION = "context-orchestration-readiness/v1" as const;
const INTERFACES: readonly DownstreamInterfaceName[] = Object.freeze([
  "decision_ranking_engine",
  "decision_prioritization_engine",
  "authority_evaluation_engine",
  "recommendation_engine",
  "governance_engine",
  "replay_engine",
  "certification_framework",
] as const);
const INTERFACE_VERSIONS: Readonly<Record<DownstreamInterfaceName, string>> = Object.freeze({
  decision_ranking_engine: "ranking-interface/v1",
  decision_prioritization_engine: "prioritization-interface/v1",
  authority_evaluation_engine: "authority-interface/v1",
  recommendation_engine: "recommendation-interface/v1",
  governance_engine: "governance-interface/v1",
  replay_engine: "replay-interface/v1",
  certification_framework: "certification-interface/v1",
});

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function recordHash<T extends Record<string, unknown>>(value: T): string {
  const copy = { ...value };
  delete copy.integrity_hash;
  return hash(copy);
}

function packageHash(pkg: Omit<OrchestrationReadinessPackage, "integrity_hash"> | OrchestrationReadinessPackage): string {
  const copy = { ...(pkg as OrchestrationReadinessPackage) } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(copy);
}

function defaultCandidate(): DecisionCandidate {
  const result = normalizeDecisionCandidateInput();
  if (!result.candidate) throw new Error("default normalized candidate unavailable");
  return result.candidate;
}

export function createOrchestrationReadinessRequest(overrides: Partial<OrchestrationReadinessRequest> = {}): OrchestrationReadinessRequest {
  const candidate = overrides.candidate ?? defaultCandidate();
  return Object.freeze({
    readiness_id: overrides.readiness_id ?? `orchestration_readiness_${candidate.candidate_id}`,
    candidate,
    registry_package: overrides.registry_package ?? registerContext(createContextRegistryRequest({ candidate })),
    interface_overrides: overrides.interface_overrides ?? Object.freeze({}),
    readiness_version: overrides.readiness_version ?? READINESS_VERSION,
  });
}

function tenantLeak(value: unknown, tenant_id: string): boolean {
  if (typeof value === "string") {
    const match = value.match(/tenant_(alpha|beta|[0-9]+)/i);
    return Boolean(match && match[0] !== tenant_id);
  }
  if (Array.isArray(value)) return value.some((item) => tenantLeak(item, tenant_id));
  if (value && typeof value === "object") return Object.values(value).some((item) => tenantLeak(item, tenant_id));
  return false;
}

function interfaceStatus(request: OrchestrationReadinessRequest, name: DownstreamInterfaceName): InterfaceCompatibilityStatus {
  const override = request.interface_overrides?.[name];
  if (override) return override;
  const registry = request.registry_package!;
  if (name === "decision_ranking_engine") return registry.repository_record.replay_package.replay_dependencies.length && registry.registry_record.certification_state === "CERTIFIED" ? "COMPATIBLE" : "MISSING";
  if (name === "decision_prioritization_engine") return registry.repository_record.context_metadata.mission_id ? "COMPATIBLE" : "MISSING";
  if (name === "authority_evaluation_engine") return registry.repository_record.serialized_context.includes("operator_context") ? "COMPATIBLE" : "MISSING";
  if (name === "recommendation_engine") return registry.repository_record.serialized_context.includes("evidence_context") ? "COMPATIBLE" : "MISSING";
  if (name === "governance_engine") return registry.repository_record.serialized_context.includes("governance_context") && registry.repository_record.serialized_context.includes("constitutional_context") ? "COMPATIBLE" : "MISSING";
  if (name === "replay_engine") return registry.replay_package.replay_dependencies.length ? "COMPATIBLE" : "MISSING";
  return registry.registry_record.certification_state === "CERTIFIED" && registry.repository_record.certification_package.length ? "COMPATIBLE" : "MISSING";
}

function downstreamRegistry(request: OrchestrationReadinessRequest): readonly DownstreamIntegrationRegistry[] {
  const registry = request.registry_package!;
  return Object.freeze(INTERFACES.map((target_component) => {
    const base: Omit<DownstreamIntegrationRegistry, "integrity_hash"> = {
      registry_id: `downstream_${registry.registry_record.context_id}_${target_component}`,
      decision_candidate_id: request.candidate.candidate_id,
      target_component,
      interface_version: INTERFACE_VERSIONS[target_component],
      compatibility_status: interfaceStatus(request, target_component),
      validation_reference: registry.validation.lifecycle_state,
      replay_reference: registry.replay_package.replay_package_id,
    };
    return Object.freeze({ ...base, integrity_hash: recordHash(base) });
  }));
}

function failuresFor(request: OrchestrationReadinessRequest, downstream: readonly DownstreamIntegrationRegistry[]): readonly OrchestrationReadinessFailureReason[] {
  const registry = request.registry_package!;
  const serialized = registry.repository_record.serialized_context;
  const failures: OrchestrationReadinessFailureReason[] = [
    ...(registry.validation.validation_status !== "PASS" ? ["CONTEXT_INCOMPLETE" as const] : []),
    ...(registry.registry_record.validation_state !== "CERTIFIED" ? ["VALIDATION_INCOMPLETE" as const] : []),
    ...(registry.registry_record.certification_state !== "CERTIFIED" ? ["CERTIFICATION_INCOMPLETE" as const] : []),
    ...(downstream.some((item) => item.compatibility_status !== "COMPATIBLE") ? ["INTERFACE_INCOMPATIBLE" as const] : []),
    ...(serialized.includes("governance_context") ? [] : ["GOVERNANCE_VALIDATION_MISSING" as const]),
    ...(serialized.includes("constitutional_context") ? [] : ["CONSTITUTIONAL_VALIDATION_MISSING" as const]),
    ...(serialized.includes("operator_context") ? [] : ["AUTHORITY_UNRESOLVED" as const]),
    ...(registry.replay_package.replay_dependencies.length && registry.validation.checks.replay_package_complete ? [] : ["REPLAY_UNAVAILABLE" as const]),
    ...(registry.validation.checks.integrity_hashes_reproducible ? [] : ["INTEGRITY_VERIFICATION_FAILED" as const]),
    ...(tenantLeak({ registry, downstream }, request.candidate.tenant_id) ? ["CROSS_TENANT_INTEGRATION" as const] : []),
  ];
  return Object.freeze([...new Set(failures)]);
}

function validationState(failures: readonly OrchestrationReadinessFailureReason[]): IntegrationValidationState {
  if (failures.includes("CROSS_TENANT_INTEGRATION")) return "FAILED_ISOLATION";
  if (failures.includes("INTEGRITY_VERIFICATION_FAILED")) return "FAILED_INTEGRITY";
  if (failures.includes("INTERFACE_INCOMPATIBLE")) return "FAILED_INTERFACE";
  if (failures.includes("GOVERNANCE_VALIDATION_MISSING") || failures.includes("CONSTITUTIONAL_VALIDATION_MISSING")) return "FAILED_GOVERNANCE";
  if (failures.includes("AUTHORITY_UNRESOLVED")) return "FAILED_AUTHORITY";
  if (failures.includes("REPLAY_UNAVAILABLE")) return "FAILED_REPLAY";
  if (failures.length) return "FAILED_CONTEXT";
  return "PASSED";
}

function readinessState(failures: readonly OrchestrationReadinessFailureReason[]): OrchestrationReadinessState {
  if (failures.some((failure) => ["GOVERNANCE_VALIDATION_MISSING", "CONSTITUTIONAL_VALIDATION_MISSING", "AUTHORITY_UNRESOLVED", "REPLAY_UNAVAILABLE", "INTEGRITY_VERIFICATION_FAILED", "CROSS_TENANT_INTEGRATION"].includes(failure))) return "BLOCKED";
  if (failures.includes("INTERFACE_INCOMPATIBLE")) return "NOT_READY";
  if (failures.length) return "CONDITIONALLY_READY";
  return "READY";
}

function readinessScore(downstream: readonly DownstreamIntegrationRegistry[], failures: readonly OrchestrationReadinessFailureReason[]): number {
  const interfaceScore = downstream.filter((item) => item.compatibility_status === "COMPATIBLE").length / downstream.length;
  const penalty = failures.length * 0.1;
  return Number(Math.max(0, Math.min(1, interfaceScore - penalty)).toFixed(6));
}

function validationResult(request: OrchestrationReadinessRequest, downstream: readonly DownstreamIntegrationRegistry[]): OrchestrationReadinessValidationResult {
  const registry = request.registry_package!;
  const failures = failuresFor(request, downstream);
  const serialized = registry.repository_record.serialized_context;
  return Object.freeze({
    validation_status: failures.length ? "FAIL" : "PASS",
    validation_state: validationState(failures),
    failure_reason: failures[0],
    failure_reasons: failures,
    checks: Object.freeze({
      context_complete: !failures.includes("CONTEXT_INCOMPLETE"),
      context_validated: !failures.includes("VALIDATION_INCOMPLETE"),
      context_certified: !failures.includes("CERTIFICATION_INCOMPLETE"),
      interfaces_compatible: !failures.includes("INTERFACE_INCOMPATIBLE"),
      governance_complete: serialized.includes("governance_context"),
      constitutional_complete: serialized.includes("constitutional_context"),
      authority_resolved: serialized.includes("operator_context"),
      replay_verified: !failures.includes("REPLAY_UNAVAILABLE"),
      certification_complete: registry.repository_record.certification_package.length > 0,
      integration_lineage_preserved: registry.audit_trail.ledger_events.length > 0,
      integrity_verified: !failures.includes("INTEGRITY_VERIFICATION_FAILED"),
      tenant_isolated: !failures.includes("CROSS_TENANT_INTEGRATION"),
    }),
  });
}

function orchestrationReadiness(request: OrchestrationReadinessRequest, downstream: readonly DownstreamIntegrationRegistry[], validation: OrchestrationReadinessValidationResult): OrchestrationReadiness {
  const state = readinessState(validation.failure_reasons);
  const base: Omit<OrchestrationReadiness, "integrity_hash"> = {
    readiness_id: request.readiness_id,
    decision_candidate_id: request.candidate.candidate_id,
    context_status: validation.checks.context_complete ? "COMPLETE" : "INCOMPLETE",
    validation_status: validation.checks.context_validated ? "VALIDATED" : "INVALID",
    certification_status: validation.checks.context_certified ? "CERTIFIED" : "UNCERTIFIED",
    interface_status: validation.checks.interfaces_compatible ? "COMPATIBLE" : "INCOMPATIBLE",
    integration_status: validation.validation_status === "PASS" ? "INTEGRATED" : "BLOCKED",
    readiness_state: state,
    readiness_score: readinessScore(downstream, validation.failure_reasons),
    orchestration_eligible: state === "READY",
    validation_timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function integration(request: OrchestrationReadinessRequest, downstream: readonly DownstreamIntegrationRegistry[], validation: OrchestrationReadinessValidationResult): ContextIntegration {
  const registry = request.registry_package!;
  const mappings = Object.freeze(Object.fromEntries(downstream.map((item) => [item.target_component, item.registry_id])) as Record<DownstreamInterfaceName, string>);
  const base: Omit<ContextIntegration, "integrity_hash"> = {
    integration_id: `integration_${request.candidate.candidate_id}`,
    decision_candidate_id: request.candidate.candidate_id,
    context_package: registry.repository_record.repository_id,
    downstream_interfaces: INTERFACES,
    interface_mappings: mappings,
    integration_dependencies: Object.freeze([registry.registry_record.registry_record_id, registry.repository_record.repository_id, registry.replay_package.replay_package_id, ...registry.repository_record.certification_package].sort()),
    integration_lineage: Object.freeze([registry.registry_record.lineage_reference, registry.audit_trail.audit_id, ...registry.ledger_entries.map((entry) => entry.ledger_entry_id)].sort()),
    integration_version: READINESS_VERSION,
    validation_state: validation.validation_state,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function entryPackage(request: OrchestrationReadinessRequest, validation: OrchestrationReadinessValidationResult): OrchestrationEntryPackage {
  const registry = request.registry_package!;
  const base: Omit<OrchestrationEntryPackage, "integrity_hash"> = {
    entry_package_id: `orchestration_entry_${request.candidate.candidate_id}`,
    decision_candidate_id: request.candidate.candidate_id,
    decision_context_ref: registry.registry_record.context_id,
    validation_report_ref: registry.repository_record.validation_reports[0] ?? "missing_validation",
    integrity_report_ref: registry.validation.checks.integrity_hashes_reproducible ? registry.registry_record.integrity_hash : "missing_integrity",
    explainability_report_ref: registry.repository_record.explainability_reports[0] ?? "missing_explainability",
    replay_package_ref: registry.replay_package.replay_package_id,
    certification_package_refs: registry.repository_record.certification_package,
    governance_package_refs: Object.freeze(["governance_context", "constitutional_context"]),
    authority_package_refs: Object.freeze(["operator_context"]),
    risk_package_refs: Object.freeze(["risk_context"]),
    confidence_package_refs: Object.freeze(["confidence_context"]),
    self_contained: validation.validation_status === "PASS",
    advisory_only: true,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function readinessReport(request: OrchestrationReadinessRequest, readiness: OrchestrationReadiness, downstream: readonly DownstreamIntegrationRegistry[], validation: OrchestrationReadinessValidationResult): ReadinessReport {
  const base: Omit<ReadinessReport, "integrity_hash"> = {
    report_id: `readiness_report_${request.candidate.candidate_id}`,
    decision_candidate_id: request.candidate.candidate_id,
    readiness_summary: readiness.orchestration_eligible ? "All orchestration prerequisites passed." : "Orchestration entry is blocked until prerequisites pass.",
    validation_results: Object.freeze(Object.entries(validation.checks).map(([key, value]) => `${key}:${value}`).sort()),
    certification_results: Object.freeze([request.registry_package!.registry_record.certification_state, request.registry_package!.validation.lifecycle_state]),
    interface_results: Object.freeze(downstream.map((item) => `${item.target_component}:${item.compatibility_status}`).sort()),
    unresolved_items: validation.failure_reasons,
    orchestration_decision: readiness.orchestration_eligible ? "ALLOW_ORCHESTRATION_ENTRY" : "BLOCK_ORCHESTRATION_ENTRY",
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

export function assessOrchestrationReadiness(request: OrchestrationReadinessRequest = createOrchestrationReadinessRequest()): OrchestrationReadinessPackage {
  const downstream = downstreamRegistry(request);
  const validation = validationResult(request, downstream);
  const readiness = orchestrationReadiness(request, downstream, validation);
  const integrationValue = integration(request, downstream, validation);
  const entry = entryPackage(request, validation);
  const report = readinessReport(request, readiness, downstream, validation);
  const base: Omit<OrchestrationReadinessPackage, "integrity_hash"> = {
    readiness_id: request.readiness_id,
    candidate_id: request.candidate.candidate_id,
    readiness,
    integration: integrationValue,
    downstream_registry: downstream,
    readiness_report: report,
    orchestration_entry_package: entry,
    validation,
    replay_ref: `replay_orchestration_readiness_${request.readiness_id}`,
    timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: packageHash(base) });
}

export function replayOrchestrationReadiness(pkg: OrchestrationReadinessPackage): OrchestrationReadinessReplayResult {
  const reconstructed_hash = packageHash(pkg);
  const replay_valid = reconstructed_hash === pkg.integrity_hash;
  const base: Omit<OrchestrationReadinessReplayResult, "integrity_hash"> = {
    replay_id: `replay_validation_${pkg.readiness_id}`,
    replay_valid,
    readiness_id: pkg.readiness_id,
    reconstructed_hash,
    expected_hash: pkg.integrity_hash,
    reconstructed_state: pkg.readiness.readiness_state,
    failures: replay_valid ? Object.freeze([]) : Object.freeze(["INTEGRITY_VERIFICATION_FAILED"] as const),
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

export function buildOrchestrationReadinessObservability(packages: readonly OrchestrationReadinessPackage[]): OrchestrationReadinessObservability {
  const failures = packages.flatMap((pkg) => pkg.validation.failure_reasons);
  return Object.freeze({
    readiness_attempts: packages.length,
    ready_count: packages.filter((pkg) => pkg.readiness.readiness_state === "READY").length,
    blocked_count: packages.filter((pkg) => pkg.readiness.readiness_state !== "READY").length,
    interface_failures: failures.filter((failure) => failure === "INTERFACE_INCOMPATIBLE").length,
    governance_failures: failures.filter((failure) => failure === "GOVERNANCE_VALIDATION_MISSING" || failure === "CONSTITUTIONAL_VALIDATION_MISSING").length,
    authority_failures: failures.filter((failure) => failure === "AUTHORITY_UNRESOLVED").length,
    replay_failures: failures.filter((failure) => failure === "REPLAY_UNAVAILABLE").length,
    integrity_failures: failures.filter((failure) => failure === "INTEGRITY_VERIFICATION_FAILED").length,
    isolation_failures: failures.filter((failure) => failure === "CROSS_TENANT_INTEGRATION").length,
    average_readiness_score: packages.length === 0 ? 0 : packages.reduce((sum, pkg) => sum + pkg.readiness.readiness_score, 0) / packages.length,
    replay_success_rate: packages.length === 0 ? 0 : packages.filter((pkg) => replayOrchestrationReadiness(pkg).replay_valid).length / packages.length,
  });
}

export function getDecisionContextOrchestrationReadinessFramework() {
  const request = createOrchestrationReadinessRequest();
  const readiness_package = assessOrchestrationReadiness(request);
  return Object.freeze({
    readiness_version: READINESS_VERSION,
    downstream_interfaces: INTERFACES,
    request,
    readiness_package,
    replay: replayOrchestrationReadiness(readiness_package),
    observability: buildOrchestrationReadinessObservability([readiness_package]),
  });
}
