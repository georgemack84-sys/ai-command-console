import { runAdaptationStateMachine } from "@/services/adaptation-state-machine";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type { AdaptationStateMachineResult } from "@/types/adaptation-state-machine";
import type {
  AdaptiveAuthorityLevel,
  AuthorityBindingDecision,
  AuthorityBindingValidationState,
  AuthorityDecision,
  AuthorityGovernanceBinding,
  AuthorityGovernanceBindingFoundation,
  AuthorityGovernanceBindingInput,
  AuthorityGovernanceBindingResult,
  AuthorityGovernanceCertificationReport,
  AuthorityGovernanceCheck,
  AuthorityGovernanceFailure,
  AuthorityGovernanceLedgerRecord,
  AuthorityGovernanceValidation,
  AuthorityReplayModel,
  ProhibitedAuthorityLevel,
} from "@/types/authority-governance-binding";
import type { VisibilityRole } from "@/types/decision-observability-contract";

const BINDING_VERSION = "authority-governance-binding/v1" as const;

export const AUTHORITY_GOVERNANCE_CHECKS: readonly AuthorityGovernanceCheck[] = Object.freeze(["STATE_MACHINE", "AUTHORITY_SCOPE", "AUTHORITY_LEVEL", "GOVERNANCE_BINDING", "CONSTITUTIONAL_BINDING", "OPERATOR_SUPREMACY", "SEPARATION_OF_DUTIES", "REPLAY_BINDING", "CERTIFICATION_BINDING", "TENANT_ISOLATION", "INTEGRITY", "ADVISORY_ONLY"]);
export const ADAPTIVE_AUTHORITY_LEVELS: readonly AdaptiveAuthorityLevel[] = Object.freeze(["OBSERVATION", "ANALYSIS", "RECOMMENDATION", "SIMULATION", "ADVISORY_SUPPORT"]);

type Scenario = NonNullable<AuthorityGovernanceBindingInput["scenario"]>;

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

function state(pass: boolean): AuthorityBindingValidationState {
  return pass ? "PASS" : "FAIL";
}

function ctx(source: AdaptationStateMachineResult) {
  return {
    tenant_id: source.state_record.tenant_id,
    mission_scope: source.state_record.mission_scope,
    replay_ref: source.replay_hash,
  };
}

function visibleToRole(source: AdaptationStateMachineResult, role: VisibilityRole): boolean {
  return source.learning_permission.boundary_model.contract_foundation.final_certification.production_readiness.security_certification.observability_certification.ledger_certification.operator_workflow_certification.intelligence_certification.governance_certification.replay_certification.deterministic_certification.foundation_certification.certification_framework.analytics_result.operator_dashboard.replay_monitoring.governance_visibility.priority_dashboard.conflict_visualization.timeline_result.dashboard_result.observability_result.authorizations.some((auth) => auth.role === role && auth.permissions.includes("VIEW_DECISIONS"));
}

function requestedAuthority(input: AuthorityGovernanceBindingInput, scenario: Scenario): AdaptiveAuthorityLevel | ProhibitedAuthorityLevel {
  if (input.requested_authority) return input.requested_authority;
  if (scenario === "PROHIBITED_AUTHORITY" || scenario === "EXECUTION_AUTHORITY" || scenario === "HIDDEN_EXECUTION_AUTHORITY") return "EXECUTION_AUTHORITY";
  if (scenario === "CONSTITUTIONAL_MUTATION") return "CONSTITUTIONAL_AUTHORITY";
  if (scenario === "GOVERNANCE_BYPASS") return "GOVERNANCE_AUTHORITY";
  if (scenario === "PRIVILEGE_ESCALATION") return "APPROVAL_AUTHORITY";
  return "RECOMMENDATION";
}

function isAllowedAuthority(level: AdaptiveAuthorityLevel | ProhibitedAuthorityLevel): level is AdaptiveAuthorityLevel {
  return ADAPTIVE_AUTHORITY_LEVELS.includes(level as AdaptiveAuthorityLevel);
}

