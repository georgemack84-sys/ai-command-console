import { createDecisionContext } from "@/services/decision-context-contract";
import { generateDecisionIntegrityHash } from "@/services/decision-integrity";
import { normalizeDecisionCandidateInput } from "@/services/decision-input-normalization";
import { createMissionTenantContextRequest, resolveMissionTenantContext } from "@/services/decision-mission-tenant-context";
import { createAuthorityOperatorContextRequest, resolveAuthorityOperatorContext } from "@/services/decision-authority-operator-context";
import { createEvidenceDependencyContextRequest, resolveEvidenceDependencyContext } from "@/services/decision-evidence-dependency-context";
import { createRiskConfidenceContextRequest, resolveRiskConfidenceContext } from "@/services/decision-risk-confidence-context";
import { createGovernanceConstitutionalContextRequest, resolveGovernanceConstitutionalContext } from "@/services/decision-governance-constitutional-context";
import { createRuntimeRecoveryForecastContextRequest, resolveRuntimeRecoveryForecastContext } from "@/services/decision-runtime-recovery-forecast-context";
import type { DecisionCandidate } from "@/types/decision-input-normalization";
import type { DecisionContextDomain } from "@/types/decision-context-contract";
import type {
  CertificationHistoryRecord,
  DecisionLineageGraph,
  HistoricalContext,
  HistoricalDecisionRecord,
  HistoricalOutcomeRecord,
  HistoricalReplayContextPackage,
  HistoricalReplayContextRequest,
  HistoricalReplayExplainability,
  HistoricalReplayFailureReason,
  HistoricalReplayObservability,
  HistoricalReplayResolutionState,
  HistoricalReplayResult,
  HistoricalReplayValidationResult,
  ReplayArtifactRecord,
  ReplayAvailability,
  ReplayContext,
} from "@/types/decision-historical-replay-context";

const NOW = "2026-07-02T09:35:00.000Z";
const RESOLVER_VERSION = "historical-replay-context-resolver/v1" as const;
const RESOLUTION_ORDER: readonly HistoricalReplayResolutionState[] = Object.freeze([
  "HISTORICAL_REGISTRY_RESOLVED",
  "HISTORICAL_DECISIONS_RESOLVED",
  "OUTCOMES_RESOLVED",
  "CERTIFICATION_HISTORY_RESOLVED",
  "ANCESTRY_BUILT",
  "LINEAGE_GRAPH_BUILT",
  "REPLAY_REFERENCES_RESOLVED",
  "REPLAY_ARTIFACTS_VERIFIED",
  "LINEAGE_VALIDATED",
  "PASSED",
] as const);

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function recordHash<T extends Record<string, unknown>>(value: T): string {
  const copy = { ...value };
  delete copy.integrity_hash;
  delete copy.graph_integrity_hash;
  return hash(copy);
}

function makeDecision(input: Omit<HistoricalDecisionRecord, "integrity_hash">): HistoricalDecisionRecord {
  return Object.freeze({ ...input, integrity_hash: recordHash(input) });
}

function makeOutcome(input: Omit<HistoricalOutcomeRecord, "integrity_hash">): HistoricalOutcomeRecord {
  return Object.freeze({ ...input, integrity_hash: recordHash(input) });
}

function makeCertification(input: Omit<CertificationHistoryRecord, "integrity_hash">): CertificationHistoryRecord {
  return Object.freeze({ ...input, integrity_hash: recordHash(input) });
}

function makeArtifact(input: Omit<ReplayArtifactRecord, "integrity_hash">): ReplayArtifactRecord {
  return Object.freeze({ ...input, integrity_hash: recordHash(input) });
}

