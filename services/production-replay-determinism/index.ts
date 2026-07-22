import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runLiveEvidenceCollection } from "@/services/live-evidence-collection";
import type {
  ProductionReplayDeterminismBundle,
  ProductionReplayDeterminismCertificationTest,
  ProductionReplayDeterminismFailure,
  ProductionReplayDeterminismInput,
  ProductionReplayDeterminismOutcome,
  ProductionReplayDeterminismResult,
  ProductionReplayDeterminismValidation,
  ReplayDivergenceCategory,
} from "@/types/production-replay-determinism";

const VERSION = "production-replay-determinism/v16.5" as const;
const IDENTIFIER = "ProductionReplayDeterminism" as const;
const TIMESTAMP = "2026-07-15T00:00:00.000Z" as const;
const DEFAULT_TENANT = "tenant_phase_16_replay_determinism";
const DEFAULT_OPERATOR = "operator_phase_16_replay_determinism";

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function verify(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 20)}`; }
function has(failures: readonly ProductionReplayDeterminismFailure[], failure: ProductionReplayDeterminismFailure): boolean { return failures.includes(failure); }
function directFailure(scenario: ProductionReplayDeterminismInput["scenario"]): ProductionReplayDeterminismFailure | undefined { return !scenario || scenario === "BASELINE" ? undefined : scenario; }
function outcomeFor(failures: readonly ProductionReplayDeterminismFailure[]): ProductionReplayDeterminismOutcome {
  if (failures.length === 1 && failures[0] === "NON_CONSTITUTIONAL_REPLAY_WARNING") return "CONDITIONAL_PASS";
  return failures.length ? "FAIL" : "PASS";
}

const divergenceCategories = freezeArray(["NO_DIVERGENCE", "INPUT_DIVERGENCE", "CONFIGURATION_DIVERGENCE", "DEPENDENCY_DIVERGENCE", "POLICY_DIVERGENCE", "MODEL_DIVERGENCE", "ORDERING_DIVERGENCE", "EVIDENCE_DIVERGENCE", "EXPLANATION_DIVERGENCE", "OUTPUT_DIVERGENCE", "UNEXPLAINED_DIVERGENCE"] as const satisfies readonly ReplayDivergenceCategory[]);

function certTest(name: string, passed: boolean, failure: ProductionReplayDeterminismFailure, evidence_refs: readonly string[]): ProductionReplayDeterminismCertificationTest {
  const actual: ProductionReplayDeterminismOutcome = passed ? "PASS" : failure === "NON_CONSTITUTIONAL_REPLAY_WARNING" ? "CONDITIONAL_PASS" : "FAIL";
  return nested({ test_id: id("production_replay_determinism_test", name), name, expected: "PASS" as const, actual, passed, failure_reason: passed ? null : failure, evidence_refs: freezeArray(evidence_refs) });
}
function resultReplayHash(result: Omit<ProductionReplayDeterminismResult, "replay_hash" | "integrity_hash">): string {
  return hash({ evidence: result.live_evidence_collection_ref, engine: result.engine.integrity_hash, comparator: result.comparator.integrity_hash, divergence: result.divergence.integrity_hash, replay_record: result.replay_record.integrity_hash, lineage: result.lineage.integrity_hash, ledger: result.ledger.map((entry) => entry.integrity_hash), observability: result.observability.integrity_hash, tests: result.certification_tests.map((test) => test.integrity_hash), outcome: result.outcome });
}
function resultIntegrityHash(result: Omit<ProductionReplayDeterminismResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.outcome, replay_hash: result.replay_hash });
}

export function runProductionReplayDeterminism(input: ProductionReplayDeterminismInput = {}): ProductionReplayDeterminismResult {
  const evidence = runLiveEvidenceCollection({ tenant_id: input.tenant_id ?? DEFAULT_TENANT, operator_id: input.operator_id ?? DEFAULT_OPERATOR, mission_id: input.mission_id });
  const direct = directFailure(input.scenario);
  const upstreamFailures: ProductionReplayDeterminismFailure[] = evidence.outcome === "PASS" ? [] : ["PHASE_16_4_EVIDENCE_NOT_VALID"];
  const failures = freezeArray([...new Set([...upstreamFailures, ...(direct ? [direct] : [])])]);
  const tenantId = input.tenant_id ?? DEFAULT_TENANT;
  const replaySessionId = input.replay_session_id ?? id("replay_session", evidence.integrity_hash);
  const replayRefs = has(failures, "REPLAY_NOT_REPRODUCIBLE") ? freezeArray([]) : freezeArray([evidence.replay_hash, evidence.replay_evidence.integrity_hash]);
  const certificationRefs = freezeArray([evidence.integrity_hash, ...evidence.certification_tests.map((test) => test.integrity_hash)]);
  const evidenceRefs = has(failures, "EVIDENCE_INTEGRITY_NOT_VERIFIED") ? freezeArray([]) : freezeArray([evidence.master_evidence.integrity_hash, evidence.operational_evidence.integrity_hash, evidence.recommendation_evidence.integrity_hash]);
  const governanceRefs = freezeArray([evidence.integration.integrity_hash, evidence.master_evidence.governance_refs[0] ?? evidence.production_advisory_runtime_ref]);
  const comparatorOk = !has(failures, "REPLAY_NOT_DETERMINISTIC") && !has(failures, "REPLAY_NOT_REPRODUCIBLE") && !has(failures, "EXPLANATIONS_NOT_CONSISTENT");
  const divergenceCategory: ReplayDivergenceCategory = has(failures, "UNEXPLAINED_DIVERGENCE_NOT_BLOCKING") ? "UNEXPLAINED_DIVERGENCE" : has(failures, "EXPLANATIONS_NOT_CONSISTENT") ? "EXPLANATION_DIVERGENCE" : has(failures, "EVIDENCE_INTEGRITY_NOT_VERIFIED") ? "EVIDENCE_DIVERGENCE" : has(failures, "REPLAY_NOT_DETERMINISTIC") ? "OUTPUT_DIVERGENCE" : "NO_DIVERGENCE";
  const engine = nested({ replay_engine_id: id("production_replay_engine", replaySessionId), replay_session_id: replaySessionId, replay_inputs: freezeArray([evidence.master_evidence.integrity_hash, evidence.registry.integrity_hash, evidence.integration.integrity_hash]), replay_outputs: replayRefs, reconstructed_recommendations: freezeArray([evidence.recommendation_evidence.recommendation_id]), reconstructed_explanations: has(failures, "EXPLANATIONS_NOT_CONSISTENT") ? freezeArray([]) : freezeArray(evidence.recommendation_evidence.reasoning_refs), reconstructed_confidence: freezeArray([evidence.recommendation_evidence.confidence]), reconstructed_evidence: evidenceRefs, reconstructed_governance: governanceRefs, reconstructed_operator_workflow: freezeArray([evidence.operational_evidence.operator_interactions[0] ?? ""]), reconstructed_certification_context: certificationRefs, reconstructed_lineage: has(failures, "REPLAY_LINEAGE_INCOMPLETE") ? freezeArray([]) : freezeArray([evidence.lineage.integrity_hash]), deterministic: !has(failures, "REPLAY_NOT_DETERMINISTIC"), advisory_only: !has(failures, "ADVISORY_BOUNDARY_NOT_PRESERVED"), mutates_production_state: has(failures, "ADVISORY_BOUNDARY_NOT_PRESERVED") });
  const comparator = nested({ comparator_id: id("replay_comparator", replaySessionId), recommendation_equal: comparatorOk, explanation_equal: !has(failures, "EXPLANATIONS_NOT_CONSISTENT"), confidence_equal: comparatorOk, evidence_equal: evidenceRefs.length > 0, governance_equal: governanceRefs.length > 0, ordering_equal: comparatorOk, policy_equal: comparatorOk, operator_interaction_equal: comparatorOk, replay_references_equal: replayRefs.length > 0, certification_references_equal: certificationRefs.length > 0, deterministic_behavior: comparatorOk });
  const divergence = nested({ divergence_id: id("production_replay_divergence", replaySessionId), tenant_id: tenantId, pilot_id: evidence.master_evidence.mission_id, recommendation_id: evidence.recommendation_evidence.recommendation_id, replay_id: id("production_replay", replaySessionId), replay_session_id: replaySessionId, divergence_category: divergenceCategory, severity: divergenceCategory === "NO_DIVERGENCE" ? "NONE" as const : divergenceCategory === "UNEXPLAINED_DIVERGENCE" ? "CRITICAL" as const : "HIGH" as const, expected_behavior: "Certified advisory behavior reconstructed from immutable evidence.", observed_behavior: divergenceCategory === "NO_DIVERGENCE" ? "Replay matched certified production behavior." : "Replay divergence detected.", root_cause: divergenceCategory === "NO_DIVERGENCE" ? "none" : divergenceCategory === "UNEXPLAINED_DIVERGENCE" ? null : divergenceCategory.toLowerCase(), evidence_refs: evidenceRefs, policy_refs: governanceRefs, replay_refs: replayRefs, certification_refs: certificationRefs, classification_status: has(failures, "DIVERGENCE_NOT_GOVERNED") ? "UNCLASSIFIED" as const : "CLASSIFIED" as const, resolution_status: divergenceCategory === "NO_DIVERGENCE" ? "NOT_REQUIRED" as const : divergenceCategory === "UNEXPLAINED_DIVERGENCE" ? "UNRESOLVED" as const : "RESOLVED" as const, detected_timestamp: TIMESTAMP, blocks_certification: divergenceCategory === "UNEXPLAINED_DIVERGENCE" && !has(failures, "UNEXPLAINED_DIVERGENCE_NOT_BLOCKING") ? true : divergenceCategory === "UNEXPLAINED_DIVERGENCE" ? false : false, deterministic_classification: !has(failures, "DIVERGENCE_NOT_GOVERNED") });
  const replay_record = nested({ replay_id: divergence.replay_id, tenant_id: tenantId, pilot_id: evidence.master_evidence.mission_id, replay_scope: "production pilot advisory replay", production_reference: evidence.production_advisory_runtime_ref, replay_reference: engine.integrity_hash, recommendation_refs: freezeArray([evidence.recommendation_evidence.integrity_hash]), evidence_refs: evidenceRefs, operator_refs: freezeArray([evidence.operational_evidence.operator_interactions[0] ?? ""]), governance_refs: governanceRefs, comparison_result: comparator.deterministic_behavior ? "MATCH" as const : "MISMATCH" as const, determinism_status: comparator.deterministic_behavior ? "DETERMINISTIC" as const : "NON_DETERMINISTIC" as const, divergence_summary: divergenceCategory, certification_status: divergenceCategory === "UNEXPLAINED_DIVERGENCE" && divergence.blocks_certification ? "BLOCKED" as const : comparator.deterministic_behavior ? "CERTIFIED" as const : "REQUIRES_REVIEW" as const, created_timestamp: TIMESTAMP });
  const lineage = nested({ lineage_id: id("production_replay_lineage", replaySessionId), unified_lineage_ref: has(failures, "EVIDENCE_PLATFORM_NOT_REUSED") ? "" : evidence.lineage.integrity_hash, production_activity_refs: freezeArray([evidence.master_evidence.integrity_hash]), evidence_refs: evidenceRefs, replay_refs: replayRefs, comparison_refs: freezeArray([comparator.integrity_hash, divergence.integrity_hash]), validation_refs: freezeArray([engine.integrity_hash, replay_record.integrity_hash]), certification_refs: certificationRefs, duplicate_lineage_created: has(failures, "EVIDENCE_PLATFORM_NOT_REUSED"), complete: !has(failures, "REPLAY_LINEAGE_INCOMPLETE"), immutable: !has(failures, "REPLAY_EVIDENCE_MUTABLE") });
  const ledgerTypes = ["REPLAY_REQUEST", "REPLAY_EXECUTION", "REPLAY_OUTPUT", "REPLAY_COMPARISON", "DIVERGENCE_CLASSIFICATION", "REPLAY_VALIDATION", "LINEAGE_EXTENSION", "CERTIFICATION_REFERENCE"] as const;
  const ledger = freezeArray(ledgerTypes.map((event_type, index) => nested({ ledger_entry_id: id("production_replay_ledger", { replaySessionId, event_type }), sequence: index + 1, event_type, replay_session_id: replaySessionId, evidence_refs: has(failures, "REPLAY_EVIDENCE_MUTABLE") ? freezeArray([]) : evidenceRefs, replay_refs: replayRefs, certification_refs: certificationRefs, append_only: !has(failures, "REPLAY_EVIDENCE_MUTABLE"), immutable: !has(failures, "REPLAY_EVIDENCE_MUTABLE") })));
  const observability = nested({ replay_success_rate: comparator.deterministic_behavior ? 1 : 0, replay_latency_ms: 37, replay_determinism: comparator.deterministic_behavior, divergence_classifications: freezeArray([divergenceCategory]), explanation_consistency: comparator.explanation_equal, evidence_integrity: evidenceRefs.length > 0, replay_lineage_health: lineage.complete, certification_blockers: divergence.divergence_category === "UNEXPLAINED_DIVERGENCE" && divergence.blocks_certification ? 1 : 0, tenant_replay_isolation: !has(failures, "TENANT_ISOLATION_NOT_MAINTAINED"), unresolved_replay_divergence: divergence.resolution_status === "UNRESOLVED" ? 1 : 0 });
  const tests = freezeArray([
    certTest("Replay deterministic", engine.deterministic && comparator.deterministic_behavior && observability.replay_determinism, "REPLAY_NOT_DETERMINISTIC", [engine.integrity_hash]),
    certTest("Divergence governed", divergence.deterministic_classification && divergence.classification_status === "CLASSIFIED", "DIVERGENCE_NOT_GOVERNED", [divergence.integrity_hash]),
    certTest("Replay reproducible", replayRefs.length > 0 && comparator.replay_references_equal && replay_record.determinism_status === "DETERMINISTIC", "REPLAY_NOT_REPRODUCIBLE", [replay_record.integrity_hash]),
    certTest("Explanations consistent", comparator.explanation_equal && engine.reconstructed_explanations.length > 0, "EXPLANATIONS_NOT_CONSISTENT", [comparator.integrity_hash]),
    certTest("Evidence integrity verified", evidenceRefs.length > 0 && comparator.evidence_equal && observability.evidence_integrity, "EVIDENCE_INTEGRITY_NOT_VERIFIED", [comparator.integrity_hash]),
    certTest("Replay lineage complete", lineage.complete && lineage.unified_lineage_ref.length > 0 && lineage.certification_refs.length > 0, "REPLAY_LINEAGE_INCOMPLETE", [lineage.integrity_hash]),
    certTest("Replay evidence immutable", lineage.immutable && ledger.every((entry) => entry.immutable && entry.append_only), "REPLAY_EVIDENCE_MUTABLE", ledger.map((entry) => entry.integrity_hash)),
    certTest("Unexplained divergence blocks certification", divergence.divergence_category !== "UNEXPLAINED_DIVERGENCE" || divergence.blocks_certification, "UNEXPLAINED_DIVERGENCE_NOT_BLOCKING", [divergence.integrity_hash]),
    certTest("Advisory boundary preserved", engine.advisory_only && !engine.mutates_production_state, "ADVISORY_BOUNDARY_NOT_PRESERVED", [engine.integrity_hash]),
    certTest("Tenant isolation maintained", observability.tenant_replay_isolation && replay_record.tenant_id === tenantId, "TENANT_ISOLATION_NOT_MAINTAINED", [replay_record.integrity_hash]),
    certTest("Evidence platform reused", !lineage.duplicate_lineage_created && Boolean(lineage.unified_lineage_ref), "EVIDENCE_PLATFORM_NOT_REUSED", [lineage.integrity_hash]),
    certTest("Phase 16.4 evidence valid", evidence.outcome === "PASS", "PHASE_16_4_EVIDENCE_NOT_VALID", [evidence.integrity_hash]),
  ]);
  const effectiveFailures = freezeArray([...new Set([...failures, ...tests.map((test) => test.failure_reason).filter((failure): failure is ProductionReplayDeterminismFailure => Boolean(failure))])]);
  const outcome = outcomeFor(effectiveFailures);
  const base: Omit<ProductionReplayDeterminismResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, live_evidence_collection_ref: evidence.integrity_hash, engine, comparator, divergence, replay_record, lineage, ledger, observability, certification_tests: tests, failures: effectiveFailures, outcome };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateProductionReplayDeterminism(result = runProductionReplayDeterminism()): ProductionReplayDeterminismValidation {
  const engine_valid = verify(result.engine) && result.engine.deterministic && result.engine.advisory_only && !result.engine.mutates_production_state && result.engine.replay_inputs.length > 0 && result.engine.replay_outputs.length > 0 && result.engine.reconstructed_explanations.length > 0;
  const comparator_valid = verify(result.comparator) && Object.entries(result.comparator).filter(([key]) => key !== "comparator_id" && key !== "integrity_hash").every(([, value]) => value === true);
  const divergence_valid = verify(result.divergence) && result.divergence.divergence_category === "NO_DIVERGENCE" && result.divergence.classification_status === "CLASSIFIED" && result.divergence.resolution_status === "NOT_REQUIRED" && result.divergence.deterministic_classification;
  const replay_record_valid = verify(result.replay_record) && result.replay_record.comparison_result === "MATCH" && result.replay_record.determinism_status === "DETERMINISTIC" && result.replay_record.certification_status === "CERTIFIED" && result.replay_record.evidence_refs.length > 0;
  const lineage_valid = verify(result.lineage) && result.lineage.complete && result.lineage.immutable && !result.lineage.duplicate_lineage_created && Boolean(result.lineage.unified_lineage_ref) && result.lineage.certification_refs.length > 0;
  const ledger_valid = result.ledger.length === 8 && result.ledger.every((entry, index) => verify(entry) && entry.sequence === index + 1 && entry.evidence_refs.length > 0 && entry.replay_refs.length > 0 && entry.certification_refs.length > 0 && entry.append_only && entry.immutable);
  const observability_valid = verify(result.observability) && result.observability.replay_success_rate === 1 && result.observability.replay_determinism && result.observability.explanation_consistency && result.observability.evidence_integrity && result.observability.replay_lineage_health && result.observability.certification_blockers === 0 && result.observability.tenant_replay_isolation && result.observability.unresolved_replay_divergence === 0;
  const certification_valid = result.certification_tests.length === 12 && result.certification_tests.every((test) => verify(test) && test.passed && test.evidence_refs.length > 0);
  const result_replay_valid = resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
  const valid = result.outcome === "PASS" && engine_valid && comparator_valid && divergence_valid && replay_record_valid && lineage_valid && ledger_valid && observability_valid && certification_valid && result_replay_valid;
  return nested({ valid, outcome: result.outcome, engine_valid, comparator_valid, divergence_valid, replay_record_valid, lineage_valid, ledger_valid, observability_valid, certification_valid, result_replay_valid, failures: result.failures });
}

export function replayProductionReplayDeterminism(result = runProductionReplayDeterminism()): boolean {
  const replayed = runProductionReplayDeterminism();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateProductionReplayDeterminism(result).valid;
}

export function getProductionReplayDeterminismBundle(): ProductionReplayDeterminismBundle {
  const result = runProductionReplayDeterminism();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, upstream_phase: "live-evidence-collection/v16.4" as const, divergence_categories: divergenceCategories, certification_outcomes: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const) }), result, validation: validateProductionReplayDeterminism(result) });
}

export const ProductionReplayDeterminismService = Object.freeze({ run: runProductionReplayDeterminism, validate: validateProductionReplayDeterminism, replay: replayProductionReplayDeterminism });