function buildBinding(source: AdaptationStateMachineResult, input: AuthorityGovernanceBindingInput, scenario: Scenario): AuthorityGovernanceBinding {
  const c = ctx(source);
  const requested = requestedAuthority(input, scenario);
  const validAuthority = isAllowedAuthority(requested) ? requested : "NONE";
  const base: Omit<AuthorityGovernanceBinding, "integrity_hash"> = {
    binding_id: "authority_governance_binding",
    tenant_id: scenario === "TENANT_CROSSOVER" ? `${c.tenant_id}:foreign` : c.tenant_id,
    mission_scope: c.mission_scope,
    adaptive_component: "adaptive-recommendation-quality-analyzer",
    authority_scope: scenario === "AUTHORITY_SCOPE_EXCEEDED" ? "TENANT" : "PROPOSAL",
    authority_level: requested,
    requested_authority: requested,
    validated_authority: scenario === "AUTHORITY_SCOPE_EXCEEDED" ? "NONE" : validAuthority,
    governance_policy_refs: scenario === "MISSING_GOVERNANCE" || scenario === "GOVERNANCE_BYPASS" ? freezeArray([]) : source.transition_request.governance_refs,
    constitutional_refs: scenario === "CONSTITUTIONAL_FAILURE" || scenario === "CONSTITUTIONAL_MUTATION" ? freezeArray([]) : freezeArray(["constitution:adaptive-authority", "constitution:operator-supremacy"]),
    operator_authority_required: true,
    governance_review_required: true,
    certification_required: true,
    separation_of_duties_verified: !["SEPARATION_OF_DUTIES", "UNAUTHORIZED_DELEGATION", "RECURSIVE_DELEGATION"].includes(scenario),
    authority_validation_status: isAllowedAuthority(requested) && scenario !== "AUTHORITY_SCOPE_EXCEEDED" ? "PASS" : "REJECT",
    replay_refs: scenario === "MISSING_REPLAY" ? freezeArray([]) : source.transition_request.replay_refs,
    certification_refs: scenario === "MISSING_CERTIFICATION" ? freezeArray([]) : source.transition_request.certification_refs,
    created_at: "2026-07-05T10:00:50.000Z",
  };
  const built = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "HASH_MISMATCH") return Object.freeze({ ...built, integrity_hash: hash({ tampered: built.binding_id }) });
  return built;
}