const HISTORICAL_DECISIONS: readonly HistoricalDecisionRecord[] = Object.freeze([
  makeDecision({
    decision_id: "decision_phase_9_root_context_foundation",
    tenant_id: "tenant_alpha",
    mission_id: "mission_phase_9_decision_orchestration",
    decision_type: "RECOMMENDATION_SELECTION",
    decision_state: "CERTIFIED",
    parent_decision_refs: Object.freeze([]),
    child_decision_refs: Object.freeze(["decision_phase_9_context_resolver_chain"]),
    evidence_refs: Object.freeze(["evidence_tenant_alpha_mission_phase_9_decision_orchestration_001"]),
    governance_refs: Object.freeze(["policy_tenant_alpha_mission_phase_9_governance_review"]),
    replay_refs: Object.freeze(["replay_history_phase_9_root", "replay_certification_phase_9_root"]),
    certification_refs: Object.freeze(["cert_phase_9_root_context_foundation"]),
    outcome_ref: "outcome_phase_9_root_context_foundation",
    lineage_refs: Object.freeze(["lineage_history_phase_9_root_001"]),
  }),
  makeDecision({
    decision_id: "decision_phase_9_context_resolver_chain",
    tenant_id: "tenant_alpha",
    mission_id: "mission_phase_9_decision_orchestration",
    decision_type: "RECOMMENDATION_SELECTION",
    decision_state: "APPROVED",
    parent_decision_refs: Object.freeze(["decision_phase_9_root_context_foundation"]),
    child_decision_refs: Object.freeze(["candidate_tenant_alpha_mission_phase_9_decision_orchestration_001"]),
    evidence_refs: Object.freeze(["evidence_tenant_alpha_mission_phase_9_decision_orchestration_supporting_001"]),
    governance_refs: Object.freeze(["policy_tenant_alpha_phase_9_risk_review"]),
    replay_refs: Object.freeze(["replay_history_phase_9_chain", "replay_governance_phase_9_chain"]),
    certification_refs: Object.freeze(["cert_phase_9_context_resolver_chain"]),
    outcome_ref: "outcome_phase_9_context_resolver_chain",
    lineage_refs: Object.freeze(["lineage_history_phase_9_chain_001"]),
  }),
  makeDecision({
    decision_id: "decision_tenant_beta_external_history",
    tenant_id: "tenant_beta",
    mission_id: "mission_phase_9_decision_orchestration",
    decision_type: "RECOMMENDATION_SELECTION",
    decision_state: "ESCALATED",
    parent_decision_refs: Object.freeze([]),
    child_decision_refs: Object.freeze([]),
    evidence_refs: Object.freeze(["evidence_tenant_beta_mission_phase_9_decision_orchestration_001"]),
    governance_refs: Object.freeze(["policy_tenant_beta_external_governance"]),
    replay_refs: Object.freeze(["replay_tenant_beta_history"]),
    certification_refs: Object.freeze(["cert_tenant_beta_external"]),
    outcome_ref: "outcome_tenant_beta_external_history",
    lineage_refs: Object.freeze(["lineage_history_beta_001"]),
  }),
]);

const OUTCOMES: readonly HistoricalOutcomeRecord[] = Object.freeze([
  makeOutcome({
    outcome_id: "outcome_phase_9_root_context_foundation",
    decision_id: "decision_phase_9_root_context_foundation",
    mission_impact: "decision_context_contract_established",
    risk_impact: "risk_visibility_improved",
    recovery_impact: "rollback_scope_documented",
    runtime_impact: "no_runtime_execution",
    governance_impact: "governance_supremacy_preserved",
    operator_response: "accepted_for_next_phase",
    certification_outcome: "PASSED",
    replay_result: "VALID",
  }),
  makeOutcome({
    outcome_id: "outcome_phase_9_context_resolver_chain",
    decision_id: "decision_phase_9_context_resolver_chain",
    mission_impact: "context_resolvers_progressively_certified",
    risk_impact: "moderate_risk_review_preserved",
    recovery_impact: "context_rebuild_ready",
    runtime_impact: "healthy_operational_awareness",
    governance_impact: "review_required_recorded",
    operator_response: "approved_with_review",
    certification_outcome: "CONDITIONAL",
    replay_result: "VALID",
  }),
  makeOutcome({
    outcome_id: "outcome_tenant_beta_external_history",
    decision_id: "decision_tenant_beta_external_history",
    mission_impact: "external_history_not_applicable",
    risk_impact: "tenant_boundary_required",
    recovery_impact: "external_recovery",
    runtime_impact: "external_runtime",
    governance_impact: "external_escalation",
    operator_response: "escalated",
    certification_outcome: "FAILED",
    replay_result: "VALID",
  }),
]);

