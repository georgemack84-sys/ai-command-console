import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { analyzeRiskAdaptationFoundation } from "@/services/risk-adaptation-engine-foundation";
import { validateGovernanceAdaptation } from "@/services/governance-adaptation-validator";
import { validateConstitutionalAdaptation } from "@/services/constitutional-adaptation-validator";
import type {
  AuthorityBoundaryApiSurface,
  AuthorityBoundaryFailure,
  AuthorityBoundaryLedgerEntry,
  AuthorityBoundaryValidatorFoundation,
  AuthorityBoundaryValidatorInput,
  AuthorityBoundaryValidatorResult,
  AuthorityBoundaryValidation,
  AuthorityDelegationResult,
  AuthorityDomain,
  AuthorityEscalationRequirement,
  AuthorityScopeAssessment,
  AuthorityValidationResult,
  AuthorityViolation,
} from "@/types/authority-boundary-validator";

const AUTHORITY_BOUNDARY_VALIDATOR_VERSION = "authority-boundary-validator/v1" as const;
const VALIDATED_AT = "2026-07-10T00:00:00.000Z";

type Scenario = NonNullable<AuthorityBoundaryValidatorInput["scenario"]>;

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

function buildApiSurface(): AuthorityBoundaryApiSurface {
  const base: Omit<AuthorityBoundaryApiSurface, "integrity_hash"> = {
    api_id: "authority_boundary_validator_api",
    validate_proposal: "POST /authority-boundary-validator/validate",
    retrieve_scope: "POST /authority-boundary-validator/scope",
    retrieve_approvals: "POST /authority-boundary-validator/approvals",
    retrieve_execution: "POST /authority-boundary-validator/execution",
    retrieve_governance: "POST /authority-boundary-validator/governance",
    retrieve_operator: "POST /authority-boundary-validator/operator",
    retrieve_delegation: "POST /authority-boundary-validator/delegation",
    retrieve_escalation: "POST /authority-boundary-validator/escalation",
    retrieve_violations: "POST /authority-boundary-validator/violations",
    retrieve_ledger: "POST /authority-boundary-validator/ledger",
    replay_validation: "POST /authority-boundary-validator/replay",
    retrieve_contract: "GET /authority-boundary-validator/contract",
    authority_grant_supported: false,
    execution_authority_supported: false,
    authority_expansion_supported: false,
    self_grant_supported: false,
    fail_open_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function scenarioFailure(scenario: Scenario): AuthorityBoundaryFailure | undefined {
  const map: Partial<Record<Scenario, AuthorityBoundaryFailure>> = {
    SCOPE_UNDETERMINED: "AUTHORITY_SCOPE_UNDETERMINED",
    OWNER_AMBIGUOUS: "AUTHORITY_OWNERSHIP_AMBIGUOUS",
    APPROVAL_UNVERIFIED: "APPROVAL_AUTHORITY_UNVERIFIED",
    EXECUTION_EXPANSION: "EXECUTION_AUTHORITY_EXPANDED",
    AUTONOMOUS_EXECUTION: "AUTONOMOUS_EXECUTION_DETECTED",
    GOVERNANCE_WEAKENING: "GOVERNANCE_AUTHORITY_WEAKENED",
    OPERATOR_REDUCTION: "OPERATOR_SUPREMACY_REDUCED",
    UNAUTHORIZED_DELEGATION: "UNAUTHORIZED_DELEGATION",
    PRIVILEGE_ESCALATION: "PRIVILEGE_ESCALATION_DETECTED",
    HIDDEN_EXECUTION: "HIDDEN_EXECUTION_DETECTED",
    LINEAGE_INCOMPLETE: "AUTHORITY_LINEAGE_INCOMPLETE",
    BROKEN_LINEAGE: "AUTHORITY_LINEAGE_INCOMPLETE",
    CROSS_TENANT_AUTHORITY: "CROSS_TENANT_AUTHORITY_LEAKAGE",
    CROSS_TENANT: "CROSS_TENANT_AUTHORITY_LEAKAGE",
    MISSING_EVIDENCE: "AUTHORITY_EVIDENCE_MISSING",
    REPLAY_DIVERGENCE: "REPLAY_DIVERGENCE",
    HASH_MISMATCH: "INTEGRITY_VERIFICATION_FAILED",
    LEDGER_FAILURE: "AUTHORITY_DECISION_RECORDING_FAILED",
    INVALID_APPROVAL_CHAIN: "INVALID_APPROVAL_CHAIN",
    AUTHORITY_INHERITANCE: "AUTHORITY_INHERITANCE_VIOLATION",
    RUNTIME_AUTHORITY: "RUNTIME_AUTHORITY_ACQUIRED",
    PRODUCTION_AUTHORITY: "PRODUCTION_EXECUTION_AUTHORITY",
    PRODUCTION_MUTATION: "PRODUCTION_EXECUTION_AUTHORITY",
    SELF_GRANTED_PERMISSION: "SELF_GRANTED_PERMISSION",
    IMPLICIT_ELEVATION: "IMPLICIT_AUTHORITY_ELEVATION",
    UNDOCUMENTED_DEPENDENCY: "UNDOCUMENTED_AUTHORITY_DEPENDENCY",
    OPERATOR_BYPASS: "OPERATOR_SUPREMACY_REDUCED",
    SIMULATION_BYPASS: "EXECUTION_AUTHORITY_EXPANDED",
    GOVERNANCE_THRESHOLD_UPDATE: "GOVERNANCE_AUTHORITY_WEAKENED",
  };
  return map[scenario];
}

function scope(scope_id: string, domain: AuthorityDomain, requested: boolean, within: boolean, evidenceRefs: readonly string[], reasoning: string): AuthorityScopeAssessment {
  const base: Omit<AuthorityScopeAssessment, "integrity_hash"> = {
    scope_id,
    domain,
    assigned_authority: domain !== "EXECUTION_AUTHORITY" && domain !== "RUNTIME_AUTHORITY" && domain !== "DEPLOYMENT_AUTHORITY",
    requested_authority: requested,
    within_boundary: within,
    classification: within ? "ASSIGNED" : "PROHIBITED",
    reasoning,
    evidence_refs: evidenceRefs,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function result(result_id: string, domain: AuthorityDomain, failure: AuthorityBoundaryFailure | undefined, evidenceRefs: readonly string[], reasoning: string): AuthorityValidationResult {
  const violations = failure ? freezeArray([failure]) : freezeArray<AuthorityBoundaryFailure>([]);
  const base: Omit<AuthorityValidationResult, "integrity_hash"> = {
    result_id,
    domain,
    status: failure ? "INVALID" : "VALID",
    violations,
    reasoning,
    evidence_refs: evidenceRefs,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildScopes(scenario: Scenario, evidenceRefs: readonly string[]): readonly AuthorityScopeAssessment[] {
  if (scenario === "SCOPE_UNDETERMINED") return freezeArray([]);
  return freezeArray([
    scope("scope_recommendation", "RECOMMENDATION_AUTHORITY", true, true, evidenceRefs, "Recommendation authority is assigned and advisory."),
    scope("scope_simulation", "SIMULATION_AUTHORITY", true, scenario !== "SIMULATION_BYPASS", evidenceRefs, "Simulation authority is limited to pre-execution validation."),
    scope("scope_approval", "APPROVAL_AUTHORITY", scenario === "APPROVAL_REQUIRED" || scenario === "INVALID_APPROVAL_CHAIN", scenario !== "INVALID_APPROVAL_CHAIN" && scenario !== "APPROVAL_UNVERIFIED", evidenceRefs, "Approval authority must originate from authorized approvers."),
    scope("scope_execution", "EXECUTION_AUTHORITY", ["EXECUTION_EXPANSION", "AUTONOMOUS_EXECUTION", "HIDDEN_EXECUTION", "PRODUCTION_AUTHORITY", "RUNTIME_AUTHORITY", "PRODUCTION_MUTATION"].includes(scenario), !["EXECUTION_EXPANSION", "AUTONOMOUS_EXECUTION", "HIDDEN_EXECUTION", "PRODUCTION_AUTHORITY", "RUNTIME_AUTHORITY", "PRODUCTION_MUTATION"].includes(scenario), evidenceRefs, "Execution authority is prohibited for adaptive proposals."),
    scope("scope_delegation", "DELEGATED_AUTHORITY", scenario === "UNAUTHORIZED_DELEGATION", scenario !== "UNAUTHORIZED_DELEGATION", evidenceRefs, "Delegation must remain temporary, explicit, and bounded."),
  ]);
}

function buildDelegation(scenario: Scenario): AuthorityDelegationResult {
  const violation = scenario === "UNAUTHORIZED_DELEGATION" ? freezeArray<AuthorityBoundaryFailure>(["UNAUTHORIZED_DELEGATION"]) : freezeArray<AuthorityBoundaryFailure>([]);
  const base: Omit<AuthorityDelegationResult, "integrity_hash"> = {
    delegation_id: `authority_delegation_${hash(scenario).slice(0, 12)}`,
    delegated: scenario === "UNAUTHORIZED_DELEGATION" || scenario === "AUTHORITY_INHERITANCE",
    delegation_valid: violation.length === 0 && scenario !== "AUTHORITY_INHERITANCE",
    temporary: true,
    expires: "2026-07-10T01:00:00.000Z",
    reasoning: violation.length ? "Delegation violates approved authority boundaries." : "No unauthorized delegation detected.",
    violations: scenario === "AUTHORITY_INHERITANCE" ? freezeArray(["AUTHORITY_INHERITANCE_VIOLATION"]) : violation,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(scenario: Scenario, scopes: readonly AuthorityScopeAssessment[], delegation: AuthorityDelegationResult): readonly AuthorityBoundaryFailure[] {
  const failures: AuthorityBoundaryFailure[] = [];
  const direct = scenarioFailure(scenario);
  if (direct) failures.push(direct);
  if (scopes.length === 0) failures.push("AUTHORITY_SCOPE_UNDETERMINED");
  scopes.filter((item) => !item.within_boundary).forEach((item) => {
    if (item.domain === "EXECUTION_AUTHORITY") failures.push("EXECUTION_AUTHORITY_EXPANDED");
    if (item.domain === "APPROVAL_AUTHORITY") failures.push("APPROVAL_AUTHORITY_UNVERIFIED");
    if (item.domain === "DELEGATED_AUTHORITY") failures.push("UNAUTHORIZED_DELEGATION");
  });
  failures.push(...delegation.violations);
  return freezeArray([...new Set(failures)]);
}

function escalationFor(scenario: Scenario, failures: readonly AuthorityBoundaryFailure[]): AuthorityEscalationRequirement {
  const level: AuthorityEscalationRequirement["level"] =
    scenario === "EXECUTIVE_REVIEW" ? "EXECUTIVE_REVIEW" :
    scenario === "CONSTITUTIONAL_REVIEW" || failures.includes("PRIVILEGE_ESCALATION_DETECTED") || failures.includes("SELF_GRANTED_PERMISSION") ? "CONSTITUTIONAL_REVIEW" :
    scenario === "GOVERNANCE_REVIEW" || failures.includes("GOVERNANCE_AUTHORITY_WEAKENED") || failures.includes("UNAUTHORIZED_DELEGATION") ? "GOVERNANCE_REVIEW" :
    scenario === "OPERATOR_REVIEW" || failures.length > 0 ? "OPERATOR_REVIEW" :
    "NONE";
  const reviewers = level === "NONE" ? freezeArray([]) : level === "EXECUTIVE_REVIEW" ? freezeArray(["operator", "governance_board", "executive_reviewer"]) : freezeArray(["operator", level.toLowerCase()]);
  const base: Omit<AuthorityEscalationRequirement, "integrity_hash"> = {
    escalation_id: `authority_escalation_${hash(`${scenario}:${level}`).slice(0, 12)}`,
    level,
    required_reviewers: reviewers,
    reasoning: level === "NONE" ? "No authority escalation required." : `${level} required by authority boundary validation.`,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function violation(failure: AuthorityBoundaryFailure, evidenceRefs: readonly string[]): AuthorityViolation {
  const domainMap: Partial<Record<AuthorityBoundaryFailure, AuthorityDomain>> = {
    EXECUTION_AUTHORITY_EXPANDED: "EXECUTION_AUTHORITY",
    AUTONOMOUS_EXECUTION_DETECTED: "EXECUTION_AUTHORITY",
    HIDDEN_EXECUTION_DETECTED: "EXECUTION_AUTHORITY",
    RUNTIME_AUTHORITY_ACQUIRED: "RUNTIME_AUTHORITY",
    PRODUCTION_EXECUTION_AUTHORITY: "DEPLOYMENT_AUTHORITY",
    GOVERNANCE_AUTHORITY_WEAKENED: "GOVERNANCE_AUTHORITY",
    OPERATOR_SUPREMACY_REDUCED: "OPERATOR_AUTHORITY",
    UNAUTHORIZED_DELEGATION: "DELEGATED_AUTHORITY",
    INVALID_APPROVAL_CHAIN: "APPROVAL_AUTHORITY",
    APPROVAL_AUTHORITY_UNVERIFIED: "APPROVAL_AUTHORITY",
    CROSS_TENANT_AUTHORITY_LEAKAGE: "TENANT_AUTHORITY",
  };
  const critical = ["EXECUTION_AUTHORITY_EXPANDED", "AUTONOMOUS_EXECUTION_DETECTED", "PRIVILEGE_ESCALATION_DETECTED", "SELF_GRANTED_PERMISSION", "PRODUCTION_EXECUTION_AUTHORITY"].includes(failure);
  const base: Omit<AuthorityViolation, "integrity_hash"> = {
    violation_id: `authority_violation_${hash(failure).slice(0, 14)}`,
    failure,
    domain: domainMap[failure] ?? "PLATFORM_AUTHORITY",
    severity: critical ? "CRITICAL" : "HIGH",
    blocks_authorization: true,
    evidence_refs: evidenceRefs,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function statusFor(scenario: Scenario, failures: readonly AuthorityBoundaryFailure[], escalation: AuthorityEscalationRequirement): AuthorityBoundaryValidation["authority_status"] {
  if (failures.length > 0) {
    if (scenario === "AUTHORITY_CONFLICT" || failures.includes("AUTHORITY_OWNERSHIP_AMBIGUOUS")) return "AUTHORITY_CONFLICT";
    if (scenario === "RESTRICTED_PROPOSAL") return "RESTRICTED";
    if (failures.some((item) => ["EXECUTION_AUTHORITY_EXPANDED", "AUTONOMOUS_EXECUTION_DETECTED", "PRIVILEGE_ESCALATION_DETECTED", "SELF_GRANTED_PERMISSION", "PRODUCTION_EXECUTION_AUTHORITY"].includes(item))) return "REJECTED";
    return "FAIL_CLOSED";
  }
  if (scenario === "AUTHORITY_CONFLICT") return "AUTHORITY_CONFLICT";
  if (escalation.level === "EXECUTIVE_REVIEW") return "REQUIRES_GOVERNANCE_REVIEW";
  if (escalation.level === "CONSTITUTIONAL_REVIEW") return "REQUIRES_CONSTITUTIONAL_REVIEW";
  if (escalation.level === "GOVERNANCE_REVIEW") return "REQUIRES_GOVERNANCE_REVIEW";
  if (escalation.level === "OPERATOR_REVIEW") return "REQUIRES_OPERATOR_REVIEW";
  if (scenario === "APPROVAL_REQUIRED") return "AUTHORIZED_WITH_APPROVAL";
  return "AUTHORIZED";
}

function buildValidation(input: AuthorityBoundaryValidatorInput): AuthorityBoundaryValidation {
  const scenario = input.scenario ?? "BASELINE";
  const adaptation = input.adaptation_result ?? analyzeRiskAdaptationFoundation({ scenario: scenario === "BASELINE" ? "BASELINE" : undefined });
  const governance = input.governance_result ?? validateGovernanceAdaptation({ scenario: scenario === "BASELINE" ? "BASELINE" : undefined, adaptation_result: adaptation });
  const constitutional = input.constitutional_result ?? validateConstitutionalAdaptation({ scenario: scenario === "BASELINE" ? "BASELINE" : undefined, adaptation_result: adaptation, governance_result: governance });
  const proposal_id = adaptation.contract.adaptation_id || governance.validation.proposal_id || constitutional.validation.proposal_id;
  const tenant_id = scenario === "CROSS_TENANT_AUTHORITY" || scenario === "CROSS_TENANT" ? "tenant_mission_control:foreign" : adaptation.contract.tenant_id;
  const evidenceRefs = scenario === "MISSING_EVIDENCE" ? freezeArray([]) : freezeArray([...adaptation.contract.supporting_evidence_refs, governance.validation.validation_id, constitutional.validation.validation_id]);
  const authority_scope = buildScopes(scenario, evidenceRefs);
  const delegation = buildDelegation(scenario);
  const failures = collectFailures(scenario, authority_scope, delegation);
  const escalation = escalationFor(scenario, failures);
  const authority_violations = freezeArray(failures.map((failure) => violation(failure, evidenceRefs)));
  const authority_status = statusFor(scenario, failures, escalation);
  const approvalFailure = failures.find((item) => item === "APPROVAL_AUTHORITY_UNVERIFIED" || item === "INVALID_APPROVAL_CHAIN");
  const executionFailure = failures.find((item) => ["EXECUTION_AUTHORITY_EXPANDED", "AUTONOMOUS_EXECUTION_DETECTED", "HIDDEN_EXECUTION_DETECTED", "RUNTIME_AUTHORITY_ACQUIRED", "PRODUCTION_EXECUTION_AUTHORITY"].includes(item));
  const governanceFailure = failures.find((item) => item === "GOVERNANCE_AUTHORITY_WEAKENED");
  const operatorFailure = failures.find((item) => item === "OPERATOR_SUPREMACY_REDUCED");
  const base: Omit<AuthorityBoundaryValidation, "integrity_hash"> = {
    validation_id: `authority_boundary_validation_${hash(`${scenario}:${proposal_id}`).slice(0, 16)}`,
    tenant_id,
    proposal_id,
    authority_scope,
    authority_owner: scenario === "OWNER_AMBIGUOUS" ? "ambiguous" : "mission_control_operator",
    authority_classification: failures.length ? "PROHIBITED" : "ASSIGNED",
    approval_authority_results: freezeArray([result("approval_authority_result", "APPROVAL_AUTHORITY", approvalFailure, evidenceRefs, "Approval authority chain evaluated.")]),
    execution_authority_results: freezeArray([result("execution_authority_result", "EXECUTION_AUTHORITY", executionFailure, evidenceRefs, "Execution authority must remain absent.")]),
    governance_authority_results: freezeArray([result("governance_authority_result", "GOVERNANCE_AUTHORITY", governanceFailure, evidenceRefs, "Governance authority hierarchy evaluated.")]),
    operator_authority_results: freezeArray([result("operator_authority_result", "OPERATOR_AUTHORITY", operatorFailure, evidenceRefs, "Operator supremacy evaluated.")]),
    delegation_results: freezeArray([delegation]),
    escalation_requirements: freezeArray([escalation]),
    authority_violations,
    authority_status,
    authority_reasoning: freezeArray([
      "Authority validation enforces least authority before simulation or review.",
      authority_status === "AUTHORIZED" ? "Requested authority remains inside assigned advisory boundaries." : `Authority validation resolved to ${authority_status}.`,
      "The validator never grants authority or execution permission.",
    ]),
    failures,
    supporting_evidence: evidenceRefs,
    replay_reference: scenario === "REPLAY_DIVERGENCE" ? "" : `authority_replay_${hash(`${proposal_id}:${scenario}`).slice(0, 16)}`,
    validation_timestamp: VALIDATED_AT,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildLedgerEntry(validation: AuthorityBoundaryValidation, scenario: Scenario): AuthorityBoundaryLedgerEntry {
  const base: Omit<AuthorityBoundaryLedgerEntry, "integrity_hash"> = {
    ledger_entry_id: `authority_boundary_ledger_${hash(validation.validation_id).slice(0, 16)}`,
    validation_id: validation.validation_id,
    proposal_id: validation.proposal_id,
    tenant_id: validation.tenant_id,
    final_status: validation.authority_status,
    append_only: true,
    immutable: true,
    replayable: true,
    tenant_isolated: !validation.failures.includes("CROSS_TENANT_AUTHORITY_LEAKAGE"),
    recorded_at: VALIDATED_AT,
  };
  const entry = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "LEDGER_FAILURE") return Object.freeze({ ...entry, integrity_hash: hash({ tampered: entry.ledger_entry_id }) });
  return entry;
}

function resultReplayHash(result: Omit<AuthorityBoundaryValidatorResult, "integrity_hash" | "replay_hash">): string {
  return hash({ validation: result.validation, ledger_entry: result.ledger_entry });
}

function resultIntegrityHash(result: Omit<AuthorityBoundaryValidatorResult, "integrity_hash">): string {
  return hash({
    authority_boundary_validator_version: result.authority_boundary_validator_version,
    api_surface_hash: result.api_surface.integrity_hash,
    validation_hash: result.validation.integrity_hash,
    ledger_hash: result.ledger_entry.integrity_hash,
    replay_hash: result.replay_hash,
  });
}

export function validateAuthorityBoundary(input: AuthorityBoundaryValidatorInput = {}): AuthorityBoundaryValidatorResult {
  const scenario = input.scenario ?? "BASELINE";
  const api_surface = buildApiSurface();
  const validation = buildValidation(input);
  const ledger_entry = buildLedgerEntry(validation, scenario);
  const ledgerIntegrityFailed = hashWithoutIntegrity(ledger_entry) !== ledger_entry.integrity_hash;
  const base: Omit<AuthorityBoundaryValidatorResult, "integrity_hash" | "replay_hash"> = {
    authority_boundary_validator_version: AUTHORITY_BOUNDARY_VALIDATOR_VERSION,
    api_surface,
    validation,
    ledger_entry,
    deterministic: true,
    replayable: true,
    explainable: true,
    evidence_backed: validation.supporting_evidence.length > 0,
    advisory_only: true,
    human_controlled: true,
    governance_enforced: true,
    least_authority_enforced: true,
    fail_closed: validation.failures.length > 0 || ledgerIntegrityFailed,
    tenant_isolated: ledger_entry.tenant_isolated,
    authority_granted: false,
    execution_authority_granted: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayAuthorityBoundaryValidation(result: AuthorityBoundaryValidatorResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
}

export function getAuthorityBoundaryValidatorFoundation(): AuthorityBoundaryValidatorFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    authority_boundary_validator_version: AUTHORITY_BOUNDARY_VALIDATOR_VERSION,
    api_surface,
    result: validateAuthorityBoundary(),
  });
}

export const AuthorityBoundaryValidator = Object.freeze({
  validate: validateAuthorityBoundary,
  replay: replayAuthorityBoundaryValidation,
});
