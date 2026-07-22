import { createGovernanceDecisionRecord, validateGovernanceDecisionRecord } from "@/services/governance-decision-filter-contract";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type { GovernanceDecisionRecord } from "@/types/governance-decision-filter-contract";
import type {
  GovernanceOverrideResult,
  GovernancePolicyCategory,
  GovernancePolicyEnforcementLevel,
  GovernancePolicyRule,
  GovernancePolicyValidation,
  GovernancePolicyValidationEngineFoundation,
  GovernancePolicyValidationFailureReason,
  GovernancePolicyValidationInput,
  GovernancePolicyValidationObservability,
  GovernancePolicyValidationReplay,
  GovernancePolicyValidationResult,
  GovernancePolicyValidationState,
  GovernanceRuleEvaluation,
  GovernanceRuleLedgerRecord,
  GovernanceValidationEvidence,
} from "@/types/governance-policy-validation-engine";

const ENGINE_VERSION = "governance-policy-validation-engine/v1" as const;
const AUTHORIZED_COMPONENT = "governance-policy-validation-engine";
const NOW = "2026-07-04T00:18:00.000Z";

export const GOVERNANCE_POLICY_CATEGORIES: readonly GovernancePolicyCategory[] = Object.freeze([
  "Constitutional Governance Reference",
  "Regulatory Compliance",
  "Operational Governance",
  "Mission Governance",
  "Security Governance",
  "Data Governance",
  "Privacy Governance",
  "Risk Governance",
  "Financial Governance",
  "Resource Governance",
  "Certification Governance",
  "Tenant Governance",
]);

export const GOVERNANCE_POLICY_ENFORCEMENT_LEVELS: readonly GovernancePolicyEnforcementLevel[] = Object.freeze(["ADVISORY", "CONDITIONAL", "MANDATORY", "BLOCKING"]);
export const GOVERNANCE_POLICY_VALIDATION_STATES: readonly GovernancePolicyValidationState[] = Object.freeze(["VALID", "CONDITIONAL", "VIOLATION", "UNKNOWN"]);

const CATEGORY_PRECEDENCE: Readonly<Record<GovernancePolicyCategory, number>> = Object.freeze({
  "Constitutional Governance Reference": 1,
  "Regulatory Compliance": 2,
  "Security Governance": 3,
  "Data Governance": 3,
  "Privacy Governance": 3,
  "Risk Governance": 3,
  "Financial Governance": 3,
  "Resource Governance": 3,
  "Certification Governance": 3,
  "Tenant Governance": 3,
  "Mission Governance": 4,
  "Operational Governance": 5,
});

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity(value: object): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function normalize(values: readonly string[] | undefined): readonly string[] {
  return Object.freeze([...new Set((values ?? []).filter((value) => value.length > 0))].sort());
}

export function computeGovernancePolicyRuleHash(rule: Omit<GovernancePolicyRule, "integrity_hash"> | GovernancePolicyRule): string {
  return hashWithoutIntegrity(rule);
}

function policyRule(input: Omit<GovernancePolicyRule, "integrity_hash">): GovernancePolicyRule {
  return Object.freeze({ ...input, integrity_hash: computeGovernancePolicyRuleHash(input) });
}