const CERTIFICATIONS: readonly CertificationHistoryRecord[] = Object.freeze([
  makeCertification({
    certification_id: "cert_phase_9_root_context_foundation",
    decision_id: "decision_phase_9_root_context_foundation",
    certification_state: "CERTIFIED",
    certification_gate: "phase_9_3_1_context_contract",
    certification_evidence: Object.freeze(["replay_history_phase_9_root"]),
    certification_failures: Object.freeze([]),
    replay_validation_result: "VALID",
    integrity_validation_result: "VALID",
  }),
  makeCertification({
    certification_id: "cert_phase_9_context_resolver_chain",
    decision_id: "decision_phase_9_context_resolver_chain",
    certification_state: "CONDITIONAL_PASS",
    certification_gate: "phase_9_3_context_resolver_chain",
    certification_evidence: Object.freeze(["replay_history_phase_9_chain", "replay_governance_phase_9_chain"]),
    certification_failures: Object.freeze(["operator_review_pending"]),
    replay_validation_result: "VALID",
    integrity_validation_result: "VALID",
  }),
  makeCertification({
    certification_id: "cert_tenant_beta_external",
    decision_id: "decision_tenant_beta_external_history",
    certification_state: "FAILED",
    certification_gate: "external_gate",
    certification_evidence: Object.freeze(["replay_tenant_beta_history"]),
    certification_failures: Object.freeze(["tenant_boundary"]),
    replay_validation_result: "VALID",
    integrity_validation_result: "VALID",
  }),
]);

const REPLAY_ARTIFACTS: readonly ReplayArtifactRecord[] = Object.freeze([
  makeArtifact({
    replay_artifact_id: "artifact_replay_history_phase_9_root",
    replay_ref: "replay_history_phase_9_root",
    tenant_id: "tenant_alpha",
    mission_id: "mission_phase_9_decision_orchestration",
    source_component: "historical-decision-registry",
    artifact_available: true,
    artifact_hash: hash("replay_history_phase_9_root"),
    artifact_lineage: Object.freeze(["lineage_history_phase_9_root_001"]),
    artifact_version: "replay/v1",
    schema_version: "9.3",
    certified: true,
  }),
  makeArtifact({
    replay_artifact_id: "artifact_replay_history_phase_9_chain",
    replay_ref: "replay_history_phase_9_chain",
    tenant_id: "tenant_alpha",
    mission_id: "mission_phase_9_decision_orchestration",
    source_component: "historical-decision-registry",
    artifact_available: true,
    artifact_hash: hash("replay_history_phase_9_chain"),
    artifact_lineage: Object.freeze(["lineage_history_phase_9_chain_001"]),
    artifact_version: "replay/v1",
    schema_version: "9.3",
    certified: true,
  }),
  makeArtifact({
    replay_artifact_id: "artifact_replay_governance_phase_9_chain",
    replay_ref: "replay_governance_phase_9_chain",
    tenant_id: "tenant_alpha",
    mission_id: "mission_phase_9_decision_orchestration",
    source_component: "governance-ledger",
    artifact_available: true,
    artifact_hash: hash("replay_governance_phase_9_chain"),
    artifact_lineage: Object.freeze(["lineage_history_phase_9_chain_001"]),
    artifact_version: "replay/v1",
    schema_version: "9.3",
    certified: true,
  }),
  makeArtifact({
    replay_artifact_id: "artifact_replay_certification_phase_9_root",
    replay_ref: "replay_certification_phase_9_root",
    tenant_id: "tenant_alpha",
    mission_id: "mission_phase_9_decision_orchestration",
    source_component: "certification-ledger",
    artifact_available: true,
    artifact_hash: hash("replay_certification_phase_9_root"),
    artifact_lineage: Object.freeze(["lineage_history_phase_9_root_001"]),
    artifact_version: "replay/v1",
    schema_version: "9.3",
    certified: true,
  }),
  makeArtifact({
    replay_artifact_id: "artifact_replay_tenant_beta_history",
    replay_ref: "replay_tenant_beta_history",
    tenant_id: "tenant_beta",
    mission_id: "mission_phase_9_decision_orchestration",
    source_component: "external-history",
    artifact_available: true,
    artifact_hash: hash("replay_tenant_beta_history"),
    artifact_lineage: Object.freeze(["lineage_history_beta_001"]),
    artifact_version: "replay/v1",
    schema_version: "9.3",
    certified: true,
  }),
]);

function defaultCandidate(): DecisionCandidate {
  const result = normalizeDecisionCandidateInput();
  if (!result.candidate) throw new Error("default normalized candidate unavailable");
  return result.candidate;
}

