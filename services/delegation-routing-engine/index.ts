import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { buildAuthorityValidationPackage } from "@/services/authority-validation-engine";
import type { AuthorityValidationPackage, AuthorityValidationScenario } from "@/types/authority-validation-engine";
import type {
  ContingencyPlan,
  DelegationPlan,
  DelegationRoutingFailureReason,
  DelegationRoutingFramework,
  DelegationRoutingPackage,
  DelegationRoutingReplayResult,
  DelegationRoutingScenario,
  DelegationRoutingState,
  DelegationRoutingValidationResult,
  DelegationRoutingVisibilitySurface,
  RoutingDecision,
  RoutingExplainabilityRecord,
} from "@/types/delegation-routing-engine";

const NOW = "2026-06-29T16:00:00.000Z";
const ENGINE_VERSION = "delegation-routing-engine/v8D.4" as const;

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function unique<T extends string>(values: readonly T[]): readonly T[] {
  return freezeArray([...new Set(values.filter(Boolean))].sort());
}

function id(prefix: string, domain: string, value: unknown) {
  return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`;
}

function authorityScenarioFor(scenario: DelegationRoutingScenario): AuthorityValidationScenario {
  if (scenario === "BLOCKED_AUTHORITY" || scenario === "UNAUTHORIZED_DELEGATE") return "UNAUTHORIZED_DELEGATION";
  if (scenario === "GOVERNANCE_BYPASS") return "GOVERNANCE_BYPASS";
  if (scenario === "CONSTITUTIONAL_VIOLATION") return "CONSTITUTIONAL_VIOLATION";
  if (scenario === "PRIVILEGE_ESCALATION") return "PRIVILEGE_ESCALATION";
  if (scenario === "TENANT_VIOLATION") return "TENANT_ISOLATION_FAILURE";
  if (scenario === "REPLAY_INCONSISTENCY") return "REPLAY_INCONSISTENCY";
  if (scenario === "EXTERNAL_ROUTE") return "BASELINE";
  if (scenario === "OPERATOR_ROUTE") return "BASELINE";
  return "BASELINE";
}

function planHashSource(plan: Omit<DelegationPlan, "plan_hash"> | DelegationPlan) {
  return {
    plan_id: plan.plan_id,
    task_id: plan.task_id,
    delegate_id: plan.delegate_id,
    delegate_type: plan.delegate_type,
    authority_reference: plan.authority_reference,
    dependencies: plan.dependencies,
    priority: plan.priority,
    confidence: plan.confidence,
    replay_reference: plan.replay_reference,
    lineage_reference: plan.lineage_reference,
    immutable: plan.immutable,
  };
}

export function computeDelegationPlanHash(plan: Omit<DelegationPlan, "plan_hash"> | DelegationPlan): string {
  return hashValue("delegation-routing-plan", planHashSource(plan));
}

function buildPlan(pkg: AuthorityValidationPackage, scenario: DelegationRoutingScenario): DelegationPlan {
  const classification = pkg.source_classification.classification;
  const base = {
    plan_id: id("DRP", "delegation-routing-plan-id", { classification: classification.classification_id, scenario }),
    task_id: classification.task_id,
    delegate_id: scenario === "MULTIPLE_OWNERS" ? `${classification.execution_owner_id}|owner:extra` : classification.execution_owner_id,
    delegate_type: classification.classification,
    authority_reference: pkg.validation.evidence.authority_references[0] ?? "",
    dependencies: scenario === "UNRESOLVED_DEPENDENCIES" ? freezeArray(["dependency:unresolved"]) : classification.dependency_analysis.dependency_refs,
    priority: pkg.source_classification.source_delegation.metadata.priority,
    confidence: scenario === "NONDETERMINISTIC_ROUTING" ? 0.333 : classification.confidence.score,
    replay_reference: scenario === "REPLAY_INCONSISTENCY" ? "" : `routing:${classification.replay_reference}`,
    lineage_reference: classification.lineage_reference,
    immutable: true as const,
  };
  return Object.freeze({ ...base, plan_hash: computeDelegationPlanHash(base) });
}

function routeHashSource(route: Omit<RoutingDecision, "routing_hash"> | RoutingDecision) {
  return {
    routing_id: route.routing_id,
    primary_execution_owner: route.primary_execution_owner,
    primary_owner_type: route.primary_owner_type,
    routing_sequence: route.routing_sequence,
    escalation_path: route.escalation_path,
    fallback_delegate: route.fallback_delegate,
    fallback_authority_ceiling: route.fallback_authority_ceiling,
    governance_reference: route.governance_reference,
    tenant_id: route.tenant_id,
    route_state: route.route_state,
    replay_reference: route.replay_reference,
    lineage_reference: route.lineage_reference,
  };
}

export function computeRoutingDecisionHash(route: Omit<RoutingDecision, "routing_hash"> | RoutingDecision): string {
  return hashValue("delegation-routing-decision", routeHashSource(route));
}

function routeStateFor(pkg: AuthorityValidationPackage, scenario: DelegationRoutingScenario): DelegationRoutingState {
  if (pkg.validation.decision !== "AUTHORIZED") return "AUTHORITY_FAILURE";
  if (scenario === "UNRESOLVED_DEPENDENCIES") return "DEPENDENCY_FAILURE";
  if (scenario === "OPERATOR_ROUTE") return "WAITING_OPERATOR";
  if (scenario === "NONDETERMINISTIC_ROUTING" || scenario === "MULTIPLE_OWNERS") return "ROUTING_FAILED";
  return "READY_FOR_EXECUTION";
}

function fallbackFor(plan: DelegationPlan, scenario: DelegationRoutingScenario): string | null {
  if (scenario === "UNCERTIFIED_FALLBACK") return "agent:uncertified-fallback";
  if (plan.delegate_type === "AGENT") return "operator:mission-control";
  if (plan.delegate_type === "EXTERNAL") return "operator:external-review";
  if (plan.delegate_type === "OPERATOR") return null;
  return "operator:mission-control";
}

function buildRoute(pkg: AuthorityValidationPackage, plan: DelegationPlan, scenario: DelegationRoutingScenario): RoutingDecision {
  const sequence = scenario === "NONDETERMINISTIC_ROUTING"
    ? freezeArray([plan.task_id, "task:randomized"])
    : freezeArray([...plan.dependencies, plan.task_id]);
  const base = {
    routing_id: id("DRR", "delegation-routing-id", { plan: plan.plan_id, scenario }),
    primary_execution_owner: plan.delegate_id,
    primary_owner_type: scenario === "EXTERNAL_ROUTE" ? "EXTERNAL" as const : scenario === "OPERATOR_ROUTE" ? "OPERATOR" as const : plan.delegate_type,
    routing_sequence: sequence,
    escalation_path: freezeArray(["primary delegate", "operator review", "governance review", "mission authority"]),
    fallback_delegate: fallbackFor(plan, scenario),
    fallback_authority_ceiling: plan.delegate_type,
    governance_reference: scenario === "GOVERNANCE_BYPASS" ? "" : pkg.validation.evidence.governing_policies[0] ?? "",
    tenant_id: scenario === "TENANT_VIOLATION" ? "tenant_delta" : pkg.validation.tenant_id,
    route_state: routeStateFor(pkg, scenario),
    replay_reference: plan.replay_reference,
    lineage_reference: plan.lineage_reference,
  };
  return Object.freeze({ ...base, routing_hash: computeRoutingDecisionHash(base) });
}

function contingencyHashSource(contingency: Omit<ContingencyPlan, "contingency_hash"> | ContingencyPlan) {
  return {
    contingency_id: contingency.contingency_id,
    alternate_delegate: contingency.alternate_delegate,
    operator_takeover: contingency.operator_takeover,
    rollback_path: contingency.rollback_path,
    retry_strategy: contingency.retry_strategy,
    governance_policy_modified: contingency.governance_policy_modified,
    constitutional_policy_modified: contingency.constitutional_policy_modified,
  };
}

export function computeContingencyPlanHash(contingency: Omit<ContingencyPlan, "contingency_hash"> | ContingencyPlan): string {
  return hashValue("delegation-routing-contingency", contingencyHashSource(contingency));
}

function buildContingency(pkg: AuthorityValidationPackage, plan: DelegationPlan, route: RoutingDecision, scenario: DelegationRoutingScenario): ContingencyPlan {
  const base = {
    contingency_id: id("DRC", "delegation-routing-contingency-id", { plan: plan.plan_id, scenario }),
    alternate_delegate: route.fallback_delegate,
    operator_takeover: Object.freeze({
      takeover_required: route.route_state === "WAITING_OPERATOR" || plan.confidence < 0.7,
      operator_reference: "operator:mission-control",
      trigger: "authority uncertainty, governance review, confidence threshold, or contingency limit",
    }),
    rollback_path: Object.freeze({
      rollback_trigger: scenario === "INVALID_ROLLBACK" ? "" : "delegated work failure or governance stop",
      rollback_scope: scenario === "INVALID_ROLLBACK" ? freezeArray<string>([]) : freezeArray([plan.task_id]),
      rollback_sequence: scenario === "INVALID_ROLLBACK" ? freezeArray<string>([]) : freezeArray(["pause delegation", "restore checkpoint", "verify governance"]),
      authority_required: pkg.validation.evidence.authority_references[0] ?? "",
      protected_checkpoints: freezeArray([`checkpoint:${plan.task_id}`]),
      recovery_boundaries: freezeArray([`recovery-boundary:${plan.task_id}`]),
    }),
    retry_strategy: Object.freeze({
      retry_conditions: freezeArray(["delegate timeout", "resource unavailable", "transient routing failure"]),
      retry_limit: 2,
      retry_delay_ms: 30000,
      validation_before_retry: true,
      escalation_threshold: 2,
      termination_conditions: freezeArray(["governance denial", "authority failure", "retry limit reached"]),
    }),
    governance_policy_modified: false as const,
    constitutional_policy_modified: false as const,
  };
  return Object.freeze({ ...base, contingency_hash: computeContingencyPlanHash(base) });
}

function explanationHashSource(explanation: Omit<RoutingExplainabilityRecord, "explanation_hash"> | RoutingExplainabilityRecord) {
  return {
    explanation_id: explanation.explanation_id,
    why_delegated: explanation.why_delegated,
    authority_used: explanation.authority_used,
    policies_satisfied: explanation.policies_satisfied,
    risks_evaluated: explanation.risks_evaluated,
    confidence_rationale: explanation.confidence_rationale,
    dependency_explanation: explanation.dependency_explanation,
    governance_evidence: explanation.governance_evidence,
  };
}

export function computeRoutingExplanationHash(explanation: Omit<RoutingExplainabilityRecord, "explanation_hash"> | RoutingExplainabilityRecord): string {
  return hashValue("delegation-routing-explanation", explanationHashSource(explanation));
}

function buildExplanation(pkg: AuthorityValidationPackage, plan: DelegationPlan, route: RoutingDecision, scenario: DelegationRoutingScenario): RoutingExplainabilityRecord {
  const base = {
    explanation_id: id("DRE", "delegation-routing-explanation-id", { route: route.routing_id, scenario }),
    why_delegated: scenario === "MISSING_EXPLAINABILITY" ? "" : `Task ${plan.task_id} is routed to ${route.primary_execution_owner} because classification selected ${plan.delegate_type}.`,
    authority_used: freezeArray(pkg.validation.evidence.authority_references),
    policies_satisfied: freezeArray(pkg.validation.evidence.governing_policies),
    risks_evaluated: freezeArray(["execution risk", "governance risk", "dependency risk", "resource risk", "operational risk"]),
    confidence_rationale: scenario === "MISSING_EXPLAINABILITY" ? "" : `Confidence ${plan.confidence} reflects authority certainty, delegate capability, dependency completeness, governance certainty, historical consistency, and replay consistency.`,
    dependency_explanation: scenario === "MISSING_EXPLAINABILITY" ? "" : `Dependencies resolved in deterministic order: ${plan.dependencies.join(",") || "none"}.`,
    governance_evidence: freezeArray([pkg.validation.evidence.integrity_hash, pkg.ledger_entry.ledger_hash]),
  };
  return Object.freeze({ ...base, explanation_hash: computeRoutingExplanationHash(base) });
}

function validationFailures(pkg: AuthorityValidationPackage, plan: DelegationPlan, route: RoutingDecision, contingency: ContingencyPlan, explanation: RoutingExplainabilityRecord, scenario: DelegationRoutingScenario): readonly DelegationRoutingFailureReason[] {
  const failures: DelegationRoutingFailureReason[] = [];
  if (pkg.validation.decision !== "AUTHORIZED") failures.push("INVALID_AUTHORITY_VALIDATION");
  if (plan.delegate_id.includes("|")) failures.push("MULTIPLE_PRIMARY_EXECUTION_OWNERS");
  if (scenario === "NONDETERMINISTIC_ROUTING") failures.push("NONDETERMINISTIC_ROUTING");
  if (plan.dependencies.includes("dependency:unresolved")) failures.push("UNRESOLVED_DEPENDENCIES");
  if (scenario === "UNAUTHORIZED_DELEGATE") failures.push("UNAUTHORIZED_DELEGATE");
  if (!route.governance_reference || scenario === "GOVERNANCE_BYPASS") failures.push("GOVERNANCE_BYPASS");
  if (scenario === "CONSTITUTIONAL_VIOLATION") failures.push("CONSTITUTIONAL_VIOLATION");
  if (scenario === "PRIVILEGE_ESCALATION") failures.push("PRIVILEGE_ESCALATION");
  if (route.fallback_delegate?.includes("uncertified")) failures.push("UNCERTIFIED_FALLBACK_DELEGATE");
  if (!contingency.rollback_path.rollback_trigger || contingency.rollback_path.rollback_sequence.length === 0) failures.push("INVALID_ROLLBACK_PLAN");
  if (!plan.replay_reference || !route.replay_reference || scenario === "REPLAY_INCONSISTENCY") failures.push("REPLAY_INCONSISTENCY");
  if (!explanation.why_delegated || !explanation.confidence_rationale || !explanation.dependency_explanation) failures.push("MISSING_EXPLAINABILITY");
  if (route.tenant_id !== pkg.validation.tenant_id) failures.push("TENANT_ISOLATION_VIOLATION");
  if (computeDelegationPlanHash(plan) !== plan.plan_hash || computeRoutingDecisionHash(route) !== route.routing_hash || computeContingencyPlanHash(contingency) !== contingency.contingency_hash || computeRoutingExplanationHash(explanation) !== explanation.explanation_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  if (scenario === "HASH_MISMATCH") failures.push("INTEGRITY_HASH_MISMATCH");
  return unique(failures);
}

function validateRouting(pkg: AuthorityValidationPackage, plan: DelegationPlan, route: RoutingDecision, contingency: ContingencyPlan, explanation: RoutingExplainabilityRecord, scenario: DelegationRoutingScenario, packageId: string): DelegationRoutingValidationResult {
  const failures = validationFailures(pkg, plan, route, contingency, explanation, scenario);
  const validation_state = failures.length ? "FAIL" as const : "PASS" as const;
  const has = (failure: DelegationRoutingFailureReason) => failures.includes(failure);
  const source = { packageId, validation_state, failures };
  return Object.freeze({
    validation_id: id("DRV", "delegation-routing-validation-id", source),
    routing_package_id: packageId,
    validation_state,
    failures,
    exactly_one_primary_owner: !has("MULTIPLE_PRIMARY_EXECUTION_OWNERS"),
    authority_valid: !has("INVALID_AUTHORITY_VALIDATION") && !has("UNAUTHORIZED_DELEGATE") && !has("PRIVILEGE_ESCALATION"),
    dependencies_valid: !has("UNRESOLVED_DEPENDENCIES"),
    governance_valid: !has("GOVERNANCE_BYPASS"),
    constitutional_valid: !has("CONSTITUTIONAL_VIOLATION"),
    contingency_valid: !has("UNCERTIFIED_FALLBACK_DELEGATE") && !has("INVALID_ROLLBACK_PLAN"),
    explainability_complete: !has("MISSING_EXPLAINABILITY"),
    tenant_isolated: !has("TENANT_ISOLATION_VIOLATION"),
    replay_ready: !has("REPLAY_INCONSISTENCY") && !has("NONDETERMINISTIC_ROUTING"),
    integrity_verified: !has("INTEGRITY_HASH_MISMATCH"),
    ready_for_delegation_certification: validation_state === "PASS",
    validation_hash: hashValue("delegation-routing-validation", source),
  });
}

function replayRouting(plan: DelegationPlan, route: RoutingDecision, contingency: ContingencyPlan, explanation: RoutingExplainabilityRecord, validation: DelegationRoutingValidationResult): DelegationRoutingReplayResult {
  const source = {
    replay_id: id("DRRP", "delegation-routing-replay-id", validation.routing_package_id),
    routing_package_id: validation.routing_package_id,
    reconstructed_owner: route.primary_execution_owner,
    reconstructed_sequence: route.routing_sequence,
    reconstructed_fallback_delegate: route.fallback_delegate,
    reconstructed_contingency_hash: contingency.contingency_hash,
    reconstructed_explanation_hash: explanation.explanation_hash,
    validation_state: validation.validation_state,
    failure_reason: validation.failures[0] ?? null,
  };
  return Object.freeze({ ...source, replay_hash: hashValue("delegation-routing-replay", source) });
}

export function buildDelegationRoutingPackage(input: { scenario?: DelegationRoutingScenario; authorityPackage?: AuthorityValidationPackage } = {}): DelegationRoutingPackage {
  const scenario = input.scenario ?? "BASELINE";
  const source_authority_validation = input.authorityPackage ?? buildAuthorityValidationPackage({ scenario: authorityScenarioFor(scenario) });
  const plan = buildPlan(source_authority_validation, scenario);
  const route = buildRoute(source_authority_validation, plan, scenario);
  const contingency = buildContingency(source_authority_validation, plan, route, scenario);
  const explanation = buildExplanation(source_authority_validation, plan, route, scenario);
  const package_id = id("DRPKG", "delegation-routing-package-id", { validation: source_authority_validation.validation.validation_id, scenario });
  const validation = validateRouting(source_authority_validation, plan, route, contingency, explanation, scenario, package_id);
  const replay = replayRouting(plan, route, contingency, explanation, validation);
  const base = {
    package_id,
    engine_version: ENGINE_VERSION,
    source_authority_validation,
    delegation_plan: scenario === "HASH_MISMATCH" ? Object.freeze({ ...plan, plan_hash: "tampered-plan-hash" }) : plan,
    routing_decision: route,
    contingency_plan: contingency,
    explainability: explanation,
    validation,
    replay,
    mapped_authority_failures: source_authority_validation.validation.failures,
  };
  return Object.freeze({ ...base, package_hash: hashValue("delegation-routing-package", base) });
}

export function buildDelegationRoutingVisibilitySurface(pkg = buildDelegationRoutingPackage()): DelegationRoutingVisibilitySurface {
  return Object.freeze({
    package_id: pkg.package_id,
    task_id: pkg.delegation_plan.task_id,
    primary_execution_owner: pkg.routing_decision.primary_execution_owner,
    route_state: pkg.routing_decision.route_state,
    fallback_delegate: pkg.routing_decision.fallback_delegate,
    operator_takeover_required: pkg.contingency_plan.operator_takeover.takeover_required,
    validation_state: pkg.validation.validation_state,
    failure_reasons: pkg.validation.failures,
    replay_reference: pkg.routing_decision.replay_reference,
    lineage_reference: pkg.routing_decision.lineage_reference,
    integrity_status: pkg.validation.integrity_verified ? "VALID" : "INVALID",
  });
}

export function getDelegationRoutingFramework(): DelegationRoutingFramework {
  const pkg = buildDelegationRoutingPackage();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["deterministic-routing", "single-primary-owner", "authority-aware", "governance-approved", "contingency-prepared", "explainable", "replayable", "lineage-preserving", "non-executing", "integrity-protected"]),
      engine_version: ENGINE_VERSION,
      states: freezeArray(["PLANNING", "OWNER_SELECTED", "ROUTING_GENERATED", "CONTINGENCY_PREPARED", "EXPLANATION_GENERATED", "VALIDATED", "READY_FOR_EXECUTION", "BLOCKED", "WAITING_OPERATOR", "ROUTING_FAILED", "AUTHORITY_FAILURE", "DEPENDENCY_FAILURE", "FAILED"] as const),
    }),
    package: pkg,
    visibility: buildDelegationRoutingVisibilitySurface(pkg),
  });
}
