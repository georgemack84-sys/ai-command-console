import { createDecisionContext, validateDecisionContext } from "@/services/decision-context-contract";
import { generateDecisionIntegrityHash } from "@/services/decision-integrity";
import { normalizeDecisionCandidateInput } from "@/services/decision-input-normalization";
import { createMissionTenantContextRequest, resolveMissionTenantContext } from "@/services/decision-mission-tenant-context";
import { createAuthorityOperatorContextRequest, resolveAuthorityOperatorContext } from "@/services/decision-authority-operator-context";
import { createEvidenceDependencyContextRequest, resolveEvidenceDependencyContext } from "@/services/decision-evidence-dependency-context";
import { createRiskConfidenceContextRequest, resolveRiskConfidenceContext } from "@/services/decision-risk-confidence-context";
import { createGovernanceConstitutionalContextRequest, resolveGovernanceConstitutionalContext } from "@/services/decision-governance-constitutional-context";
import { createRuntimeRecoveryForecastContextRequest, resolveRuntimeRecoveryForecastContext } from "@/services/decision-runtime-recovery-forecast-context";
import { createHistoricalReplayContextRequest, resolveHistoricalReplayContext } from "@/services/decision-historical-replay-context";
import type { DecisionCandidate } from "@/types/decision-input-normalization";
import type { DecisionContextDomainName } from "@/types/decision-context-contract";
import type {
  CompletenessExplainability,
  ContextCompleteness,
  ContextCompletenessFailureReason,
  ContextCompletenessGapPackage,
  ContextCompletenessGapRequest,
  ContextCompletenessObservability,
  ContextCompletenessReplayResult,
  ContextCompletenessValidationResult,
  ContextCompletenessValidationState,
  ContextDomainScore,
  ContextReadinessStatus,
  GapResolutionRecommendation,
  GapSeverity,
  MissingContextRegistry,
} from "@/types/decision-context-completeness-gap";

const NOW = "2026-07-02T09:36:00.000Z";
const ENGINE_VERSION = "context-completeness-gap-engine/v1" as const;
const DOMAIN_ORDER: readonly DecisionContextDomainName[] = Object.freeze([
  "mission_context",
  "tenant_context",
  "operator_context",
  "evidence_context",
  "dependency_context",
  "risk_context",
  "confidence_context",
  "governance_context",
  "constitutional_context",
  "runtime_context",
  "recovery_context",
  "forecast_context",
  "historical_context",
  "replay_context",
] as const);
const WEIGHTS: Readonly<Record<DecisionContextDomainName, number>> = Object.freeze({
  mission_context: 0.1,
  tenant_context: 0.05,
  operator_context: 0.1,
  evidence_context: 0.15,
  dependency_context: 0.1,
  risk_context: 0.1,
  confidence_context: 0.05,
  governance_context: 0.1,
  constitutional_context: 0.1,
  runtime_context: 0.05,
  recovery_context: 0.025,
  forecast_context: 0.025,
  historical_context: 0.025,
  replay_context: 0.025,
});

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function recordHash<T extends Record<string, unknown>>(value: T): string {
  const copy = { ...value };
  delete copy.integrity_hash;
  return hash(copy);
}

function packageHash(pkg: Omit<ContextCompletenessGapPackage, "integrity_hash"> | ContextCompletenessGapPackage): string {
  const copy = { ...(pkg as ContextCompletenessGapPackage) } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(copy);
}

function defaultCandidate(): DecisionCandidate {
  const result = normalizeDecisionCandidateInput();
  if (!result.candidate) throw new Error("default normalized candidate unavailable");
  return result.candidate;
}

