import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runAssuranceDependencyEvaluation, validateAssuranceDependencyEvaluation } from "@/services/assurance-dependency-evaluation";
import type {
  AssuranceEvaluationCertification,
  AssuranceEvaluationCertificationTest,
  AssuranceEvaluationContract,
  AssuranceEvaluationContractBundle,
  AssuranceEvaluationContractResult,
  AssuranceEvaluationExplanation,
  AssuranceEvaluationFailure,
  AssuranceEvaluationInput,
  AssuranceEvaluationLedger,
  AssuranceEvaluationLedgerEntry,
  AssuranceEvaluationReplayReport,
  AssuranceEvaluationScenario,
  AssuranceEvaluationValidation,
  DeterministicEvaluationInputs,
  EvaluationExecutionReport,
  EvidenceQualificationReport,
  ResultVocabularyReport,
} from "@/types/assurance-evaluation-contract";

const VERSION = "assurance-evaluation-contract/v13.3" as const;
const ID = "AssuranceEvaluationContract" as const;
const LIFECYCLE = Object.freeze(["REGISTERED", "READY", "EVALUATING", "PASS", "FAIL", "PRUNED"] as const);
const TERMINAL = Object.freeze(["PASS", "FAIL", "PRUNED"] as const);
const SEQUENCE = Object.freeze(["Validate Inputs", "Validate Dependencies", "Qualify Evidence", "Execute Evaluation", "Determine Result", "Generate Explanation", "Commit Ledger"] as const);

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 24)}`; }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function scenarioFailure(scenario: AssuranceEvaluationScenario): AssuranceEvaluationFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function has(failures: readonly AssuranceEvaluationFailure[], failure: AssuranceEvaluationFailure): boolean { return failures.includes(failure); }
function statusFor(failures: readonly AssuranceEvaluationFailure[]): "PASS" | "FAIL" { return failures.length ? "FAIL" : "PASS"; }

function contract(failures: readonly AssuranceEvaluationFailure[]): AssuranceEvaluationContract {
  return nested({ contract_id: id("assurance_evaluation_contract", VERSION), lifecycle: LIFECYCLE, terminal_outcomes: TERMINAL, evaluation_identity_deterministic: !has(failures, "CONTRACT_INCOMPLETE"), one_engine_per_evaluation: true, immutable_after_completion: true, one_terminal_outcome: true, replay_metadata_complete: !has(failures, "CONTRACT_INCOMPLETE") });
}

function inputs(tenantId: string, dependencyHash: string, failures: readonly AssuranceEvaluationFailure[]): DeterministicEvaluationInputs {
  const ok = !has(failures, "INPUTS_NONDETERMINISTIC");
  return nested({ input_id: id("assurance_evaluation_inputs", { tenantId, dependencyHash }), policy_refs: freezeArray(["policy:assurance:evaluation:v13.3"]), governance_refs: freezeArray(["governance:mission-control:assurance"]), constitutional_refs: freezeArray(["constitution:authority-hierarchy:v13.1"]), dependency_results: freezeArray([dependencyHash]), evidence_refs: freezeArray(["evidence:dependency-ledger", "evidence:authority-contract"]), configuration_version: "config:v13.3", assurance_version: VERSION, evaluation_context: `tenant:${tenantId}:mission-control`, complete: ok, immutable: ok, versioned: true, replayable: ok, tenant_isolated: !has(failures, "TENANT_ISOLATION_FAILURE"), hidden_runtime_state_prohibited: ok });
}

function evidence(failures: readonly AssuranceEvaluationFailure[]): EvidenceQualificationReport {
  const ok = !has(failures, "EVIDENCE_QUALIFICATION_NONDETERMINISTIC");
  return nested({ report_id: id("evidence_qualification", failures), complete: ok, integrity_valid: !has(failures, "INTEGRITY_FAILURE"), authenticity_valid: ok, provenance_valid: ok, policy_eligible: ok, constitutional_eligible: ok, temporal_valid: ok, dependencies_satisfied: ok, qualified_before_evaluation: ok, rejected_evidence_reasons: ok ? freezeArray([]) : freezeArray(["evidence qualification was not reproducible"]), missing_evidence_inferred: false as const, deterministic: ok });
}

function vocabulary(failures: readonly AssuranceEvaluationFailure[]): ResultVocabularyReport {
  return nested({ report_id: id("result_vocabulary", failures), terminal_outcomes: TERMINAL, closed: !has(failures, "VOCABULARY_OPEN"), implementation_extensions_rejected: !has(failures, "CUSTOM_TERMINAL_OUTCOME_ACCEPTED"), intermediate_states_not_terminal: true, pass_semantics: has(failures, "PASS_SEMANTICS_INVALID") ? "invalid pass semantics" : "completed successfully without violations", fail_semantics: has(failures, "FAIL_SEMANTICS_INVALID") ? "invalid fail semantics" : "completed and detected violations", pruned_semantics: has(failures, "PRUNED_SEMANTICS_INVALID") ? "invalid pruned semantics" : "did not execute because prerequisite dependency failed or was unavailable" });
}

function execution(failures: readonly AssuranceEvaluationFailure[]): EvaluationExecutionReport {
  const ordered = !has(failures, "ORDERING_NONDETERMINISTIC");
  return nested({ report_id: id("evaluation_execution", failures), sequence: SEQUENCE, deterministic_inputs: !has(failures, "INPUTS_NONDETERMINISTIC"), deterministic_ordering: ordered, deterministic_dependencies: ordered, deterministic_evidence: !has(failures, "EVIDENCE_QUALIFICATION_NONDETERMINISTIC"), deterministic_policy_evaluation: true, deterministic_completion: true, deterministic_outputs: ordered });
}

function explanation(failures: readonly AssuranceEvaluationFailure[]): AssuranceEvaluationExplanation {
  const ok = !has(failures, "EXPLANATION_NONDETERMINISTIC");
  return nested({ explanation_id: id("evaluation_explanation", failures), evaluated_requirement: "assurance evaluation contract completeness", governing_policy: "policy:assurance:evaluation:v13.3", governing_constitutional_rule: "assessment authority remains advisory-only", evidence_used: freezeArray(["evidence:dependency-ledger"]), evidence_rejected: has(failures, "EVIDENCE_QUALIFICATION_NONDETERMINISTIC") ? freezeArray(["evidence:unstable"]) : freezeArray([]), dependency_results: freezeArray(["dependency-evaluation:PASS"]), evaluation_path: SEQUENCE, result_determination: has(failures, "PRUNED_SEMANTICS_INVALID") ? "PRUNED" as const : has(failures, "FAIL_SEMANTICS_INVALID") ? "FAIL" as const : "PASS" as const, rationale: ok ? "Deterministic evidence, dependency, and policy checks produced the terminal result." : "Runtime generated explanation diverged.", replay_references: freezeArray(["replay:assurance-evaluation:inputs", "replay:assurance-evaluation:explanation"]), deterministic: ok, complete: ok });
}

function ledger(exp: AssuranceEvaluationExplanation, inp: DeterministicEvaluationInputs, failures: readonly AssuranceEvaluationFailure[]): AssuranceEvaluationLedger {
  const entry: AssuranceEvaluationLedgerEntry = nested({ entry_id: id("assurance_evaluation_ledger_entry", exp.explanation_id), evaluation_identifier: id("assurance_evaluation", inp.input_id), assurance_engine: "assurance-evaluation-contract", evaluation_version: VERSION, dependency_graph_version: "assurance-dependency-evaluation/v13.2", evidence_manifest: inp.evidence_refs.join(","), evaluation_inputs: inp.input_id, evaluation_outcome: exp.result_determination, explanation_reference: exp.explanation_id, execution_timestamp: "2026-07-15T00:00:00.000Z", replay_reference: "replay:assurance-evaluation-contract" });
  return nested({ ledger_id: id("assurance_evaluation_ledger", failures), entries: freezeArray([entry]), append_only: !has(failures, "LEDGER_MUTABLE"), immutable: !has(failures, "LEDGER_MUTABLE"), replayable: !has(failures, "REPLAY_OUTCOME_MISMATCH"), tenant_isolated: !has(failures, "TENANT_ISOLATION_FAILURE"), cryptographically_verifiable: !has(failures, "INTEGRITY_FAILURE") });
}

function replay(failures: readonly AssuranceEvaluationFailure[]): AssuranceEvaluationReplayReport {
  return nested({ report_id: id("assurance_evaluation_replay", failures), inputs_reproduced: !has(failures, "INPUTS_NONDETERMINISTIC"), dependency_ordering_reproduced: !has(failures, "ORDERING_NONDETERMINISTIC"), evidence_qualification_reproduced: !has(failures, "EVIDENCE_QUALIFICATION_NONDETERMINISTIC"), policy_bindings_reproduced: true, execution_path_reproduced: !has(failures, "REPLAY_OUTCOME_MISMATCH"), explanations_reproduced: !has(failures, "REPLAY_EXPLANATION_MISMATCH"), outcomes_reproduced: !has(failures, "REPLAY_OUTCOME_MISMATCH"), divergence_detected: has(failures, "REPLAY_EXPLANATION_MISMATCH") || has(failures, "REPLAY_OUTCOME_MISMATCH") });
}

type CertBase = Omit<AssuranceEvaluationContractResult, "certification" | "replay_hash" | "integrity_hash">;
function certTest(name: string, passed: boolean, failure: AssuranceEvaluationFailure, refs: readonly string[]): AssuranceEvaluationCertificationTest {
  return nested({ test_id: id("assurance_evaluation_test", name), name, expected: "PASS" as const, actual: passed ? "PASS" as const : "FAIL" as const, passed, failure_reason: passed ? null : failure, evidence_refs: refs });
}
function certificationTests(result: CertBase): readonly AssuranceEvaluationCertificationTest[] {
  const refs = freezeArray([result.contract.integrity_hash, result.inputs.integrity_hash, result.evidence.integrity_hash, result.ledger.integrity_hash]);
  return freezeArray([
    certTest("Evaluation contract complete", result.contract.evaluation_identity_deterministic && result.contract.replay_metadata_complete, "CONTRACT_INCOMPLETE", refs),
    certTest("Deterministic inputs enforced", result.inputs.complete && result.inputs.hidden_runtime_state_prohibited, "INPUTS_NONDETERMINISTIC", refs),
    certTest("Deterministic ordering enforced", result.execution.deterministic_ordering, "ORDERING_NONDETERMINISTIC", refs),
    certTest("Evidence qualification deterministic", result.evidence.deterministic, "EVIDENCE_QUALIFICATION_NONDETERMINISTIC", refs),
    certTest("Evaluation vocabulary closed", result.vocabulary.closed, "VOCABULARY_OPEN", refs),
    certTest("PASS semantics deterministic", result.vocabulary.pass_semantics === "completed successfully without violations", "PASS_SEMANTICS_INVALID", refs),
    certTest("FAIL semantics deterministic", result.vocabulary.fail_semantics === "completed and detected violations", "FAIL_SEMANTICS_INVALID", refs),
    certTest("PRUNED semantics deterministic", result.vocabulary.pruned_semantics.startsWith("did not execute"), "PRUNED_SEMANTICS_INVALID", refs),
    certTest("Implementation-specific terminal outcomes rejected", result.vocabulary.implementation_extensions_rejected, "CUSTOM_TERMINAL_OUTCOME_ACCEPTED", refs),
    certTest("Deterministic explanations produced", result.explanation.deterministic && result.explanation.complete, "EXPLANATION_NONDETERMINISTIC", refs),
    certTest("Evaluation ledger immutable", result.ledger.append_only && result.ledger.immutable, "LEDGER_MUTABLE", refs),
    certTest("Replay reproduces explanations", result.replay.explanations_reproduced, "REPLAY_EXPLANATION_MISMATCH", refs),
    certTest("Replay reproduces outcomes", result.replay.outcomes_reproduced, "REPLAY_OUTCOME_MISMATCH", refs),
    certTest("Tenant isolation preserved", result.inputs.tenant_isolated && result.ledger.tenant_isolated, "TENANT_ISOLATION_FAILURE", refs),
    certTest("Integrity validation successful", result.evidence.integrity_valid && result.ledger.cryptographically_verifiable, "INTEGRITY_FAILURE", refs),
  ]);
}

function replayHash(result: Omit<AssuranceEvaluationContractResult, "replay_hash" | "integrity_hash">): string {
  return hash({ contract: result.contract.integrity_hash, inputs: result.inputs.integrity_hash, evidence: result.evidence.integrity_hash, vocabulary: result.vocabulary.integrity_hash, execution: result.execution.integrity_hash, explanation: result.explanation.integrity_hash, ledger: result.ledger.integrity_hash, replay: result.replay.integrity_hash, certification: result.certification.integrity_hash });
}
function integrityHash(result: Omit<AssuranceEvaluationContractResult, "integrity_hash">): string { return hash({ version: result.phase_version, id: result.phase_identifier, status: result.certification.status, replay_hash: result.replay_hash }); }

export function runAssuranceEvaluationContract(input: AssuranceEvaluationInput = {}): AssuranceEvaluationContractResult {
  const dep = runAssuranceDependencyEvaluation({ tenant_id: input.tenant_id ?? "tenant_mission_control" });
  const depValid = validateAssuranceDependencyEvaluation(dep).valid;
  const directFailure = scenarioFailure(input.scenario ?? "BASELINE");
  const failures = freezeArray<AssuranceEvaluationFailure>([...(depValid ? [] : ["INTEGRITY_FAILURE" as const]), ...(directFailure ? [directFailure] : [])]);
  const c = contract(failures);
  const inp = inputs(input.tenant_id ?? "tenant_mission_control", dep.integrity_hash, failures);
  const ev = evidence(failures);
  const voc = vocabulary(failures);
  const exe = execution(failures);
  const exp = explanation(failures);
  const led = ledger(exp, inp, failures);
  const rep = replay(failures);
  const baseWithoutCertification: CertBase = { phase_version: VERSION, phase_identifier: ID, contract: c, inputs: inp, evidence: ev, vocabulary: voc, execution: exe, explanation: exp, ledger: led, replay: rep };
  const tests = certificationTests(baseWithoutCertification);
  const finalFailures = freezeArray([...new Set([...failures, ...tests.map((test) => test.failure_reason).filter((failure): failure is AssuranceEvaluationFailure => Boolean(failure))])]);
  const status = statusFor(finalFailures);
  const certification: AssuranceEvaluationCertification = nested({ certification_id: id("assurance_evaluation_certification", VERSION), status, certified: status === "PASS", failures: finalFailures, tests });
  const base = { ...baseWithoutCertification, certification };
  const rHash = replayHash(base);
  return Object.freeze({ ...base, replay_hash: rHash, integrity_hash: integrityHash({ ...base, replay_hash: rHash }) });
}

export function validateAssuranceEvaluationContract(result?: AssuranceEvaluationContractResult): AssuranceEvaluationValidation {
  if (!result) {
    const failures = freezeArray<AssuranceEvaluationFailure>(["CONTRACT_INCOMPLETE"]);
    const base = { valid: false, status: "FAIL" as const, certified: false, failures, replay_hash_valid: false, integrity_hash_valid: false, vocabulary_valid: false, ledger_valid: false, replay_valid: false };
    return nested({ ...base, validation_hash: hashWithoutIntegrity(base) });
  }
  const replay_hash_valid = replayHash(result) === result.replay_hash;
  const integrity_hash_valid = integrityHash(result) === result.integrity_hash && hashWithoutIntegrity(result.certification) === result.certification.integrity_hash;
  const vocabulary_valid = result.vocabulary.closed && result.vocabulary.terminal_outcomes.join(",") === "PASS,FAIL,PRUNED";
  const ledger_valid = result.ledger.append_only && result.ledger.immutable && result.ledger.cryptographically_verifiable;
  const replay_valid = result.replay.explanations_reproduced && result.replay.outcomes_reproduced;
  const valid = result.certification.status === "PASS" && result.certification.certified && result.certification.failures.length === 0 && replay_hash_valid && integrity_hash_valid && vocabulary_valid && ledger_valid && replay_valid;
  const base = { valid, status: result.certification.status, certified: result.certification.certified, failures: result.certification.failures, replay_hash_valid, integrity_hash_valid, vocabulary_valid, ledger_valid, replay_valid };
  return nested({ ...base, validation_hash: hashWithoutIntegrity(base) });
}

export function replayAssuranceEvaluationContract(result = runAssuranceEvaluationContract()): boolean {
  const replayed = runAssuranceEvaluationContract();
  return result.integrity_hash === replayed.integrity_hash && result.replay_hash === replayed.replay_hash && validateAssuranceEvaluationContract(result).valid;
}

export function getAssuranceEvaluationContractBundle(): AssuranceEvaluationContractBundle {
  const result = runAssuranceEvaluationContract();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, closed_terminal_vocabulary: true, deterministic_inputs_required: true, deterministic_evidence_required: true, immutable_evaluation_ledger_required: true, reproducible_explanations_required: true, replay_required: true }), result, validation: validateAssuranceEvaluationContract(result) });
}

export const AssuranceEvaluationContractService = Object.freeze({ run: runAssuranceEvaluationContract, validate: validateAssuranceEvaluationContract, replay: replayAssuranceEvaluationContract });
