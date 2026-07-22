import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { normalizeDecisionCandidateInput } from "@/services/decision-input-normalization";
import type { DecisionCandidate } from "@/types/decision-input-normalization";
import type {
  ContextIdentity,
  DecisionContext,
  DecisionContextBuildInput,
  DecisionContextDomain,
  DecisionContextDomainName,
  DecisionContextFailureReason,
  DecisionContextIntegrity,
  DecisionContextLifecycleState,
  DecisionContextLifecycleTransition,
  DecisionContextObservability,
  DecisionContextReplayResult,
  DecisionContextValidationResult,
  DecisionContextValidationState,
} from "@/types/decision-context-contract";

const NOW = "2026-07-02T09:28:00.000Z";
const SCHEMA_VERSION = "9.3.1" as const;
const CREATED_BY = "mission-control-context-contract";
const CONSTRUCTION_ORDER: readonly DecisionContextDomainName[] = Object.freeze([
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
]);
const LIFECYCLE_ORDER: readonly DecisionContextLifecycleState[] = Object.freeze(["DRAFT", "UNDER_CONSTRUCTION", "VALIDATED", "CERTIFIED", "ACTIVE", "SUPERSEDED", "ARCHIVED"]);

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function recordHash<T extends Record<string, unknown>>(value: T): string {
  const copy = { ...value };
  delete copy.integrity_hash;
  return hash(copy);
}

function contextHash(context: Omit<DecisionContext, "integrity_hash"> | DecisionContext): string {
  const copy = { ...(context as DecisionContext) } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(copy);
}

function defaultCandidate(): DecisionCandidate {
  const result = normalizeDecisionCandidateInput();
  if (!result.candidate) throw new Error("default normalized candidate unavailable");
  return result.candidate;
}

function domainDefaults(domain_name: DecisionContextDomainName, candidate: DecisionCandidate): Omit<DecisionContextDomain, "integrity_hash"> {
  const evidence = domain_name === "evidence_context" ? candidate.evidence_refs : domain_name === "governance_context" || domain_name === "constitutional_context" ? candidate.governance_refs : candidate.evidence_refs.slice(0, 1);
  const recordByDomain: Record<DecisionContextDomainName, string> = {
    mission_context: candidate.mission_id,
    tenant_context: candidate.tenant_id,
    operator_context: candidate.source_record_ref,
    evidence_context: candidate.evidence_refs[0] ?? "missing_evidence",
    dependency_context: `dependency_${candidate.candidate_id}`,
    risk_context: candidate.risk_refs[0] ?? `risk_${candidate.candidate_id}`,
    confidence_context: candidate.confidence_refs[0] ?? `confidence_${candidate.candidate_id}`,
    governance_context: candidate.governance_refs[0] ?? "missing_governance",
    constitutional_context: candidate.governance_refs.find((ref) => ref.includes("constitutional")) ?? "constitution_advisory_only_v1",
    runtime_context: `runtime_${candidate.mission_id}`,
    recovery_context: `recovery_${candidate.mission_id}`,
    forecast_context: `forecast_${candidate.mission_id}`,
    historical_context: candidate.source_record_ref,
    replay_context: candidate.replay_refs[0] ?? "missing_replay",
  };
  return {
    domain_name,
    required: true,
    status: "COMPLETE",
    source_subsystem: domain_name === "governance_context" || domain_name === "constitutional_context" ? "mission-control-governance-engine" : candidate.source_system,
    originating_record: recordByDomain[domain_name],
    resolver: `resolver_${domain_name}`,
    supporting_evidence: Object.freeze(evidence),
    confidence: domain_name === "confidence_context" ? 0.91 : 1,
    governance_rationale: `Governance context retained for ${candidate.candidate_id}.`,
    constitutional_rationale: candidate.advisory_only ? "Advisory-only operation preserved." : "Advisory-only operation unavailable.",
    replay_reference: domain_name === "replay_context" ? candidate.replay_refs[0] ?? "missing_replay" : `replay_${domain_name}_${candidate.candidate_id}`,
  };
}

