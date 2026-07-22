import { createDecisionContext } from "@/services/decision-context-contract";
import { generateDecisionIntegrityHash } from "@/services/decision-integrity";
import { normalizeDecisionCandidateInput } from "@/services/decision-input-normalization";
import { createMissionTenantContextRequest, resolveMissionTenantContext } from "@/services/decision-mission-tenant-context";
import { createAuthorityOperatorContextRequest, resolveAuthorityOperatorContext } from "@/services/decision-authority-operator-context";
import type { DecisionCandidate } from "@/types/decision-input-normalization";
import type { DecisionContextDomain } from "@/types/decision-context-contract";
import type {
  DependencyContext,
  DependencyGraphEdge,
  DependencyGraphNode,
  DependencyStatus,
  EvidenceContext,
  EvidenceDependencyContextPackage,
  EvidenceDependencyContextRequest,
  EvidenceDependencyFailureReason,
  EvidenceDependencyObservability,
  EvidenceDependencyReplayResult,
  EvidenceDependencyResolutionState,
  EvidenceDependencyValidationResult,
  EvidenceExplainability,
  EvidenceLineageGraph,
  EvidenceQuality,
  EvidenceRecord,
} from "@/types/decision-evidence-dependency-context";

const NOW = "2026-07-02T09:31:00.000Z";
const RESOLVER_VERSION = "evidence-dependency-context-resolver/v1" as const;
const RESOLUTION_ORDER: readonly EvidenceDependencyResolutionState[] = Object.freeze([
  "EVIDENCE_REGISTRY_RESOLVED",
  "PRIMARY_EVIDENCE_RESOLVED",
  "SUPPORTING_EVIDENCE_RESOLVED",
  "CONFLICTS_DETECTED",
  "OBSERVATIONS_RESOLVED",
  "FINDINGS_RESOLVED",
  "DEPENDENCIES_RESOLVED",
  "PREREQUISITES_RESOLVED",
  "BLOCKERS_RESOLVED",
  "RECOMMENDATIONS_RESOLVED",
  "LINEAGE_BUILT",
  "GRAPH_BUILT",
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

function makeEvidence(input: Omit<EvidenceRecord, "integrity_hash" | "content_hash">): EvidenceRecord {
  const withContent = { ...input, content_hash: hash({ source_record: input.source_record, evidence_id: input.evidence_id }) };
  return Object.freeze({ ...withContent, integrity_hash: recordHash(withContent) });
}

const EVIDENCE_REGISTRY: readonly EvidenceRecord[] = Object.freeze([
  makeEvidence({
    evidence_id: "evidence_tenant_alpha_mission_phase_9_decision_orchestration_001",
    evidence_kind: "PRIMARY",
    tenant_id: "tenant_alpha",
    mission_id: "mission_phase_9_decision_orchestration",
    source_subsystem: "truth-ledger",
    source_record: "truth_record_phase_9_candidate_001",
    certified: true,
    provenance_complete: true,
    collection_timestamp: "2026-07-02T09:00:00.000Z",
    validation_timestamp: NOW,
    last_verification: NOW,
    expiration_policy: "refresh_30d",
    lineage_refs: Object.freeze(["lineage_evidence_phase_9_001"]),
    replay_refs: Object.freeze(["replay_evidence_phase_9_001"]),
  }),
  makeEvidence({
    evidence_id: "evidence_tenant_alpha_mission_phase_9_decision_orchestration_supporting_001",
    evidence_kind: "SUPPORTING",
    tenant_id: "tenant_alpha",
    mission_id: "mission_phase_9_decision_orchestration",
    source_subsystem: "mission-health-intelligence",
    source_record: "mission_health_phase_9_001",
    certified: true,
    provenance_complete: true,
    collection_timestamp: "2026-07-02T09:01:00.000Z",
    validation_timestamp: NOW,
    last_verification: NOW,
    expiration_policy: "refresh_30d",
    lineage_refs: Object.freeze(["lineage_supporting_phase_9_001"]),
    replay_refs: Object.freeze(["replay_supporting_phase_9_001"]),
  }),
  makeEvidence({
    evidence_id: "evidence_tenant_alpha_mission_phase_9_decision_orchestration_conflict_001",
    evidence_kind: "CONFLICTING",
    tenant_id: "tenant_alpha",
    mission_id: "mission_phase_9_decision_orchestration",
    source_subsystem: "governance-intelligence",
    source_record: "governance_conflict_phase_9_001",
    certified: true,
    provenance_complete: true,
    collection_timestamp: "2026-07-02T09:02:00.000Z",
    validation_timestamp: NOW,
    last_verification: NOW,
    expiration_policy: "refresh_30d",
    lineage_refs: Object.freeze(["lineage_conflict_phase_9_001"]),
    replay_refs: Object.freeze(["replay_conflict_phase_9_001"]),
  }),
  makeEvidence({
    evidence_id: "observation_tenant_alpha_mission_phase_9_decision_orchestration_001",
    evidence_kind: "OBSERVATION",
    tenant_id: "tenant_alpha",
    mission_id: "mission_phase_9_decision_orchestration",
    source_subsystem: "runtime-telemetry",
    source_record: "runtime_observation_phase_9_001",
    certified: true,
    provenance_complete: true,
    collection_timestamp: "2026-07-02T09:03:00.000Z",
    validation_timestamp: NOW,
    last_verification: NOW,
    expiration_policy: "refresh_30d",
    lineage_refs: Object.freeze(["lineage_observation_phase_9_001"]),
    replay_refs: Object.freeze(["replay_observation_phase_9_001"]),
  }),
  makeEvidence({
    evidence_id: "finding_tenant_alpha_mission_phase_9_decision_orchestration_001",
    evidence_kind: "FINDING",
    tenant_id: "tenant_alpha",
    mission_id: "mission_phase_9_decision_orchestration",
    source_subsystem: "confidence-intelligence",
    source_record: "confidence_finding_phase_9_001",
    certified: true,
    provenance_complete: true,
    collection_timestamp: "2026-07-02T09:04:00.000Z",
    validation_timestamp: NOW,
    last_verification: NOW,
    expiration_policy: "refresh_30d",
    lineage_refs: Object.freeze(["lineage_finding_phase_9_001"]),
    replay_refs: Object.freeze(["replay_finding_phase_9_001"]),
  }),
  makeEvidence({
    evidence_id: "evidence_tenant_beta_mission_phase_9_decision_orchestration_001",
    evidence_kind: "PRIMARY",
    tenant_id: "tenant_beta",
    mission_id: "mission_phase_9_decision_orchestration",
    source_subsystem: "truth-ledger",
    source_record: "truth_record_beta_001",
    certified: true,
    provenance_complete: true,
    collection_timestamp: "2026-07-02T09:00:00.000Z",
    validation_timestamp: NOW,
    last_verification: NOW,
    expiration_policy: "refresh_30d",
    lineage_refs: Object.freeze(["lineage_beta_001"]),
    replay_refs: Object.freeze(["replay_beta_001"]),
  }),
]);

const DEPENDENCY_REGISTRY = Object.freeze({
  candidate_tenant_alpha_mission_phase_9_decision_orchestration_001: Object.freeze({
    prerequisite_decisions: Object.freeze(["approval_tenant_alpha_operator_required_v1"]),
    blocking_decisions: Object.freeze([]),
    dependent_decisions: Object.freeze(["decision_context_builder_phase_9_3"]),
    related_recommendations: Object.freeze(["recommendation_phase_9_normalization_complete"]),
  }),
  candidate_circular_dependency: Object.freeze({
    prerequisite_decisions: Object.freeze(["candidate_circular_dependency"]),
    blocking_decisions: Object.freeze([]),
    dependent_decisions: Object.freeze(["candidate_circular_dependency"]),
    related_recommendations: Object.freeze([]),
  }),
});

function defaultCandidate(): DecisionCandidate {
  const result = normalizeDecisionCandidateInput();
  if (!result.candidate) throw new Error("default normalized candidate unavailable");
  return result.candidate;
}

export function createEvidenceDependencyContextRequest(overrides: Partial<EvidenceDependencyContextRequest> = {}): EvidenceDependencyContextRequest {
  const candidate = overrides.candidate ?? defaultCandidate();
  const mission_tenant_package = overrides.mission_tenant_package ?? resolveMissionTenantContext(createMissionTenantContextRequest({ candidate }));
  return Object.freeze({
    resolution_id: overrides.resolution_id ?? `evidence_dependency_resolution_${candidate.candidate_id}`,
    candidate,
    base_context: overrides.base_context ?? createDecisionContext({ candidate }),
    mission_tenant_package,
    authority_operator_package: overrides.authority_operator_package ?? resolveAuthorityOperatorContext(createAuthorityOperatorContextRequest({ candidate, mission_tenant_package })),
    resolver_version: overrides.resolver_version ?? RESOLVER_VERSION,
  });
}

function registryEvidence(candidate: DecisionCandidate): readonly EvidenceRecord[] {
  const requested = new Set(candidate.evidence_refs);
  const byTenantMission = EVIDENCE_REGISTRY.filter((record) => record.tenant_id === candidate.tenant_id && record.mission_id === candidate.mission_id);
  return Object.freeze([
    ...EVIDENCE_REGISTRY.filter((record) => requested.has(record.evidence_id)),
    ...byTenantMission.filter((record) => record.evidence_kind !== "PRIMARY"),
  ].sort((left, right) => left.evidence_id.localeCompare(right.evidence_id)));
}

function explainability(input: {
  candidate: DecisionCandidate;
  evidence: readonly EvidenceRecord[];
  conflicting: readonly EvidenceRecord[];
  dependencyLineage: readonly string[];
}): EvidenceExplainability {
  const base: Omit<EvidenceExplainability, "integrity_hash"> = {
    source_subsystem: "evidence-registry",
    source_record: `evidence_context_record_${input.candidate.candidate_id}`,
    origin_timestamp: NOW,
    resolver_version: RESOLVER_VERSION,
    supporting_evidence: Object.freeze(input.evidence.map((record) => record.evidence_id)),
    conflicting_evidence: Object.freeze(input.conflicting.map((record) => record.evidence_id)),
    dependency_rationale: `Dependencies resolved for ${input.candidate.candidate_id}.`,
    lineage_path: input.dependencyLineage,
    governance_influence: input.candidate.governance_refs,
    constitutional_influence: Object.freeze(["constitution_evidence_traceability_v1", "constitution_tenant_isolation_v1"]),
    replay_references: Object.freeze(input.evidence.flatMap((record) => record.replay_refs).sort()),
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function evidenceContext(request: EvidenceDependencyContextRequest, evidence: readonly EvidenceRecord[], validation_state: EvidenceDependencyResolutionState): EvidenceContext {
  const primary = evidence.filter((record) => record.evidence_kind === "PRIMARY");
  const supporting = evidence.filter((record) => record.evidence_kind === "SUPPORTING");
  const conflicting = evidence.filter((record) => record.evidence_kind === "CONFLICTING");
  const observations = evidence.filter((record) => record.evidence_kind === "OBSERVATION");
  const findings = evidence.filter((record) => record.evidence_kind === "FINDING");
  const certified = evidence.every((record) => record.certified && record.provenance_complete);
  const quality: EvidenceQuality = primary.length === 0 || !certified ? "INVALID" : supporting.length ? "CERTIFIED" : "PARTIAL";
  const base: Omit<EvidenceContext, "integrity_hash"> = {
    evidence_context_id: `evidence_context_${request.candidate.candidate_id}`,
    decision_candidate_id: request.candidate.candidate_id,
    primary_evidence: Object.freeze(primary),
    supporting_evidence: Object.freeze(supporting),
    conflicting_evidence: Object.freeze(conflicting),
    observations: Object.freeze(observations),
    findings: Object.freeze(findings),
    evidence_quality: quality,
    evidence_confidence: quality === "CERTIFIED" ? 0.94 : quality === "PARTIAL" ? 0.7 : 0,
    evidence_freshness: evidence.some((record) => record.expiration_policy === "expired") ? "EXPIRED" : "CURRENT",
    evidence_lineage: Object.freeze(evidence.flatMap((record) => record.lineage_refs).sort()),
    evidence_provenance: Object.freeze(evidence.map((record) => record.source_record).sort()),
    validation_state,
    explainability: explainability({ candidate: request.candidate, evidence, conflicting, dependencyLineage: evidence.flatMap((record) => record.lineage_refs).sort() }),
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function dependencySource(candidate: DecisionCandidate) {
  return DEPENDENCY_REGISTRY[candidate.candidate_id as keyof typeof DEPENDENCY_REGISTRY] ?? DEPENDENCY_REGISTRY.candidate_tenant_alpha_mission_phase_9_decision_orchestration_001;
}

function refsIncludeUnresolved(values: readonly string[]): boolean {
  return values.some((ref) => ref.includes("unresolved"));
}

function buildGraph(candidate: DecisionCandidate, evidence: readonly EvidenceRecord[], deps = dependencySource(candidate)) {
  const nodes: readonly DependencyGraphNode[] = Object.freeze([
    { node_id: "mission_inputs", node_type: "MISSION_INPUT", refs: Object.freeze([candidate.mission_id]) },
    { node_id: "evidence_records", node_type: "EVIDENCE_RECORD", refs: Object.freeze(evidence.map((record) => record.evidence_id).sort()) },
    { node_id: "observations", node_type: "OBSERVATION", refs: Object.freeze(evidence.filter((record) => record.evidence_kind === "OBSERVATION").map((record) => record.evidence_id)) },
    { node_id: "findings", node_type: "FINDING", refs: Object.freeze(evidence.filter((record) => record.evidence_kind === "FINDING").map((record) => record.evidence_id)) },
    { node_id: "prerequisites", node_type: "PREREQUISITE", refs: deps.prerequisite_decisions },
    { node_id: "blockers", node_type: "BLOCKER", refs: deps.blocking_decisions },
    { node_id: "recommendations", node_type: "RECOMMENDATION", refs: deps.related_recommendations },
    { node_id: "current_decision", node_type: "CURRENT_DECISION", refs: Object.freeze([candidate.candidate_id]) },
  ]);
  const edges: readonly DependencyGraphEdge[] = Object.freeze([
    { from: "mission_inputs", to: "evidence_records", relation: "SUPPORTS" },
    { from: "evidence_records", to: "observations", relation: "DERIVES" },
    { from: "observations", to: "findings", relation: "DERIVES" },
    { from: "findings", to: "prerequisites", relation: "SUPPORTS" },
    { from: "prerequisites", to: "current_decision", relation: "REQUIRES" },
    { from: "blockers", to: "current_decision", relation: "BLOCKS" },
    { from: "recommendations", to: "current_decision", relation: "RELATES_TO" },
  ]);
  const acyclic = !deps.prerequisite_decisions.includes(candidate.candidate_id) && !deps.dependent_decisions.includes(candidate.candidate_id);
  return Object.freeze({ nodes, edges, acyclic });
}

function dependencyContext(request: EvidenceDependencyContextRequest, evidence: readonly EvidenceRecord[], validation_state: EvidenceDependencyResolutionState): DependencyContext {
  const deps = dependencySource(request.candidate);
  const graph = buildGraph(request.candidate, evidence, deps);
  const status: DependencyStatus = !graph.acyclic ? "CIRCULAR" : deps.blocking_decisions.length ? "BLOCKED" : deps.prerequisite_decisions.length ? "WAITING" : "CLEAR";
  const lineage = Object.freeze([...evidence.flatMap((record) => record.lineage_refs), ...deps.prerequisite_decisions, ...deps.dependent_decisions].sort());
  const base: Omit<DependencyContext, "integrity_hash"> = {
    dependency_context_id: `dependency_context_${request.candidate.candidate_id}`,
    decision_candidate_id: request.candidate.candidate_id,
    prerequisite_decisions: deps.prerequisite_decisions,
    blocking_decisions: deps.blocking_decisions,
    dependent_decisions: deps.dependent_decisions,
    related_recommendations: deps.related_recommendations,
    dependency_graph: graph,
    dependency_lineage: lineage,
    dependency_status: status,
    validation_state,
    explainability: explainability({ candidate: request.candidate, evidence, conflicting: evidence.filter((record) => record.evidence_kind === "CONFLICTING"), dependencyLineage: lineage }),
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function lineageGraph(candidate: DecisionCandidate, evidence: readonly EvidenceRecord[]): EvidenceLineageGraph {
  const base: Omit<EvidenceLineageGraph, "integrity_hash"> = {
    graph_id: `evidence_lineage_graph_${candidate.candidate_id}`,
    evidence_origins: Object.freeze(evidence.map((record) => record.source_record).sort()),
    transformations: Object.freeze(evidence.flatMap((record) => record.lineage_refs).sort()),
    referencing_decisions: Object.freeze([candidate.candidate_id]),
    replay_artifacts: Object.freeze(evidence.flatMap((record) => record.replay_refs).sort()),
    historical_usage: Object.freeze([`historical_usage_${candidate.mission_id}_001`]),
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function tenantLeak(evidence: readonly EvidenceRecord[], tenant_id: string): boolean {
  return evidence.some((record) => record.tenant_id !== tenant_id);
}

function validationFor(request: EvidenceDependencyContextRequest, evidence: readonly EvidenceRecord[]): EvidenceDependencyValidationResult {
  const deps = dependencySource(request.candidate);
  const graph = buildGraph(request.candidate, evidence, deps);
  const primary = evidence.filter((record) => record.evidence_kind === "PRIMARY");
  const failures: EvidenceDependencyFailureReason[] = [
    ...(primary.length === 0 ? ["PRIMARY_EVIDENCE_MISSING" as const] : []),
    ...(evidence.some((record) => !record.certified) ? ["EVIDENCE_AUTHENTICITY_UNVERIFIED" as const] : []),
    ...(evidence.some((record) => !record.provenance_complete) ? ["EVIDENCE_PROVENANCE_INCOMPLETE" as const] : []),
    ...(evidence.some((record) => record.evidence_kind === "SUPPORTING") ? [] : ["SUPPORTING_EVIDENCE_UNLINKED" as const]),
    ...(evidence.some((record) => record.evidence_kind === "OBSERVATION") ? [] : ["OBSERVATION_INVALID" as const]),
    ...(evidence.some((record) => record.evidence_kind === "FINDING") ? [] : ["FINDING_UNREPRODUCIBLE" as const]),
    ...(graph.nodes.length === 0 ? ["DEPENDENCY_GRAPH_INVALID" as const] : []),
    ...(!graph.acyclic ? ["CIRCULAR_DEPENDENCY_DETECTED" as const] : []),
    ...(refsIncludeUnresolved(deps.prerequisite_decisions) ? ["REQUIRED_PREREQUISITE_UNRESOLVED" as const] : []),
    ...(refsIncludeUnresolved(deps.blocking_decisions) ? ["BLOCKING_DECISION_UNRESOLVED" as const] : []),
    ...(evidence.some((record) => record.lineage_refs.length === 0) ? ["LINEAGE_INCOMPLETE" as const] : []),
    ...(tenantLeak(evidence, request.candidate.tenant_id) ? ["CROSS_TENANT_EVIDENCE" as const] : []),
    ...(request.mission_tenant_package?.validation.validation_status === "FAIL" || request.authority_operator_package?.validation.validation_status === "FAIL" ? ["INTEGRITY_VERIFICATION_FAILED" as const] : []),
  ];
  const unique = Object.freeze([...new Set(failures)]);
  const state: EvidenceDependencyResolutionState =
    unique.includes("CROSS_TENANT_EVIDENCE") ? "FAILED_ISOLATION"
      : unique.includes("INTEGRITY_VERIFICATION_FAILED") ? "FAILED_INTEGRITY"
        : unique.some((failure) => failure.includes("DEPENDENCY") || failure.includes("PREREQUISITE") || failure.includes("BLOCKING") || failure.includes("CIRCULAR")) ? "FAILED_DEPENDENCY"
          : unique.length ? "FAILED_EVIDENCE"
            : "PASSED";
  return Object.freeze({
    validation_status: unique.length ? "FAIL" : "PASS",
    validation_state: state,
    failure_reason: unique[0],
    failure_reasons: unique,
    checks: Object.freeze({
      primary_evidence_exists: primary.length > 0,
      authenticity_verified: evidence.every((record) => record.certified),
      provenance_complete: evidence.every((record) => record.provenance_complete),
      supporting_evidence_linked: evidence.some((record) => record.evidence_kind === "SUPPORTING"),
      conflicts_identified: true,
      observations_valid: evidence.some((record) => record.evidence_kind === "OBSERVATION"),
      findings_reproducible: evidence.some((record) => record.evidence_kind === "FINDING"),
      prerequisites_satisfied: !refsIncludeUnresolved(deps.prerequisite_decisions),
      blocking_decisions_identified: true,
      related_recommendations_resolved: deps.related_recommendations.every((ref) => !ref.includes("unresolved")),
      dependency_graph_valid: graph.nodes.length > 0,
      circular_dependencies_absent: graph.acyclic,
      lineage_complete: evidence.every((record) => record.lineage_refs.length > 0),
      tenant_isolated: !tenantLeak(evidence, request.candidate.tenant_id),
      integrity_verified: !unique.includes("INTEGRITY_VERIFICATION_FAILED"),
    }),
  });
}

function evidenceDomain(context: EvidenceContext, candidate: DecisionCandidate): DecisionContextDomain {
  const base: Omit<DecisionContextDomain, "integrity_hash"> = {
    domain_name: "evidence_context",
    required: true,
    status: context.validation_state === "PASSED" ? "COMPLETE" : "UNAVAILABLE",
    source_subsystem: "evidence-registry",
    originating_record: context.primary_evidence[0]?.source_record ?? "missing_primary_evidence",
    resolver: RESOLVER_VERSION,
    supporting_evidence: Object.freeze(context.primary_evidence.map((record) => record.evidence_id)),
    confidence: context.evidence_confidence,
    governance_rationale: `${context.conflicting_evidence.length} conflicting evidence records preserved.`,
    constitutional_rationale: "Evidence lineage and tenant isolation preserved.",
    replay_reference: `replay_evidence_context_${candidate.candidate_id}`,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function dependencyDomain(context: DependencyContext, candidate: DecisionCandidate): DecisionContextDomain {
  const base: Omit<DecisionContextDomain, "integrity_hash"> = {
    domain_name: "dependency_context",
    required: true,
    status: context.validation_state === "PASSED" ? "COMPLETE" : "UNAVAILABLE",
    source_subsystem: "dependency-registry",
    originating_record: context.dependency_context_id,
    resolver: RESOLVER_VERSION,
    supporting_evidence: Object.freeze(context.prerequisite_decisions),
    confidence: context.dependency_graph.acyclic ? 1 : 0,
    governance_rationale: `${context.dependency_status} dependency status for ${candidate.candidate_id}.`,
    constitutional_rationale: "Dependency graph remains explicit, acyclic, and replayable.",
    replay_reference: `replay_dependency_context_${candidate.candidate_id}`,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function packageHash(pkg: Omit<EvidenceDependencyContextPackage, "integrity_hash"> | EvidenceDependencyContextPackage): string {
  const copy = { ...(pkg as EvidenceDependencyContextPackage) } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(copy);
}

export function resolveEvidenceDependencyContext(request: EvidenceDependencyContextRequest = createEvidenceDependencyContextRequest()): EvidenceDependencyContextPackage {
  const evidence = registryEvidence(request.candidate);
  const validation = validationFor(request, evidence);
  const evidence_context = evidenceContext(request, evidence, validation.validation_state);
  const dependency_context = dependencyContext(request, evidence, validation.validation_state);
  const base: Omit<EvidenceDependencyContextPackage, "integrity_hash"> = {
    resolution_id: request.resolution_id,
    candidate_id: request.candidate.candidate_id,
    evidence_context,
    dependency_context,
    evidence_domain: evidenceDomain(evidence_context, request.candidate),
    dependency_domain: dependencyDomain(dependency_context, request.candidate),
    lineage_graph: lineageGraph(request.candidate, evidence),
    validation,
    replay_ref: `replay_evidence_dependency_${request.resolution_id}`,
    timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: packageHash(base) });
}

export function replayEvidenceDependencyContext(pkg: EvidenceDependencyContextPackage): EvidenceDependencyReplayResult {
  const reconstructed_hash = packageHash(pkg);
  const replay_valid = reconstructed_hash === pkg.integrity_hash;
  const base: Omit<EvidenceDependencyReplayResult, "integrity_hash"> = {
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

export function buildEvidenceDependencyObservability(packages: readonly EvidenceDependencyContextPackage[]): EvidenceDependencyObservability {
  const failures = packages.flatMap((pkg) => pkg.validation.failure_reasons);
  return Object.freeze({
    resolution_attempts: packages.length,
    successful_resolutions: packages.filter((pkg) => pkg.validation.validation_status === "PASS").length,
    failed_resolutions: packages.filter((pkg) => pkg.validation.validation_status === "FAIL").length,
    evidence_failures: failures.filter((failure) => failure.includes("EVIDENCE") || failure.includes("PROVENANCE") || failure.includes("OBSERVATION") || failure.includes("FINDING")).length,
    dependency_failures: failures.filter((failure) => failure.includes("DEPENDENCY") || failure.includes("PREREQUISITE") || failure.includes("BLOCKING") || failure.includes("CIRCULAR")).length,
    conflict_count: packages.reduce((count, pkg) => count + pkg.evidence_context.conflicting_evidence.length, 0),
    isolation_failures: failures.filter((failure) => failure === "CROSS_TENANT_EVIDENCE").length,
    integrity_failures: failures.filter((failure) => failure === "INTEGRITY_VERIFICATION_FAILED").length,
    replay_success_rate: packages.length === 0 ? 0 : packages.filter((pkg) => replayEvidenceDependencyContext(pkg).replay_valid).length / packages.length,
  });
}

export function getEvidenceDependencyContextResolver() {
  const request = createEvidenceDependencyContextRequest();
  const context_package = resolveEvidenceDependencyContext(request);
  return Object.freeze({
    resolution_order: RESOLUTION_ORDER,
    evidence_registry: EVIDENCE_REGISTRY,
    request,
    context_package,
    replay: replayEvidenceDependencyContext(context_package),
    observability: buildEvidenceDependencyObservability([context_package]),
  });
}
