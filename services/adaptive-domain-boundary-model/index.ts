import { runAdaptiveContractFoundation } from "@/services/adaptive-intelligence-contract-foundation";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  AdaptiveBoundaryCertificationReport,
  AdaptiveBoundaryCheck,
  AdaptiveBoundaryDecision,
  AdaptiveBoundaryEnforcementResult,
  AdaptiveBoundaryFailure,
  AdaptiveBoundaryFoundation,
  AdaptiveBoundaryInput,
  AdaptiveBoundaryLedgerEntry,
  AdaptiveBoundaryOperation,
  AdaptiveBoundaryReplayModel,
  AdaptiveBoundaryRequest,
  AdaptiveBoundaryResult,
  AdaptiveBoundaryValidation,
  AdaptiveBoundaryValidationState,
  AdaptiveDomainClassification,
  AdaptiveDomainDefinition,
  AdaptiveDomainRestrictionRegistry,
} from "@/types/adaptive-domain-boundary-model";
import type { AdaptiveContractFoundationResult, AdaptiveDomain } from "@/types/adaptive-intelligence-contract-foundation";
import type { VisibilityRole } from "@/types/decision-observability-contract";

const BOUNDARY_VERSION = "adaptive-domain-boundary-model/v1" as const;

export const ADAPTIVE_BOUNDARY_CHECKS: readonly AdaptiveBoundaryCheck[] = Object.freeze(["CONTRACT_FOUNDATION", "DOMAIN_REGISTRY", "CLASSIFICATION", "PERMISSION", "GOVERNANCE", "OPERATOR_REVIEW", "REPLAY", "CERTIFICATION", "TENANT_ISOLATION", "INHERITANCE", "INTEGRITY", "DEFAULT_DENY"]);
export const ADAPTIVE_DOMAIN_CLASSIFICATIONS: readonly AdaptiveDomainClassification[] = Object.freeze(["ALLOWED", "RESTRICTED", "PROHIBITED"]);

type Scenario = NonNullable<AdaptiveBoundaryInput["scenario"]>;

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity<T extends object>(value: T): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function state(pass: boolean): AdaptiveBoundaryValidationState {
  return pass ? "PASS" : "FAIL";
}

function ctx(source: AdaptiveContractFoundationResult) {
  return {
    tenant_id: source.contract.tenant_id,
    mission_scope: source.contract.mission_scope,
    contract_id: source.contract.contract_id,
  };
}

function visibleToRole(source: AdaptiveContractFoundationResult, role: VisibilityRole): boolean {
  return source.final_certification.production_readiness.security_certification.observability_certification.ledger_certification.operator_workflow_certification.intelligence_certification.governance_certification.replay_certification.deterministic_certification.foundation_certification.certification_framework.analytics_result.operator_dashboard.replay_monitoring.governance_visibility.priority_dashboard.conflict_visualization.timeline_result.dashboard_result.observability_result.authorizations.some((auth) => auth.role === role && auth.permissions.includes("VIEW_DECISIONS"));
}

function buildDomain(input: {
  id: string;
  name: string;
  category: AdaptiveDomain;
  classification: AdaptiveDomainClassification;
  parent: string;
  reason: string;
  scenario: Scenario;
}): AdaptiveDomainDefinition {
  const restricted = input.classification === "RESTRICTED";
  const prohibited = input.classification === "PROHIBITED";
  const missingClassification = input.scenario === "CLASSIFICATION_MISSING" && input.id === "domain:recommendation-quality";
  const permissionMismatch = input.scenario === "PERMISSION_MISMATCH" && input.id === "domain:constitution";
  const base: Omit<AdaptiveDomainDefinition, "integrity_hash"> = {
    domain_id: input.id,
    domain_name: input.name,
    domain_category: input.category,
    classification: missingClassification ? ("" as AdaptiveDomainClassification) : input.classification,
    analysis_allowed: !prohibited || input.id === "domain:constitution",
    recommendation_allowed: permissionMismatch ? true : !prohibited && !restricted,
    simulation_allowed: !prohibited,
    governance_review_required: restricted || prohibited,
    operator_review_required: input.scenario === "MISSING_OPERATOR_REVIEW" && restricted ? false : restricted || prohibited,
    replay_required: true,
    certification_required: true,
    mutation_allowed: (permissionMismatch ? true : false) as false,
    parent_domain: input.parent,
    restriction_reason: input.reason,
    constitutional_reference: input.scenario === "INVALID_CONSTITUTION" && prohibited ? "" : "constitution:adaptive-boundary",
    governance_reference: input.scenario === "MISSING_GOVERNANCE" && restricted ? "" : "governance:adaptive-domain-boundary",
  };
  const built = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (input.scenario === "HASH_MISMATCH" && input.id === "domain:forecast-accuracy") return Object.freeze({ ...built, integrity_hash: hash({ tampered: built.domain_id }) });
  return built;
}

