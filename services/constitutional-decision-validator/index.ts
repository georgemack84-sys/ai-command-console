import { createGovernanceDecisionRecord, validateGovernanceDecisionRecord } from "@/services/governance-decision-filter-contract";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { validateGovernancePolicy } from "@/services/governance-policy-validation-engine";
import type { GovernanceDecisionRecord } from "@/types/governance-decision-filter-contract";
import type { GovernancePolicyValidationResult } from "@/types/governance-policy-validation-engine";
import type {
  ConstitutionalDecisionLedgerRecord,
  ConstitutionalDecisionValidation,
  ConstitutionalDecisionValidationFailureReason,
  ConstitutionalDecisionValidationInput,
  ConstitutionalDecisionValidationObservability,
  ConstitutionalDecisionValidationReplay,
  ConstitutionalDecisionValidationResult,
  ConstitutionalDecisionValidatorFoundation,
  ConstitutionalEnforcementLevel,
  ConstitutionalEvidenceReport,
  ConstitutionalRule,
  ConstitutionalRuleCategory,
  ConstitutionalRuleEvaluation,
  ConstitutionalValidationResultState,
} from "@/types/constitutional-decision-validator";

const VALIDATOR_VERSION = "constitutional-decision-validator/v1" as const;
const AUTHORIZED_COMPONENT = "constitutional-decision-validator";
const NOW = "2026-07-04T00:22:00.000Z";

export const CONSTITUTIONAL_RULE_CATEGORIES: readonly ConstitutionalRuleCategory[] = Object.freeze([
  "Constitutional Supremacy",
  "Advisory-Only Operation",
  "Authority Boundaries",
  "Operator Supremacy",
  "Governance Supremacy",
  "Security Principles",
  "Explainability",
  "Deterministic Execution",
  "Certification Requirements",
  "Tenant Isolation Reference",
  "Immutable Audit",
  "Replay Integrity Reference",
]);

export const CONSTITUTIONAL_ENFORCEMENT_LEVELS: readonly ConstitutionalEnforcementLevel[] = Object.freeze(["REFERENCE", "MANDATORY", "BLOCKING"]);
export const CONSTITUTIONAL_VALIDATION_RESULTS: readonly ConstitutionalValidationResultState[] = Object.freeze(["COMPLIANT", "CONDITIONAL", "VIOLATION", "UNKNOWN"]);

