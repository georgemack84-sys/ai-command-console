import {
  computeDecisionContextIntegrityHash,
  createDecisionContext,
  validateDecisionContext,
} from "@/services/decision-context-contract";
import { generateDecisionIntegrityHash } from "@/services/decision-integrity";
import { normalizeDecisionCandidateInput } from "@/services/decision-input-normalization";
import {
  assessContextCompleteness,
  createContextCompletenessGapRequest,
  replayContextCompleteness,
} from "@/services/decision-context-completeness-gap";
import type { DecisionCandidate } from "@/types/decision-input-normalization";
import type { DecisionContext, DecisionContextDomain, DecisionContextDomainName } from "@/types/decision-context-contract";
import type {
  ContextAssuranceFailureReason,
  ContextAssuranceState,
  ContextExplanation,
  ContextIntegrity,
  ContextIntegrityValidationObservability,
  ContextIntegrityValidationReplayResult,
  ContextIntegrityValidationReport,
  ContextIntegrityValidationRequest,
  ContextValidation,
  ContextValidationEvidence,
} from "@/types/decision-context-integrity-validation-explainability";

const NOW = "2026-07-03T09:37:00.000Z";
const FRAMEWORK_VERSION = "context-integrity-validation-explainability/v1" as const;
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

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function recordHash<T extends Record<string, unknown>>(value: T): string {
  const copy = { ...value };
  delete copy.integrity_hash;
  return hash(copy);
}

function reportHash(report: Omit<ContextIntegrityValidationReport, "integrity_hash"> | ContextIntegrityValidationReport): string {
  const copy = { ...(report as ContextIntegrityValidationReport) } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(copy);
}

function defaultCandidate(): DecisionCandidate {
  const result = normalizeDecisionCandidateInput();
  if (!result.candidate) throw new Error("default normalized candidate unavailable");
  return result.candidate;
}

export function createContextIntegrityValidationRequest(overrides: Partial<ContextIntegrityValidationRequest> = {}): ContextIntegrityValidationRequest {
  const candidate = overrides.candidate ?? defaultCandidate();
  const completeness_package = overrides.completeness_package ?? assessContextCompleteness(createContextCompletenessGapRequest({ candidate, decision_context: overrides.decision_context }));
  return Object.freeze({
    validation_id: overrides.validation_id ?? `context_validation_${candidate.candidate_id}`,
    candidate,
    decision_context: overrides.decision_context ?? completeness_package.decision_context,
    completeness_package,
    framework_version: overrides.framework_version ?? FRAMEWORK_VERSION,
  });
}