function collectFailures(input: {
  stateMachine: AdaptationStateMachineResult;
  binding: AuthorityGovernanceBinding;
  decision: AuthorityDecision | undefined;
  replay: AuthorityReplayModel | undefined;
  ledger: readonly AuthorityGovernanceLedgerRecord[];
  role: VisibilityRole;
  scenario: Scenario;
}): readonly AuthorityGovernanceFailure[] {
  const failures: AuthorityGovernanceFailure[] = [];
  if (input.stateMachine.validation.validation_status !== "VALID") failures.push("ADAPTATION_STATE_MACHINE_INVALID");
  if (input.binding.authority_scope !== "PROPOSAL" && input.binding.authority_scope !== "ADAPTIVE_COMPONENT") failures.push("AUTHORITY_EXCEEDS_ASSIGNED_SCOPE");
  if (!isAllowedAuthority(input.binding.requested_authority)) failures.push("AUTHORITY_LEVEL_PROHIBITED");
  if (!input.binding.governance_policy_refs.length) failures.push("GOVERNANCE_APPROVAL_MISSING");
  if (input.scenario === "GOVERNANCE_BYPASS") failures.push("GOVERNANCE_BYPASS");
  if (!input.binding.constitutional_refs.length || input.scenario === "CONSTITUTIONAL_FAILURE") failures.push("CONSTITUTIONAL_VALIDATION_FAILED");
  if (input.scenario === "CONSTITUTIONAL_MUTATION") failures.push("CONSTITUTIONAL_MUTATION_ATTEMPTED");
  if (input.scenario === "OPERATOR_BYPASS") failures.push("OPERATOR_AUTHORITY_BYPASSED");
  if (input.scenario === "OPERATOR_SUPREMACY_VIOLATION") failures.push("OPERATOR_SUPREMACY_VIOLATED");
  if (!input.binding.separation_of_duties_verified) failures.push("SEPARATION_OF_DUTIES_VIOLATED");
  if (input.scenario === "UNAUTHORIZED_DELEGATION") failures.push("UNAUTHORIZED_DELEGATION");
  if (input.scenario === "RECURSIVE_DELEGATION") failures.push("RECURSIVE_DELEGATION");
  if (input.scenario === "IMPLICIT_PERMISSION") failures.push("IMPLICIT_PERMISSION");
  if (input.scenario === "PRIVILEGE_ESCALATION") failures.push("PRIVILEGE_ESCALATION");
  if (input.scenario === "HIDDEN_AUTHORITY") failures.push("HIDDEN_AUTHORITY");
  if (input.scenario === "HIDDEN_EXECUTION_AUTHORITY") failures.push("HIDDEN_EXECUTION_AUTHORITY");
  if (!input.binding.replay_refs.length || input.replay?.deterministic_reconstruction === false) failures.push("REPLAY_REFERENCES_MISSING");
  if (!input.binding.certification_refs.length) failures.push("CERTIFICATION_PREREQUISITES_MISSING");
  if (input.binding.tenant_id !== input.stateMachine.state_record.tenant_id || input.scenario === "TENANT_CROSSOVER") failures.push("TENANT_AUTHORITY_CROSSOVER");
  if (
    hashWithoutIntegrity(input.binding) !== input.binding.integrity_hash
    || (input.decision && hashWithoutIntegrity(input.decision) !== input.decision.integrity_hash)
    || (input.replay && hashWithoutIntegrity(input.replay) !== input.replay.integrity_hash)
    || input.ledger.some((entry) => hashWithoutIntegrity(entry) !== entry.integrity_hash)
  ) failures.push("INTEGRITY_HASH_MISMATCH");
  if (input.ledger.some((entry) => !entry.append_only || entry.deleted) || (input.decision?.validation_outcome === "PASS" && failures.length > 0)) failures.push("FAIL_OPEN_AUTHORITY_BEHAVIOR");
  if (!visibleToRole(input.stateMachine, input.role)) failures.push("AUTHORIZATION_FAILURE");
  if (input.scenario === "EXECUTION_AUTHORITY" || input.binding.requested_authority === "EXECUTION_AUTHORITY") failures.push("EXECUTION_AUTHORITY_GRANTED");
  return freezeArray([...new Set(failures)]);
}