export function createGovernancePolicyRules(): readonly GovernancePolicyRule[] {
  return Object.freeze([
    policyRule({
      policy_rule_id: "policy_constitutional_reference_guard",
      policy_name: "Constitutional governance reference guard",
      policy_version: "governance-policy-rule/v1",
      policy_category: "Constitutional Governance Reference",
      evaluation_priority: 1,
      evaluation_order: 1,
      enforcement_level: "BLOCKING",
      rule_expression: "constitutional_bypass not in action_refs",
      required_evidence: ["evidence_decision_candidate_alpha"],
      required_approvals: [],
      prohibited_actions: ["constitutional_bypass"],
      escalation_requirements: ["governance_review"],
      override_permissions: [],
      policy_status: "ACTIVE",
      effective_date: "2026-01-01T00:00:00.000Z",
      replay_ref: "replay_policy_constitutional_reference_guard",
    }),
    policyRule({
      policy_rule_id: "policy_regulatory_approval_required",
      policy_name: "Regulatory governance approval required",
      policy_version: "governance-policy-rule/v1",
      policy_category: "Regulatory Compliance",
      evaluation_priority: 2,
      evaluation_order: 2,
      enforcement_level: "MANDATORY",
      rule_expression: "approval_regulatory_governance in approvals",
      required_evidence: ["evidence_decision_candidate_alpha"],
      required_approvals: ["approval_regulatory_governance"],
      prohibited_actions: ["unregistered_external_transfer"],
      escalation_requirements: ["regulatory_governance_escalation"],
      override_permissions: ["override_regulatory_governance_board"],
      policy_status: "ACTIVE",
      effective_date: "2026-01-01T00:00:00.000Z",
      replay_ref: "replay_policy_regulatory_approval_required",
    }),
    policyRule({
      policy_rule_id: "policy_mission_scope_alignment",
      policy_name: "Mission governance scope alignment",
      policy_version: "governance-policy-rule/v1",
      policy_category: "Mission Governance",
      evaluation_priority: 4,
      evaluation_order: 3,
      enforcement_level: "MANDATORY",
      rule_expression: "mission_scope_bypass not in action_refs",
      required_evidence: ["evidence_decision_candidate_alpha"],
      required_approvals: [],
      prohibited_actions: ["mission_scope_bypass"],
      escalation_requirements: ["mission_governance_review"],
      override_permissions: ["override_mission_governance_council"],
      policy_status: "ACTIVE",
      effective_date: "2026-01-01T00:00:00.000Z",
      replay_ref: "replay_policy_mission_scope_alignment",
    }),
    policyRule({
      policy_rule_id: "policy_operational_change_control",
      policy_name: "Operational change control",
      policy_version: "governance-policy-rule/v1",
      policy_category: "Operational Governance",
      evaluation_priority: 5,
      evaluation_order: 4,
      enforcement_level: "CONDITIONAL",
      rule_expression: "approval_change_control in approvals",
      required_evidence: ["evidence_decision_candidate_alpha"],
      required_approvals: ["approval_change_control"],
      prohibited_actions: ["delete_audit_log", "execute_without_governance"],
      escalation_requirements: ["operator_change_review"],
      override_permissions: ["override_change_control_board"],
      policy_status: "ACTIVE",
      effective_date: "2026-01-01T00:00:00.000Z",
      replay_ref: "replay_policy_operational_change_control",
    }),
  ]);
}

function orderedRules(rules: readonly GovernancePolicyRule[]): readonly GovernancePolicyRule[] {
  return Object.freeze([...rules].sort((a, b) => (
    CATEGORY_PRECEDENCE[a.policy_category] - CATEGORY_PRECEDENCE[b.policy_category]
    || a.evaluation_priority - b.evaluation_priority
    || a.evaluation_order - b.evaluation_order
    || a.policy_rule_id.localeCompare(b.policy_rule_id)
  )));
}