const CATEGORY_PRECEDENCE: Readonly<Record<ConstitutionalRuleCategory, number>> = Object.freeze({
  "Constitutional Supremacy": 1,
  "Advisory-Only Operation": 2,
  "Authority Boundaries": 3,
  "Operator Supremacy": 3,
  "Governance Supremacy": 4,
  "Security Principles": 5,
  Explainability: 6,
  "Deterministic Execution": 6,
  "Certification Requirements": 7,
  "Tenant Isolation Reference": 8,
  "Immutable Audit": 8,
  "Replay Integrity Reference": 8,
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

export function computeConstitutionalRuleHash(rule: Omit<ConstitutionalRule, "integrity_hash"> | ConstitutionalRule): string {
  return hashWithoutIntegrity(rule);
}

function constitutionalRule(input: Omit<ConstitutionalRule, "integrity_hash">): ConstitutionalRule {
  return Object.freeze({ ...input, integrity_hash: computeConstitutionalRuleHash(input) });
}

export function createConstitutionalRules(): readonly ConstitutionalRule[] {
  return Object.freeze([
    constitutionalRule({
      constitutional_rule_id: "constitution_supremacy_guard",
      rule_name: "Constitutional supremacy guard",
      rule_version: "constitutional-rule/v1",
      constitutional_article: "Article I",
      constitutional_principle: "Constitutional Supremacy",
      priority: 1,
      evaluation_order: 1,
      enforcement_level: "BLOCKING",
      rule_expression: "constitutional_bypass not in action_refs",
      authority_constraints: ["advisory_authority"],
      advisory_constraints: ["advisory_only"],
      prohibited_actions: ["constitutional_bypass", "governance_override_constitution"],
      conflict_resolution_priority: 1,
      required_evidence: ["evidence_decision_candidate_alpha"],
      policy_references: ["policy_constitutional_reference_guard"],
      replay_ref: "replay_constitution_supremacy_guard",
    }),
    constitutionalRule({
      constitutional_rule_id: "constitution_advisory_only",
      rule_name: "Advisory-only operation",
      rule_version: "constitutional-rule/v1",
      constitutional_article: "Article II",
      constitutional_principle: "Advisory-Only Operation",
      priority: 2,
      evaluation_order: 2,
      enforcement_level: "BLOCKING",
      rule_expression: "execution actions absent",
      authority_constraints: ["advisory_authority"],
      advisory_constraints: ["advisory_only"],
      prohibited_actions: ["autonomous_execution", "direct_command", "hidden_execution", "unauthorized_automation"],
      conflict_resolution_priority: 2,
      required_evidence: ["evidence_decision_candidate_alpha"],
      policy_references: ["policy_operational_change_control"],
      replay_ref: "replay_constitution_advisory_only",
    }),
    constitutionalRule({
      constitutional_rule_id: "constitution_authority_boundaries",
      rule_name: "Authority boundary protection",
      rule_version: "constitutional-rule/v1",
      constitutional_article: "Article III",
      constitutional_principle: "Authority Boundaries",
      priority: 3,
      evaluation_order: 3,
      enforcement_level: "BLOCKING",
      rule_expression: "authority expansion absent",
      authority_constraints: ["advisory_authority"],
      advisory_constraints: ["advisory_only"],
      prohibited_actions: ["authority_expansion", "operator_override", "certification_authority_claim"],
      conflict_resolution_priority: 3,
      required_evidence: ["evidence_decision_candidate_alpha"],
      policy_references: ["policy_regulatory_approval_required"],
      replay_ref: "replay_constitution_authority_boundaries",
    }),
    constitutionalRule({
      constitutional_rule_id: "constitution_governance_supremacy",
      rule_name: "Governance subordinate to constitution",
      rule_version: "constitutional-rule/v1",
      constitutional_article: "Article IV",
      constitutional_principle: "Governance Supremacy",
      priority: 4,
      evaluation_order: 4,
      enforcement_level: "MANDATORY",
      rule_expression: "governance policy cannot weaken constitution",
      authority_constraints: ["advisory_authority"],
      advisory_constraints: ["advisory_only"],
      prohibited_actions: ["policy_weakens_constitution"],
      conflict_resolution_priority: 4,
      required_evidence: ["evidence_decision_candidate_alpha"],
      policy_references: ["policy_constitutional_reference_guard"],
      replay_ref: "replay_constitution_governance_supremacy",
    }),
    constitutionalRule({
      constitutional_rule_id: "constitution_explainability_audit",
      rule_name: "Explainability and immutable audit",
      rule_version: "constitutional-rule/v1",
      constitutional_article: "Article V",
      constitutional_principle: "Explainability",
      priority: 6,
      evaluation_order: 5,
      enforcement_level: "MANDATORY",
      rule_expression: "evidence and replay references present",
      authority_constraints: ["advisory_authority"],
      advisory_constraints: ["advisory_only"],
      prohibited_actions: ["omit_evidence", "erase_audit"],
      conflict_resolution_priority: 6,
      required_evidence: ["evidence_decision_candidate_alpha"],
      policy_references: ["policy_operational_change_control"],
      replay_ref: "replay_constitution_explainability_audit",
    }),
  ]);
}

function orderedRules(rules: readonly ConstitutionalRule[]): readonly ConstitutionalRule[] {
  return Object.freeze([...rules].sort((a, b) => (
    CATEGORY_PRECEDENCE[a.constitutional_principle] - CATEGORY_PRECEDENCE[b.constitutional_principle]
    || a.priority - b.priority
    || a.evaluation_order - b.evaluation_order
    || a.constitutional_rule_id.localeCompare(b.constitutional_rule_id)
  )));
}

function validateRules(rules: readonly ConstitutionalRule[]): readonly ConstitutionalDecisionValidationFailureReason[] {
  const failures: ConstitutionalDecisionValidationFailureReason[] = [];
  if (rules.length === 0) failures.push("MISSING_CONSTITUTIONAL_RULES");
  const ids = rules.map((rule) => rule.constitutional_rule_id);
  if (new Set(ids).size !== ids.length) failures.push("DUPLICATE_CONSTITUTIONAL_IDENTIFIER");
  for (const rule of rules) {
    if (rule.rule_version !== "constitutional-rule/v1") failures.push("INVALID_CONSTITUTIONAL_VERSION");
    if (!CONSTITUTIONAL_RULE_CATEGORIES.includes(rule.constitutional_principle) || !CONSTITUTIONAL_ENFORCEMENT_LEVELS.includes(rule.enforcement_level)) failures.push("CORRUPTED_CONSTITUTIONAL_DEFINITION");
    if (!rule.rule_expression || rule.rule_expression.includes("??")) failures.push("MALFORMED_CONSTITUTIONAL_EXPRESSION");
    if (!rule.replay_ref || rule.policy_references.length === 0) failures.push("UNRESOLVED_CONSTITUTIONAL_REFERENCE");
    if (computeConstitutionalRuleHash(rule) !== rule.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  }
  const ordered = orderedRules(rules);
  for (let index = 0; index < rules.length; index += 1) {
    if (rules[index].constitutional_rule_id !== ordered[index]?.constitutional_rule_id) failures.push("CONSTITUTIONAL_CONFLICT_DETECTED");
  }
  return Object.freeze([...new Set(failures)] as ConstitutionalDecisionValidationFailureReason[]);
}

function evaluationHash(evaluation: Omit<ConstitutionalRuleEvaluation, "integrity_hash"> | ConstitutionalRuleEvaluation): string {
  return hashWithoutIntegrity(evaluation);
}

export function evaluateConstitutionalRule(input: {
  rule: ConstitutionalRule;
  decision: GovernanceDecisionRecord;
  authority_refs: readonly string[];
  action_refs: readonly string[];
}): ConstitutionalRuleEvaluation {
  const evidence_satisfied = input.rule.required_evidence.every((ref) => input.decision.evidence_refs.includes(ref));
  const authority_satisfied = input.rule.authority_constraints.every((ref) => input.authority_refs.includes(ref));
  const advisory_satisfied = input.decision.advisory_only === true
    && input.rule.advisory_constraints.every((ref) => ref === "advisory_only")
    && !input.action_refs.some((action) => action.includes("execute") || action.includes("execution") || action.includes("command") || action.includes("automation"));
  const prohibited_actions_detected = normalize(input.action_refs.filter((action) => input.rule.prohibited_actions.includes(action)));
  const validation_result: ConstitutionalValidationResultState = prohibited_actions_detected.length > 0
    ? "VIOLATION"
    : !evidence_satisfied
      ? "UNKNOWN"
      : !authority_satisfied
        ? "VIOLATION"
        : !advisory_satisfied
          ? "VIOLATION"
          : "COMPLIANT";
  const base: Omit<ConstitutionalRuleEvaluation, "integrity_hash"> = {
    evaluation_id: `constitutional_evaluation_${input.decision.governance_decision_id}_${input.rule.constitutional_rule_id}`,
    constitutional_rule_id: input.rule.constitutional_rule_id,
    validation_result,
    evidence_satisfied,
    authority_satisfied,
    advisory_satisfied,
    prohibited_actions_detected,
    explanation: `Rule ${input.rule.constitutional_rule_id} evaluated as ${validation_result}; authority=${authority_satisfied}; advisory=${advisory_satisfied}; prohibited=${prohibited_actions_detected.join(",") || "none"}.`,
    replay_ref: `${input.rule.replay_ref}_evaluation`,
  };
  return Object.freeze({ ...base, integrity_hash: evaluationHash(base) });
}

function conflictsFor(evaluations: readonly ConstitutionalRuleEvaluation[], policyResult?: GovernancePolicyValidationResult): readonly string[] {
  const conflicts: string[] = [];
  const highestViolation = evaluations.find((evaluation) => evaluation.validation_result === "VIOLATION");
  if (highestViolation && evaluations.some((evaluation) => evaluation.validation_result === "COMPLIANT" && evaluation.constitutional_rule_id !== highestViolation.constitutional_rule_id)) {
    conflicts.push(`constitutional_precedence_violation:${highestViolation.constitutional_rule_id}`);
  }
  if (policyResult?.evidence.prohibited_actions_detected.includes("constitutional_bypass")) conflicts.push("governance_policy_constitutional_bypass");
  if (policyResult?.evidence.validation_state === "VIOLATION" && policyResult.evidence.governance_conflicts.some((conflict) => conflict.includes("constitutional"))) conflicts.push("governance_constitutional_conflict");
  return Object.freeze(conflicts.sort());
}

function reportHash(report: Omit<ConstitutionalEvidenceReport, "integrity_hash"> | ConstitutionalEvidenceReport): string {
  return hashWithoutIntegrity(report);
}

function reportState(evaluations: readonly ConstitutionalRuleEvaluation[], conflicts: readonly string[]): ConstitutionalValidationResultState {
  if (evaluations.some((evaluation) => evaluation.validation_result === "VIOLATION")) return "VIOLATION";
  if (evaluations.some((evaluation) => evaluation.validation_result === "UNKNOWN")) return "UNKNOWN";
  if (conflicts.length > 0 || evaluations.some((evaluation) => evaluation.validation_result === "CONDITIONAL")) return "CONDITIONAL";
  return "COMPLIANT";
}

function buildReport(decision: GovernanceDecisionRecord, evaluations: readonly ConstitutionalRuleEvaluation[], conflicts: readonly string[]): ConstitutionalEvidenceReport {
  const validation_result = reportState(evaluations, conflicts);
  const base: Omit<ConstitutionalEvidenceReport, "integrity_hash"> = {
    report_id: `constitutional_evidence_${decision.governance_decision_id}`,
    governance_decision_id: decision.governance_decision_id,
    evaluated_rules: evaluations.map((evaluation) => evaluation.constitutional_rule_id),
    satisfied_rules: evaluations.filter((evaluation) => evaluation.validation_result === "COMPLIANT").map((evaluation) => evaluation.constitutional_rule_id),
    violated_rules: evaluations.filter((evaluation) => evaluation.validation_result === "VIOLATION").map((evaluation) => evaluation.constitutional_rule_id),
    conditional_rules: evaluations.filter((evaluation) => evaluation.validation_result === "CONDITIONAL" || evaluation.validation_result === "UNKNOWN").map((evaluation) => evaluation.constitutional_rule_id),
    authority_results: evaluations.map((evaluation) => `${evaluation.constitutional_rule_id}:${evaluation.authority_satisfied ? "AUTHORIZED" : "REJECTED"}`),
    advisory_results: evaluations.map((evaluation) => `${evaluation.constitutional_rule_id}:${evaluation.advisory_satisfied ? "ADVISORY_ONLY" : "VIOLATION"}`),
    prohibited_actions_detected: normalize(evaluations.flatMap((evaluation) => [...evaluation.prohibited_actions_detected])),
    constitutional_conflicts: conflicts,
    validation_result,
    evidence_refs: decision.evidence_refs,
    replay_ref: `replay_constitutional_evidence_${decision.governance_decision_id}`,
  };
  return Object.freeze({ ...base, integrity_hash: reportHash(base) });
}

function ledgerHash(record: Omit<ConstitutionalDecisionLedgerRecord, "integrity_hash"> | ConstitutionalDecisionLedgerRecord): string {
  return hashWithoutIntegrity(record);
}

function writeLedger(report: ConstitutionalEvidenceReport, evaluations: readonly ConstitutionalRuleEvaluation[]): readonly ConstitutionalDecisionLedgerRecord[] {
  const base: Omit<ConstitutionalDecisionLedgerRecord, "integrity_hash"> = {
    ledger_id: `constitutional_decision_ledger_${report.report_id}`,
    governance_decision_id: report.governance_decision_id,
    constitutional_rule_ids: report.evaluated_rules,
    evaluation_results: evaluations.map((evaluation) => evaluation.validation_result),
    authority_results: report.authority_results,
    advisory_results: report.advisory_results,
    conflict_results: report.constitutional_conflicts,
    validation_result: report.validation_result,
    evidence_refs: report.evidence_refs,
    replay_refs: [report.replay_ref, ...evaluations.map((evaluation) => evaluation.replay_ref)],
    created_at: NOW,
  };
  return Object.freeze([Object.freeze({ ...base, integrity_hash: ledgerHash(base) })]);
}

function validationResult(failures: readonly ConstitutionalDecisionValidationFailureReason[]): ConstitutionalDecisionValidation {
  const unique = Object.freeze([...new Set(failures)] as ConstitutionalDecisionValidationFailureReason[]);
  const has = (failure: ConstitutionalDecisionValidationFailureReason) => unique.includes(failure);
  return Object.freeze({
    validation_state: unique.length === 0 ? "VALID" : "REJECTED",
    fail_closed: unique.length > 0,
    failures: unique,
    checks: Object.freeze({
      contract_valid: !has("GOVERNANCE_CONTRACT_INVALID"),
      governance_policy_compatible: !has("GOVERNANCE_POLICY_INVALID"),
      rules_present: !has("MISSING_CONSTITUTIONAL_RULES"),
      rules_integrity_valid: !has("CORRUPTED_CONSTITUTIONAL_DEFINITION") && !has("INTEGRITY_HASH_MISMATCH"),
      evidence_complete: !has("MISSING_EVIDENCE"),
      authority_boundaries_valid: !has("AUTHORITY_AMBIGUITY") && !has("AUTHORITY_BOUNDARY_VIOLATION"),
      advisory_only: !has("ADVISORY_AMBIGUITY") && !has("ADVISORY_ONLY_VIOLATION"),
      prohibited_execution_absent: !has("PROHIBITED_EXECUTION_DETECTED"),
      constitutional_conflicts_absent: !has("CONSTITUTIONAL_CONFLICT_DETECTED"),
      constitutional_supremacy_preserved: !has("CONSTITUTIONAL_SUPREMACY_VIOLATION"),
      replay_valid: !has("REPLAY_DIVERGENCE"),
    }),
  });
}

function resultReplayHash(result: Omit<ConstitutionalDecisionValidationResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    governance_decision: result.governance_decision,
    governance_policy_result: result.governance_policy_result,
    constitutional_rules: result.constitutional_rules,
    evaluations: result.evaluations,
    evidence_report: result.evidence_report,
    ledger_records: result.ledger_records,
    validation: result.validation,
    failures: result.failures,
  });
}

function failResult(decision: GovernanceDecisionRecord, failures: readonly ConstitutionalDecisionValidationFailureReason[], rules: readonly ConstitutionalRule[] = [], policyResult?: GovernancePolicyValidationResult): ConstitutionalDecisionValidationResult {
  const validation = validationResult(failures);
  const report = buildReport(decision, [], []);
  const base: Omit<ConstitutionalDecisionValidationResult, "integrity_hash" | "replay_hash"> = {
    constitutional_validation_status: "FAIL",
    fail_closed: true,
    governance_decision: decision,
    governance_policy_result: policyResult,
    constitutional_rules: rules,
    evaluations: Object.freeze([]),
    evidence_report: report,
    ledger_records: Object.freeze([]),
    validation,
    failures: validation.failures,
    deterministic: true,
    advisory_only: true,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function validateConstitutionalDecision(input: ConstitutionalDecisionValidationInput = {}): ConstitutionalDecisionValidationResult {
  if (input.authorized_component && input.authorized_component !== AUTHORIZED_COMPONENT) return failResult(input.governance_decision ?? createGovernanceDecisionRecord(), ["UNAUTHORIZED_CONSTITUTIONAL_VALIDATOR_ACCESS"]);
  const decision = input.governance_decision ?? createGovernanceDecisionRecord({ lifecycle_state: "READY_FOR_ENFORCEMENT" });
  const policyResult = input.governance_policy_result ?? validateGovernancePolicy({ governance_decision: decision });
  const contractValidation = validateGovernanceDecisionRecord(decision);
  const rules = orderedRules(input.constitutional_rules ?? createConstitutionalRules());
  const ruleFailures = validateRules(rules);
  if (contractValidation.validation_state !== "VALID") return failResult(decision, ["GOVERNANCE_CONTRACT_INVALID"], rules, policyResult);
  if (ruleFailures.length > 0) return failResult(decision, ruleFailures, rules, policyResult);
  const authorityRefs = normalize(input.authority_refs ?? ["advisory_authority"]);
  const actionRefs = normalize(input.action_refs ?? []);
  const evaluations = Object.freeze(rules.map((rule) => evaluateConstitutionalRule({ rule, decision, authority_refs: authorityRefs, action_refs: actionRefs })));
  const conflicts = conflictsFor(evaluations, policyResult);
  const report = buildReport(decision, evaluations, conflicts);
  const ledger_records = writeLedger(report, evaluations);
  const failures: ConstitutionalDecisionValidationFailureReason[] = [];
  if (policyResult.policy_validation_status === "FAIL" && policyResult.fail_closed && policyResult.evidence.validation_state === "VIOLATION") failures.push("GOVERNANCE_POLICY_INVALID");
  if (evaluations.some((evaluation) => !evaluation.evidence_satisfied)) failures.push("MISSING_EVIDENCE");
  if (evaluations.some((evaluation) => !evaluation.authority_satisfied)) failures.push("AUTHORITY_BOUNDARY_VIOLATION");
  if (evaluations.some((evaluation) => !evaluation.advisory_satisfied)) failures.push("ADVISORY_ONLY_VIOLATION");
  if (report.prohibited_actions_detected.length > 0) failures.push("PROHIBITED_EXECUTION_DETECTED");
  if (conflicts.length > 0) failures.push("CONSTITUTIONAL_CONFLICT_DETECTED");
  if (actionRefs.includes("constitutional_bypass") || actionRefs.includes("governance_override_constitution")) failures.push("CONSTITUTIONAL_SUPREMACY_VIOLATION");
  if (evaluations.some((evaluation) => evaluationHash(evaluation) !== evaluation.integrity_hash) || reportHash(report) !== report.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  if (ledger_records.some((record) => ledgerHash(record) !== record.integrity_hash)) failures.push("CONSTITUTIONAL_LEDGER_FAILED");
  const validation = validationResult(failures);
  const base: Omit<ConstitutionalDecisionValidationResult, "integrity_hash" | "replay_hash"> = {
    constitutional_validation_status: validation.validation_state === "VALID" ? "PASS" : "FAIL",
    fail_closed: validation.fail_closed,
    governance_decision: decision,
    governance_policy_result: policyResult,
    constitutional_rules: rules,
    evaluations,
    evidence_report: report,
    ledger_records,
    validation,
    failures: validation.failures,
    deterministic: true,
    advisory_only: true,
  };
  const replay_hash = resultReplayHash(base);
  if (input.replay_expected_hash && input.replay_expected_hash !== replay_hash) return failResult(decision, ["REPLAY_DIVERGENCE"], rules, policyResult);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayConstitutionalDecisionValidation(result: ConstitutionalDecisionValidationResult): ConstitutionalDecisionValidationReplay {
  const reconstructed = resultReplayHash(result);
  const replay_valid = reconstructed === result.replay_hash
    && result.constitutional_rules.every((rule) => computeConstitutionalRuleHash(rule) === rule.integrity_hash)
    && result.evaluations.every((evaluation) => evaluationHash(evaluation) === evaluation.integrity_hash)
    && reportHash(result.evidence_report) === result.evidence_report.integrity_hash
    && result.ledger_records.every((record) => ledgerHash(record) === record.integrity_hash);
  const failures: ConstitutionalDecisionValidationFailureReason[] = replay_valid ? [] : ["REPLAY_DIVERGENCE"];
  const base: Omit<ConstitutionalDecisionValidationReplay, "integrity_hash"> = {
    replay_id: "replay_constitutional_decision_validator",
    replay_valid,
    governance_decision_id: result.governance_decision.governance_decision_id,
    evaluated_rule_refs: result.constitutional_rules.map((rule) => rule.constitutional_rule_id),
    evidence_report_ref: result.evidence_report.report_id,
    ledger_refs: result.ledger_records.map((record) => record.ledger_id),
    expected_replay_hash: result.replay_hash,
    reconstructed_replay_hash: reconstructed,
    failures: Object.freeze(failures),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

export function buildConstitutionalDecisionValidationObservability(result: ConstitutionalDecisionValidationResult): ConstitutionalDecisionValidationObservability {
  return Object.freeze({
    constitutional_loading_events: result.constitutional_rules.length,
    rule_evaluation_events: result.evaluations.length,
    authority_validation_events: result.evaluations.filter((evaluation) => evaluation.authority_satisfied).length,
    advisory_validation_events: result.evaluations.filter((evaluation) => evaluation.advisory_satisfied).length,
    execution_prohibition_events: result.evidence_report.prohibited_actions_detected.length,
    constitutional_conflict_events: result.evidence_report.constitutional_conflicts.length,
    validation_completion_events: 1,
    replay_verification_events: replayConstitutionalDecisionValidation(result).replay_valid ? 1 : 0,
    ledger_append_events: result.ledger_records.length,
  });
}

export function getConstitutionalDecisionValidatorFoundation(): ConstitutionalDecisionValidatorFoundation {
  const result = validateConstitutionalDecision();
  const replay = replayConstitutionalDecisionValidation(result);
  return Object.freeze({
    validator_version: VALIDATOR_VERSION,
    rule_categories: CONSTITUTIONAL_RULE_CATEGORIES,
    enforcement_levels: CONSTITUTIONAL_ENFORCEMENT_LEVELS,
    validation_results: CONSTITUTIONAL_VALIDATION_RESULTS,
    result,
    replay,
    observability: buildConstitutionalDecisionValidationObservability(result),
  });
}

export const ConstitutionalDecisionValidator = Object.freeze({
  rules: createConstitutionalRules,
  evaluateRule: evaluateConstitutionalRule,
  validate: validateConstitutionalDecision,
  replay: replayConstitutionalDecisionValidation,
});