function buildRegistry(source: AdaptiveContractFoundationResult, scenario: Scenario): AdaptiveDomainRestrictionRegistry {
  const c = ctx(source);
  const domains = freezeArray([
    buildDomain({ id: "domain:recommendation-quality", name: "Recommendation Quality", category: "RECOMMENDATION_RULES", classification: "ALLOWED", parent: "adaptive:allowed", reason: "Adaptive recommendation quality may be analyzed and improved through advisory recommendations.", scenario }),
    buildDomain({ id: "domain:confidence-calibration", name: "Confidence Calibration", category: "CONFIDENCE_CALIBRATION", classification: "ALLOWED", parent: "adaptive:allowed", reason: "Calibration can be improved without mutating evidence or authority.", scenario }),
    buildDomain({ id: "domain:risk-scoring", name: "Risk Scoring", category: "RISK_ADAPTATION", classification: "ALLOWED", parent: "adaptive:allowed", reason: "Risk estimates may be recommended under advisory constraints.", scenario }),
    buildDomain({ id: "domain:evidence-weighting", name: "Evidence Weighting", category: "LEARNING_RULES", classification: "ALLOWED", parent: "adaptive:allowed", reason: "Evidence weights may be recommended but evidence is immutable.", scenario }),
    buildDomain({ id: "domain:forecast-accuracy", name: "Forecast Accuracy", category: "FORECAST_ADAPTATION", classification: "ALLOWED", parent: "adaptive:allowed", reason: "Forecast accuracy may be analyzed and calibrated.", scenario }),
    buildDomain({ id: "domain:governance-interpretation", name: "Governance Interpretation", category: "RECOMMENDATION_RULES", classification: "RESTRICTED", parent: "adaptive:restricted", reason: "Policy usage may be analyzed but interpretation requires governance review.", scenario }),
    buildDomain({ id: "domain:authority-assignments", name: "Authority Assignments", category: "RECOMMENDATION_RULES", classification: "RESTRICTED", parent: "adaptive:restricted", reason: "Authority utilization may be analyzed but expansion is forbidden without governance.", scenario }),
    buildDomain({ id: "domain:policy-evaluation", name: "Policy Evaluation", category: "RECOMMENDATION_RULES", classification: "RESTRICTED", parent: "adaptive:restricted", reason: "Policy effectiveness analysis requires governance oversight.", scenario }),
    buildDomain({ id: "domain:constitution", name: "Constitution", category: "LEARNING_RULES", classification: "PROHIBITED", parent: "adaptive:prohibited", reason: "Constitutional authority is immutable.", scenario }),
    buildDomain({ id: "domain:governance-rules", name: "Governance Rules", category: "LEARNING_RULES", classification: "PROHIBITED", parent: "adaptive:prohibited", reason: "Governance policies and precedence cannot be modified.", scenario }),
    buildDomain({ id: "domain:execution-permissions", name: "Execution Permissions", category: "RECOMMENDATION_RULES", classification: "PROHIBITED", parent: "adaptive:prohibited", reason: "Execution authority can never be granted by adaptation.", scenario }),
    buildDomain({ id: "domain:tenant-isolation", name: "Tenant Isolation", category: "MEMORY_ADAPTATION", classification: "PROHIBITED", parent: "adaptive:prohibited", reason: "Tenant memory and intelligence cannot cross boundaries.", scenario }),
    buildDomain({ id: "domain:immutable-ledger-history", name: "Immutable Ledger History", category: "MEMORY_ADAPTATION", classification: "PROHIBITED", parent: "adaptive:prohibited", reason: "Ledger history and evidence are immutable.", scenario }),
  ]);
  const maybeDomains = scenario === "HIDDEN_DOMAIN" ? domains.slice(1) : domains;
  const withUnauthorized = scenario === "UNAUTHORIZED_DOMAIN_CREATION" ? freezeArray([...maybeDomains, buildDomain({ id: "domain:unauthorized", name: "Unauthorized Adaptive Domain", category: "LEARNING_RULES", classification: "ALLOWED", parent: "adaptive:hidden", reason: "Unauthorized domain creation attempted.", scenario })]) : maybeDomains;
  const base: Omit<AdaptiveDomainRestrictionRegistry, "integrity_hash"> = {
    registry_id: "adaptive_domain_restriction_registry",
    tenant_id: scenario === "TENANT_BREACH" ? `${c.tenant_id}:foreign` : c.tenant_id,
    contract_id: c.contract_id,
    domains: withUnauthorized,
    allowed_domain_ids: freezeArray(withUnauthorized.filter((domain) => domain.classification === "ALLOWED").map((domain) => domain.domain_id)),
    restricted_domain_ids: freezeArray(withUnauthorized.filter((domain) => domain.classification === "RESTRICTED").map((domain) => domain.domain_id)),
    prohibited_domain_ids: freezeArray(withUnauthorized.filter((domain) => domain.classification === "PROHIBITED").map((domain) => domain.domain_id)),
    append_only: (scenario === "FAIL_OPEN" ? false : true) as true,
    default_decision: "REJECT",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildRequest(source: AdaptiveContractFoundationResult, input: AdaptiveBoundaryInput, scenario: Scenario): AdaptiveBoundaryRequest {
  const c = ctx(source);
  const domain = input.domain_id ?? (scenario === "UNKNOWN_DOMAIN" ? "domain:unknown" : scenario === "MISSING_OPERATOR_REVIEW" ? "domain:policy-evaluation" : scenario === "PROHIBITED_RECOMMENDATION" ? "domain:constitution" : scenario === "PROHIBITED_MUTATION" ? "domain:immutable-ledger-history" : "domain:recommendation-quality");
  const operation = input.operation ?? (scenario === "PROHIBITED_RECOMMENDATION" || scenario === "MISSING_OPERATOR_REVIEW" ? "RECOMMEND" : scenario === "PROHIBITED_MUTATION" ? "MUTATE" : scenario === "EXECUTION_AUTHORITY" ? "EXECUTE" : "RECOMMEND");
  return Object.freeze({
    request_id: "adaptive_boundary_request",
    tenant_id: scenario === "TENANT_BREACH" ? `${c.tenant_id}:foreign` : c.tenant_id,
    mission_scope: c.mission_scope,
    adaptive_domain: domain,
    requested_operation: operation,
    supporting_evidence: freezeArray(["adaptive:evidence:classification", source.contract.integrity_hash]),
    governance_refs: scenario === "MISSING_GOVERNANCE" ? freezeArray([]) : source.contract.governance_refs,
    replay_refs: scenario === "MISSING_REPLAY" ? freezeArray([]) : source.contract.replay_refs,
    certification_refs: scenario === "MISSING_CERTIFICATION" ? freezeArray([]) : source.contract.certification_refs,
  });
}

function decisionFor(domain: AdaptiveDomainDefinition | undefined, operation: AdaptiveBoundaryOperation): AdaptiveBoundaryDecision {
  if (!domain) return "REJECT";
  if (operation === "EXECUTE") return "REJECT";
  if (operation === "MUTATE") return "REJECT";
  if (domain.classification === "PROHIBITED" && operation === "RECOMMEND") return "REJECT";
  if (domain.classification === "PROHIBITED" && operation === "SIMULATE") return "REJECT";
  if (domain.classification === "RESTRICTED" && operation === "RECOMMEND") return "RESTRICT";
  return "PASS";
}

function buildEnforcement(source: AdaptiveContractFoundationResult, registry: AdaptiveDomainRestrictionRegistry, request: AdaptiveBoundaryRequest, scenario: Scenario): AdaptiveBoundaryEnforcementResult {
  const domain = registry.domains.find((entry) => entry.domain_id === request.adaptive_domain);
  const decision = decisionFor(domain, request.requested_operation);
  const base: Omit<AdaptiveBoundaryEnforcementResult, "integrity_hash"> = {
    enforcement_id: "adaptive_boundary_enforcement_result",
    tenant_id: request.tenant_id,
    contract_id: source.contract.contract_id,
    adaptive_domain: request.adaptive_domain,
    classification: domain?.classification || "UNKNOWN",
    requested_operation: request.requested_operation,
    validation_result: scenario === "FAIL_OPEN" ? "PASS" : decision,
    governance_refs: request.governance_refs,
    replay_refs: request.replay_refs,
    certification_refs: request.certification_refs,
    operator_review_required: Boolean(domain?.operator_review_required),
    reason: domain ? domain.restriction_reason : "Unknown domains are rejected by default.",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildReplay(registry: AdaptiveDomainRestrictionRegistry, request: AdaptiveBoundaryRequest, enforcement: AdaptiveBoundaryEnforcementResult, scenario: Scenario): AdaptiveBoundaryReplayModel {
  const domain = registry.domains.find((entry) => entry.domain_id === request.adaptive_domain);
  const base: Omit<AdaptiveBoundaryReplayModel, "integrity_hash"> = {
    replay_model_id: "adaptive_boundary_replay_model",
    tenant_id: request.tenant_id,
    contract_id: registry.contract_id,
    evaluated_domain: request.adaptive_domain,
    classification: domain?.classification || "UNKNOWN",
    validation_outcome: enforcement.validation_result,
    supporting_evidence: request.supporting_evidence,
    governance_refs: request.governance_refs,
    replay_refs: request.replay_refs,
    integrity_reproducible: scenario !== "HASH_MISMATCH" && scenario !== "REPLAY_MISMATCH",
    deterministic_reconstruction: scenario !== "REPLAY_MISMATCH",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(input: {
  foundation: AdaptiveContractFoundationResult;
  registry: AdaptiveDomainRestrictionRegistry;
  request: AdaptiveBoundaryRequest;
  enforcement: AdaptiveBoundaryEnforcementResult;
  replay: AdaptiveBoundaryReplayModel;
  ledger: readonly AdaptiveBoundaryLedgerEntry[];
  role: VisibilityRole;
  scenario: Scenario;
}): readonly AdaptiveBoundaryFailure[] {
  const failures: AdaptiveBoundaryFailure[] = [];
  const domain = input.registry.domains.find((entry) => entry.domain_id === input.request.adaptive_domain);
  if (input.foundation.validation.validation_status !== "VALID" || !input.foundation.permits_adaptation) failures.push("CONTRACT_FOUNDATION_INVALID");
  if (!domain) failures.push("UNKNOWN_DOMAIN");
  if (!input.registry.domains.some((entry) => entry.domain_id === "domain:recommendation-quality")) failures.push("HIDDEN_ADAPTIVE_DOMAIN");
  if (input.registry.domains.some((entry) => entry.domain_id === "domain:unauthorized")) failures.push("UNAUTHORIZED_DOMAIN_CREATION");
  if (input.registry.domains.some((entry) => !entry.classification)) failures.push("CLASSIFICATION_MISSING");
  if (input.registry.domains.some((entry) => (entry.classification === "PROHIBITED" && (entry.recommendation_allowed || entry.mutation_allowed)) || (entry.classification === "ALLOWED" && entry.governance_review_required))) failures.push("PERMISSION_CLASSIFICATION_MISMATCH");
  if (!input.request.governance_refs.length || input.registry.domains.some((entry) => !entry.governance_reference)) failures.push("GOVERNANCE_REQUIREMENTS_MISSING");
  if (input.enforcement.validation_result === "RESTRICT" && !input.enforcement.operator_review_required) failures.push("OPERATOR_REVIEW_MISSING");
  if (!input.request.replay_refs.length || !input.replay.deterministic_reconstruction) failures.push("REPLAY_REQUIREMENTS_MISSING");
  if (!input.request.certification_refs.length) failures.push("CERTIFICATION_REQUIREMENTS_MISSING");
  if (input.registry.domains.some((entry) => !entry.constitutional_reference)) failures.push("CONSTITUTIONAL_REFERENCE_INVALID");
  if (input.scenario === "AUTHORITY_ESCALATION") failures.push("AUTHORITY_ESCALATION");
  if (input.registry.tenant_id !== input.foundation.contract.tenant_id || input.request.tenant_id !== input.foundation.contract.tenant_id) failures.push("TENANT_ISOLATION_BREACH");
  if (input.scenario === "CROSS_TENANT_MEMORY") failures.push("CROSS_TENANT_MEMORY_SHARING");
  if (domain?.classification === "PROHIBITED" && input.request.requested_operation === "RECOMMEND") failures.push("PROHIBITED_RECOMMENDATION");
  if (input.request.requested_operation === "MUTATE") failures.push("PROHIBITED_MUTATION");
  if (input.request.requested_operation === "EXECUTE" || input.scenario === "EXECUTION_AUTHORITY") failures.push("EXECUTION_AUTHORITY_GRANTED");
  if (input.scenario === "INHERITANCE_WEAKENED") failures.push("INHERITED_BOUNDARY_WEAKENED");
  if (!input.replay.integrity_reproducible || !input.replay.deterministic_reconstruction) failures.push("BOUNDARY_REPLAY_MISMATCH");
  if (
    hashWithoutIntegrity(input.registry) !== input.registry.integrity_hash
    || input.registry.domains.some((entry) => hashWithoutIntegrity(entry) !== entry.integrity_hash)
    || hashWithoutIntegrity(input.enforcement) !== input.enforcement.integrity_hash
    || hashWithoutIntegrity(input.replay) !== input.replay.integrity_hash
    || input.ledger.some((entry) => hashWithoutIntegrity(entry) !== entry.integrity_hash)
  ) failures.push("INTEGRITY_HASH_MISMATCH");
  if (!input.registry.append_only || (input.enforcement.validation_result === "PASS" && (domain?.classification === "PROHIBITED" || !domain))) failures.push("FAIL_OPEN_BOUNDARY_BEHAVIOR");
  if (!visibleToRole(input.foundation, input.role)) failures.push("AUTHORIZATION_FAILURE");
  return freezeArray([...new Set(failures)]);
}

function buildReport(registry: AdaptiveDomainRestrictionRegistry, replay: AdaptiveBoundaryReplayModel, failures: readonly AdaptiveBoundaryFailure[]): AdaptiveBoundaryCertificationReport {
  const has = (failure: AdaptiveBoundaryFailure) => failures.includes(failure);
  const base: Omit<AdaptiveBoundaryCertificationReport, "integrity_hash"> = {
    report_id: "adaptive_boundary_certification_report",
    tenant_id: registry.tenant_id,
    contract_id: registry.contract_id,
    checks: ADAPTIVE_BOUNDARY_CHECKS,
    allowed_domains_valid: !has("CLASSIFICATION_MISSING") && !has("PERMISSION_CLASSIFICATION_MISMATCH"),
    restricted_domains_valid: !has("GOVERNANCE_REQUIREMENTS_MISSING") && !has("OPERATOR_REVIEW_MISSING"),
    prohibited_domains_valid: !has("PROHIBITED_RECOMMENDATION") && !has("PROHIBITED_MUTATION") && !has("EXECUTION_AUTHORITY_GRANTED"),
    default_deny_enforced: !has("UNKNOWN_DOMAIN") && !has("FAIL_OPEN_BOUNDARY_BEHAVIOR"),
    governance_inherited: !has("GOVERNANCE_REQUIREMENTS_MISSING") && !has("INHERITED_BOUNDARY_WEAKENED"),
    replay_inherited: !has("REPLAY_REQUIREMENTS_MISSING") && !has("BOUNDARY_REPLAY_MISMATCH"),
    certification_inherited: !has("CERTIFICATION_REQUIREMENTS_MISSING"),
    operator_review_enforced: !has("OPERATOR_REVIEW_MISSING"),
    tenant_isolation_preserved: !has("TENANT_ISOLATION_BREACH") && !has("CROSS_TENANT_MEMORY_SHARING"),
    advisory_only_preserved: !has("AUTHORITY_ESCALATION") && !has("EXECUTION_AUTHORITY_GRANTED"),
    boundary_replay_verified: replay.deterministic_reconstruction && !has("BOUNDARY_REPLAY_MISMATCH"),
    integrity_verified: !has("INTEGRITY_HASH_MISMATCH"),
    failure_analysis: failures,
    certification_decision: failures.length ? "FAIL" : "PASS",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildLedger(request: AdaptiveBoundaryRequest, enforcement: AdaptiveBoundaryEnforcementResult, scenario: Scenario): readonly AdaptiveBoundaryLedgerEntry[] {
  const event: Omit<AdaptiveBoundaryLedgerEntry, "integrity_hash"> = {
    boundary_event_id: "adaptive_boundary_ledger_001",
    tenant_id: request.tenant_id,
    mission_scope: request.mission_scope,
    adaptive_domain: request.adaptive_domain,
    classification: enforcement.classification,
    requested_operation: request.requested_operation,
    validation_result: enforcement.validation_result,
    governance_refs: enforcement.governance_refs,
    replay_refs: enforcement.replay_refs,
    certification_refs: enforcement.certification_refs,
    operator_review_required: enforcement.operator_review_required,
    event_timestamp: "2026-07-05T10:00:20.000Z",
    sequence_number: 1,
    append_only: (scenario === "FAIL_OPEN" ? false : true) as true,
    deleted: false,
  };
  return freezeArray([Object.freeze({ ...event, integrity_hash: hashWithoutIntegrity(event) })]);
}

function buildValidation(failures: readonly AdaptiveBoundaryFailure[]): AdaptiveBoundaryValidation {
  const has = (failure: AdaptiveBoundaryFailure) => failures.includes(failure);
  const base: Omit<AdaptiveBoundaryValidation, "integrity_hash"> = {
    validation_id: "adaptive_boundary_validation",
    validation_status: failures.length ? "BLOCKED" : "VALID",
    contract_foundation_valid: !has("CONTRACT_FOUNDATION_INVALID"),
    domain_registry_complete: !has("HIDDEN_ADAPTIVE_DOMAIN") && !has("UNAUTHORIZED_DOMAIN_CREATION") && !has("UNKNOWN_DOMAIN"),
    classifications_valid: !has("CLASSIFICATION_MISSING"),
    permissions_match_classification: !has("PERMISSION_CLASSIFICATION_MISMATCH") && !has("PROHIBITED_RECOMMENDATION") && !has("PROHIBITED_MUTATION"),
    governance_requirements_present: !has("GOVERNANCE_REQUIREMENTS_MISSING") && !has("OPERATOR_REVIEW_MISSING"),
    replay_requirements_present: !has("REPLAY_REQUIREMENTS_MISSING") && !has("BOUNDARY_REPLAY_MISMATCH"),
    certification_requirements_present: !has("CERTIFICATION_REQUIREMENTS_MISSING"),
    tenant_isolated: !has("TENANT_ISOLATION_BREACH") && !has("CROSS_TENANT_MEMORY_SHARING"),
    inheritance_enforced: !has("INHERITED_BOUNDARY_WEAKENED"),
    default_deny_enforced: !has("FAIL_OPEN_BOUNDARY_BEHAVIOR"),
    advisory_only: !has("AUTHORITY_ESCALATION") && !has("EXECUTION_AUTHORITY_GRANTED"),
    integrity_verified: !has("INTEGRITY_HASH_MISMATCH"),
    authorization_valid: !has("AUTHORIZATION_FAILURE"),
    execution_authority_absent: !has("EXECUTION_AUTHORITY_GRANTED"),
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<AdaptiveBoundaryResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    registry: result.registry,
    request: result.request,
    enforcement: result.enforcement_result,
    replay: result.replay_model,
    report: result.certification_report,
    ledger: result.boundary_ledger,
    validation: result.validation,
  });
}

export function runAdaptiveDomainBoundaryModel(input: AdaptiveBoundaryInput = {}): AdaptiveBoundaryResult {
  const scenario = input.scenario ?? "BASELINE";
  const role = input.role ?? "OPERATOR";
  const contract_foundation = input.contract_foundation ?? runAdaptiveContractFoundation({ scenario: scenario === "CONTRACT_INVALID" ? "MISSING_GOVERNANCE" : "BASELINE" });
  const registry = buildRegistry(contract_foundation, scenario);
  const request = buildRequest(contract_foundation, input, scenario);
  const enforcement_result = buildEnforcement(contract_foundation, registry, request, scenario);
  const replay_model = buildReplay(registry, request, enforcement_result, scenario);
  const preFailures = collectFailures({ foundation: contract_foundation, registry, request, enforcement: enforcement_result, replay: replay_model, ledger: [], role, scenario });
  const preReport = buildReport(registry, replay_model, preFailures);
  const boundary_ledger = buildLedger(request, enforcement_result, scenario);
  const failures = collectFailures({ foundation: contract_foundation, registry, request, enforcement: enforcement_result, replay: replay_model, ledger: boundary_ledger, role, scenario });
  const certification_report = buildReport(registry, replay_model, failures);
  const validation = buildValidation(failures);
  const base: Omit<AdaptiveBoundaryResult, "integrity_hash" | "replay_hash"> = {
    boundary_version: BOUNDARY_VERSION,
    contract_foundation,
    registry,
    request,
    enforcement_result,
    replay_model,
    certification_report: preReport.certification_decision === certification_report.certification_decision ? certification_report : buildReport(registry, replay_model, failures),
    boundary_ledger,
    validation,
    deterministic: true,
    replayable: true,
    advisory_only: true,
    permits_execution: false,
    mutates_domain_registry: false,
    execution_authority_granted: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayAdaptiveDomainBoundaryModel(result: AdaptiveBoundaryResult): boolean {
  return resultReplayHash(result) === result.replay_hash && hashWithoutIntegrity(result) === result.integrity_hash;
}

export function computeAdaptiveDomainHash(record: Omit<AdaptiveDomainDefinition, "integrity_hash"> | AdaptiveDomainDefinition): string {
  return hashWithoutIntegrity(record);
}

export function getAdaptiveDomainBoundaryFoundation(): AdaptiveBoundaryFoundation {
  return Object.freeze({
    boundary_version: BOUNDARY_VERSION,
    checks: ADAPTIVE_BOUNDARY_CHECKS,
    classifications: ADAPTIVE_DOMAIN_CLASSIFICATIONS,
    result: runAdaptiveDomainBoundaryModel(),
  });
}

export const AdaptiveDomainBoundaryModel = Object.freeze({
  run: runAdaptiveDomainBoundaryModel,
  replay: replayAdaptiveDomainBoundaryModel,
});