function validateRules(rules: readonly GovernancePolicyRule[]): readonly GovernancePolicyValidationFailureReason[] {
  const failures: GovernancePolicyValidationFailureReason[] = [];
  if (rules.length === 0) failures.push("MISSING_POLICIES");
  const ids = rules.map((rule) => rule.policy_rule_id);
  if (new Set(ids).size !== ids.length) failures.push("DUPLICATE_POLICY_IDENTIFIER");
  for (const rule of rules) {
    if (rule.policy_version !== "governance-policy-rule/v1") failures.push("INVALID_POLICY_VERSION");
    if (!GOVERNANCE_POLICY_CATEGORIES.includes(rule.policy_category) || !GOVERNANCE_POLICY_ENFORCEMENT_LEVELS.includes(rule.enforcement_level)) failures.push("CORRUPTED_POLICY_DEFINITION");
    if (rule.policy_status !== "ACTIVE" || rule.effective_date > NOW || (rule.expiration_date && rule.expiration_date <= NOW)) failures.push("POLICY_NOT_ACTIVE");
    if (!rule.rule_expression || rule.rule_expression.includes("??")) failures.push("MALFORMED_RULE_EXPRESSION");
    if (!rule.replay_ref) failures.push("UNRESOLVED_POLICY_REFERENCE");
    if (computeGovernancePolicyRuleHash(rule) !== rule.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  }
  const ordered = orderedRules(rules);
  for (let index = 0; index < rules.length; index += 1) {
    if (rules[index].policy_rule_id !== ordered[index]?.policy_rule_id) failures.push("CONFLICTING_POLICY_PRECEDENCE");
  }
  return Object.freeze([...new Set(failures)] as GovernancePolicyValidationFailureReason[]);
}

function overrideHash(result: Omit<GovernanceOverrideResult, "integrity_hash"> | GovernanceOverrideResult): string {
  return hashWithoutIntegrity(result);
}

function evaluateOverride(rule: GovernancePolicyRule, overrideRefs: readonly string[]): GovernanceOverrideResult | undefined {
  const matching = overrideRefs.find((ref) => rule.override_permissions.includes(ref) || ref.includes(rule.policy_rule_id));
  if (!matching) return undefined;
  const authorized = rule.override_permissions.includes(matching);
  const base: Omit<GovernanceOverrideResult, "integrity_hash"> = {
    override_id: `override_${rule.policy_rule_id}_${hash(matching).slice(0, 12)}`,
    policy_rule_id: rule.policy_rule_id,
    authorized,
    scope_valid: authorized,
    approval_ref: matching,
    evidence_ref: `evidence_${matching}`,
    replay_ref: `replay_${matching}`,
  };
  return Object.freeze({ ...base, integrity_hash: overrideHash(base) });
}

function evaluationHash(evaluation: Omit<GovernanceRuleEvaluation, "integrity_hash"> | GovernanceRuleEvaluation): string {
  return hashWithoutIntegrity(evaluation);
}

export function evaluateGovernancePolicyRule(input: {
  rule: GovernancePolicyRule;
  decision: GovernanceDecisionRecord;
  approvals: readonly string[];
  action_refs: readonly string[];
  override_refs: readonly string[];
}): GovernanceRuleEvaluation {
  const evidence_satisfied = input.rule.required_evidence.every((ref) => input.decision.evidence_refs.includes(ref));
  const approvals_satisfied = input.rule.required_approvals.every((ref) => input.approvals.includes(ref));
  const prohibited_actions_detected = normalize(input.action_refs.filter((action) => input.rule.prohibited_actions.includes(action)));
  const override = evaluateOverride(input.rule, input.override_refs);
  const override_applied = Boolean(override?.authorized && prohibited_actions_detected.length === 0);
  const validation_state: GovernancePolicyValidationState = prohibited_actions_detected.length > 0
    ? "VIOLATION"
    : !evidence_satisfied
      ? "UNKNOWN"
      : approvals_satisfied || override_applied
        ? "VALID"
        : input.rule.enforcement_level === "CONDITIONAL" || input.rule.required_approvals.length > 0
          ? "CONDITIONAL"
          : "VALID";
  const escalation_required = validation_state === "CONDITIONAL" || validation_state === "VIOLATION" || validation_state === "UNKNOWN";
  const base: Omit<GovernanceRuleEvaluation, "integrity_hash"> = {
    evaluation_id: `evaluation_${input.decision.governance_decision_id}_${input.rule.policy_rule_id}`,
    policy_rule_id: input.rule.policy_rule_id,
    validation_state,
    evidence_satisfied,
    approvals_satisfied,
    prohibited_actions_detected,
    escalation_required,
    override_applied,
    explanation: `Rule ${input.rule.policy_rule_id} evaluated as ${validation_state}; evidence=${evidence_satisfied}; approvals=${approvals_satisfied}; prohibited=${prohibited_actions_detected.join(",") || "none"}.`,
    replay_ref: `${input.rule.replay_ref}_evaluation`,
  };
  return Object.freeze({ ...base, integrity_hash: evaluationHash(base) });
}

function conflictsFor(evaluations: readonly GovernanceRuleEvaluation[], rules: readonly GovernancePolicyRule[]): readonly string[] {
  const conflicts: string[] = [];
  const byAction = new Map<string, string[]>();
  for (const rule of rules) {
    for (const action of rule.prohibited_actions) {
      byAction.set(action, [...(byAction.get(action) ?? []), rule.policy_rule_id]);
    }
  }
  for (const [action, ids] of byAction) {
    if (ids.length > 1) conflicts.push(`overlapping_prohibition:${action}:${ids.sort().join("+")}`);
  }
  const highestViolation = evaluations.find((evaluation) => evaluation.validation_state === "VIOLATION");
  const lowerValid = highestViolation ? evaluations.some((evaluation) => evaluation.validation_state === "VALID" && evaluation.policy_rule_id !== highestViolation.policy_rule_id) : false;
  if (highestViolation && lowerValid) conflicts.push(`policy_precedence_violation:${highestViolation.policy_rule_id}`);
  return Object.freeze(conflicts.sort());
}

function evidenceHash(evidence: Omit<GovernanceValidationEvidence, "integrity_hash"> | GovernanceValidationEvidence): string {
  return hashWithoutIntegrity(evidence);
}

function evidenceState(evaluations: readonly GovernanceRuleEvaluation[], conflicts: readonly string[]): GovernancePolicyValidationState {
  if (evaluations.some((evaluation) => evaluation.validation_state === "VIOLATION")) return "VIOLATION";
  if (evaluations.some((evaluation) => evaluation.validation_state === "UNKNOWN")) return "UNKNOWN";
  if (conflicts.length > 0 || evaluations.some((evaluation) => evaluation.validation_state === "CONDITIONAL")) return "CONDITIONAL";
  return "VALID";
}

function buildEvidence(input: {
  decision: GovernanceDecisionRecord;
  rules: readonly GovernancePolicyRule[];
  evaluations: readonly GovernanceRuleEvaluation[];
  overrides: readonly GovernanceOverrideResult[];
  approvals: readonly string[];
  conflicts: readonly string[];
}): GovernanceValidationEvidence {
  const escalation_requirements = normalize(input.rules.filter((rule) => input.evaluations.some((evaluation) => evaluation.policy_rule_id === rule.policy_rule_id && evaluation.escalation_required)).flatMap((rule) => [...rule.escalation_requirements]));
  const validation_state = evidenceState(input.evaluations, input.conflicts);
  const base: Omit<GovernanceValidationEvidence, "integrity_hash"> = {
    validation_id: `governance_policy_validation_${input.decision.governance_decision_id}`,
    evaluated_rules: input.rules.map((rule) => rule.policy_rule_id),
    satisfied_rules: input.evaluations.filter((evaluation) => evaluation.validation_state === "VALID").map((evaluation) => evaluation.policy_rule_id),
    violated_rules: input.evaluations.filter((evaluation) => evaluation.validation_state === "VIOLATION").map((evaluation) => evaluation.policy_rule_id),
    conditional_rules: input.evaluations.filter((evaluation) => evaluation.validation_state === "CONDITIONAL" || evaluation.validation_state === "UNKNOWN").map((evaluation) => evaluation.policy_rule_id),
    approvals_verified: normalize(input.approvals),
    prohibited_actions_detected: normalize(input.evaluations.flatMap((evaluation) => [...evaluation.prohibited_actions_detected])),
    governance_conflicts: input.conflicts,
    escalation_requirements,
    override_results: input.overrides,
    validation_state,
    replay_ref: `replay_governance_policy_validation_${input.decision.governance_decision_id}`,
  };
  return Object.freeze({ ...base, integrity_hash: evidenceHash(base) });
}

function ledgerHash(record: Omit<GovernanceRuleLedgerRecord, "integrity_hash"> | GovernanceRuleLedgerRecord): string {
  return hashWithoutIntegrity(record);
}

function writeLedger(evidence: GovernanceValidationEvidence, decision: GovernanceDecisionRecord, evaluations: readonly GovernanceRuleEvaluation[]): readonly GovernanceRuleLedgerRecord[] {
  const base: Omit<GovernanceRuleLedgerRecord, "integrity_hash"> = {
    ledger_id: `governance_rule_ledger_${evidence.validation_id}`,
    governance_decision_id: decision.governance_decision_id,
    evaluated_policy_ids: evidence.evaluated_rules,
    evaluation_results: evaluations.map((evaluation) => evaluation.validation_state),
    governance_conflicts: evidence.governance_conflicts,
    override_results: evidence.override_results.map((override) => override.override_id),
    escalation_results: evidence.escalation_requirements,
    validation_state: evidence.validation_state,
    evidence_refs: decision.evidence_refs,
    replay_refs: [evidence.replay_ref, ...evaluations.map((evaluation) => evaluation.replay_ref)],
    created_at: NOW,
  };
  return Object.freeze([Object.freeze({ ...base, integrity_hash: ledgerHash(base) })]);
}

function validationResult(failures: readonly GovernancePolicyValidationFailureReason[]): GovernancePolicyValidation {
  const unique = Object.freeze([...new Set(failures)] as GovernancePolicyValidationFailureReason[]);
  const has = (failure: GovernancePolicyValidationFailureReason) => unique.includes(failure);
  return Object.freeze({
    validation_state: unique.length === 0 ? "VALID" : "REJECTED",
    fail_closed: unique.some((failure) => failure !== "INVALID_APPROVALS"),
    failures: unique,
    checks: Object.freeze({
      contract_valid: !has("GOVERNANCE_CONTRACT_INVALID"),
      policies_present: !has("MISSING_POLICIES"),
      policies_active: !has("POLICY_NOT_ACTIVE") && !has("INVALID_POLICY_VERSION"),
      policy_integrity_valid: !has("CORRUPTED_POLICY_DEFINITION") && !has("INTEGRITY_HASH_MISMATCH"),
      evidence_complete: !has("MISSING_EVIDENCE"),
      approvals_satisfied: !has("INVALID_APPROVALS"),
      prohibited_actions_absent: !has("PROHIBITED_ACTION_DETECTED"),
      conflicts_absent: !has("GOVERNANCE_CONFLICT_DETECTED") && !has("CONFLICTING_POLICY_PRECEDENCE"),
      overrides_authorized: !has("UNAUTHORIZED_OVERRIDE"),
      replay_valid: !has("REPLAY_DIVERGENCE"),
      advisory_only: !has("ADVISORY_ONLY_VIOLATION"),
    }),
  });
}

function resultReplayHash(result: Omit<GovernancePolicyValidationResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    governance_decision: result.governance_decision,
    policy_rules: result.policy_rules,
    evaluations: result.evaluations,
    evidence: result.evidence,
    ledger_records: result.ledger_records,
    validation: result.validation,
    failures: result.failures,
  });
}