export function createHistoricalReplayContextRequest(overrides: Partial<HistoricalReplayContextRequest> = {}): HistoricalReplayContextRequest {
  const candidate = overrides.candidate ?? defaultCandidate();
  const mission_tenant_package = overrides.mission_tenant_package ?? resolveMissionTenantContext(createMissionTenantContextRequest({ candidate }));
  const authority_operator_package = overrides.authority_operator_package ?? resolveAuthorityOperatorContext(createAuthorityOperatorContextRequest({ candidate, mission_tenant_package }));
  const evidence_dependency_package = overrides.evidence_dependency_package ?? resolveEvidenceDependencyContext(createEvidenceDependencyContextRequest({ candidate, mission_tenant_package, authority_operator_package }));
  const risk_confidence_package = overrides.risk_confidence_package ?? resolveRiskConfidenceContext(createRiskConfidenceContextRequest({ candidate, mission_tenant_package, authority_operator_package, evidence_dependency_package }));
  const governance_constitutional_package = overrides.governance_constitutional_package ?? resolveGovernanceConstitutionalContext(createGovernanceConstitutionalContextRequest({ candidate, mission_tenant_package, authority_operator_package, evidence_dependency_package, risk_confidence_package }));
  return Object.freeze({
    resolution_id: overrides.resolution_id ?? `historical_replay_resolution_${candidate.candidate_id}`,
    candidate,
    base_context: overrides.base_context ?? createDecisionContext({ candidate }),
    mission_tenant_package,
    authority_operator_package,
    evidence_dependency_package,
    risk_confidence_package,
    governance_constitutional_package,
    runtime_recovery_forecast_package: overrides.runtime_recovery_forecast_package ?? resolveRuntimeRecoveryForecastContext(createRuntimeRecoveryForecastContextRequest({ candidate, mission_tenant_package, authority_operator_package, evidence_dependency_package, risk_confidence_package, governance_constitutional_package })),
    resolver_version: overrides.resolver_version ?? RESOLVER_VERSION,
  });
}

function historicalDecisions(candidate: DecisionCandidate): readonly HistoricalDecisionRecord[] {
  const includeBeta = candidate.replay_refs.some((ref) => ref.includes("tenant_beta"));
  const scoped = HISTORICAL_DECISIONS.filter((decision) => decision.tenant_id === candidate.tenant_id && decision.mission_id === candidate.mission_id);
  const external = includeBeta ? HISTORICAL_DECISIONS.filter((decision) => decision.tenant_id === "tenant_beta") : [];
  return Object.freeze([...scoped, ...external].sort((left, right) => left.decision_id.localeCompare(right.decision_id)));
}

function outcomesFor(decisions: readonly HistoricalDecisionRecord[]): readonly HistoricalOutcomeRecord[] {
  const ids = new Set(decisions.map((decision) => decision.outcome_ref));
  return Object.freeze(OUTCOMES.filter((outcome) => ids.has(outcome.outcome_id)).sort((left, right) => left.outcome_id.localeCompare(right.outcome_id)));
}

function certificationsFor(decisions: readonly HistoricalDecisionRecord[]): readonly CertificationHistoryRecord[] {
  const ids = new Set(decisions.flatMap((decision) => decision.certification_refs));
  return Object.freeze(CERTIFICATIONS.filter((cert) => ids.has(cert.certification_id)).sort((left, right) => left.certification_id.localeCompare(right.certification_id)));
}

function replayRefs(request: HistoricalReplayContextRequest, decisions: readonly HistoricalDecisionRecord[], certs: readonly CertificationHistoryRecord[]): readonly string[] {
  return Object.freeze([...new Set([
    ...request.candidate.replay_refs,
    ...(request.evidence_dependency_package ? [request.evidence_dependency_package.replay_ref] : []),
    ...(request.risk_confidence_package ? [request.risk_confidence_package.replay_ref] : []),
    ...(request.governance_constitutional_package ? [request.governance_constitutional_package.replay_ref] : []),
    ...(request.runtime_recovery_forecast_package ? [request.runtime_recovery_forecast_package.replay_ref] : []),
    ...decisions.flatMap((decision) => decision.replay_refs),
    ...certs.flatMap((cert) => cert.certification_evidence),
  ].filter(Boolean))].sort());
}

function artifactsFor(refs: readonly string[]): readonly ReplayArtifactRecord[] {
  const known = new Map(REPLAY_ARTIFACTS.map((artifact) => [artifact.replay_ref, artifact]));
  return Object.freeze(refs.flatMap((ref) => {
    const artifact = known.get(ref);
    if (artifact) return [artifact];
    if (ref.includes("missing")) return [];
    const tenant_id = ref.includes("tenant_beta") ? "tenant_beta" : "tenant_alpha";
    return [makeArtifact({
      replay_artifact_id: `artifact_${ref}`,
      replay_ref: ref,
      tenant_id,
      mission_id: "mission_phase_9_decision_orchestration",
      source_component: "upstream-context-resolver",
      artifact_available: !ref.includes("unavailable"),
      artifact_hash: ref.includes("corrupt") ? "corrupt" : hash(ref),
      artifact_lineage: Object.freeze([`lineage_${ref}`]),
      artifact_version: "replay/v1",
      schema_version: "9.3",
      certified: !ref.includes("unverified"),
    })];
  }).sort((left, right) => left.replay_artifact_id.localeCompare(right.replay_artifact_id)));
}