export function createContextCompletenessGapRequest(overrides: Partial<ContextCompletenessGapRequest> = {}): ContextCompletenessGapRequest {
  const candidate = overrides.candidate ?? defaultCandidate();
  const mission_tenant_package = overrides.mission_tenant_package ?? resolveMissionTenantContext(createMissionTenantContextRequest({ candidate }));
  const authority_operator_package = overrides.authority_operator_package ?? resolveAuthorityOperatorContext(createAuthorityOperatorContextRequest({ candidate, mission_tenant_package }));
  const evidence_dependency_package = overrides.evidence_dependency_package ?? resolveEvidenceDependencyContext(createEvidenceDependencyContextRequest({ candidate, mission_tenant_package, authority_operator_package }));
  const risk_confidence_package = overrides.risk_confidence_package ?? resolveRiskConfidenceContext(createRiskConfidenceContextRequest({ candidate, mission_tenant_package, authority_operator_package, evidence_dependency_package }));
  const governance_constitutional_package = overrides.governance_constitutional_package ?? resolveGovernanceConstitutionalContext(createGovernanceConstitutionalContextRequest({ candidate, mission_tenant_package, authority_operator_package, evidence_dependency_package, risk_confidence_package }));
  const runtime_recovery_forecast_package = overrides.runtime_recovery_forecast_package ?? resolveRuntimeRecoveryForecastContext(createRuntimeRecoveryForecastContextRequest({ candidate, mission_tenant_package, authority_operator_package, evidence_dependency_package, risk_confidence_package, governance_constitutional_package }));
  const historical_replay_package = overrides.historical_replay_package ?? resolveHistoricalReplayContext(createHistoricalReplayContextRequest({ candidate, mission_tenant_package, authority_operator_package, evidence_dependency_package, risk_confidence_package, governance_constitutional_package, runtime_recovery_forecast_package }));
  const decision_context = overrides.decision_context ?? createDecisionContext({
    candidate,
    domain_overrides: {
      mission_context: mission_tenant_package.mission_domain,
      tenant_context: mission_tenant_package.tenant_domain,
      operator_context: authority_operator_package.operator_domain,
      evidence_context: evidence_dependency_package.evidence_domain,
      dependency_context: evidence_dependency_package.dependency_domain,
      risk_context: risk_confidence_package.risk_domain,
      confidence_context: risk_confidence_package.confidence_domain,
      governance_context: governance_constitutional_package.governance_domain,
      constitutional_context: governance_constitutional_package.constitutional_domain,
      runtime_context: runtime_recovery_forecast_package.runtime_domain,
      recovery_context: runtime_recovery_forecast_package.recovery_domain,
      forecast_context: runtime_recovery_forecast_package.forecast_domain,
      historical_context: historical_replay_package.historical_domain,
      replay_context: historical_replay_package.replay_domain,
    },
    validation_state: "VALID",
    lifecycle_state: "VALIDATED",
  });
  return Object.freeze({
    assessment_id: overrides.assessment_id ?? `context_completeness_${candidate.candidate_id}`,
    candidate,
    decision_context,
    mission_tenant_package,
    authority_operator_package,
    evidence_dependency_package,
    risk_confidence_package,
    governance_constitutional_package,
    runtime_recovery_forecast_package,
    historical_replay_package,
    engine_version: overrides.engine_version ?? ENGINE_VERSION,
  });
}

function domainScores(request: ContextCompletenessGapRequest): ContextDomainScore {
  const context = request.decision_context;
  return Object.freeze(Object.fromEntries(DOMAIN_ORDER.map((name) => {
    const domain = context?.[name];
    const score = domain?.status === "COMPLETE" && domain.confidence > 0 ? 1 : 0;
    return [name, score];
  })) as Record<DecisionContextDomainName, number>);
}