function failResult(decision: GovernanceDecisionRecord, failures: readonly GovernancePolicyValidationFailureReason[], rules: readonly GovernancePolicyRule[] = []): GovernancePolicyValidationResult {
  const validation = validationResult(failures);
  const evidence = buildEvidence({ decision, rules, evaluations: [], overrides: [], approvals: [], conflicts: [] });
  const base: Omit<GovernancePolicyValidationResult, "integrity_hash" | "replay_hash"> = {
    policy_validation_status: "FAIL",
    fail_closed: true,
    governance_decision: decision,
    policy_rules: rules,
    evaluations: Object.freeze([]),
    evidence,
    ledger_records: Object.freeze([]),
    validation,
    failures: validation.failures,
    deterministic: true,
    advisory_only: true,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function validateGovernancePolicy(input: GovernancePolicyValidationInput = {}): GovernancePolicyValidationResult {
  if (input.authorized_component && input.authorized_component !== AUTHORIZED_COMPONENT) return failResult(input.governance_decision ?? createGovernanceDecisionRecord(), ["UNAUTHORIZED_POLICY_VALIDATOR_ACCESS"]);
  const decision = input.governance_decision ?? createGovernanceDecisionRecord({ governance_status: "PENDING", lifecycle_state: "READY_FOR_ENFORCEMENT" });
  const contractValidation = validateGovernanceDecisionRecord(decision);
  const rules = orderedRules(input.policy_rules ?? createGovernancePolicyRules());
  const ruleFailures = validateRules(rules);
  if (contractValidation.validation_state !== "VALID") return failResult(decision, ["GOVERNANCE_CONTRACT_INVALID"], rules);
  if (ruleFailures.length > 0 && ruleFailures.some((failure) => failure !== "CONFLICTING_POLICY_PRECEDENCE")) return failResult(decision, ruleFailures, rules);
  const approvals = normalize(input.approvals ?? ["approval_regulatory_governance", "approval_change_control"]);
  const actions = normalize(input.action_refs ?? []);
  const overrideRefs = normalize(input.override_refs ?? []);
  const evaluations = Object.freeze(rules.map((rule) => evaluateGovernancePolicyRule({ rule, decision, approvals, action_refs: actions, override_refs: overrideRefs })));
  const overrides = Object.freeze(rules.map((rule) => evaluateOverride(rule, overrideRefs)).filter((override): override is GovernanceOverrideResult => Boolean(override)));
  const conflicts = conflictsFor(evaluations, rules);
  const evidence = buildEvidence({ decision, rules, evaluations, overrides, approvals, conflicts });
  const ledger_records = writeLedger(evidence, decision, evaluations);
  const failures: GovernancePolicyValidationFailureReason[] = [...ruleFailures];
  if (evaluations.some((evaluation) => !evaluation.evidence_satisfied)) failures.push("MISSING_EVIDENCE");
  if (evaluations.some((evaluation) => !evaluation.approvals_satisfied && evaluation.validation_state === "CONDITIONAL")) failures.push("INVALID_APPROVALS");
  if (evidence.prohibited_actions_detected.length > 0) failures.push("PROHIBITED_ACTION_DETECTED");
  if (overrides.some((override) => !override.authorized || !override.scope_valid)) failures.push("UNAUTHORIZED_OVERRIDE");
  if (conflicts.length > 0) failures.push("GOVERNANCE_CONFLICT_DETECTED");
  if (evaluations.some((evaluation) => evaluationHash(evaluation) !== evaluation.integrity_hash) || evidenceHash(evidence) !== evidence.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  if (ledger_records.some((record) => ledgerHash(record) !== record.integrity_hash)) failures.push("GOVERNANCE_RULE_LEDGER_FAILED");
  const validation = validationResult(failures);
  const base: Omit<GovernancePolicyValidationResult, "integrity_hash" | "replay_hash"> = {
    policy_validation_status: validation.validation_state === "VALID" ? "PASS" : "FAIL",
    fail_closed: validation.fail_closed,
    governance_decision: decision,
    policy_rules: rules,
    evaluations,
    evidence,
    ledger_records,
    validation,
    failures: validation.failures,
    deterministic: true,
    advisory_only: true,
  };
  const replay_hash = resultReplayHash(base);
  if (input.replay_expected_hash && input.replay_expected_hash !== replay_hash) return failResult(decision, ["REPLAY_DIVERGENCE"], rules);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayGovernancePolicyValidation(result: GovernancePolicyValidationResult): GovernancePolicyValidationReplay {
  const reconstructed = resultReplayHash(result);
  const replay_valid = reconstructed === result.replay_hash
    && result.policy_rules.every((rule) => computeGovernancePolicyRuleHash(rule) === rule.integrity_hash)
    && result.evaluations.every((evaluation) => evaluationHash(evaluation) === evaluation.integrity_hash)
    && evidenceHash(result.evidence) === result.evidence.integrity_hash
    && result.ledger_records.every((record) => ledgerHash(record) === record.integrity_hash);
  const failures: GovernancePolicyValidationFailureReason[] = replay_valid ? [] : ["REPLAY_DIVERGENCE"];
  const base: Omit<GovernancePolicyValidationReplay, "integrity_hash"> = {
    replay_id: "replay_governance_policy_validation_engine",
    replay_valid,
    governance_decision_id: result.governance_decision.governance_decision_id,
    evaluated_policy_refs: result.policy_rules.map((rule) => rule.policy_rule_id),
    evidence_ref: result.evidence.validation_id,
    ledger_refs: result.ledger_records.map((record) => record.ledger_id),
    expected_replay_hash: result.replay_hash,
    reconstructed_replay_hash: reconstructed,
    failures: Object.freeze(failures),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

export function buildGovernancePolicyValidationObservability(result: GovernancePolicyValidationResult): GovernancePolicyValidationObservability {
  return Object.freeze({
    policy_loading_events: result.policy_rules.length,
    rule_evaluation_events: result.evaluations.length,
    conflict_detection_events: result.evidence.governance_conflicts.length,
    override_evaluation_events: result.evidence.override_results.length,
    escalation_events: result.evidence.escalation_requirements.length,
    validation_completion_events: 1,
    ledger_append_events: result.ledger_records.length,
    replay_verification_events: replayGovernancePolicyValidation(result).replay_valid ? 1 : 0,
  });
}

export function getGovernancePolicyValidationEngineFoundation(): GovernancePolicyValidationEngineFoundation {
  const result = validateGovernancePolicy();
  const replay = replayGovernancePolicyValidation(result);
  return Object.freeze({
    engine_version: ENGINE_VERSION,
    policy_categories: GOVERNANCE_POLICY_CATEGORIES,
    enforcement_levels: GOVERNANCE_POLICY_ENFORCEMENT_LEVELS,
    validation_states: GOVERNANCE_POLICY_VALIDATION_STATES,
    result,
    replay,
    observability: buildGovernancePolicyValidationObservability(result),
  });
}

export const GovernancePolicyValidationEngine = Object.freeze({
  rules: createGovernancePolicyRules,
  evaluateRule: evaluateGovernancePolicyRule,
  validate: validateGovernancePolicy,
  replay: replayGovernancePolicyValidation,
});
