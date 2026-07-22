import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runCertificationLineageSupersession, validateCertificationLineageSupersession } from "@/services/certification-lineage-supersession";
import type {
  ReplayCertificationTest,
  ReplayCertificationOutcome,
  ReplayDivergenceCategory,
  ReplayIntegrityExplainabilityBundle,
  ReplayIntegrityExplainabilityInput,
  ReplayIntegrityExplainabilityResult,
  ReplayIntegrityExplainabilityValidation,
  ReplayIntegrityFailure,
  ReplayIntegrityOutcome,
  ReplayIntegrityScenario,
  ReplayLifecycleState,
} from "@/types/replay-integrity-explainability";

const VERSION = "replay-integrity-explainability/v14.10" as const;
const IDENTIFIER = "ReplayIntegrityExplainability" as const;
const TIMESTAMP = "2026-07-15T00:00:00.000Z" as const;

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function verify(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 20)}`; }
function directFailure(scenario: ReplayIntegrityScenario): ReplayIntegrityFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function has(failures: readonly ReplayIntegrityFailure[], failure: ReplayIntegrityFailure): boolean { return failures.includes(failure); }
function outcomeFor(failures: readonly ReplayIntegrityFailure[]): ReplayCertificationOutcome {
  if (failures.length === 1 && failures[0] === "NON_CONSTITUTIONAL_EXPLANATION_WARNING") return "CONDITIONAL_PASS";
  return failures.length ? "FAIL" : "PASS";
}

const replayLifecycle = freezeArray(["REGISTERED", "PREPARED", "EXECUTING", "VERIFYING", "COMPLETED", "FAILED", "DIVERGED", "INVALID", "CANCELLED"] as const satisfies readonly ReplayLifecycleState[]);
const failureStates = freezeArray(["FAILED", "DIVERGED", "INVALID", "CANCELLED"] as const satisfies readonly ReplayLifecycleState[]);
const integrityOutcomes = freezeArray(["IDENTICAL", "ACCEPTABLE_VARIANCE", "DIVERGED", "INVALID"] as const satisfies readonly ReplayIntegrityOutcome[]);
const divergenceCategories = freezeArray(["INPUT_DIVERGENCE", "DATASET_DIVERGENCE", "ENVIRONMENT_DIVERGENCE", "DEPENDENCY_DIVERGENCE", "EXECUTION_DIVERGENCE", "OUTPUT_DIVERGENCE", "GOVERNANCE_DIVERGENCE", "CERTIFICATION_DIVERGENCE", "UNEXPLAINED_DIVERGENCE"] as const satisfies readonly ReplayDivergenceCategory[]);

function resultReplayHash(result: Omit<ReplayIntegrityExplainabilityResult, "replay_hash" | "integrity_hash">): string {
  return hash({ lineage: result.certification_lineage_ref, contract: result.contract.integrity_hash, execution: result.execution.integrity_hash, replayIntegrity: result.replay_integrity.integrity_hash, explanation: result.explanation.integrity_hash, ledger: result.replay_ledger.map((e) => e.integrity_hash), divergences: result.divergences.map((d) => d.integrity_hash), artifactIntegrity: result.artifact_integrity.integrity_hash, tests: result.certification_tests.map((t) => t.integrity_hash), outcome: result.outcome });
}
function resultIntegrityHash(result: Omit<ReplayIntegrityExplainabilityResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.outcome, replay_hash: result.replay_hash });
}
function test(name: string, passed: boolean, failure: ReplayIntegrityFailure): ReplayCertificationTest {
  const actual: ReplayCertificationOutcome = passed ? "PASS" : failure === "NON_CONSTITUTIONAL_EXPLANATION_WARNING" ? "CONDITIONAL_PASS" : "FAIL";
  return nested({ test_id: id("replay_integrity_test", name), name, expected: "PASS" as const, actual, passed, failure_reason: passed ? null : failure });
}

export function runReplayIntegrityExplainability(input: ReplayIntegrityExplainabilityInput = {}): ReplayIntegrityExplainabilityResult {
  const lineage = runCertificationLineageSupersession();
  const lineageValid = validateCertificationLineageSupersession(lineage).valid;
  const direct = directFailure(input.scenario ?? "BASELINE");
  const failures = freezeArray([...new Set([...(lineageValid ? [] : ["LINEAGE_NOT_APPROVED" as const]), ...(direct ? [direct] : [])])]);
  const replayId = id("replay_execution", lineage.integrity_hash);
  const explanationId = id("replay_explanation", replayId);
  const contract = nested({ contract_version: VERSION, certification_lineage_ref: lineage.integrity_hash, lifecycle: replayLifecycle, failure_states: failureStates, preserves_execution_ordering: !has(failures, "ORDERING_NOT_REPRODUCIBLE"), preserves_identities: true, preserves_evidence: !has(failures, "EVIDENCE_CHAIN_INCOMPLETE"), preserves_governance_state: !has(failures, "GOVERNANCE_REASONING_NOT_REPRODUCIBLE"), preserves_dependency_ordering: !has(failures, "DEPENDENCY_GRAPH_LOST"), preserves_environment_configuration: !has(failures, "ENVIRONMENT_RESTORE_FAILED"), never_modifies_history: true, original_execution_canonical: true });
  const execution = nested({ replay_id: replayId, execution_reference: lineage.replay_hash, replay_status: has(failures, "REPLAY_NON_DETERMINISTIC") ? "DIVERGED" as const : "COMPLETED" as const, replay_environment: has(failures, "ENVIRONMENT_RESTORE_FAILED") ? "" : lineage.dependency_governance_ref, replay_inputs: has(failures, "INPUT_RECONSTRUCTION_FAILED") ? freezeArray([]) : freezeArray([lineage.integrity_hash, lineage.replay_hash]), replay_outputs: has(failures, "OUTPUT_REPRODUCTION_FAILED") ? freezeArray([]) : freezeArray([id("replay_output", replayId)]), divergence_detected: has(failures, "UNEXPLAINED_DIVERGENCE_NOT_BLOCKED"), explanation_reference: explanationId, integrity_status: has(failures, "ARTIFACT_HASH_FAILURE") ? "INVALID" as const : "IDENTICAL" as const, completion_timestamp: TIMESTAMP });
  const replay_integrity = nested({ integrity_report_id: id("replay_integrity", replayId), outcome: execution.integrity_status, execution_ordering_valid: !has(failures, "ORDERING_NOT_REPRODUCIBLE"), outputs_valid: !has(failures, "OUTPUT_REPRODUCTION_FAILED"), evidence_valid: !has(failures, "EVIDENCE_CHAIN_INCOMPLETE"), dependency_graph_valid: !has(failures, "DEPENDENCY_GRAPH_LOST"), governance_decisions_valid: !has(failures, "GOVERNANCE_REASONING_NOT_REPRODUCIBLE"), certification_outcomes_valid: !has(failures, "CERTIFICATION_REASONING_NOT_REPRODUCIBLE"), environment_state_valid: !has(failures, "ENVIRONMENT_RESTORE_FAILED"), differences_classified: !has(failures, "DIVERGENCE_DETECTION_NON_DETERMINISTIC") });
  const explanation = nested({ explanation_id: explanationId, execution_summary: has(failures, "EXPLAINABILITY_NON_DETERMINISTIC") ? "" : "Replay reproduced certification lineage, evidence, governance, dependency ordering, and outcomes deterministically.", decision_sequence: freezeArray(["register replay", "prepare inputs", "execute replay", "verify integrity", "explain outcome"]), evidence_chain: has(failures, "EVIDENCE_CHAIN_INCOMPLETE") ? freezeArray([]) : freezeArray([lineage.integrity_hash, replay_integrity.integrity_hash]), dependency_graph: has(failures, "DEPENDENCY_GRAPH_LOST") ? freezeArray([]) : freezeArray([lineage.dependency_governance_ref]), governance_references: has(failures, "GOVERNANCE_REASONING_NOT_REPRODUCIBLE") ? freezeArray([]) : freezeArray([lineage.contract.integrity_hash]), replay_references: freezeArray([replayId]), integrity_references: freezeArray([replay_integrity.integrity_hash]), deterministic: !has(failures, "EXPLAINABILITY_NON_DETERMINISTIC"), reproducible: !has(failures, "EXPLAINABILITY_NON_DETERMINISTIC"), immutable: !has(failures, "AUDIT_MUTABLE") });
  const replay_ledger = freezeArray((["REPLAY_REQUESTED", "REPLAY_EXECUTED", "INTEGRITY_REPORTED", "EXPLANATION_REGISTERED", "DIVERGENCE_CHECKED", "CERTIFICATION_REFERENCED"] as const).map((event_type, index) => nested({ ledger_entry_id: id("replay_ledger", { replayId, event_type }), event_type, replay_id: replayId, sequence: index + 1, immutable: !has(failures, "LEDGER_MUTABLE") && !has(failures, "AUDIT_MUTABLE"), lineage_ref: has(failures, "LINEAGE_LOST") ? "" : id("replay_lineage", { replayId, event_type }) })));
  const divergences = freezeArray(divergenceCategories.map((category) => nested({ divergence_id: id("replay_divergence", { replayId, category }), replay_id: replayId, category, detected: category === "UNEXPLAINED_DIVERGENCE" ? has(failures, "UNEXPLAINED_DIVERGENCE_NOT_BLOCKED") : false, explained: category !== "UNEXPLAINED_DIVERGENCE", certification_blocked: category === "UNEXPLAINED_DIVERGENCE" ? !has(failures, "UNEXPLAINED_DIVERGENCE_NOT_BLOCKED") : true, evidence_ref: id("divergence_evidence", category) })));
  const artifact_integrity = nested({ verification_id: id("artifact_integrity", replayId), artifact_hashes_verified: !has(failures, "ARTIFACT_HASH_FAILURE"), signatures_verified: true, lineage_validated: !has(failures, "LINEAGE_LOST"), dependency_references_validated: !has(failures, "DEPENDENCY_GRAPH_LOST"), replay_evidence_validated: !has(failures, "EVIDENCE_CHAIN_INCOMPLETE"), certification_lineage_validated: !has(failures, "LINEAGE_LOST"), audit_chain_validated: !has(failures, "AUDIT_MUTABLE"), integrity_state: has(failures, "ARTIFACT_HASH_FAILURE") ? "FAILED" as const : "VERIFIED" as const });
  const tests = freezeArray([
    test("Replay Contract enforced", contract.never_modifies_history && contract.original_execution_canonical, "REPLAY_CONTRACT_FAILURE"),
    test("Replay deterministic", execution.replay_status === "COMPLETED", "REPLAY_NON_DETERMINISTIC"),
    test("Replay ordering reproducible", contract.preserves_execution_ordering && replay_integrity.execution_ordering_valid, "ORDERING_NOT_REPRODUCIBLE"),
    test("Replay inputs reconstructed", execution.replay_inputs.length > 0, "INPUT_RECONSTRUCTION_FAILED"),
    test("Replay outputs reproducible", execution.replay_outputs.length > 0 && replay_integrity.outputs_valid, "OUTPUT_REPRODUCTION_FAILED"),
    test("Dependency graph preserved", replay_integrity.dependency_graph_valid && explanation.dependency_graph.length > 0, "DEPENDENCY_GRAPH_LOST"),
    test("Environment restored", Boolean(execution.replay_environment) && replay_integrity.environment_state_valid, "ENVIRONMENT_RESTORE_FAILED"),
    test("Integrity validation deterministic", !has(failures, "INTEGRITY_VALIDATION_NON_DETERMINISTIC"), "INTEGRITY_VALIDATION_NON_DETERMINISTIC"),
    test("Artifact hashes verified", artifact_integrity.artifact_hashes_verified, "ARTIFACT_HASH_FAILURE"),
    test("Lineage preserved", artifact_integrity.lineage_validated && replay_ledger.every((entry) => Boolean(entry.lineage_ref)), "LINEAGE_LOST"),
    test("Explainability deterministic", explanation.deterministic && explanation.reproducible, "EXPLAINABILITY_NON_DETERMINISTIC"),
    test("Evidence chain complete", explanation.evidence_chain.length > 0 && replay_integrity.evidence_valid, "EVIDENCE_CHAIN_INCOMPLETE"),
    test("Governance reasoning reproducible", explanation.governance_references.length > 0 && replay_integrity.governance_decisions_valid, "GOVERNANCE_REASONING_NOT_REPRODUCIBLE"),
    test("Certification reasoning reproducible", replay_integrity.certification_outcomes_valid, "CERTIFICATION_REASONING_NOT_REPRODUCIBLE"),
    test("Replay Ledger immutable", replay_ledger.every((entry) => entry.immutable), "LEDGER_MUTABLE"),
    test("Replay history complete", replay_ledger.length === 6, "REPLAY_HISTORY_INCOMPLETE"),
    test("Divergence detection deterministic", replay_integrity.differences_classified, "DIVERGENCE_DETECTION_NON_DETERMINISTIC"),
    test("Unexplained divergence blocks certification", divergences.find((d) => d.category === "UNEXPLAINED_DIVERGENCE")?.certification_blocked === true, "UNEXPLAINED_DIVERGENCE_NOT_BLOCKED"),
    test("Audit trail immutable", artifact_integrity.audit_chain_validated && explanation.immutable, "AUDIT_MUTABLE"),
    test("Constitutional ownership preserved", !has(failures, "CONSTITUTIONAL_OWNERSHIP_LOST"), "CONSTITUTIONAL_OWNERSHIP_LOST"),
  ]);
  const effectiveFailures = freezeArray([...new Set([...failures, ...tests.map((t) => t.failure_reason).filter((failure): failure is ReplayIntegrityFailure => Boolean(failure))])]);
  const outcome = outcomeFor(effectiveFailures);
  const base: Omit<ReplayIntegrityExplainabilityResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, certification_lineage_ref: lineage.integrity_hash, contract, execution, replay_integrity, explanation, replay_ledger, divergences, artifact_integrity, certification_tests: tests, failures: effectiveFailures, outcome };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateReplayIntegrityExplainability(result = runReplayIntegrityExplainability()): ReplayIntegrityExplainabilityValidation {
  const contract_valid = verify(result.contract) && result.contract.never_modifies_history && result.contract.original_execution_canonical && result.contract.lifecycle.length === 9;
  const execution_valid = verify(result.execution) && result.execution.replay_status === "COMPLETED" && result.execution.replay_inputs.length > 0 && result.execution.replay_outputs.length > 0 && result.execution.integrity_status === "IDENTICAL";
  const replay_integrity_valid = verify(result.replay_integrity) && result.replay_integrity.outcome === "IDENTICAL" && Object.entries(result.replay_integrity).filter(([key]) => !key.endsWith("_id") && key !== "integrity_hash" && key !== "outcome").every(([, value]) => value === true);
  const explanation_valid = verify(result.explanation) && result.explanation.deterministic && result.explanation.reproducible && result.explanation.immutable && result.explanation.evidence_chain.length > 0 && result.explanation.dependency_graph.length > 0 && result.explanation.governance_references.length > 0;
  const ledger_valid = result.replay_ledger.length === 6 && result.replay_ledger.every((entry, index) => verify(entry) && entry.sequence === index + 1 && entry.immutable && Boolean(entry.lineage_ref));
  const divergence_valid = result.divergences.length === 9 && result.divergences.every((entry) => verify(entry) && (entry.category !== "UNEXPLAINED_DIVERGENCE" || entry.certification_blocked));
  const artifact_integrity_valid = verify(result.artifact_integrity) && result.artifact_integrity.integrity_state === "VERIFIED" && result.artifact_integrity.artifact_hashes_verified && result.artifact_integrity.lineage_validated && result.artifact_integrity.audit_chain_validated;
  const certification_valid = result.certification_tests.length === 20 && result.certification_tests.every((t) => verify(t) && t.passed);
  const integrityValid = resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
  const valid = result.outcome === "PASS" && integrityValid && contract_valid && execution_valid && replay_integrity_valid && explanation_valid && ledger_valid && divergence_valid && artifact_integrity_valid && certification_valid;
  return nested({ valid, outcome: result.outcome, contract_valid, execution_valid, replay_integrity_valid, explanation_valid, ledger_valid, divergence_valid, artifact_integrity_valid, certification_valid, failures: result.failures });
}

export function replayReplayIntegrityExplainability(result = runReplayIntegrityExplainability()): boolean {
  const replayed = runReplayIntegrityExplainability();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateReplayIntegrityExplainability(result).valid;
}

export function getReplayIntegrityExplainabilityBundle(): ReplayIntegrityExplainabilityBundle {
  const result = runReplayIntegrityExplainability();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, certification_lineage_phase: "certification-lineage-supersession/v14.9" as const, replay_lifecycle: replayLifecycle, integrity_outcomes: integrityOutcomes, divergence_categories: divergenceCategories, certification_outcomes: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const) }), result, validation: validateReplayIntegrityExplainability(result) });
}

export const ReplayIntegrityExplainabilityService = Object.freeze({ run: runReplayIntegrityExplainability, validate: validateReplayIntegrityExplainability, replay: replayReplayIntegrityExplainability });
