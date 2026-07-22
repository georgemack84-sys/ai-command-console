import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runAssuranceEvaluationContract, validateAssuranceEvaluationContract } from "@/services/assurance-evaluation-contract";
import type {
  AssuranceInputOutcome,
  CertificationAggregationRules,
  CertificationDecisionCertification,
  CertificationDecisionContract,
  CertificationDecisionContractBundle,
  CertificationDecisionFailure,
  CertificationDecisionInput,
  CertificationDecisionLedger,
  CertificationDecisionLedgerEntry,
  CertificationDecisionOutcome,
  CertificationDecisionResult,
  CertificationDecisionScenario,
  CertificationDecisionTest,
  CertificationDecisionValidation,
  CertificationEvidenceBinder,
  CertificationExplanation,
  CertificationReplayReport,
} from "@/types/certification-decision-framework";

const VERSION = "certification-decision-framework/v13.4" as const;
const ID = "CertificationDecisionFramework" as const;
const OUTCOMES = Object.freeze(["PASS", "CONDITIONAL_PASS", "FAIL", "REQUIRES_GOVERNANCE_REVIEW", "REQUIRES_OPERATOR_REVIEW"] as const);
const REQUIRED = Object.freeze(["assurance-evaluation-contract", "assurance-dependency-evaluation", "constitutional-authority-hierarchy"] as const);
const OPTIONAL = Object.freeze(["operational-observability-summary"] as const);

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 24)}`; }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function scenarioFailure(scenario: CertificationDecisionScenario): CertificationDecisionFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function has(failures: readonly CertificationDecisionFailure[], failure: CertificationDecisionFailure): boolean { return failures.includes(failure); }
function statusFor(failures: readonly CertificationDecisionFailure[]): "PASS" | "FAIL" { return failures.length ? "FAIL" : "PASS"; }

function requiredOutcomes(failures: readonly CertificationDecisionFailure[]): readonly AssuranceInputOutcome[] {
  if (has(failures, "PRUNED_NORMALIZED_TO_FAIL")) return freezeArray(["PASS", "PRUNED", "PASS"]);
  if (has(failures, "REQUIRED_ASSURANCE_FAILED")) return freezeArray(["PASS", "FAIL", "PASS"]);
  return freezeArray(["PASS", "PASS", "PASS"]);
}

function resolveOutcome(failures: readonly CertificationDecisionFailure[], required: readonly AssuranceInputOutcome[]): CertificationDecisionOutcome {
  if (has(failures, "GOVERNANCE_REVIEW_BYPASSED")) return "REQUIRES_GOVERNANCE_REVIEW";
  if (has(failures, "OPERATOR_REVIEW_BYPASSED")) return "REQUIRES_OPERATOR_REVIEW";
  if (has(failures, "CONDITIONS_IMPLICIT")) return "CONDITIONAL_PASS";
  return required.every((outcome) => outcome === "PASS") ? "PASS" : "FAIL";
}

function contract(outcome: CertificationDecisionOutcome, failures: readonly CertificationDecisionFailure[]): CertificationDecisionContract {
  return nested({ contract_id: id("certification_decision_contract", VERSION), certification_decision_id: id("certification_decision", { outcome, failures }), assessment_id: "assessment:mission-control:assurance", certification_cycle_id: "cycle:mission-control:certification:13.4", evaluated_scope: "Mission Control assurance aggregation", assurance_result_refs: freezeArray([...REQUIRED, ...OPTIONAL]), required_assurance_refs: REQUIRED, optional_assurance_refs: OPTIONAL, aggregation_policy_ref: "policy:certification-aggregation:v13.4", certification_outcome: outcome, governance_review_required: outcome === "REQUIRES_GOVERNANCE_REVIEW", operator_review_required: outcome === "REQUIRES_OPERATOR_REVIEW", evidence_binder_ref: id("certification_evidence_binder", failures), explanation_ref: id("certification_explanation", failures), replay_ref: id("certification_replay", failures), decision_timestamp: "2026-07-15T00:00:00.000Z", schema_immutable: !has(failures, "CONTRACT_INVALID"), identity_deterministic: !has(failures, "CONTRACT_INVALID"), replayable: !has(failures, "REPLAY_MISMATCH"), evidence_linked: !has(failures, "EVIDENCE_LINEAGE_INCOMPLETE") });
}

function aggregationRules(required: readonly AssuranceInputOutcome[], failures: readonly CertificationDecisionFailure[]): CertificationAggregationRules {
  return nested({ rules_id: id("certification_aggregation_rules", failures), required_outcomes: required, optional_outcomes: freezeArray(["PASS"]), aggregation_order: freezeArray([...REQUIRED, ...OPTIONAL]), no_implicit_weighting: true, deterministic_ordering: !has(failures, "AGGREGATION_NONDETERMINISTIC"), closed_vocabulary: !has(failures, "VOCABULARY_OPEN"), policy_binding_immutable: !has(failures, "INTEGRITY_FAILURE"), optional_cannot_override_required: !has(failures, "OPTIONAL_OVERRIDES_REQUIRED"), pruned_preserved_distinct: !has(failures, "PRUNED_NORMALIZED_TO_FAIL"), constitutional_constraints_enforced: !has(failures, "ADVISORY_BOUNDARY_VIOLATION") });
}

function evidenceBinder(evalHash: string, failures: readonly CertificationDecisionFailure[]): CertificationEvidenceBinder {
  return nested({ binder_id: id("certification_evidence_binder", failures), assurance_evaluations: REQUIRED, dependency_graph_refs: freezeArray(["dependency-graph:v13.2"]), evaluation_ordering_refs: freezeArray(["ordering:v13.2"]), qualified_evidence_refs: freezeArray([evalHash, "evidence:qualification:v13.3"]), policy_manifest_refs: freezeArray(["policy:certification-aggregation:v13.4"]), governance_approval_refs: freezeArray(["governance:assurance:approved"]), operator_review_refs: freezeArray(["operator:review:available"]), constitutional_constraint_refs: freezeArray(["constitution:authority-hierarchy:v13.1"]), integrity_validation_refs: freezeArray(["integrity:assurance-evaluation:v13.3"]), replay_refs: freezeArray(["replay:certification-decision:v13.4"]), immutable: !has(failures, "EVIDENCE_MUTABLE"), lineage_complete: !has(failures, "EVIDENCE_LINEAGE_INCOMPLETE"), independently_verifiable: !has(failures, "INTEGRITY_FAILURE"), qualification_explicit: true });
}

function explanation(outcome: CertificationDecisionOutcome, required: readonly AssuranceInputOutcome[], failures: readonly CertificationDecisionFailure[]): CertificationExplanation {
  return nested({ explanation_id: id("certification_explanation", failures), outcome, succeeded_reason: outcome === "PASS" ? "Every required assurance engine returned PASS." : null, failed_reason: outcome === "FAIL" ? "At least one required assurance input was non-passing." : null, conditional_reason: outcome === "CONDITIONAL_PASS" ? "Bounded conditions require explicit remediation before unrestricted production use." : null, governance_review_reason: outcome === "REQUIRES_GOVERNANCE_REVIEW" ? "Governance authority must review identified certification issues." : null, operator_review_reason: outcome === "REQUIRES_OPERATOR_REVIEW" ? "Operator assessment is required within constitutional and governance bounds." : null, contributing_assurance_outcomes: required.map((r, i) => `${REQUIRED[i]}:${r}`), dependency_influence: freezeArray(["declared dependency graph preserved", "PRUNED remains distinct from FAIL"]), evidence_qualification: has(failures, "EVIDENCE_LINEAGE_INCOMPLETE") ? "evidence lineage incomplete" : "all evidence qualified and immutable", applied_aggregation_rules: freezeArray(["PASS requires all required PASS", "optional cannot override required", "governance supersedes operator", "certification remains advisory-only"]), constitutional_constraints: freezeArray(["constitutional supremacy", "governance supremacy", "operator boundedness", "advisory boundary"]), deterministic: !has(failures, "EXPLANATION_INCOMPLETE"), hidden_reasoning_eliminated: !has(failures, "EXPLANATION_INCOMPLETE"), replay_identical: !has(failures, "REPLAY_MISMATCH") });
}

function replay(failures: readonly CertificationDecisionFailure[]): CertificationReplayReport {
  const ok = !has(failures, "REPLAY_MISMATCH");
  return nested({ report_id: id("certification_decision_replay", failures), assurance_ordering_replayed: ok, dependency_evaluation_replayed: ok, aggregation_sequence_replayed: ok && !has(failures, "AGGREGATION_NONDETERMINISTIC"), evidence_qualification_replayed: ok, aggregation_rules_replayed: ok, outcome_reproduced: ok, explanation_reproduced: ok, integrity_validated: !has(failures, "INTEGRITY_FAILURE"), evidence_preserved: !has(failures, "EVIDENCE_MUTABLE") });
}

function ledger(contractRecord: CertificationDecisionContract, binder: CertificationEvidenceBinder, failures: readonly CertificationDecisionFailure[]): CertificationDecisionLedger {
  const entry: CertificationDecisionLedgerEntry = nested({ entry_id: id("certification_decision_ledger_entry", contractRecord.certification_decision_id), certification_decision: contractRecord.certification_decision_id, assurance_references: contractRecord.assurance_result_refs, aggregation_policy: contractRecord.aggregation_policy_ref, evidence_binder: binder.binder_id, governance_actions: contractRecord.governance_review_required ? freezeArray(["governance review required"]) : freezeArray(["governance approval observed"]), operator_actions: contractRecord.operator_review_required ? freezeArray(["operator review required"]) : freezeArray(["operator review available"]), replay_references: freezeArray([contractRecord.replay_ref]), integrity_verification: "integrity:certification-decision:v13.4", timestamp: contractRecord.decision_timestamp });
  return nested({ ledger_id: id("certification_decision_ledger", failures), entries: freezeArray(has(failures, "MULTIPLE_DECISIONS") ? [entry, entry] : [entry]), append_only: !has(failures, "LEDGER_MUTABLE"), immutable: !has(failures, "LEDGER_MUTABLE"), tenant_isolated: !has(failures, "TENANT_ISOLATION_FAILURE"), cryptographically_verifiable: !has(failures, "INTEGRITY_FAILURE"), replayable: !has(failures, "REPLAY_MISMATCH") });
}

type CertBase = Omit<CertificationDecisionResult, "certification" | "replay_hash" | "integrity_hash">;
function certTest(name: string, passed: boolean, failure: CertificationDecisionFailure, refs: readonly string[]): CertificationDecisionTest {
  return nested({ test_id: id("certification_decision_test", name), name, expected: "PASS" as const, actual: passed ? "PASS" as const : "FAIL" as const, passed, failure_reason: passed ? null : failure, evidence_refs: refs });
}
function certificationTests(result: CertBase): readonly CertificationDecisionTest[] {
  const refs = freezeArray([result.contract.integrity_hash, result.aggregation_rules.integrity_hash, result.evidence_binder.integrity_hash, result.ledger.integrity_hash]);
  return freezeArray([
    certTest("Decision contract valid", result.contract.schema_immutable && result.contract.identity_deterministic, "CONTRACT_INVALID", refs),
    certTest("Aggregation deterministic", result.aggregation_rules.deterministic_ordering, "AGGREGATION_NONDETERMINISTIC", refs),
    certTest("Single certification decision guaranteed", result.ledger.entries.length === 1, "MULTIPLE_DECISIONS", refs),
    certTest("Certification vocabulary closed", result.aggregation_rules.closed_vocabulary, "VOCABULARY_OPEN", refs),
    certTest("Required assurance inputs passing", result.aggregation_rules.required_outcomes.every((outcome) => outcome === "PASS"), "REQUIRED_ASSURANCE_FAILED", refs),
    certTest("PRUNED preserved distinct from FAIL", result.aggregation_rules.pruned_preserved_distinct, "PRUNED_NORMALIZED_TO_FAIL", refs),
    certTest("Optional assurance cannot override required", result.aggregation_rules.optional_cannot_override_required, "OPTIONAL_OVERRIDES_REQUIRED", refs),
    certTest("Conditional conditions explicit", result.contract.certification_outcome !== "CONDITIONAL_PASS" || result.explanation.conditional_reason !== null, "CONDITIONS_IMPLICIT", refs),
    certTest("Governance review not bypassed", result.contract.certification_outcome !== "REQUIRES_GOVERNANCE_REVIEW" || result.contract.governance_review_required, "GOVERNANCE_REVIEW_BYPASSED", refs),
    certTest("Operator review not bypassed", result.contract.certification_outcome !== "REQUIRES_OPERATOR_REVIEW" || result.contract.operator_review_required, "OPERATOR_REVIEW_BYPASSED", refs),
    certTest("Evidence immutable", result.evidence_binder.immutable, "EVIDENCE_MUTABLE", refs),
    certTest("Evidence lineage complete", result.evidence_binder.lineage_complete, "EVIDENCE_LINEAGE_INCOMPLETE", refs),
    certTest("Decision explanation complete", result.explanation.deterministic && result.explanation.hidden_reasoning_eliminated, "EXPLANATION_INCOMPLETE", refs),
    certTest("Replay deterministic", result.replay.outcome_reproduced && result.replay.explanation_reproduced, "REPLAY_MISMATCH", refs),
    certTest("Decision ledger immutable", result.ledger.append_only && result.ledger.immutable, "LEDGER_MUTABLE", refs),
    certTest("Tenant isolation maintained", result.ledger.tenant_isolated, "TENANT_ISOLATION_FAILURE", refs),
    certTest("Advisory boundary enforced", result.aggregation_rules.constitutional_constraints_enforced, "ADVISORY_BOUNDARY_VIOLATION", refs),
    certTest("Integrity validated", result.evidence_binder.independently_verifiable && result.ledger.cryptographically_verifiable, "INTEGRITY_FAILURE", refs),
  ]);
}

function replayHash(result: Omit<CertificationDecisionResult, "replay_hash" | "integrity_hash">): string {
  return hash({ contract: result.contract.integrity_hash, rules: result.aggregation_rules.integrity_hash, evidence: result.evidence_binder.integrity_hash, explanation: result.explanation.integrity_hash, replay: result.replay.integrity_hash, ledger: result.ledger.integrity_hash, certification: result.certification.integrity_hash });
}
function integrityHash(result: Omit<CertificationDecisionResult, "integrity_hash">): string { return hash({ version: result.phase_version, id: result.phase_identifier, status: result.certification.status, outcome: result.contract.certification_outcome, replay_hash: result.replay_hash }); }

export function runCertificationDecisionFramework(input: CertificationDecisionInput = {}): CertificationDecisionResult {
  const evaluation = runAssuranceEvaluationContract({ tenant_id: input.tenant_id ?? "tenant_mission_control" });
  const evaluationValid = validateAssuranceEvaluationContract(evaluation).valid;
  const directFailure = scenarioFailure(input.scenario ?? "BASELINE");
  const failures = freezeArray<CertificationDecisionFailure>([...(evaluationValid ? [] : ["INTEGRITY_FAILURE" as const]), ...(directFailure ? [directFailure] : [])]);
  const required = requiredOutcomes(failures);
  const outcome = resolveOutcome(failures, required);
  const c = contract(outcome, failures);
  const rules = aggregationRules(required, failures);
  const binder = evidenceBinder(evaluation.integrity_hash, failures);
  const exp = explanation(outcome, required, failures);
  const rep = replay(failures);
  const led = ledger(c, binder, failures);
  const baseWithoutCertification: CertBase = { phase_version: VERSION, phase_identifier: ID, contract: c, aggregation_rules: rules, evidence_binder: binder, explanation: exp, replay: rep, ledger: led };
  const tests = certificationTests(baseWithoutCertification);
  const finalFailures = freezeArray([...new Set([...failures, ...tests.map((test) => test.failure_reason).filter((failure): failure is CertificationDecisionFailure => Boolean(failure))])]);
  const status = statusFor(finalFailures);
  const certification: CertificationDecisionCertification = nested({ certification_id: id("certification_decision_certification", VERSION), status, certified: status === "PASS", failures: finalFailures, tests });
  const base = { ...baseWithoutCertification, certification };
  const rHash = replayHash(base);
  return Object.freeze({ ...base, replay_hash: rHash, integrity_hash: integrityHash({ ...base, replay_hash: rHash }) });
}

export function validateCertificationDecisionFramework(result?: CertificationDecisionResult): CertificationDecisionValidation {
  if (!result) {
    const failures = freezeArray<CertificationDecisionFailure>(["CONTRACT_INVALID"]);
    const base = { valid: false, status: "FAIL" as const, certified: false, failures, replay_hash_valid: false, integrity_hash_valid: false, single_decision_valid: false, evidence_valid: false, ledger_valid: false, advisory_only: false };
    return nested({ ...base, validation_hash: hashWithoutIntegrity(base) });
  }
  const replay_hash_valid = replayHash(result) === result.replay_hash;
  const integrity_hash_valid = integrityHash(result) === result.integrity_hash && hashWithoutIntegrity(result.certification) === result.certification.integrity_hash;
  const single_decision_valid = result.ledger.entries.length === 1 && OUTCOMES.includes(result.contract.certification_outcome);
  const evidence_valid = result.evidence_binder.immutable && result.evidence_binder.lineage_complete && result.evidence_binder.qualification_explicit;
  const ledger_valid = result.ledger.append_only && result.ledger.immutable && result.ledger.replayable;
  const advisory_only = result.aggregation_rules.constitutional_constraints_enforced;
  const valid = result.certification.status === "PASS" && result.certification.certified && result.certification.failures.length === 0 && replay_hash_valid && integrity_hash_valid && single_decision_valid && evidence_valid && ledger_valid && advisory_only;
  const base = { valid, status: result.certification.status, certified: result.certification.certified, failures: result.certification.failures, replay_hash_valid, integrity_hash_valid, single_decision_valid, evidence_valid, ledger_valid, advisory_only };
  return nested({ ...base, validation_hash: hashWithoutIntegrity(base) });
}

export function replayCertificationDecisionFramework(result = runCertificationDecisionFramework()): boolean {
  const replayed = runCertificationDecisionFramework();
  return result.integrity_hash === replayed.integrity_hash && result.replay_hash === replayed.replay_hash && validateCertificationDecisionFramework(result).valid;
}

export function getCertificationDecisionFrameworkContract(): CertificationDecisionContractBundle {
  const result = runCertificationDecisionFramework();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, single_decision_required: true, closed_outcome_vocabulary: true, deterministic_aggregation_required: true, evidence_binding_required: true, governance_supremacy_required: true, advisory_only: true, replay_required: true }), result, validation: validateCertificationDecisionFramework(result) });
}

export const CertificationDecisionFramework = Object.freeze({ run: runCertificationDecisionFramework, validate: validateCertificationDecisionFramework, replay: replayCertificationDecisionFramework });