function domain(domain_name: DecisionContextDomainName, candidate: DecisionCandidate, overrides: Partial<DecisionContextDomain> = {}): DecisionContextDomain {
  const base: Omit<DecisionContextDomain, "integrity_hash"> = {
    ...domainDefaults(domain_name, candidate),
    ...overrides,
    domain_name,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function domainMap(context: Omit<DecisionContext, "identity" | "integrity" | "integrity_hash">): Readonly<Record<DecisionContextDomainName, DecisionContextDomain>> {
  return Object.freeze(Object.fromEntries(CONSTRUCTION_ORDER.map((name) => [name, context[name]])) as Record<DecisionContextDomainName, DecisionContextDomain>);
}

function computeCompleteness(missing_context: readonly DecisionContextDomainName[]): number {
  return Number(((CONSTRUCTION_ORDER.length - missing_context.length) / CONSTRUCTION_ORDER.length).toFixed(6));
}

function identityFor(input: {
  context_id: string;
  decision_candidate_id: string;
  tenant_id: string;
  mission_id: string;
  context_version: number;
}): ContextIdentity {
  const base: Omit<ContextIdentity, "integrity_hash"> = {
    context_id: input.context_id,
    decision_candidate_id: input.decision_candidate_id,
    tenant_id: input.tenant_id,
    mission_id: input.mission_id,
    schema_version: SCHEMA_VERSION,
    context_version: input.context_version,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function integrityFor(context: Omit<DecisionContext, "integrity" | "integrity_hash">): DecisionContextIntegrity {
  const domains = domainMap(context);
  const domain_hashes = Object.freeze(Object.fromEntries(CONSTRUCTION_ORDER.map((name) => [name, domains[name].integrity_hash])) as Record<DecisionContextDomainName, string>);
  const base: Omit<DecisionContextIntegrity, "integrity_hash"> = {
    schema_hash: hash({ schema_version: context.schema_version, construction_order: CONSTRUCTION_ORDER }),
    domain_hashes,
    replay_hash: hash(context.replay_context),
    validation_hash: hash({
      validation_state: context.validation_state,
      missing_context: context.missing_context,
      completeness: context.context_completeness_score,
    }),
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

export function createDecisionContext(input: DecisionContextBuildInput = {}): DecisionContext {
  const candidate = input.candidate ?? defaultCandidate();
  const context_version = input.context_version ?? 1;
  const context_id = `context_${candidate.tenant_id}_${candidate.mission_id}_${candidate.candidate_id}_v${context_version}`;
  const missing_context = Object.freeze(input.missing_context ?? []);
  const baseWithoutIdentity: Omit<DecisionContext, "identity" | "integrity" | "integrity_hash"> = {
    context_id,
    context_version,
    schema_version: input.schema_version ?? SCHEMA_VERSION,
    decision_candidate_id: candidate.candidate_id,
    mission_context: domain("mission_context", candidate, input.domain_overrides?.mission_context),
    tenant_context: domain("tenant_context", candidate, input.domain_overrides?.tenant_context),
    operator_context: domain("operator_context", candidate, input.domain_overrides?.operator_context),
    evidence_context: domain("evidence_context", candidate, input.domain_overrides?.evidence_context),
    dependency_context: domain("dependency_context", candidate, input.domain_overrides?.dependency_context),
    risk_context: domain("risk_context", candidate, input.domain_overrides?.risk_context),
    confidence_context: domain("confidence_context", candidate, input.domain_overrides?.confidence_context),
    governance_context: domain("governance_context", candidate, input.domain_overrides?.governance_context),
    constitutional_context: domain("constitutional_context", candidate, input.domain_overrides?.constitutional_context),
    runtime_context: domain("runtime_context", candidate, input.domain_overrides?.runtime_context),
    recovery_context: domain("recovery_context", candidate, input.domain_overrides?.recovery_context),
    forecast_context: domain("forecast_context", candidate, input.domain_overrides?.forecast_context),
    historical_context: domain("historical_context", candidate, input.domain_overrides?.historical_context),
    replay_context: domain("replay_context", candidate, input.domain_overrides?.replay_context),
    missing_context,
    context_completeness_score: computeCompleteness(missing_context),
    lifecycle_state: input.lifecycle_state ?? "DRAFT",
    validation_state: input.validation_state ?? "UNVALIDATED",
    created_timestamp: NOW,
    created_by: input.created_by ?? CREATED_BY,
  };
  const withIdentity: Omit<DecisionContext, "integrity" | "integrity_hash"> = {
    ...baseWithoutIdentity,
    identity: identityFor({
      context_id,
      decision_candidate_id: candidate.candidate_id,
      tenant_id: candidate.tenant_id,
      mission_id: candidate.mission_id,
      context_version,
    }),
  };
  const withoutHash: Omit<DecisionContext, "integrity_hash"> = {
    ...withIdentity,
    integrity: integrityFor(withIdentity),
  };
  return Object.freeze({ ...withoutHash, integrity_hash: contextHash(withoutHash) });
}

export function serializeDecisionContext(context: Omit<DecisionContext, "integrity_hash"> | DecisionContext): string {
  const copy = { ...(context as DecisionContext) } as Record<string, unknown>;
  delete copy.integrity_hash;
  return serializeDecisionCanonically(copy);
}

export function computeDecisionContextIntegrityHash(context: Omit<DecisionContext, "integrity_hash"> | DecisionContext): string {
  return hash(JSON.parse(serializeDecisionContext(context)) as unknown);
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

function domainExplainable(domainValue: DecisionContextDomain): boolean {
  return Boolean(domainValue.source_subsystem && domainValue.originating_record && domainValue.resolver && domainValue.governance_rationale && domainValue.constitutional_rationale && domainValue.replay_reference);
}

export function validateDecisionContext(context: unknown): DecisionContextValidationResult {
  if (!context || typeof context !== "object" || Array.isArray(context)) {
    return validationResult(["CONTEXT_MISSING"], undefined);
  }
  const typed = context as DecisionContext;
  const failures: DecisionContextFailureReason[] = [];
  if (typed.schema_version !== SCHEMA_VERSION) failures.push("SCHEMA_VERSION_MISMATCH");
  if (!typed.context_id || !typed.decision_candidate_id || !typed.identity || !typed.integrity || !typed.created_timestamp || !typed.created_by) failures.push("REQUIRED_FIELD_MISSING");
  if (typed.identity && (typed.identity.context_id !== typed.context_id || typed.identity.decision_candidate_id !== typed.decision_candidate_id || typed.identity.context_version !== typed.context_version || typed.identity.schema_version !== typed.schema_version)) failures.push("IDENTITY_MISMATCH");
  const domains = CONSTRUCTION_ORDER.map((name) => typed[name]).filter(Boolean);
  if (domains.length !== CONSTRUCTION_ORDER.length || domains.some((item) => item.required && item.status !== "COMPLETE")) failures.push("MANDATORY_DOMAIN_MISSING");
  if (domains.some((item) => !domainExplainable(item))) failures.push("DOMAIN_EXPLAINABILITY_MISSING");
  if (typed.context_completeness_score !== computeCompleteness(typed.missing_context ?? [])) failures.push("COMPLETENESS_INVALID");
  if (!typed.governance_context?.supporting_evidence?.length || typed.governance_context.status !== "COMPLETE") failures.push("GOVERNANCE_UNAVAILABLE");
  if (!typed.constitutional_context?.constitutional_rationale || typed.constitutional_context.status !== "COMPLETE") failures.push("CONSTITUTIONAL_UNAVAILABLE");
  if (!typed.replay_context?.replay_reference || typed.replay_context.status !== "COMPLETE") failures.push("REPLAY_UNAVAILABLE");
  if (typed.identity?.tenant_id && tenantLeak(typed, typed.identity.tenant_id)) failures.push("TENANT_ISOLATION_VIOLATION");
  if (!typed.operator_context?.governance_rationale) failures.push("AUTHORITY_UNDEFINED");
  if (!typed.operator_context?.constitutional_rationale?.includes("Advisory-only")) failures.push("ADVISORY_ONLY_VIOLATION");
  if (typed.integrity_hash && computeDecisionContextIntegrityHash(typed) !== typed.integrity_hash) failures.push("INTEGRITY_MISMATCH");
  try {
    if (serializeDecisionContext(typed) !== serializeDecisionContext(typed)) failures.push("NONDETERMINISTIC_SERIALIZATION");
  } catch {
    failures.push("NONDETERMINISTIC_SERIALIZATION");
  }
  return validationResult(failures, typed);
}

function validationResult(failures: readonly DecisionContextFailureReason[], context: DecisionContext | undefined): DecisionContextValidationResult {
  const has = (reason: DecisionContextFailureReason) => failures.includes(reason);
  return Object.freeze({
    validation_state: failures.length ? "INVALID" : "VALID" as DecisionContextValidationState,
    failures: Object.freeze([...new Set(failures)]),
    checks: Object.freeze({
      schema_valid: !has("SCHEMA_VERSION_MISMATCH") && !has("CONTEXT_MISSING"),
      identity_valid: !has("IDENTITY_MISMATCH") && Boolean(context?.identity),
      required_fields_present: !has("REQUIRED_FIELD_MISSING") && Boolean(context),
      domains_valid: !has("MANDATORY_DOMAIN_MISSING") && !has("DOMAIN_EXPLAINABILITY_MISSING"),
      completeness_valid: !has("COMPLETENESS_INVALID"),
      governance_valid: !has("GOVERNANCE_UNAVAILABLE"),
      constitutional_valid: !has("CONSTITUTIONAL_UNAVAILABLE"),
      replay_valid: !has("REPLAY_UNAVAILABLE"),
      integrity_valid: !has("INTEGRITY_MISMATCH") && !has("NONDETERMINISTIC_SERIALIZATION"),
      tenant_isolated: !has("TENANT_ISOLATION_VIOLATION"),
      advisory_only: !has("ADVISORY_ONLY_VIOLATION") && !has("AUTHORITY_UNDEFINED"),
    }),
  });
}

export function transitionDecisionContextLifecycle(context: DecisionContext, to_state: DecisionContextLifecycleState): DecisionContextLifecycleTransition {
  const fromIndex = LIFECYCLE_ORDER.indexOf(context.lifecycle_state);
  const toIndex = LIFECYCLE_ORDER.indexOf(to_state);
  const transition_valid = toIndex === fromIndex + 1 || (context.lifecycle_state === to_state);
  const base: Omit<DecisionContextLifecycleTransition, "integrity_hash"> = {
    transition_id: `transition_${context.context_id}_${context.lifecycle_state.toLowerCase()}_${to_state.toLowerCase()}`,
    context_id: context.context_id,
    from_state: context.lifecycle_state,
    to_state,
    transition_valid,
    replay_ref: `replay_transition_${context.context_id}_${to_state.toLowerCase()}`,
    timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

export function replayDecisionContext(context: DecisionContext): DecisionContextReplayResult {
  const reconstructed_hash = computeDecisionContextIntegrityHash(context);
  const replay_valid = reconstructed_hash === context.integrity_hash;
  const base: Omit<DecisionContextReplayResult, "integrity_hash"> = {
    replay_id: `replay_validation_${context.context_id}`,
    replay_valid,
    context_id: context.context_id,
    reconstructed_hash,
    expected_hash: context.integrity_hash,
    reconstructed_validation_state: validateDecisionContext(context).validation_state,
    reconstructed_completeness_score: context.context_completeness_score,
    failures: replay_valid ? Object.freeze([]) : Object.freeze(["INTEGRITY_MISMATCH"] as const),
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

export function buildDecisionContextObservability(contexts: readonly DecisionContext[]): DecisionContextObservability {
  const validations = contexts.map((context) => validateDecisionContext(context));
  const failures = validations.flatMap((validation) => validation.failures);
  return Object.freeze({
    contexts_created: contexts.length,
    validation_failures: validations.filter((validation) => validation.validation_state !== "VALID").length,
    mandatory_domain_failures: failures.filter((failure) => failure === "MANDATORY_DOMAIN_MISSING").length,
    governance_failures: failures.filter((failure) => failure === "GOVERNANCE_UNAVAILABLE").length,
    constitutional_failures: failures.filter((failure) => failure === "CONSTITUTIONAL_UNAVAILABLE").length,
    replay_failures: failures.filter((failure) => failure === "REPLAY_UNAVAILABLE").length,
    integrity_failures: failures.filter((failure) => failure === "INTEGRITY_MISMATCH").length,
    tenant_isolation_failures: failures.filter((failure) => failure === "TENANT_ISOLATION_VIOLATION").length,
    average_completeness_score: contexts.length === 0 ? 0 : contexts.reduce((sum, context) => sum + context.context_completeness_score, 0) / contexts.length,
    lifecycle_distribution: Object.freeze(contexts.reduce<Record<DecisionContextLifecycleState, number>>((counts, context) => {
      counts[context.lifecycle_state] = (counts[context.lifecycle_state] ?? 0) + 1;
      return counts;
    }, {} as Record<DecisionContextLifecycleState, number>)),
  });
}

export function getDecisionContextContractFoundation() {
  const context = createDecisionContext();
  return Object.freeze({
    schema_version: SCHEMA_VERSION,
    construction_order: CONSTRUCTION_ORDER,
    lifecycle_order: LIFECYCLE_ORDER,
    context,
    validation: validateDecisionContext(context),
    replay: replayDecisionContext(context),
    observability: buildDecisionContextObservability([context]),
  });
}
