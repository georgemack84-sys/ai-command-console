import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { analyzeRiskAdaptationFoundation } from "@/services/risk-adaptation-engine-foundation";
import type {
  GovernanceAdaptationApiSurface,
  GovernanceAdaptationFailure,
  GovernanceAdaptationLedgerEntry,
  GovernanceAdaptationValidatorFoundation,
  GovernanceAdaptationValidatorInput,
  GovernanceAdaptationValidatorResult,
  GovernanceApprovalRequirement,
  GovernanceDependencyResult,
  GovernanceEscalationRequirement,
  GovernanceExceptionResult,
  GovernanceObligation,
  GovernancePolicyAssessment,
  GovernanceRuleEvaluation,
  GovernanceValidation,
  GovernanceValidationStatus,
} from "@/types/governance-adaptation-validator";

const GOVERNANCE_ADAPTATION_VALIDATOR_VERSION = "governance-adaptation-validator/v1" as const;
const POLICY_SET_VERSION = "governance-policy-set/phase-10.8.1";
const VALIDATED_AT = "2026-07-10T00:00:00.000Z";

type Scenario = NonNullable<GovernanceAdaptationValidatorInput["scenario"]>;

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

function buildApiSurface(): GovernanceAdaptationApiSurface {
  const base: Omit<GovernanceAdaptationApiSurface, "integrity_hash"> = {
    api_id: "governance_adaptation_validator_api",
    validate_proposal: "POST /governance-adaptation-validator/validate",
    retrieve_policies: "POST /governance-adaptation-validator/policies",
    retrieve_rules: "POST /governance-adaptation-validator/rules",
    retrieve_dependencies: "POST /governance-adaptation-validator/dependencies",
    retrieve_approvals: "POST /governance-adaptation-validator/approvals",
    retrieve_obligations: "POST /governance-adaptation-validator/obligations",
    retrieve_exceptions: "POST /governance-adaptation-validator/exceptions",
    retrieve_escalations: "POST /governance-adaptation-validator/escalations",
    retrieve_ledger: "POST /governance-adaptation-validator/ledger",
    replay_validation: "POST /governance-adaptation-validator/replay",
    retrieve_contract: "GET /governance-adaptation-validator/contract",
    execution_approval_supported: false,
    governance_bypass_supported: false,
    fail_open_supported: false,
    mutation_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function policy(policy_id: string, category: GovernancePolicyAssessment["category"], passed: boolean, evidence_refs: readonly string[], explanation: string): GovernancePolicyAssessment {
  const base: Omit<GovernancePolicyAssessment, "integrity_hash"> = {
    policy_id,
    category,
    version: POLICY_SET_VERSION,
    applicable: true,
    passed,
    explanation,
    evidence_refs,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function rule(rule_id: string, category: GovernanceRuleEvaluation["category"], status: GovernanceRuleEvaluation["status"], explanation: string, evidence_refs: readonly string[]): GovernanceRuleEvaluation {
  const base: Omit<GovernanceRuleEvaluation, "integrity_hash"> = { rule_id, category, status, explanation, evidence_refs };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function dependency(dependency_id: string, status: GovernanceDependencyResult["status"], explanation: string, evidence_refs: readonly string[]): GovernanceDependencyResult {
  const base: Omit<GovernanceDependencyResult, "integrity_hash"> = { dependency_id, status, explanation, evidence_refs };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function approval(approval_id: string, approver_role: string, sequence: number, justification: string): GovernanceApprovalRequirement {
  const base: Omit<GovernanceApprovalRequirement, "integrity_hash"> = { approval_id, approver_role, sequence, mandatory: true, justification };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function obligation(obligation_id: string, obligation_type: string, rationale: string, evidence_refs: readonly string[]): GovernanceObligation {
  const base: Omit<GovernanceObligation, "integrity_hash"> = { obligation_id, obligation_type, rationale, evidence_refs };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function exceptionResult(scenario: Scenario): GovernanceExceptionResult {
  const requested = scenario === "AUTHORIZED_EXCEPTION" || scenario === "UNAUTHORIZED_EXCEPTION" || scenario === "CONSTITUTIONAL_EXCEPTION";
  const decision: GovernanceExceptionResult["decision"] = scenario === "AUTHORIZED_EXCEPTION" ? "PERMITTED_WITH_APPROVAL" : requested ? "REJECTED" : "NONE_REQUESTED";
  const base: Omit<GovernanceExceptionResult, "integrity_hash"> = {
    exception_id: `governance_exception_${hash(scenario).slice(0, 12)}`,
    requested,
    decision,
    required_approvals: decision === "PERMITTED_WITH_APPROVAL" ? freezeArray(["operator", "governance_board"]) : freezeArray([]),
    explanation: requested ? `Exception request evaluated as ${decision}.` : "No governance exception requested.",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function escalation(scenario: Scenario, failures: readonly GovernanceAdaptationFailure[]): GovernanceEscalationRequirement {
  const level: GovernanceEscalationRequirement["level"] =
    scenario === "EXECUTIVE_REQUIRED" ? "EXECUTIVE" :
    failures.includes("CONSTITUTIONAL_EXCEPTION") ? "CONSTITUTIONAL" :
    failures.includes("POLICY_CONFLICT_DETECTED") || failures.includes("UNAUTHORIZED_EXCEPTION") ? "GOVERNANCE" :
    failures.length ? "OPERATOR" :
    "NONE";
  const reviewers = level === "NONE" ? freezeArray([]) : level === "EXECUTIVE" ? freezeArray(["operator", "governance_board", "executive_reviewer"]) : freezeArray(["operator", `${level.toLowerCase()}_reviewer`]);
  const base: Omit<GovernanceEscalationRequirement, "integrity_hash"> = {
    escalation_id: `governance_escalation_${hash(`${scenario}:${level}`).slice(0, 12)}`,
    level,
    required_reviewers: reviewers,
    rationale: level === "NONE" ? "No escalation trigger detected." : `${level} escalation required by governance validation.`,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildPolicies(scenario: Scenario, evidenceRefs: readonly string[]): readonly GovernancePolicyAssessment[] {
  if (scenario === "POLICY_DISCOVERY_FAILURE") return freezeArray([]);
  return freezeArray([
    policy("policy_governance_supremacy", "GOVERNANCE", scenario !== "POLICY_CONFLICT", evidenceRefs, "Governance policy supremacy must be preserved."),
    policy("policy_constitutional_alignment", "CONSTITUTIONAL", scenario !== "CONSTITUTIONAL_EXCEPTION", evidenceRefs, "Constitutional obligations cannot be waived."),
    policy("policy_authority_operator_control", "AUTHORITY", scenario !== "OPERATOR_BYPASS", evidenceRefs, "Operator authority remains mandatory and advisory-only."),
    policy("policy_replay_audit_evidence", "REPLAY", scenario !== "MISSING_REPLAY" && scenario !== "MISSING_EVIDENCE", evidenceRefs, "Replay and audit evidence must be available."),
    policy("policy_tenant_isolation", "TENANT", scenario !== "CROSS_TENANT", evidenceRefs, "Validation must remain tenant-isolated."),
  ]);
}

function buildRules(scenario: Scenario, evidenceRefs: readonly string[]): readonly GovernanceRuleEvaluation[] {
  if (scenario === "RULE_DISCOVERY_FAILURE") return freezeArray([]);
  return freezeArray([
    rule("rule_advisory_only", "REQUIRED", scenario === "PRODUCTION_MUTATION" ? "FAILED" : "PASSED", "Validator cannot grant execution authority.", evidenceRefs),
    rule("rule_simulation_required", "REQUIRED", scenario === "SIMULATION_BYPASS" ? "FAILED" : "PASSED", "Simulation cannot be bypassed downstream.", evidenceRefs),
    rule("rule_no_governance_bypass", "PROHIBITED", scenario === "GOVERNANCE_THRESHOLD_UPDATE" ? "FAILED" : "PASSED", "Governance threshold mutation is prohibited.", evidenceRefs),
    rule("rule_restricted_proposals", "RESTRICTED", scenario === "RESTRICTED_PROPOSAL" ? "FAILED" : "PASSED", "Restricted proposals require rejection before simulation.", evidenceRefs),
  ]);
}

function buildDependencies(scenario: Scenario, evidenceRefs: readonly string[]): readonly GovernanceDependencyResult[] {
  return freezeArray([
    dependency("dependency_policy_set", scenario === "POLICY_DISCOVERY_FAILURE" ? "MISSING" : "SATISFIED", "Applicable governance policies resolved.", evidenceRefs),
    dependency("dependency_constitutional_validation", scenario === "MISSING_CONSTITUTIONAL" ? "MISSING" : "SATISFIED", "Constitutional validation reference required.", evidenceRefs),
    dependency("dependency_authority_validation", scenario === "MISSING_AUTHORITY" ? "MISSING" : "SATISFIED", "Authority reference required.", evidenceRefs),
    dependency("dependency_replay_readiness", scenario === "MISSING_REPLAY" || scenario === "REPLAY_DIVERGENCE" ? "UNVERIFIABLE" : "SATISFIED", "Replay readiness required before downstream processing.", evidenceRefs),
    dependency("dependency_audit_readiness", scenario === "MISSING_EVIDENCE" ? "MISSING" : "SATISFIED", "Audit evidence must be complete.", evidenceRefs),
    dependency("dependency_lineage", scenario === "BROKEN_LINEAGE" ? "MISSING" : "SATISFIED", "Governance lineage must be preserved.", evidenceRefs),
    dependency("dependency_verifiability", scenario === "DEPENDENCY_UNVERIFIABLE" ? "UNVERIFIABLE" : "SATISFIED", "Dependencies must be deterministically verifiable.", evidenceRefs),
  ]);
}

function buildApprovals(scenario: Scenario): readonly GovernanceApprovalRequirement[] {
  if (scenario === "APPROVAL_UNDETERMINED") return freezeArray([]);
  const approvals = [
    approval("approval_operator_review", "operator", 1, "Operator approval is required before any downstream action."),
    approval("approval_governance_board", "governance_board", 2, "Governance review is required for adaptive proposals."),
  ];
  if (scenario === "EXECUTIVE_REQUIRED") approvals.push(approval("approval_executive_review", "executive_reviewer", 3, "Executive review required by risk threshold."));
  return freezeArray(approvals);
}

function buildObligations(scenario: Scenario, evidenceRefs: readonly string[]): readonly GovernanceObligation[] {
  if (scenario === "OBLIGATION_INCOMPLETE") return freezeArray([obligation("obligation_audit", "AUDIT", "Audit obligation retained, but replay and reporting obligations are missing.", evidenceRefs)]);
  return freezeArray([
    obligation("obligation_documentation", "DOCUMENTATION", "Governance rationale must be documented.", evidenceRefs),
    obligation("obligation_audit", "AUDIT", "Audit-ready evidence must be retained.", evidenceRefs),
    obligation("obligation_replay", "REPLAY", "Validation must replay to an identical outcome.", evidenceRefs),
    obligation("obligation_monitoring", "MONITORING", "Downstream monitoring obligation must be recorded.", evidenceRefs),
  ]);
}

function collectFailures(
  scenario: Scenario,
  policies: readonly GovernancePolicyAssessment[],
  rules: readonly GovernanceRuleEvaluation[],
  dependencies: readonly GovernanceDependencyResult[],
  approvals: readonly GovernanceApprovalRequirement[],
  obligations: readonly GovernanceObligation[],
  exception_result: GovernanceExceptionResult,
): readonly GovernanceAdaptationFailure[] {
  const failures: GovernanceAdaptationFailure[] = [];
  if (policies.length === 0) failures.push("POLICIES_UNRESOLVED");
  if (rules.length === 0) failures.push("RULES_MISSING");
  if (rules.some((item) => item.status === "FAILED")) failures.push("RULE_FAILED");
  if (scenario === "POLICY_CONFLICT" || policies.some((item) => !item.passed && item.policy_id.includes("governance_supremacy"))) failures.push("POLICY_CONFLICT_DETECTED");
  if (dependencies.some((item) => item.status === "UNVERIFIABLE")) failures.push("DEPENDENCY_UNVERIFIABLE");
  if (approvals.length === 0) failures.push("APPROVALS_UNDETERMINED");
  if (obligations.length < 4) failures.push("OBLIGATIONS_INCOMPLETE");
  if (scenario === "UNAUTHORIZED_EXCEPTION") failures.push("UNAUTHORIZED_EXCEPTION");
  if (scenario === "CONSTITUTIONAL_EXCEPTION" || policies.some((item) => !item.passed && item.category === "CONSTITUTIONAL")) failures.push("CONSTITUTIONAL_EXCEPTION");
  if (scenario === "GOVERNANCE_THRESHOLD_UPDATE" || scenario === "MISSING_GOVERNANCE") failures.push("GOVERNANCE_BYPASS_DETECTED");
  if (scenario === "SIMULATION_BYPASS" || scenario === "MISSING_SIMULATION") failures.push("SIMULATION_BYPASS_DETECTED");
  if (scenario === "OPERATOR_BYPASS") failures.push("OPERATOR_AUTHORITY_REMOVAL_DETECTED");
  if (scenario === "MISSING_REPLAY") failures.push("REPLAY_EVIDENCE_UNAVAILABLE");
  if (scenario === "MISSING_EVIDENCE") failures.push("AUDIT_EVIDENCE_INCOMPLETE", "EVIDENCE_INSUFFICIENT");
  if (scenario === "BROKEN_LINEAGE") failures.push("LINEAGE_MISSING");
  if (scenario === "HASH_MISMATCH") failures.push("INTEGRITY_HASH_FAILED");
  if (scenario === "CROSS_TENANT") failures.push("TENANT_ISOLATION_FAILED");
  if (scenario === "REPLAY_DIVERGENCE") failures.push("REPLAY_DIVERGENCE");
  if (scenario === "LEDGER_FAILURE") failures.push("LEDGER_RECORDING_FAILED");
  if (scenario === "NONDETERMINISTIC") failures.push("NONDETERMINISTIC_VALIDATION");
  if (scenario === "FAIL_OPEN") failures.push("FAIL_OPEN_BEHAVIOR");
  if (exception_result.decision === "REJECTED" && exception_result.requested && scenario !== "CONSTITUTIONAL_EXCEPTION") failures.push("UNAUTHORIZED_EXCEPTION");
  return freezeArray([...new Set(failures)]);
}

function statusFor(scenario: Scenario, failures: readonly GovernanceAdaptationFailure[], approvals: readonly GovernanceApprovalRequirement[]): GovernanceValidationStatus {
  if (failures.length > 0) {
    if (failures.includes("POLICY_CONFLICT_DETECTED")) return "POLICY_CONFLICT";
    if (scenario === "RESTRICTED_PROPOSAL" || failures.includes("RULE_FAILED")) return "RESTRICTED";
    if (failures.includes("CONSTITUTIONAL_EXCEPTION") || failures.includes("INTEGRITY_HASH_FAILED")) return "REJECTED";
    return "FAIL_CLOSED";
  }
  if (scenario === "EXECUTIVE_REQUIRED") return "REQUIRES_EXECUTIVE_REVIEW";
  if (approvals.length > 0) return "COMPLIANT_WITH_APPROVAL";
  return "COMPLIANT";
}

function buildValidation(input: GovernanceAdaptationValidatorInput): GovernanceValidation {
  const scenario = input.scenario ?? "BASELINE";
  const adaptation = input.adaptation_result ?? analyzeRiskAdaptationFoundation({ scenario: scenario === "BASELINE" ? "BASELINE" : undefined });
  const proposal_id = adaptation.contract.adaptation_id || `proposal_${hash(scenario).slice(0, 12)}`;
  const tenant_id = scenario === "CROSS_TENANT" ? "tenant_mission_control:foreign" : adaptation.contract.tenant_id;
  const evidenceRefs = scenario === "MISSING_EVIDENCE" ? freezeArray([]) : freezeArray([...adaptation.contract.supporting_evidence_refs, ...adaptation.contract.replay_refs]);
  const evaluated_policies = buildPolicies(scenario, evidenceRefs);
  const rule_results = buildRules(scenario, evidenceRefs);
  const dependency_results = buildDependencies(scenario, evidenceRefs);
  const required_approvals = buildApprovals(scenario);
  const governance_obligations = buildObligations(scenario, evidenceRefs);
  const exception_result = exceptionResult(scenario);
  const failures = collectFailures(scenario, evaluated_policies, rule_results, dependency_results, required_approvals, governance_obligations, exception_result);
  const escalation_requirement = escalation(scenario, failures);
  const governance_status = statusFor(scenario, failures, required_approvals);
  const base: Omit<GovernanceValidation, "integrity_hash"> = {
    validation_id: `governance_validation_${hash(`${scenario}:${proposal_id}`).slice(0, 16)}`,
    tenant_id,
    proposal_id,
    policy_set_version: POLICY_SET_VERSION,
    evaluated_policies,
    rule_results,
    dependency_results,
    required_approvals,
    governance_obligations,
    exception_results: freezeArray([exception_result]),
    escalation_requirements: freezeArray([escalation_requirement]),
    governance_status,
    governance_reasoning: freezeArray([
      "All adaptive proposals are governance-gated before simulation or downstream processing.",
      governance_status === "FAIL_CLOSED" ? "Validation failed closed because mandatory governance evidence or dependencies were unavailable." : `Validation resolved to ${governance_status}.`,
      "The validator is advisory-only and grants no execution authority.",
    ]),
    failures,
    evidence_references: evidenceRefs,
    replay_reference: scenario === "MISSING_REPLAY" ? "" : `governance_replay_${hash(`${proposal_id}:${scenario}`).slice(0, 16)}`,
    validation_timestamp: VALIDATED_AT,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildLedgerEntry(validation: GovernanceValidation, scenario: Scenario): GovernanceAdaptationLedgerEntry {
  const base: Omit<GovernanceAdaptationLedgerEntry, "integrity_hash"> = {
    ledger_entry_id: `governance_adaptation_ledger_${hash(validation.validation_id).slice(0, 16)}`,
    validation_id: validation.validation_id,
    proposal_id: validation.proposal_id,
    tenant_id: validation.tenant_id,
    final_status: validation.governance_status,
    append_only: true,
    immutable: true,
    replayable: true,
    tenant_isolated: !validation.failures.includes("TENANT_ISOLATION_FAILED"),
    recorded_at: VALIDATED_AT,
  };
  const entry = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "LEDGER_FAILURE") return Object.freeze({ ...entry, integrity_hash: hash({ tampered: entry.ledger_entry_id }) });
  return entry;
}

function resultReplayHash(result: Omit<GovernanceAdaptationValidatorResult, "integrity_hash" | "replay_hash">): string {
  return hash({ validation: result.validation, ledger_entry: result.ledger_entry });
}

function resultIntegrityHash(result: Omit<GovernanceAdaptationValidatorResult, "integrity_hash">): string {
  return hash({
    governance_adaptation_validator_version: result.governance_adaptation_validator_version,
    api_surface_hash: result.api_surface.integrity_hash,
    validation_hash: result.validation.integrity_hash,
    ledger_hash: result.ledger_entry.integrity_hash,
    replay_hash: result.replay_hash,
  });
}

export function validateGovernanceAdaptation(input: GovernanceAdaptationValidatorInput = {}): GovernanceAdaptationValidatorResult {
  const scenario = input.scenario ?? "BASELINE";
  const api_surface = buildApiSurface();
  const validation = buildValidation(input);
  const ledger_entry = buildLedgerEntry(validation, scenario);
  const ledgerIntegrityFailed = hashWithoutIntegrity(ledger_entry) !== ledger_entry.integrity_hash;
  const base: Omit<GovernanceAdaptationValidatorResult, "integrity_hash" | "replay_hash"> = {
    governance_adaptation_validator_version: GOVERNANCE_ADAPTATION_VALIDATOR_VERSION,
    api_surface,
    validation,
    ledger_entry,
    deterministic: true,
    replayable: true,
    explainable: true,
    evidence_backed: validation.evidence_references.length > 0,
    advisory_only: true,
    operator_controlled: true,
    fail_closed: validation.failures.length > 0 || ledgerIntegrityFailed,
    tenant_isolated: ledger_entry.tenant_isolated,
    execution_authority_granted: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayGovernanceAdaptationValidation(result: GovernanceAdaptationValidatorResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
}

export function getGovernanceAdaptationValidatorFoundation(): GovernanceAdaptationValidatorFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    governance_adaptation_validator_version: GOVERNANCE_ADAPTATION_VALIDATOR_VERSION,
    api_surface,
    result: validateGovernanceAdaptation(),
  });
}

export const GovernanceAdaptationValidator = Object.freeze({
  validate: validateGovernanceAdaptation,
  replay: replayGovernanceAdaptationValidation,
});