function overallScore(scores: ContextDomainScore): number {
  return Number(DOMAIN_ORDER.reduce((sum, name) => sum + scores[name] * WEIGHTS[name], 0).toFixed(6));
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

function missingItems(request: ContextCompletenessGapRequest, scores: ContextDomainScore): readonly string[] {
  return Object.freeze([
    ...DOMAIN_ORDER.filter((name) => scores[name] === 0),
    ...(request.decision_context?.missing_context ?? []),
  ].sort());
}

function conflictItems(request: ContextCompletenessGapRequest): readonly string[] {
  return Object.freeze([
    ...((request.evidence_dependency_package?.evidence_context.conflicting_evidence.length ?? 0) > 0 ? ["conflicting_evidence_documented"] : []),
    ...((request.governance_constitutional_package?.governance_context.policy_conflicts.length ?? 0) > 0 ? ["policy_conflicts_documented"] : []),
  ].sort());
}

function staleItems(request: ContextCompletenessGapRequest): readonly string[] {
  return Object.freeze([
    ...(request.evidence_dependency_package?.evidence_context.evidence_freshness === "EXPIRED" ? ["expired_evidence"] : []),
    ...(request.runtime_recovery_forecast_package?.runtime_context.runtime_health === "Unavailable" ? ["runtime_unavailable"] : []),
  ].sort());
}

function failuresFor(request: ContextCompletenessGapRequest, scores: ContextDomainScore): readonly ContextCompletenessFailureReason[] {
  const contextValidation = request.decision_context ? validateDecisionContext(request.decision_context) : undefined;
  const failures: ContextCompletenessFailureReason[] = [
    ...(missingItems(request, scores).length ? ["MANDATORY_CONTEXT_UNAVAILABLE" as const] : []),
    ...(Number.isFinite(overallScore(scores)) ? [] : ["COMPLETENESS_UNCALCULABLE" as const]),
    ...(request.historical_replay_package?.replay_context.replay_availability !== "AVAILABLE" ? ["REPLAY_ARTIFACTS_UNAVAILABLE" as const] : []),
    ...(request.governance_constitutional_package?.governance_context.validation_state !== "PASSED" ? ["GOVERNANCE_VALIDATION_INCOMPLETE" as const] : []),
    ...(request.governance_constitutional_package?.constitutional_context.validation_state !== "PASSED" ? ["CONSTITUTIONAL_VALIDATION_INCOMPLETE" as const] : []),
    ...(request.authority_operator_package?.validation.validation_status !== "PASS" ? ["AUTHORITY_UNRESOLVED" as const] : []),
    ...(request.evidence_dependency_package?.validation.validation_status !== "PASS" ? ["EVIDENCE_INCOMPLETE" as const] : []),
    ...(conflictItems(request).some((item) => !item.endsWith("documented")) ? ["CONFLICTING_CONTEXT_DETECTED" as const] : []),
    ...(staleItems(request).length ? ["STALE_CONTEXT_DETECTED" as const] : []),
    ...(request.historical_replay_package?.validation.checks.lineage_graph_acyclic === false || request.historical_replay_package?.validation.checks.decision_ancestry_complete === false ? ["LINEAGE_INCOMPLETE" as const] : []),
    ...(tenantLeak(request, request.candidate.tenant_id) ? ["CROSS_TENANT_CONTEXT" as const] : []),
    ...(contextValidation?.checks.integrity_valid === false ? ["INTEGRITY_VERIFICATION_FAILED" as const] : []),
  ];
  return Object.freeze([...new Set(failures)]);
}

function validationState(failures: readonly ContextCompletenessFailureReason[]): ContextCompletenessValidationState {
  if (failures.includes("CROSS_TENANT_CONTEXT")) return "FAILED_ISOLATION";
  if (failures.includes("INTEGRITY_VERIFICATION_FAILED")) return "FAILED_INTEGRITY";
  if (failures.some((failure) => failure.includes("REPLAY"))) return "FAILED_REPLAY";
  if (failures.some((failure) => failure.includes("AUTHORITY"))) return "FAILED_AUTHORITY";
  if (failures.some((failure) => failure.includes("GOVERNANCE") || failure.includes("CONSTITUTIONAL"))) return "FAILED_GOVERNANCE";
  if (failures.some((failure) => failure.includes("CONFLICTING") || failure.includes("STALE"))) return "FAILED_CONSISTENCY";
  if (failures.length) return "FAILED_MISSING_CONTEXT";
  return "PASSED";
}

function readiness(score: number, failures: readonly ContextCompletenessFailureReason[]): ContextReadinessStatus {
  if (failures.includes("CROSS_TENANT_CONTEXT") || failures.includes("INTEGRITY_VERIFICATION_FAILED")) return "FAIL_CLOSED";
  if (failures.length) return score >= 0.75 ? "REQUIRES_CONTEXT_COMPLETION" : "BLOCK_ORCHESTRATION";
  return score === 1 ? "READY_FOR_ORCHESTRATION" : "REQUIRES_CONTEXT_COMPLETION";
}

function severity(registry: Omit<MissingContextRegistry, "severity" | "integrity_hash">): GapSeverity {
  const count = registry.missing_context_items.length + registry.unresolved_replay.length + registry.unresolved_governance.length + registry.unresolved_authority.length + registry.unresolved_evidence.length;
  if (count === 0 && registry.conflicting_context_items.length === 0 && registry.stale_context_items.length === 0) return "NONE";
  if (count >= 5) return "CRITICAL";
  if (count >= 3) return "HIGH";
  if (count >= 1) return "MODERATE";
  return "LOW";
}

function validationResult(request: ContextCompletenessGapRequest, scores: ContextDomainScore): ContextCompletenessValidationResult {
  const failures = failuresFor(request, scores);
  return Object.freeze({
    validation_status: failures.length ? "FAIL" : "PASS",
    validation_state: validationState(failures),
    failure_reason: failures[0],
    failure_reasons: failures,
    checks: Object.freeze({
      all_mandatory_context_resolved: !failures.includes("MANDATORY_CONTEXT_UNAVAILABLE"),
      context_internally_consistent: !failures.includes("CONFLICTING_CONTEXT_DETECTED"),
      context_sufficiently_fresh: !failures.includes("STALE_CONTEXT_DETECTED"),
      required_evidence_available: !failures.includes("EVIDENCE_INCOMPLETE"),
      required_authority_available: !failures.includes("AUTHORITY_UNRESOLVED"),
      governance_complete: !failures.includes("GOVERNANCE_VALIDATION_INCOMPLETE"),
      constitutional_complete: !failures.includes("CONSTITUTIONAL_VALIDATION_INCOMPLETE"),
      replay_available: !failures.includes("REPLAY_ARTIFACTS_UNAVAILABLE"),
      lineage_complete: !failures.includes("LINEAGE_INCOMPLETE"),
      integrity_verified: !failures.includes("INTEGRITY_VERIFICATION_FAILED"),
      tenant_isolated: !failures.includes("CROSS_TENANT_CONTEXT"),
    }),
  });
}

function completeness(request: ContextCompletenessGapRequest, scores: ContextDomainScore, validation: ContextCompletenessValidationResult): ContextCompleteness {
  const score = overallScore(scores);
  const state = validation.validation_state;
  const base: Omit<ContextCompleteness, "integrity_hash"> = {
    completeness_id: `completeness_${request.candidate.candidate_id}`,
    decision_candidate_id: request.candidate.candidate_id,
    mission_score: scores.mission_context,
    tenant_score: scores.tenant_context,
    authority_score: scores.operator_context,
    operator_score: scores.operator_context,
    evidence_score: scores.evidence_context,
    dependency_score: scores.dependency_context,
    risk_score: scores.risk_context,
    confidence_score: scores.confidence_context,
    governance_score: scores.governance_context,
    constitutional_score: scores.constitutional_context,
    runtime_score: scores.runtime_context,
    recovery_score: scores.recovery_context,
    forecast_score: scores.forecast_context,
    historical_score: scores.historical_context,
    replay_score: scores.replay_context,
    overall_completeness_score: score,
    readiness_status: readiness(score, validation.failure_reasons),
    validation_state: state,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function missingRegistry(request: ContextCompletenessGapRequest, scores: ContextDomainScore, validation: ContextCompletenessValidationResult): MissingContextRegistry {
  const base: Omit<MissingContextRegistry, "severity" | "integrity_hash"> = {
    registry_id: `missing_context_${request.candidate.candidate_id}`,
    decision_candidate_id: request.candidate.candidate_id,
    missing_context_items: missingItems(request, scores),
    conflicting_context_items: conflictItems(request),
    stale_context_items: staleItems(request),
    unresolved_dependencies: request.evidence_dependency_package?.dependency_context.dependency_status === "WAITING" ? request.evidence_dependency_package.dependency_context.prerequisite_decisions : Object.freeze([]),
    unresolved_authority: validation.failure_reasons.includes("AUTHORITY_UNRESOLVED") ? request.authority_operator_package?.validation.failure_reasons ?? Object.freeze([]) : Object.freeze([]),
    unresolved_governance: validation.failure_reasons.includes("GOVERNANCE_VALIDATION_INCOMPLETE") ? request.governance_constitutional_package?.validation.failure_reasons ?? Object.freeze([]) : Object.freeze([]),
    unresolved_replay: validation.failure_reasons.includes("REPLAY_ARTIFACTS_UNAVAILABLE") ? request.historical_replay_package?.replay_context.replay_references ?? Object.freeze([]) : Object.freeze([]),
    unresolved_evidence: validation.failure_reasons.includes("EVIDENCE_INCOMPLETE") ? request.evidence_dependency_package?.validation.failure_reasons ?? Object.freeze([]) : Object.freeze([]),
    validation_state: validation.validation_state,
  };
  return Object.freeze({ ...base, severity: severity(base), integrity_hash: recordHash(base) });
}

function recommendationFor(candidate: DecisionCandidate, gap: string): GapResolutionRecommendation {
  const resolution = gap.includes("replay") ? "Regenerate and certify replay artifacts."
    : gap.includes("governance") || gap.includes("constitutional") ? "Escalate for governance and constitutional review."
      : gap.includes("authority") ? "Obtain missing operator or approval authority."
        : gap.includes("evidence") ? "Request additional certified evidence."
          : "Complete the missing context domain.";
  const base: Omit<GapResolutionRecommendation, "integrity_hash"> = {
    recommendation_id: `recommendation_${candidate.candidate_id}_${gap}`,
    decision_candidate_id: candidate.candidate_id,
    identified_gap: gap,
    recommended_resolution: resolution,
    governing_rule: "context_completeness_fail_closed_v1",
    authority_required: gap.includes("authority") || gap.includes("governance"),
    replay_requirement: gap.includes("replay") ? "replay_artifact_certification_required" : "preserve_replay_lineage",
    evidence_requirement: gap.includes("evidence") ? "certified_evidence_required" : "preserve_existing_evidence",
    operator_action: "review_gap_resolution_recommendation",
    advisory_only: true,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function recommendations(request: ContextCompletenessGapRequest, registry: MissingContextRegistry): readonly GapResolutionRecommendation[] {
  const gaps = Object.freeze([...new Set([
    ...registry.missing_context_items,
    ...registry.unresolved_authority,
    ...registry.unresolved_governance,
    ...registry.unresolved_replay,
    ...registry.unresolved_evidence,
    ...registry.stale_context_items,
  ])].sort());
  return Object.freeze(gaps.map((gap) => recommendationFor(request.candidate, gap)));
}

function explainability(request: ContextCompletenessGapRequest, scores: ContextDomainScore, registry: MissingContextRegistry, recommendationsValue: readonly GapResolutionRecommendation[], validation: ContextCompletenessValidationResult): CompletenessExplainability {
  const base: Omit<CompletenessExplainability, "integrity_hash"> = {
    score_calculation: Object.freeze(DOMAIN_ORDER.map((name) => `${name}:${scores[name]}*${WEIGHTS[name]}`)),
    missing_context: registry.missing_context_items,
    conflicting_context: registry.conflicting_context_items,
    stale_context: registry.stale_context_items,
    validation_failures: validation.failure_reasons,
    readiness_determination: validation.validation_status === "PASS" ? "All weighted mandatory context domains are complete." : "One or more fail-closed context checks require completion.",
    governing_policies: request.governance_constitutional_package?.governance_context.active_policies.map((policy) => policy.policy_id) ?? Object.freeze([]),
    constitutional_influence: request.governance_constitutional_package?.constitutional_context.constitutional_principles.map((principle) => principle.principle_id) ?? Object.freeze([]),
    replay_implications: registry.unresolved_replay.length ? registry.unresolved_replay : Object.freeze(["replay_available"]),
    recommended_remediation: Object.freeze(recommendationsValue.map((item) => item.recommended_resolution)),
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

export function assessContextCompleteness(request: ContextCompletenessGapRequest = createContextCompletenessGapRequest()): ContextCompletenessGapPackage {
  const scores = domainScores(request);
  const validation = validationResult(request, scores);
  const completenessValue = completeness(request, scores, validation);
  const registry = missingRegistry(request, scores, validation);
  const recommendationsValue = recommendations(request, registry);
  const explainabilityValue = explainability(request, scores, registry, recommendationsValue, validation);
  const base: Omit<ContextCompletenessGapPackage, "integrity_hash"> = {
    assessment_id: request.assessment_id,
    candidate_id: request.candidate.candidate_id,
    decision_context: request.decision_context as NonNullable<ContextCompletenessGapRequest["decision_context"]>,
    domain_scores: scores,
    completeness: completenessValue,
    missing_context_registry: registry,
    recommendations: recommendationsValue,
    validation,
    explainability: explainabilityValue,
    replay_ref: `replay_context_completeness_${request.assessment_id}`,
    timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: packageHash(base) });
}

export function replayContextCompleteness(pkg: ContextCompletenessGapPackage): ContextCompletenessReplayResult {
  const reconstructed_hash = packageHash(pkg);
  const replay_valid = reconstructed_hash === pkg.integrity_hash;
  const base: Omit<ContextCompletenessReplayResult, "integrity_hash"> = {
    replay_id: `replay_validation_${pkg.assessment_id}`,
    replay_valid,
    assessment_id: pkg.assessment_id,
    reconstructed_hash,
    expected_hash: pkg.integrity_hash,
    reconstructed_state: pkg.validation.validation_state,
    reconstructed_score: pkg.completeness.overall_completeness_score,
    failures: replay_valid ? Object.freeze([]) : Object.freeze(["INTEGRITY_VERIFICATION_FAILED"] as const),
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

export function buildContextCompletenessObservability(packages: readonly ContextCompletenessGapPackage[]): ContextCompletenessObservability {
  const failures = packages.flatMap((pkg) => pkg.validation.failure_reasons);
  return Object.freeze({
    assessment_attempts: packages.length,
    successful_assessments: packages.filter((pkg) => pkg.validation.validation_status === "PASS").length,
    failed_assessments: packages.filter((pkg) => pkg.validation.validation_status === "FAIL").length,
    average_completeness_score: packages.length === 0 ? 0 : packages.reduce((sum, pkg) => sum + pkg.completeness.overall_completeness_score, 0) / packages.length,
    missing_context_failures: failures.filter((failure) => failure === "MANDATORY_CONTEXT_UNAVAILABLE").length,
    authority_failures: failures.filter((failure) => failure === "AUTHORITY_UNRESOLVED").length,
    governance_failures: failures.filter((failure) => failure.includes("GOVERNANCE") || failure.includes("CONSTITUTIONAL")).length,
    replay_failures: failures.filter((failure) => failure.includes("REPLAY")).length,
    integrity_failures: failures.filter((failure) => failure === "INTEGRITY_VERIFICATION_FAILED").length,
    isolation_failures: failures.filter((failure) => failure === "CROSS_TENANT_CONTEXT").length,
    replay_success_rate: packages.length === 0 ? 0 : packages.filter((pkg) => replayContextCompleteness(pkg).replay_valid).length / packages.length,
  });
}

export function getContextCompletenessGapEngine() {
  const request = createContextCompletenessGapRequest();
  const assessment = assessContextCompleteness(request);
  return Object.freeze({
    engine_version: ENGINE_VERSION,
    domain_order: DOMAIN_ORDER,
    weights: WEIGHTS,
    request,
    assessment,
    replay: replayContextCompleteness(assessment),
    observability: buildContextCompletenessObservability([assessment]),
  });
}