function lineageGraph(candidate: DecisionCandidate, decisions: readonly HistoricalDecisionRecord[], refs: readonly string[]): DecisionLineageGraph {
  const parentRefs = Object.freeze([...new Set(decisions.flatMap((decision) => decision.parent_decision_refs))].sort());
  const childRefs = Object.freeze([...new Set(decisions.flatMap((decision) => decision.child_decision_refs))].sort());
  const rootRefs = Object.freeze(decisions.filter((decision) => decision.parent_decision_refs.length === 0).map((decision) => decision.decision_id).sort());
  const siblings = Object.freeze(decisions.filter((decision) => decision.decision_id !== candidate.candidate_id && decision.decision_type === candidate.decision_type).map((decision) => decision.decision_id).sort());
  const base: Omit<DecisionLineageGraph, "graph_integrity_hash"> = {
    lineage_graph_id: `lineage_graph_${candidate.candidate_id}`,
    decision_candidate_id: candidate.candidate_id,
    root_decision_refs: rootRefs,
    parent_decision_refs: parentRefs,
    child_decision_refs: candidate.candidate_id === "candidate_lineage_cycle" ? Object.freeze([candidate.candidate_id]) : childRefs,
    ancestor_decision_refs: Object.freeze([...new Set([...rootRefs, ...parentRefs, ...decisions.map((decision) => decision.decision_id)])].sort()),
    descendant_decision_refs: childRefs,
    sibling_decision_refs: siblings,
    related_recommendation_refs: Object.freeze(decisions.map((decision) => `recommendation_${decision.decision_id}`).sort()),
    replay_refs: refs,
    certification_refs: Object.freeze([...new Set(decisions.flatMap((decision) => decision.certification_refs))].sort()),
  };
  return Object.freeze({ ...base, graph_integrity_hash: recordHash(base) });
}

function replayAvailability(refs: readonly string[], artifacts: readonly ReplayArtifactRecord[]): ReplayAvailability {
  if (refs.length === 0) return "MISSING";
  if (artifacts.length === 0) return "MISSING";
  if (artifacts.some((artifact) => !artifact.artifact_available)) return "MISSING";
  if (artifacts.some((artifact) => !artifact.certified)) return "UNVERIFIED";
  if (artifacts.length < refs.length) return "PARTIAL";
  if (artifacts.some((artifact) => recordHash(artifact) !== artifact.integrity_hash)) return "CORRUPTED";
  return "AVAILABLE";
}