function domainMap(context: DecisionContext): Readonly<Record<DecisionContextDomainName, DecisionContextDomain>> {
  return Object.freeze(Object.fromEntries(DOMAIN_ORDER.map((name) => [name, context[name]])) as Record<DecisionContextDomainName, DecisionContextDomain>);
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

function attributionComplete(context: DecisionContext): boolean {
  return DOMAIN_ORDER.every((name) => {
    const domain = context[name];
    return Boolean(domain.source_subsystem && domain.originating_record && domain.resolver && domain.replay_reference);
  });
}

function explainabilityComplete(context: DecisionContext): boolean {
  return DOMAIN_ORDER.every((name) => {
    const domain = context[name];
    return Boolean(domain.governance_rationale && domain.constitutional_rationale && domain.supporting_evidence);
  });
}

function domainExplanation(domain: DecisionContextDomain): string {
  return `${domain.domain_name} resolved by ${domain.resolver} from ${domain.source_subsystem}:${domain.originating_record}; evidence=${domain.supporting_evidence.join(",") || "none"}; governance=${domain.governance_rationale}; constitutional=${domain.constitutional_rationale}; replay=${domain.replay_reference}.`;
}

function contextExplanation(context: DecisionContext, state: ContextAssuranceState): ContextExplanation {
  const base: Omit<ContextExplanation, "integrity_hash"> = {
    explanation_id: `explanation_${context.decision_candidate_id}`,
    decision_candidate_id: context.decision_candidate_id,
    mission_explanation: domainExplanation(context.mission_context),
    authority_explanation: domainExplanation(context.operator_context),
    evidence_explanation: domainExplanation(context.evidence_context),
    dependency_explanation: domainExplanation(context.dependency_context),
    risk_explanation: domainExplanation(context.risk_context),
    confidence_explanation: domainExplanation(context.confidence_context),
    governance_explanation: domainExplanation(context.governance_context),
    constitutional_explanation: domainExplanation(context.constitutional_context),
    runtime_explanation: domainExplanation(context.runtime_context),
    recovery_explanation: domainExplanation(context.recovery_context),
    forecast_explanation: domainExplanation(context.forecast_context),
    historical_explanation: domainExplanation(context.historical_context),
    replay_explanation: domainExplanation(context.replay_context),
    validation_summary: `Context validation state is ${state} for ${context.decision_candidate_id}.`,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function resolverHashes(context: DecisionContext): Readonly<Record<string, string>> {
  return Object.freeze(Object.fromEntries(DOMAIN_ORDER.map((name) => {
    const domain = context[name];
    return [name, hash({ resolver: domain.resolver, source_subsystem: domain.source_subsystem, originating_record: domain.originating_record })];
  })));
}

function contextIntegrity(context: DecisionContext, validationHash: string): ContextIntegrity {
  const domains = domainMap(context);
  const domain_hashes = Object.freeze(Object.fromEntries(DOMAIN_ORDER.map((name) => [name, domains[name].integrity_hash])) as Record<DecisionContextDomainName, string>);
  const base: Omit<ContextIntegrity, "integrity_hash"> = {
    integrity_id: `integrity_${context.decision_candidate_id}`,
    decision_candidate_id: context.decision_candidate_id,
    context_hash: computeDecisionContextIntegrityHash(context),
    domain_hashes,
    resolver_hashes: resolverHashes(context),
    lineage_hash: hash(DOMAIN_ORDER.map((name) => context[name].originating_record)),
    replay_hash: hash(DOMAIN_ORDER.map((name) => context[name].replay_reference)),
    validation_hash: validationHash,
    integrity_state: computeDecisionContextIntegrityHash(context) === context.integrity_hash ? "VALID" : "INVALID",
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function failuresFor(request: ContextIntegrityValidationRequest): readonly ContextAssuranceFailureReason[] {
  const context = request.decision_context as DecisionContext;
  const contextValidation = validateDecisionContext(context);
  const completeness = request.completeness_package;
  const replay = completeness ? replayContextCompleteness(completeness) : undefined;
  const failures: ContextAssuranceFailureReason[] = [
    ...(contextValidation.validation_state !== "VALID" ? ["SCHEMA_VALIDATION_FAILED" as const] : []),
    ...(computeDecisionContextIntegrityHash(context) !== context.integrity_hash ? ["INTEGRITY_HASH_MISMATCH" as const] : []),
    ...(completeness?.validation.validation_status !== "PASS" ? ["RESOLVER_INCONSISTENCY_DETECTED" as const] : []),
    ...(!attributionComplete(context) ? ["SOURCE_ATTRIBUTION_INCOMPLETE" as const] : []),
    ...(!explainabilityComplete(context) ? ["EXPLAINABILITY_INCOMPLETE" as const] : []),
    ...(replay?.replay_valid === false ? ["REPLAY_VALIDATION_FAILED" as const] : []),
    ...(completeness?.validation.failure_reasons.includes("GOVERNANCE_VALIDATION_INCOMPLETE") ? ["GOVERNANCE_VALIDATION_INCOMPLETE" as const] : []),
    ...(completeness?.validation.failure_reasons.includes("CONSTITUTIONAL_VALIDATION_INCOMPLETE") ? ["CONSTITUTIONAL_VALIDATION_INCOMPLETE" as const] : []),
    ...(tenantLeak(request, request.candidate.tenant_id) ? ["CROSS_TENANT_REFERENCE_DETECTED" as const] : []),
    ...(context.operator_context.constitutional_rationale.includes("Advisory-only") ? [] : ["ADVISORY_ONLY_VIOLATION" as const]),
  ];
  return Object.freeze([...new Set(failures)]);
}

function assuranceState(failures: readonly ContextAssuranceFailureReason[]): ContextAssuranceState {
  if (failures.includes("CROSS_TENANT_REFERENCE_DETECTED") || failures.includes("INTEGRITY_HASH_MISMATCH")) return "FAIL_CLOSED";
  if (failures.includes("SCHEMA_VALIDATION_FAILED")) return "REJECTED";
  if (failures.length) return "INVALID";
  return "CERTIFIED";
}

function contextValidationRecord(context: DecisionContext, failures: readonly ContextAssuranceFailureReason[], state: ContextAssuranceState): ContextValidation {
  const has = (failure: ContextAssuranceFailureReason) => failures.includes(failure);
  const base: Omit<ContextValidation, "integrity_hash"> = {
    validation_id: `validation_${context.decision_candidate_id}`,
    decision_candidate_id: context.decision_candidate_id,
    schema_validation: has("SCHEMA_VALIDATION_FAILED") ? "FAIL" : "PASS",
    integrity_validation: has("INTEGRITY_HASH_MISMATCH") ? "FAIL" : "PASS",
    resolver_validation: has("RESOLVER_INCONSISTENCY_DETECTED") ? "FAIL" : "PASS",
    attribution_validation: has("SOURCE_ATTRIBUTION_INCOMPLETE") ? "FAIL" : "PASS",
    explainability_validation: has("EXPLAINABILITY_INCOMPLETE") ? "FAIL" : "PASS",
    replay_validation: has("REPLAY_VALIDATION_FAILED") ? "FAIL" : "PASS",
    validation_state: state,
    validation_timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function validationEvidence(context: DecisionContext, validation: ContextValidation, explanation: ContextExplanation, integrity: ContextIntegrity, certificationReady: boolean): ContextValidationEvidence {
  const base: Omit<ContextValidationEvidence, "integrity_hash"> = {
    evidence_id: `validation_evidence_${context.decision_candidate_id}`,
    validation_id: validation.validation_id,
    schema_evidence: Object.freeze([context.schema_version, validation.schema_validation]),
    integrity_evidence: Object.freeze([integrity.context_hash, integrity.integrity_state]),
    resolver_evidence: Object.freeze(DOMAIN_ORDER.map((name) => context[name].resolver)),
    attribution_evidence: Object.freeze(DOMAIN_ORDER.map((name) => `${context[name].source_subsystem}:${context[name].originating_record}`)),
    explainability_evidence: Object.freeze([explanation.explanation_id, explanation.validation_summary]),
    replay_evidence: Object.freeze(DOMAIN_ORDER.map((name) => context[name].replay_reference)),
    certification_ready: certificationReady,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

export function validateContextIntegrityExplainability(request: ContextIntegrityValidationRequest = createContextIntegrityValidationRequest()): ContextIntegrityValidationReport {
  const context = request.decision_context ?? createDecisionContext({ candidate: request.candidate });
  const failures = failuresFor({ ...request, decision_context: context });
  const state = assuranceState(failures);
  const validation = contextValidationRecord(context, failures, state);
  const integrity = contextIntegrity(context, hash(validation));
  const explanation = contextExplanation(context, state);
  const evidence = validationEvidence(context, validation, explanation, integrity, state === "CERTIFIED");
  const base: Omit<ContextIntegrityValidationReport, "integrity_hash"> = {
    validation_id: request.validation_id,
    candidate_id: request.candidate.candidate_id,
    context_validation: validation,
    context_integrity: integrity,
    context_explanation: explanation,
    validation_evidence: evidence,
    failure_reason: failures[0],
    failure_reasons: failures,
    checks: Object.freeze({
      schema_compliant: !failures.includes("SCHEMA_VALIDATION_FAILED"),
      integrity_reproducible: !failures.includes("INTEGRITY_HASH_MISMATCH"),
      resolvers_consistent: !failures.includes("RESOLVER_INCONSISTENCY_DETECTED"),
      source_attribution_complete: !failures.includes("SOURCE_ATTRIBUTION_INCOMPLETE"),
      explainability_complete: !failures.includes("EXPLAINABILITY_INCOMPLETE"),
      replay_valid: !failures.includes("REPLAY_VALIDATION_FAILED"),
      governance_complete: !failures.includes("GOVERNANCE_VALIDATION_INCOMPLETE"),
      constitutional_complete: !failures.includes("CONSTITUTIONAL_VALIDATION_INCOMPLETE"),
      tenant_isolated: !failures.includes("CROSS_TENANT_REFERENCE_DETECTED"),
      advisory_only: !failures.includes("ADVISORY_ONLY_VIOLATION"),
    }),
    replay_ref: `replay_context_integrity_validation_${request.validation_id}`,
    timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: reportHash(base) });
}

export function replayContextIntegrityValidation(report: ContextIntegrityValidationReport): ContextIntegrityValidationReplayResult {
  const reconstructed_hash = reportHash(report);
  const replay_valid = reconstructed_hash === report.integrity_hash;
  const base: Omit<ContextIntegrityValidationReplayResult, "integrity_hash"> = {
    replay_id: `replay_validation_${report.validation_id}`,
    replay_valid,
    validation_id: report.validation_id,
    reconstructed_hash,
    expected_hash: report.integrity_hash,
    reconstructed_state: report.context_validation.validation_state,
    failures: replay_valid ? Object.freeze([]) : Object.freeze(["INTEGRITY_HASH_MISMATCH"] as const),
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

export function buildContextIntegrityValidationObservability(reports: readonly ContextIntegrityValidationReport[]): ContextIntegrityValidationObservability {
  const failures = reports.flatMap((report) => report.failure_reasons);
  return Object.freeze({
    validation_attempts: reports.length,
    certified_contexts: reports.filter((report) => report.context_validation.validation_state === "CERTIFIED").length,
    failed_contexts: reports.filter((report) => report.context_validation.validation_state !== "CERTIFIED").length,
    schema_failures: failures.filter((failure) => failure === "SCHEMA_VALIDATION_FAILED").length,
    integrity_failures: failures.filter((failure) => failure === "INTEGRITY_HASH_MISMATCH").length,
    resolver_failures: failures.filter((failure) => failure === "RESOLVER_INCONSISTENCY_DETECTED").length,
    attribution_failures: failures.filter((failure) => failure === "SOURCE_ATTRIBUTION_INCOMPLETE").length,
    explainability_failures: failures.filter((failure) => failure === "EXPLAINABILITY_INCOMPLETE").length,
    replay_failures: failures.filter((failure) => failure === "REPLAY_VALIDATION_FAILED").length,
    isolation_failures: failures.filter((failure) => failure === "CROSS_TENANT_REFERENCE_DETECTED").length,
    replay_success_rate: reports.length === 0 ? 0 : reports.filter((report) => replayContextIntegrityValidation(report).replay_valid).length / reports.length,
  });
}

export function getContextIntegrityValidationExplainabilityFramework() {
  const request = createContextIntegrityValidationRequest();
  const report = validateContextIntegrityExplainability(request);
  return Object.freeze({
    framework_version: FRAMEWORK_VERSION,
    domain_order: DOMAIN_ORDER,
    request,
    report,
    replay: replayContextIntegrityValidation(report),
    observability: buildContextIntegrityValidationObservability([report]),
  });
}