function buildDecision(binding: AuthorityGovernanceBinding, failures: readonly AuthorityGovernanceFailure[], scenario: Scenario): AuthorityDecision {
  const validation: AuthorityBindingDecision = scenario === "FAIL_OPEN" ? "PASS" : failures.length ? "REJECT" : "PASS";
  const base: Omit<AuthorityDecision, "integrity_hash"> = {
    decision_id: "authority_governance_decision",
    binding_id: binding.binding_id,
    adaptive_component: binding.adaptive_component,
    requested_authority: binding.requested_authority,
    validated_authority: validation === "PASS" ? binding.validated_authority : "NONE",
    governance_validation: binding.governance_policy_refs.length ? "PASS" : "REJECT",
    constitutional_validation: binding.constitutional_refs.length ? "PASS" : "REJECT",
    operator_validation: scenario === "OPERATOR_BYPASS" || scenario === "OPERATOR_SUPREMACY_VIOLATION" ? "REJECT" : "PASS",
    separation_of_duties_status: binding.separation_of_duties_verified ? "PASS" : "REJECT",
    validation_outcome: validation,
    reason: validation === "PASS" ? "Adaptive authority remains advisory and bound by governance." : "Authority governance binding rejected the adaptive request.",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildReplay(binding: AuthorityGovernanceBinding, decision: AuthorityDecision, scenario: Scenario): AuthorityReplayModel {
  const base: Omit<AuthorityReplayModel, "integrity_hash"> = {
    replay_model_id: "authority_governance_replay_model",
    binding_id: binding.binding_id,
    authority_requested: binding.requested_authority,
    authority_assigned: decision.validated_authority,
    governance_refs: binding.governance_policy_refs,
    constitutional_refs: binding.constitutional_refs,
    operator_required: binding.operator_authority_required,
    validation_outcome: decision.validation_outcome,
    replay_refs: binding.replay_refs,
    deterministic_reconstruction: scenario !== "MISSING_REPLAY",
    integrity_reproducible: scenario !== "HASH_MISMATCH",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildLedger(binding: AuthorityGovernanceBinding, decision: AuthorityDecision, scenario: Scenario): readonly AuthorityGovernanceLedgerRecord[] {
  const event: Omit<AuthorityGovernanceLedgerRecord, "integrity_hash"> = {
    record_id: "authority_governance_ledger_001",
    adaptive_component: binding.adaptive_component,
    tenant_id: binding.tenant_id,
    mission_scope: binding.mission_scope,
    requested_authority: binding.requested_authority,
    validated_authority: decision.validated_authority,
    governance_validation: decision.governance_validation,
    constitutional_validation: decision.constitutional_validation,
    operator_validation: decision.operator_validation,
    separation_of_duties_status: decision.separation_of_duties_status,
    replay_refs: binding.replay_refs,
    event_timestamp: "2026-07-05T10:00:51.000Z",
    sequence_number: 1,
    append_only: (scenario === "FAIL_OPEN" ? false : true) as true,
    deleted: false,
  };
  return freezeArray([Object.freeze({ ...event, integrity_hash: hashWithoutIntegrity(event) })]);
}

function buildReport(binding: AuthorityGovernanceBinding, replay: AuthorityReplayModel, failures: readonly AuthorityGovernanceFailure[]): AuthorityGovernanceCertificationReport {
  const has = (failure: AuthorityGovernanceFailure) => failures.includes(failure);
  const base: Omit<AuthorityGovernanceCertificationReport, "integrity_hash"> = {
    report_id: "authority_governance_certification_report",
    tenant_id: binding.tenant_id,
    checks: AUTHORITY_GOVERNANCE_CHECKS,
    authority_scope_valid: !has("AUTHORITY_EXCEEDS_ASSIGNED_SCOPE"),
    authority_level_valid: !has("AUTHORITY_LEVEL_PROHIBITED") && !has("EXECUTION_AUTHORITY_GRANTED"),
    governance_bound: !has("GOVERNANCE_APPROVAL_MISSING") && !has("GOVERNANCE_BYPASS"),
    constitutionally_valid: !has("CONSTITUTIONAL_VALIDATION_FAILED") && !has("CONSTITUTIONAL_MUTATION_ATTEMPTED"),
    operator_supremacy_preserved: !has("OPERATOR_AUTHORITY_BYPASSED") && !has("OPERATOR_SUPREMACY_VIOLATED"),
    separation_of_duties_verified: !has("SEPARATION_OF_DUTIES_VIOLATED"),
    replay_verified: replay.deterministic_reconstruction && !has("REPLAY_REFERENCES_MISSING"),
    certification_bound: !has("CERTIFICATION_PREREQUISITES_MISSING"),
    tenant_isolation_preserved: !has("TENANT_AUTHORITY_CROSSOVER"),
    advisory_only_preserved: !has("AUTHORITY_LEVEL_PROHIBITED") && !has("EXECUTION_AUTHORITY_GRANTED"),
    integrity_verified: !has("INTEGRITY_HASH_MISMATCH"),
    failure_analysis: failures,
    certification_decision: state(failures.length === 0),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildValidation(failures: readonly AuthorityGovernanceFailure[]): AuthorityGovernanceValidation {
  const has = (failure: AuthorityGovernanceFailure) => failures.includes(failure);
  const base: Omit<AuthorityGovernanceValidation, "integrity_hash"> = {
    validation_id: "authority_governance_binding_validation",
    validation_status: failures.length ? "BLOCKED" : "VALID",
    state_machine_valid: !has("ADAPTATION_STATE_MACHINE_INVALID"),
    authority_within_scope: !has("AUTHORITY_EXCEEDS_ASSIGNED_SCOPE"),
    prohibited_authority_absent: !has("AUTHORITY_LEVEL_PROHIBITED") && !has("EXECUTION_AUTHORITY_GRANTED"),
    governance_approved: !has("GOVERNANCE_APPROVAL_MISSING") && !has("GOVERNANCE_BYPASS"),
    constitutional_valid: !has("CONSTITUTIONAL_VALIDATION_FAILED") && !has("CONSTITUTIONAL_MUTATION_ATTEMPTED"),
    operator_supremacy_preserved: !has("OPERATOR_AUTHORITY_BYPASSED") && !has("OPERATOR_SUPREMACY_VIOLATED"),
    separation_of_duties_verified: !has("SEPARATION_OF_DUTIES_VIOLATED"),
    replay_bound: !has("REPLAY_REFERENCES_MISSING"),
    certification_bound: !has("CERTIFICATION_PREREQUISITES_MISSING"),
    tenant_isolated: !has("TENANT_AUTHORITY_CROSSOVER"),
    integrity_verified: !has("INTEGRITY_HASH_MISMATCH"),
    advisory_only: !has("AUTHORITY_LEVEL_PROHIBITED") && !has("EXECUTION_AUTHORITY_GRANTED"),
    authorization_valid: !has("AUTHORIZATION_FAILURE"),
    execution_authority_absent: !has("EXECUTION_AUTHORITY_GRANTED"),
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<AuthorityGovernanceBindingResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    binding: result.binding,
    decision: result.authority_decision,
    replay: result.replay_model,
    report: result.certification_report,
    ledger: result.authority_ledger,
    validation: result.validation,
  });
}

export function runAuthorityGovernanceBinding(input: AuthorityGovernanceBindingInput = {}): AuthorityGovernanceBindingResult {
  const scenario = input.scenario ?? "BASELINE";
  const role = input.role ?? "OPERATOR";
  const adaptation_state = input.adaptation_state ?? runAdaptationStateMachine({ scenario: scenario === "STATE_MACHINE_INVALID" ? "PERMISSION_INVALID" : "BASELINE" });
  const binding = buildBinding(adaptation_state, input, scenario);
  const preFailures = collectFailures({ stateMachine: adaptation_state, binding, decision: undefined, replay: undefined, ledger: [], role, scenario });
  const authority_decision = buildDecision(binding, preFailures, scenario);
  const replay_model = buildReplay(binding, authority_decision, scenario);
  const authority_ledger = buildLedger(binding, authority_decision, scenario);
  const failures = collectFailures({ stateMachine: adaptation_state, binding, decision: authority_decision, replay: replay_model, ledger: authority_ledger, role, scenario });
  const finalDecision = buildDecision(binding, failures, scenario);
  const finalReplay = buildReplay(binding, finalDecision, scenario);
  const certification_report = buildReport(binding, finalReplay, failures);
  const validation = buildValidation(failures);
  const base: Omit<AuthorityGovernanceBindingResult, "integrity_hash" | "replay_hash"> = {
    binding_version: BINDING_VERSION,
    adaptation_state,
    binding,
    authority_decision: finalDecision,
    replay_model: finalReplay,
    certification_report,
    authority_ledger,
    validation,
    deterministic: true,
    replayable: true,
    advisory_only: true,
    authority_granted: finalDecision.validation_outcome === "PASS" && failures.length === 0,
    permits_execution: false,
    mutates_governance: false,
    execution_authority_granted: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayAuthorityGovernanceBinding(result: AuthorityGovernanceBindingResult): boolean {
  return resultReplayHash(result) === result.replay_hash && hashWithoutIntegrity(result) === result.integrity_hash;
}

export function computeAuthorityBindingHash(record: Omit<AuthorityGovernanceBinding, "integrity_hash"> | AuthorityGovernanceBinding): string {
  return hashWithoutIntegrity(record);
}

export function getAuthorityGovernanceBindingFoundation(): AuthorityGovernanceBindingFoundation {
  return Object.freeze({
    binding_version: BINDING_VERSION,
    checks: AUTHORITY_GOVERNANCE_CHECKS,
    allowed_authority_levels: ADAPTIVE_AUTHORITY_LEVELS,
    result: runAuthorityGovernanceBinding(),
  });
}

export const AuthorityGovernanceBindingLayer = Object.freeze({
  run: runAuthorityGovernanceBinding,
  replay: replayAuthorityGovernanceBinding,
});