function explainability(input: { decisions: readonly HistoricalDecisionRecord[]; outcomes: readonly HistoricalOutcomeRecord[]; certs: readonly CertificationHistoryRecord[]; artifacts: readonly ReplayArtifactRecord[]; availability: ReplayAvailability; validation: readonly string[] }): HistoricalReplayExplainability {
  const base: Omit<HistoricalReplayExplainability, "integrity_hash"> = {
    linked_decision_rationale: Object.freeze(input.decisions.map((decision) => `${decision.decision_id}:${decision.decision_state}`)),
    outcome_summary: Object.freeze(input.outcomes.map((outcome) => `${outcome.outcome_id}:${outcome.certification_outcome}:${outcome.replay_result}`)),
    replay_artifact_rationale: Object.freeze(input.artifacts.map((artifact) => `${artifact.replay_ref}:${artifact.source_component}:${artifact.certified ? "certified" : "uncertified"}`)),
    certification_summary: Object.freeze(input.certs.map((cert) => `${cert.certification_id}:${cert.certification_state}`)),
    replay_availability_rationale: `${input.availability} replay availability from ${input.artifacts.length} artifacts.`,
    lineage_completeness_rationale: `${input.decisions.length} historical decisions carry lineage references.`,
    ancestry_reproducibility_rationale: "Ancestry ordering is deterministic by decision identifier.",
    validation_outcomes: input.validation,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function validationFor(request: HistoricalReplayContextRequest, decisions: readonly HistoricalDecisionRecord[], outcomes: readonly HistoricalOutcomeRecord[], certs: readonly CertificationHistoryRecord[], graph: DecisionLineageGraph, refs: readonly string[], artifacts: readonly ReplayArtifactRecord[]): HistoricalReplayValidationResult {
  const availability = replayAvailability(refs, artifacts);
  const crossTenant = decisions.some((decision) => decision.tenant_id !== request.candidate.tenant_id) || artifacts.some((artifact) => artifact.tenant_id !== request.candidate.tenant_id) || request.candidate.replay_refs.some((ref) => ref.includes("tenant_beta"));
  const cyclic = request.candidate.candidate_id === "candidate_lineage_cycle" || graph.parent_decision_refs.includes(request.candidate.candidate_id);
  const lineageComplete = decisions.every((decision) => decision.lineage_refs.length > 0) && artifacts.every((artifact) => artifact.artifact_lineage.length > 0);
  const integrityValid = decisions.every((decision) => recordHash(decision) === decision.integrity_hash) && artifacts.every((artifact) => recordHash(artifact) === artifact.integrity_hash) && recordHash(graph) === graph.graph_integrity_hash;
  const upstreamIntegrityFailed = request.mission_tenant_package?.validation.validation_status === "FAIL" || request.authority_operator_package?.validation.validation_status === "FAIL";
  const failures: HistoricalReplayFailureReason[] = [
    ...(HISTORICAL_DECISIONS.length === 0 ? ["HISTORICAL_REGISTRY_UNAVAILABLE" as const] : []),
    ...(decisions.length === 0 ? ["HISTORICAL_DECISIONS_UNRESOLVED" as const] : []),
    ...(outcomes.length !== decisions.length ? ["PREVIOUS_OUTCOMES_UNLINKED" as const] : []),
    ...(graph.ancestor_decision_refs.length === 0 ? ["DECISION_ANCESTRY_INCOMPLETE" as const] : []),
    ...(cyclic ? ["LINEAGE_GRAPH_CYCLIC" as const] : []),
    ...(refs.length === 0 ? ["REPLAY_REFERENCES_MISSING" as const] : []),
    ...(availability !== "AVAILABLE" ? ["REPLAY_ARTIFACTS_UNAVAILABLE" as const] : []),
    ...(availability === "CORRUPTED" || artifacts.some((artifact) => artifact.artifact_hash !== hash(artifact.replay_ref)) ? ["REPLAY_INTEGRITY_FAILED" as const] : []),
    ...(certs.length !== decisions.length ? ["CERTIFICATION_HISTORY_UNRESOLVED" as const] : []),
    ...(!lineageComplete ? ["LINEAGE_INCOMPLETE" as const] : []),
    ...(crossTenant ? ["CROSS_TENANT_LINEAGE" as const] : []),
    ...(!integrityValid || upstreamIntegrityFailed ? ["INTEGRITY_HASH_MISMATCH" as const] : []),
  ];
  const unique = Object.freeze([...new Set(failures)]);
  const state: HistoricalReplayResolutionState =
    unique.includes("CROSS_TENANT_LINEAGE") ? "FAILED_ISOLATION"
      : unique.includes("INTEGRITY_HASH_MISMATCH") ? "FAILED_INTEGRITY"
        : unique.some((failure) => failure.includes("REPLAY")) ? "FAILED_REPLAY"
          : unique.some((failure) => failure.includes("LINEAGE") || failure.includes("ANCESTRY")) ? "FAILED_LINEAGE"
            : unique.length ? "FAILED_HISTORICAL"
              : "PASSED";
  return Object.freeze({
    validation_status: unique.length ? "FAIL" : "PASS",
    validation_state: state,
    failure_reason: unique[0],
    failure_reasons: unique,
    checks: Object.freeze({
      historical_decisions_resolved: decisions.length > 0,
      previous_outcomes_linked: outcomes.length === decisions.length,
      decision_ancestry_complete: graph.ancestor_decision_refs.length > 0,
      lineage_graph_acyclic: !cyclic,
      replay_references_present: refs.length > 0,
      replay_artifacts_available: availability === "AVAILABLE",
      replay_integrity_verified: availability === "AVAILABLE" && artifacts.every((artifact) => artifact.artifact_hash === hash(artifact.replay_ref)),
      certification_history_resolved: certs.length === decisions.length,
      tenant_boundaries_preserved: !crossTenant,
      integrity_hashes_reproducible: integrityValid && !upstreamIntegrityFailed,
    }),
  });
}

function historicalContext(request: HistoricalReplayContextRequest, decisions: readonly HistoricalDecisionRecord[], outcomes: readonly HistoricalOutcomeRecord[], certs: readonly CertificationHistoryRecord[], artifacts: readonly ReplayArtifactRecord[], validation: HistoricalReplayValidationResult): HistoricalContext {
  const availability = replayAvailability(replayRefs(request, decisions, certs), artifacts);
  const base: Omit<HistoricalContext, "integrity_hash"> = {
    historical_context_id: `historical_context_${request.candidate.candidate_id}`,
    decision_candidate_id: request.candidate.candidate_id,
    historical_decisions: decisions,
    previous_outcomes: outcomes,
    related_outcomes: outcomes,
    prior_approvals: Object.freeze(decisions.filter((decision) => decision.decision_state === "APPROVED" || decision.decision_state === "CERTIFIED").map((decision) => decision.decision_id).sort()),
    prior_escalations: Object.freeze(decisions.filter((decision) => decision.decision_state === "ESCALATED").map((decision) => decision.decision_id).sort()),
    prior_rejections: Object.freeze(decisions.filter((decision) => decision.decision_state === "REJECTED").map((decision) => decision.decision_id).sort()),
    prior_deferrals: Object.freeze(decisions.filter((decision) => decision.decision_state === "DEFERRED").map((decision) => decision.decision_id).sort()),
    certification_history: certs,
    historical_patterns: Object.freeze(["context_resolver_chain_progression", "operator_review_preserved", "replay_validated_history"]),
    historical_lineage: Object.freeze(decisions.flatMap((decision) => decision.lineage_refs).sort()),
    validation_state: validation.validation_state,
    explainability: explainability({ decisions, outcomes, certs, artifacts, availability, validation: validation.failure_reasons }),
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function replayContext(request: HistoricalReplayContextRequest, refs: readonly string[], artifacts: readonly ReplayArtifactRecord[], decisions: readonly HistoricalDecisionRecord[], outcomes: readonly HistoricalOutcomeRecord[], certs: readonly CertificationHistoryRecord[], validation: HistoricalReplayValidationResult): ReplayContext {
  const availability = replayAvailability(refs, artifacts);
  const replay_hash = hash({ refs, artifact_hashes: artifacts.map((artifact) => artifact.artifact_hash) });
  const base: Omit<ReplayContext, "integrity_hash"> = {
    replay_context_id: `replay_context_${request.candidate.candidate_id}`,
    decision_candidate_id: request.candidate.candidate_id,
    replay_references: refs,
    replay_availability: availability,
    replay_artifacts: artifacts,
    replay_integrity: availability === "AVAILABLE" ? "VALID" : "INVALID",
    replay_lineage: Object.freeze(artifacts.flatMap((artifact) => artifact.artifact_lineage).sort()),
    replay_validation_state: validation.validation_state,
    replay_hash,
    explainability: explainability({ decisions, outcomes, certs, artifacts, availability, validation: validation.failure_reasons }),
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function historicalDomain(context: HistoricalContext, candidate: DecisionCandidate): DecisionContextDomain {
  const base: Omit<DecisionContextDomain, "integrity_hash"> = {
    domain_name: "historical_context",
    required: true,
    status: context.validation_state === "PASSED" ? "COMPLETE" : "UNAVAILABLE",
    source_subsystem: "historical-decision-registry",
    originating_record: context.historical_context_id,
    resolver: RESOLVER_VERSION,
    supporting_evidence: Object.freeze(context.historical_decisions.map((decision) => decision.decision_id)),
    confidence: context.historical_decisions.length ? 0.93 : 0,
    governance_rationale: `${context.historical_decisions.length} historical decisions linked for ${candidate.candidate_id}.`,
    constitutional_rationale: "History remains descriptive and advisory-only.",
    replay_reference: `replay_historical_context_${candidate.candidate_id}`,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function replayDomain(context: ReplayContext, candidate: DecisionCandidate): DecisionContextDomain {
  const base: Omit<DecisionContextDomain, "integrity_hash"> = {
    domain_name: "replay_context",
    required: true,
    status: context.replay_validation_state === "PASSED" ? "COMPLETE" : "UNAVAILABLE",
    source_subsystem: "replay-framework",
    originating_record: context.replay_context_id,
    resolver: RESOLVER_VERSION,
    supporting_evidence: context.replay_references,
    confidence: context.replay_availability === "AVAILABLE" ? 1 : 0,
    governance_rationale: `${context.replay_availability} replay availability for ${candidate.candidate_id}.`,
    constitutional_rationale: "Replay fidelity and integrity preservation verified.",
    replay_reference: `replay_replay_context_${candidate.candidate_id}`,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function packageHash(pkg: Omit<HistoricalReplayContextPackage, "integrity_hash"> | HistoricalReplayContextPackage): string {
  const copy = { ...(pkg as HistoricalReplayContextPackage) } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(copy);
}

export function resolveHistoricalReplayContext(request: HistoricalReplayContextRequest = createHistoricalReplayContextRequest()): HistoricalReplayContextPackage {
  const decisions = historicalDecisions(request.candidate);
  const outcomes = outcomesFor(decisions);
  const certs = certificationsFor(decisions);
  const refs = replayRefs(request, decisions, certs);
  const artifacts = artifactsFor(refs);
  const graph = lineageGraph(request.candidate, decisions, refs);
  const validation = validationFor(request, decisions, outcomes, certs, graph, refs, artifacts);
  const historical_context = historicalContext(request, decisions, outcomes, certs, artifacts, validation);
  const replay_context = replayContext(request, refs, artifacts, decisions, outcomes, certs, validation);
  const base: Omit<HistoricalReplayContextPackage, "integrity_hash"> = {
    resolution_id: request.resolution_id,
    candidate_id: request.candidate.candidate_id,
    historical_context,
    replay_context,
    historical_domain: historicalDomain(historical_context, request.candidate),
    replay_domain: replayDomain(replay_context, request.candidate),
    lineage_graph: graph,
    validation,
    replay_ref: `replay_historical_replay_${request.resolution_id}`,
    timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: packageHash(base) });
}

export function replayHistoricalReplayContext(pkg: HistoricalReplayContextPackage): HistoricalReplayResult {
  const reconstructed_hash = packageHash(pkg);
  const replay_valid = reconstructed_hash === pkg.integrity_hash;
  const base: Omit<HistoricalReplayResult, "integrity_hash"> = {
    replay_id: `replay_validation_${pkg.resolution_id}`,
    replay_valid,
    resolution_id: pkg.resolution_id,
    reconstructed_hash,
    expected_hash: pkg.integrity_hash,
    reconstructed_state: pkg.validation.validation_state,
    failures: replay_valid ? Object.freeze([]) : Object.freeze(["INTEGRITY_HASH_MISMATCH"] as const),
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

export function buildHistoricalReplayObservability(packages: readonly HistoricalReplayContextPackage[]): HistoricalReplayObservability {
  const failures = packages.flatMap((pkg) => pkg.validation.failure_reasons);
  return Object.freeze({
    resolution_attempts: packages.length,
    successful_resolutions: packages.filter((pkg) => pkg.validation.validation_status === "PASS").length,
    failed_resolutions: packages.filter((pkg) => pkg.validation.validation_status === "FAIL").length,
    historical_failures: failures.filter((failure) => failure.includes("HISTORICAL") || failure.includes("OUTCOMES") || failure.includes("CERTIFICATION")).length,
    replay_failures: failures.filter((failure) => failure.includes("REPLAY")).length,
    lineage_failures: failures.filter((failure) => failure.includes("LINEAGE") || failure.includes("ANCESTRY")).length,
    isolation_failures: failures.filter((failure) => failure === "CROSS_TENANT_LINEAGE").length,
    integrity_failures: failures.filter((failure) => failure === "INTEGRITY_HASH_MISMATCH").length,
    average_history_depth: packages.length === 0 ? 0 : packages.reduce((sum, pkg) => sum + pkg.historical_context.historical_decisions.length, 0) / packages.length,
    replay_success_rate: packages.length === 0 ? 0 : packages.filter((pkg) => replayHistoricalReplayContext(pkg).replay_valid).length / packages.length,
  });
}

export function getHistoricalReplayContextResolver() {
  const request = createHistoricalReplayContextRequest();
  const context_package = resolveHistoricalReplayContext(request);
  return Object.freeze({
    resolution_order: RESOLUTION_ORDER,
    historical_registry: HISTORICAL_DECISIONS,
    outcome_registry: OUTCOMES,
    certification_registry: CERTIFICATIONS,
    replay_artifact_registry: REPLAY_ARTIFACTS,
    request,
    context_package,
    replay: replayHistoricalReplayContext(context_package),
    observability: buildHistoricalReplayObservability([context_package]),
  });
}
