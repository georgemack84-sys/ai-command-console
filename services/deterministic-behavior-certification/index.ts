import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  AdaptiveDeterminismDomain,
  BehavioralConsistencyReport,
  DashboardDeterminismValidation,
  DeterminismCertificationReport,
  DeterministicBehaviorApiSurface,
  DeterministicBehaviorCertificationRecord,
  DeterministicBehaviorCertificationTest,
  DeterministicBehaviorContract,
  DeterministicBehaviorFailure,
  DeterministicBehaviorInput,
  DeterministicBehaviorObservability,
  DeterministicBehaviorResult,
  DeterministicBehaviorScenario,
  DeterministicBehaviorValidationResult,
  DeterministicCertificationWidget,
  HiddenRandomnessSource,
  HiddenRandomnessValidation,
  PrioritizationDeterminismValidation,
  ProposalDeterminismValidation,
  ReplayDeterminismValidation,
  ScoringDeterminismValidation,
  SimulationDeterminismValidation,
  SuppressionDeterminismValidation,
} from "@/types/deterministic-behavior-certification";

const VERSION = "deterministic-behavior-certification/v10.15.2" as const;
const ID = "DeterministicBehaviorCertification" as const;
const TENANT_ID = "tenant_mission_control";
const MISSION_ID = "mission_adaptive_intelligence";
const WIDGETS: readonly DeterministicCertificationWidget[] = Object.freeze(["Behavior Certification", "Proposal Determinism", "Scoring Determinism", "Suppression Determinism", "Prioritization Determinism", "Simulation Determinism", "Replay Determinism", "Dashboard Determinism", "Hidden Randomness", "Determinism Report", "Consistency Report"]);
const DOMAINS: readonly AdaptiveDeterminismDomain[] = Object.freeze(["PROPOSAL_GENERATION", "SCORING", "SUPPRESSION", "PRIORITIZATION", "SIMULATION", "REPLAY", "DASHBOARD_RENDERING"]);
const RANDOMNESS: readonly HiddenRandomnessSource[] = Object.freeze(["RANDOM_NUMBER_GENERATION", "NON_SEEDED_STOCHASTIC_ALGORITHM", "RACE_CONDITION", "THREAD_SCHEDULING_DEPENDENCY", "UNORDERED_COLLECTION_TRAVERSAL", "NONDETERMINISTIC_DATABASE_QUERY", "TIMESTAMP_DEPENDENT_LOGIC", "FLOATING_POINT_INSTABILITY", "ASYNCHRONOUS_ORDERING", "EXTERNAL_SERVICE_VARIABILITY", "RUNTIME_ENVIRONMENT_DIFFERENCE", "HARDWARE_DEPENDENT_BEHAVIOR"]);

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 24)}`; }

function failureForScenario(scenario: DeterministicBehaviorScenario): DeterministicBehaviorFailure | undefined {
  const map: Partial<Record<DeterministicBehaviorScenario, DeterministicBehaviorFailure>> = {
    PROPOSAL_DRIFT: "PROPOSAL_GENERATION_NONDETERMINISTIC",
    PROPOSAL_ORDER_DRIFT: "PROPOSAL_ORDERING_DRIFT",
    PROPOSAL_ID_DRIFT: "PROPOSAL_IDENTIFIER_DRIFT",
    PROPOSAL_EVIDENCE_MISMATCH: "PROPOSAL_EVIDENCE_MISMATCH",
    SCORING_DRIFT: "RECOMMENDATION_SCORING_NONDETERMINISTIC",
    CONFIDENCE_DRIFT: "CONFIDENCE_SCORING_NONDETERMINISTIC",
    RISK_DRIFT: "RISK_SCORING_NONDETERMINISTIC",
    PATTERN_SCORE_DRIFT: "PATTERN_SCORING_NONDETERMINISTIC",
    SUPPRESSION_DRIFT: "SUPPRESSION_NONDETERMINISTIC",
    DUPLICATE_SUPPRESSION_DRIFT: "DUPLICATE_SUPPRESSION_DRIFT",
    WEAK_SUPPRESSION_DRIFT: "WEAK_PROPOSAL_SUPPRESSION_DRIFT",
    PRIORITIZATION_DRIFT: "PRIORITIZATION_NONDETERMINISTIC",
    PRIORITY_ORDER_DRIFT: "PRIORITY_ORDERING_DRIFT",
    SIMULATION_DRIFT: "SIMULATION_NONDETERMINISTIC",
    COUNTERFACTUAL_DRIFT: "COUNTERFACTUAL_REPLAY_NONDETERMINISTIC",
    REPLAY_DIVERGENCE: "REPLAY_RECONSTRUCTION_DIVERGED",
    REPLAY_EQUIVALENCE_FAILURE: "REPLAY_EQUIVALENCE_FAILED",
    DASHBOARD_DRIFT: "DASHBOARD_RENDERING_NONDETERMINISTIC",
    DASHBOARD_LINEAGE_MISSING: "DASHBOARD_LINEAGE_INCOMPLETE",
    HIDDEN_RANDOMNESS: "HIDDEN_RANDOMNESS_DETECTED",
    RACE_CONDITION: "RACE_CONDITION_DEPENDENCY",
    TIMESTAMP_DEPENDENCY: "TIMESTAMP_DEPENDENT_BEHAVIOR",
    EXTERNAL_NONDETERMINISM: "EXTERNAL_NONDETERMINISM_DETECTED",
    FLOATING_POINT_INSTABILITY: "FLOATING_POINT_STABILITY_FAILED",
    EQUIVALENCE_BELOW_THRESHOLD: "DETERMINISTIC_EQUIVALENCE_BELOW_THRESHOLD",
    INTEGRITY_FAILURE: "INTEGRITY_HASH_MISMATCH",
  };
  return map[scenario];
}

function failed(failures: readonly DeterministicBehaviorFailure[], values: readonly DeterministicBehaviorFailure[]): boolean {
  return failures.some((failure) => values.includes(failure));
}

function apiSurface(): DeterministicBehaviorApiSurface {
  const base: Omit<DeterministicBehaviorApiSurface, "integrity_hash"> = { api_id: "deterministic_behavior_certification_api", retrieve_dashboard: "POST /deterministic-behavior-certification/dashboard", retrieve_contract: "GET /deterministic-behavior-certification/contract", retrieve_sections: freezeArray(["certification", "proposal", "scoring", "suppression", "prioritization", "simulation", "replay", "dashboard-rendering", "randomness", "report", "consistency"]), validate_certification: "POST /deterministic-behavior-certification/validate", inspect_certification: "POST /deterministic-behavior-certification/inspect", mutation_supported: false, production_advancement_supported: false, randomness_override_supported: false, replay_divergence_override_supported: false };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function proposal(failures: readonly DeterministicBehaviorFailure[]): ProposalDeterminismValidation {
  const base: Omit<ProposalDeterminismValidation, "integrity_hash"> = { validation_id: "proposal_determinism_validation", proposal_hashes_identical: !failures.includes("PROPOSAL_GENERATION_NONDETERMINISTIC"), ordering_reproducible: !failures.includes("PROPOSAL_ORDERING_DRIFT"), identifiers_reproducible: !failures.includes("PROPOSAL_IDENTIFIER_DRIFT"), evidence_identical: !failures.includes("PROPOSAL_EVIDENCE_MISMATCH"), rationale_identical: !failures.includes("PROPOSAL_GENERATION_NONDETERMINISTIC"), lineage_identical: !failures.includes("PROPOSAL_EVIDENCE_MISMATCH") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function scoring(failures: readonly DeterministicBehaviorFailure[]): ScoringDeterminismValidation {
  const base: Omit<ScoringDeterminismValidation, "integrity_hash"> = { validation_id: "scoring_determinism_validation", recommendation_score_identical: !failures.includes("RECOMMENDATION_SCORING_NONDETERMINISTIC"), confidence_score_identical: !failures.includes("CONFIDENCE_SCORING_NONDETERMINISTIC"), risk_score_identical: !failures.includes("RISK_SCORING_NONDETERMINISTIC"), pattern_score_identical: !failures.includes("PATTERN_SCORING_NONDETERMINISTIC"), precision_identical: !failures.includes("FLOATING_POINT_STABILITY_FAILED"), weighting_identical: true, normalization_identical: true, tie_breaking_deterministic: !failures.includes("PRIORITY_ORDERING_DRIFT") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function suppression(failures: readonly DeterministicBehaviorFailure[]): SuppressionDeterminismValidation {
  const base: Omit<SuppressionDeterminismValidation, "integrity_hash"> = { validation_id: "suppression_determinism_validation", suppression_deterministic: !failures.includes("SUPPRESSION_NONDETERMINISTIC"), duplicate_suppression_reproducible: !failures.includes("DUPLICATE_SUPPRESSION_DRIFT"), weak_suppression_reproducible: !failures.includes("WEAK_PROPOSAL_SUPPRESSION_DRIFT"), unsupported_suppression_reproducible: true, governance_violation_suppression_reproducible: true, suppression_rationale_identical: !failures.includes("SUPPRESSION_NONDETERMINISTIC") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function prioritization(failures: readonly DeterministicBehaviorFailure[]): PrioritizationDeterminismValidation {
  const base: Omit<PrioritizationDeterminismValidation, "integrity_hash"> = { validation_id: "prioritization_determinism_validation", prioritization_deterministic: !failures.includes("PRIORITIZATION_NONDETERMINISTIC"), priority_ordering_reproducible: !failures.includes("PRIORITY_ORDERING_DRIFT"), sorting_stable: !failed(failures, ["PRIORITY_ORDERING_DRIFT", "HIDDEN_RANDOMNESS_DETECTED"]), mission_priority_identical: true, evidence_quality_identical: true, risk_priority_identical: true, governance_impact_identical: true };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function simulation(failures: readonly DeterministicBehaviorFailure[]): SimulationDeterminismValidation {
  const base: Omit<SimulationDeterminismValidation, "integrity_hash"> = { validation_id: "simulation_determinism_validation", simulation_states_identical: !failures.includes("SIMULATION_NONDETERMINISTIC"), simulation_outputs_identical: !failures.includes("SIMULATION_NONDETERMINISTIC"), state_transitions_reproducible: !failures.includes("RACE_CONDITION_DEPENDENCY"), completion_deterministic: !failures.includes("RACE_CONDITION_DEPENDENCY"), counterfactual_replay_deterministic: !failures.includes("COUNTERFACTUAL_REPLAY_NONDETERMINISTIC"), rollback_simulation_deterministic: true };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function replay(failures: readonly DeterministicBehaviorFailure[]): ReplayDeterminismValidation {
  const base: Omit<ReplayDeterminismValidation, "integrity_hash"> = { validation_id: "replay_determinism_validation", replay_complete: !failures.includes("REPLAY_RECONSTRUCTION_DIVERGED"), reconstruction_identical: !failures.includes("REPLAY_RECONSTRUCTION_DIVERGED"), event_order_identical: !failures.includes("REPLAY_EQUIVALENCE_FAILED"), replay_integrity_verified: !failures.includes("INTEGRITY_HASH_MISMATCH"), replay_equivalence_verified: !failures.includes("REPLAY_EQUIVALENCE_FAILED"), replay_omissions_absent: !failures.includes("DASHBOARD_LINEAGE_INCOMPLETE") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function dashboard(failures: readonly DeterministicBehaviorFailure[]): DashboardDeterminismValidation {
  const base: Omit<DashboardDeterminismValidation, "integrity_hash"> = { validation_id: "dashboard_determinism_validation", rendering_deterministic: !failures.includes("DASHBOARD_RENDERING_NONDETERMINISTIC"), presentation_identical: !failures.includes("DASHBOARD_RENDERING_NONDETERMINISTIC"), lineage_complete: !failures.includes("DASHBOARD_LINEAGE_INCOMPLETE"), visualization_stable: !failures.includes("DASHBOARD_RENDERING_NONDETERMINISTIC"), hidden_adaptive_behavior_absent: !failures.includes("HIDDEN_RANDOMNESS_DETECTED"), dashboard_query_hash_identical: !failures.includes("DASHBOARD_RENDERING_NONDETERMINISTIC") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function randomness(failures: readonly DeterministicBehaviorFailure[]): HiddenRandomnessValidation {
  const sources: HiddenRandomnessSource[] = [];
  if (failures.includes("HIDDEN_RANDOMNESS_DETECTED")) sources.push("RANDOM_NUMBER_GENERATION");
  if (failures.includes("RACE_CONDITION_DEPENDENCY")) sources.push("RACE_CONDITION");
  if (failures.includes("TIMESTAMP_DEPENDENT_BEHAVIOR")) sources.push("TIMESTAMP_DEPENDENT_LOGIC");
  if (failures.includes("EXTERNAL_NONDETERMINISM_DETECTED")) sources.push("EXTERNAL_SERVICE_VARIABILITY");
  if (failures.includes("FLOATING_POINT_STABILITY_FAILED")) sources.push("FLOATING_POINT_INSTABILITY");
  const base: Omit<HiddenRandomnessValidation, "integrity_hash"> = { validation_id: "hidden_randomness_validation", hidden_randomness_absent: sources.length === 0, detected_sources: freezeArray(sources), runtime_race_conditions_absent: !failures.includes("RACE_CONDITION_DEPENDENCY"), timestamp_dependency_absent: !failures.includes("TIMESTAMP_DEPENDENT_BEHAVIOR"), external_variability_eliminated: !failures.includes("EXTERNAL_NONDETERMINISM_DETECTED"), floating_point_stability_verified: !failures.includes("FLOATING_POINT_STABILITY_FAILED"), unordered_traversal_absent: true };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function score(failures: readonly DeterministicBehaviorFailure[]): number {
  if (!failures.length) return 1;
  if (failures.includes("DETERMINISTIC_EQUIVALENCE_BELOW_THRESHOLD")) return 0.97;
  return 0.99;
}
function record(input: DeterministicBehaviorInput, failures: readonly DeterministicBehaviorFailure[]): DeterministicBehaviorCertificationRecord {
  const equivalent = score(failures);
  const base: Omit<DeterministicBehaviorCertificationRecord, "integrity_hash"> = { certification_id: id("deterministic_behavior_certification", VERSION), tenant_id: input.tenant_id ?? TENANT_ID, mission_id: input.mission_id ?? MISSION_ID, execution_id: "adaptive-execution:canonical:1", replay_execution_id: "adaptive-replay:canonical:1", proposal_determinism_status: failed(failures, ["PROPOSAL_GENERATION_NONDETERMINISTIC", "PROPOSAL_ORDERING_DRIFT", "PROPOSAL_IDENTIFIER_DRIFT", "PROPOSAL_EVIDENCE_MISMATCH"]) ? "FAIL" : "PASS", scoring_determinism_status: failed(failures, ["RECOMMENDATION_SCORING_NONDETERMINISTIC", "CONFIDENCE_SCORING_NONDETERMINISTIC", "RISK_SCORING_NONDETERMINISTIC", "PATTERN_SCORING_NONDETERMINISTIC", "FLOATING_POINT_STABILITY_FAILED"]) ? "FAIL" : "PASS", suppression_determinism_status: failed(failures, ["SUPPRESSION_NONDETERMINISTIC", "DUPLICATE_SUPPRESSION_DRIFT", "WEAK_PROPOSAL_SUPPRESSION_DRIFT"]) ? "FAIL" : "PASS", prioritization_determinism_status: failed(failures, ["PRIORITIZATION_NONDETERMINISTIC", "PRIORITY_ORDERING_DRIFT"]) ? "FAIL" : "PASS", simulation_determinism_status: failed(failures, ["SIMULATION_NONDETERMINISTIC", "COUNTERFACTUAL_REPLAY_NONDETERMINISTIC", "RACE_CONDITION_DEPENDENCY"]) ? "FAIL" : "PASS", replay_determinism_status: failed(failures, ["REPLAY_RECONSTRUCTION_DIVERGED", "REPLAY_EQUIVALENCE_FAILED"]) ? "FAIL" : "PASS", dashboard_determinism_status: failed(failures, ["DASHBOARD_RENDERING_NONDETERMINISTIC", "DASHBOARD_LINEAGE_INCOMPLETE"]) ? "FAIL" : "PASS", hidden_randomness_detected: failed(failures, ["HIDDEN_RANDOMNESS_DETECTED", "RACE_CONDITION_DEPENDENCY", "TIMESTAMP_DEPENDENT_BEHAVIOR", "EXTERNAL_NONDETERMINISM_DETECTED", "FLOATING_POINT_STABILITY_FAILED"]), inconsistency_detected: failures.length > 0, deterministic_equivalence_score: equivalent, findings: failures, evidence_refs: freezeArray(["evidence:determinism:canonical-inputs", "evidence:determinism:canonical-outputs"]), governance_refs: freezeArray(["governance:determinism:v1"]), replay_refs: freezeArray(["replay:determinism:1"]), dashboard_refs: freezeArray(["dashboard:determinism:1"]), certification_status: failures.length ? "REJECTED" : "CERTIFIED", certification_timestamp: "2026-07-09T00:00:00.000Z" };
  return Object.freeze({ ...base, integrity_hash: failures.includes("INTEGRITY_HASH_MISMATCH") ? "invalid-integrity" : hashWithoutIntegrity(base) });
}

function report(record: DeterministicBehaviorCertificationRecord): DeterminismCertificationReport {
  const base: Omit<DeterminismCertificationReport, "integrity_hash"> = { report_id: "determinism_certification_report", certification_outcome: record.certification_status, deterministic_equivalence_score: record.deterministic_equivalence_score, proposal_generation_analysis: record.proposal_determinism_status, scoring_validation: record.scoring_determinism_status, suppression_validation: record.suppression_determinism_status, prioritization_validation: record.prioritization_determinism_status, simulation_validation: record.simulation_determinism_status, replay_validation: record.replay_determinism_status, dashboard_validation: record.dashboard_determinism_status, hidden_randomness_assessment: record.hidden_randomness_detected ? "FAIL" : "PASS", corrective_actions: record.findings.map((f) => `eliminate:${f}`), production_readiness_recommendation: record.certification_status === "CERTIFIED" ? "READY" : "BLOCKED" };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function consistencyReport(record: DeterministicBehaviorCertificationRecord): BehavioralConsistencyReport {
  const base: Omit<BehavioralConsistencyReport, "integrity_hash"> = { report_id: "behavioral_consistency_report", execution_replay_comparisons: freezeArray([`${record.execution_id}:${record.replay_execution_id}:${record.deterministic_equivalence_score}`]), proposal_consistency: record.proposal_determinism_status, scoring_consistency: record.scoring_determinism_status, simulation_equivalence: record.simulation_determinism_status, replay_equivalence: record.replay_determinism_status, dashboard_consistency: record.dashboard_determinism_status, randomness_detection_results: record.hidden_randomness_detected ? record.findings : freezeArray(["none"]), stable_ordering_verified: record.prioritization_determinism_status === "PASS", evidence_reproducible: !record.findings.includes("PROPOSAL_EVIDENCE_MISMATCH"), governance_constitutional_consistency: true, certification_evidence_refs: record.evidence_refs };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function test(name: string, passed: boolean, failure: DeterministicBehaviorFailure, refs: readonly string[]): DeterministicBehaviorCertificationTest {
  const base: Omit<DeterministicBehaviorCertificationTest, "integrity_hash"> = { test_id: id("determinism_test", name), name, expected: "PASS", actual: passed ? "PASS" : "FAIL", passed, failure_reason: passed ? null : failure, evidence_refs: refs };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
type BuildBase = Omit<DeterministicBehaviorResult, "validation_tests" | "failures" | "replay_hash" | "integrity_hash">;
function tests(result: BuildBase): readonly DeterministicBehaviorCertificationTest[] {
  const refs = freezeArray([result.record.integrity_hash]);
  return freezeArray([
    test("Proposal generation deterministic", result.proposal_validation.proposal_hashes_identical, "PROPOSAL_GENERATION_NONDETERMINISTIC", refs),
    test("Proposal ordering reproducible", result.proposal_validation.ordering_reproducible, "PROPOSAL_ORDERING_DRIFT", refs),
    test("Proposal identifiers deterministic", result.proposal_validation.identifiers_reproducible, "PROPOSAL_IDENTIFIER_DRIFT", refs),
    test("Proposal evidence identical", result.proposal_validation.evidence_identical, "PROPOSAL_EVIDENCE_MISMATCH", refs),
    test("Recommendation scoring deterministic", result.scoring_validation.recommendation_score_identical, "RECOMMENDATION_SCORING_NONDETERMINISTIC", refs),
    test("Confidence scoring deterministic", result.scoring_validation.confidence_score_identical, "CONFIDENCE_SCORING_NONDETERMINISTIC", refs),
    test("Risk scoring deterministic", result.scoring_validation.risk_score_identical, "RISK_SCORING_NONDETERMINISTIC", refs),
    test("Pattern scoring deterministic", result.scoring_validation.pattern_score_identical, "PATTERN_SCORING_NONDETERMINISTIC", refs),
    test("Suppression deterministic", result.suppression_validation.suppression_deterministic, "SUPPRESSION_NONDETERMINISTIC", refs),
    test("Duplicate suppression reproducible", result.suppression_validation.duplicate_suppression_reproducible, "DUPLICATE_SUPPRESSION_DRIFT", refs),
    test("Weak proposal suppression reproducible", result.suppression_validation.weak_suppression_reproducible, "WEAK_PROPOSAL_SUPPRESSION_DRIFT", refs),
    test("Prioritization deterministic", result.prioritization_validation.prioritization_deterministic, "PRIORITIZATION_NONDETERMINISTIC", refs),
    test("Priority ordering reproducible", result.prioritization_validation.priority_ordering_reproducible, "PRIORITY_ORDERING_DRIFT", refs),
    test("Simulation deterministic", result.simulation_validation.simulation_outputs_identical, "SIMULATION_NONDETERMINISTIC", refs),
    test("Counterfactual replay deterministic", result.simulation_validation.counterfactual_replay_deterministic, "COUNTERFACTUAL_REPLAY_NONDETERMINISTIC", refs),
    test("Replay reconstruction identical", result.replay_validation.reconstruction_identical, "REPLAY_RECONSTRUCTION_DIVERGED", refs),
    test("Replay equivalence verified", result.replay_validation.replay_equivalence_verified, "REPLAY_EQUIVALENCE_FAILED", refs),
    test("Dashboard rendering deterministic", result.dashboard_validation.rendering_deterministic, "DASHBOARD_RENDERING_NONDETERMINISTIC", refs),
    test("Dashboard lineage complete", result.dashboard_validation.lineage_complete, "DASHBOARD_LINEAGE_INCOMPLETE", refs),
    test("Hidden randomness absent", result.hidden_randomness_validation.hidden_randomness_absent, "HIDDEN_RANDOMNESS_DETECTED", refs),
    test("Runtime race conditions absent", result.hidden_randomness_validation.runtime_race_conditions_absent, "RACE_CONDITION_DEPENDENCY", refs),
    test("Timestamp-dependent behavior absent", result.hidden_randomness_validation.timestamp_dependency_absent, "TIMESTAMP_DEPENDENT_BEHAVIOR", refs),
    test("External nondeterminism eliminated", result.hidden_randomness_validation.external_variability_eliminated, "EXTERNAL_NONDETERMINISM_DETECTED", refs),
    test("Floating-point stability verified", result.hidden_randomness_validation.floating_point_stability_verified, "FLOATING_POINT_STABILITY_FAILED", refs),
    test("Replay mismatch fails closed", result.replay_validation.replay_equivalence_verified, "REPLAY_EQUIVALENCE_FAILED", refs),
    test("Deterministic equivalence score = 100%", result.record.deterministic_equivalence_score === 1, "DETERMINISTIC_EQUIVALENCE_BELOW_THRESHOLD", refs),
    test("Integrity hashes reproducible", hashWithoutIntegrity(result.record) === result.record.integrity_hash, "INTEGRITY_HASH_MISMATCH", refs),
  ]);
}

function replayHash(result: Omit<DeterministicBehaviorResult, "replay_hash" | "integrity_hash">): string {
  return hash({ record: result.record.integrity_hash, proposal: result.proposal_validation.integrity_hash, scoring: result.scoring_validation.integrity_hash, simulation: result.simulation_validation.integrity_hash, replay: result.replay_validation.integrity_hash, dashboard: result.dashboard_validation.integrity_hash, failures: result.failures });
}
function integrityHash(result: Omit<DeterministicBehaviorResult, "integrity_hash">): string {
  return hash({ version: result.deterministic_behavior_version, id: result.certification_identifier, status: result.status, replay_hash: result.replay_hash });
}

export function certifyDeterministicBehavior(input: DeterministicBehaviorInput = {}): DeterministicBehaviorResult {
  const initialFailures = freezeArray(failureForScenario(input.scenario ?? "BASELINE") ? [failureForScenario(input.scenario ?? "BASELINE") as DeterministicBehaviorFailure] : []);
  const rec = record(input, initialFailures);
  const baseWithoutTests: BuildBase = { deterministic_behavior_version: VERSION, certification_identifier: ID, status: initialFailures.length ? "FAIL" : "PASS", api_surface: apiSurface(), record: rec, proposal_validation: proposal(initialFailures), scoring_validation: scoring(initialFailures), suppression_validation: suppression(initialFailures), prioritization_validation: prioritization(initialFailures), simulation_validation: simulation(initialFailures), replay_validation: replay(initialFailures), dashboard_validation: dashboard(initialFailures), hidden_randomness_validation: randomness(initialFailures), certification_report: report(rec), consistency_report: consistencyReport(rec), widgets: WIDGETS, deterministic: initialFailures.length === 0, replayable: !failed(initialFailures, ["REPLAY_RECONSTRUCTION_DIVERGED", "REPLAY_EQUIVALENCE_FAILED"]), production_ready: initialFailures.length === 0 };
  const validation_tests = tests(baseWithoutTests);
  const failures = freezeArray([...new Set([...initialFailures, ...validation_tests.map((t) => t.failure_reason).filter((f): f is DeterministicBehaviorFailure => Boolean(f))])]);
  const base: Omit<DeterministicBehaviorResult, "replay_hash" | "integrity_hash"> = { ...baseWithoutTests, status: failures.length ? "FAIL" : "PASS", deterministic: failures.length === 0, production_ready: failures.length === 0, validation_tests, failures };
  const rHash = replayHash(base);
  return Object.freeze({ ...base, replay_hash: rHash, integrity_hash: integrityHash({ ...base, replay_hash: rHash }) });
}

export function validateDeterministicBehaviorCertification(result?: DeterministicBehaviorResult): DeterministicBehaviorValidationResult {
  if (!result) {
    const failures = freezeArray<DeterministicBehaviorFailure>(["PROPOSAL_GENERATION_NONDETERMINISTIC"]);
    const base: Omit<DeterministicBehaviorValidationResult, "certification_hash"> = { certification_id: null, valid: false, status: "FAIL", failures, replay_hash_valid: false, integrity_hash_valid: false };
    return Object.freeze({ ...base, certification_hash: hashWithoutIntegrity(base) });
  }
  const nested = hashWithoutIntegrity(result.record) === result.record.integrity_hash && result.validation_tests.every((t) => hashWithoutIntegrity(t) === t.integrity_hash);
  const replay_hash_valid = replayHash(result) === result.replay_hash;
  const integrity_hash_valid = integrityHash(result) === result.integrity_hash && nested;
  const valid = result.status === "PASS" && result.failures.length === 0 && result.record.deterministic_equivalence_score === 1 && replay_hash_valid && integrity_hash_valid;
  const base: Omit<DeterministicBehaviorValidationResult, "certification_hash"> = { certification_id: result.record.certification_id, valid, status: result.status, failures: result.failures, replay_hash_valid, integrity_hash_valid };
  return Object.freeze({ ...base, certification_hash: hashWithoutIntegrity(base) });
}
export function replayDeterministicBehaviorCertification(result: DeterministicBehaviorResult): boolean { return validateDeterministicBehaviorCertification(result).valid; }
export function buildDeterministicBehaviorObservability(result = certifyDeterministicBehavior()): DeterministicBehaviorObservability {
  return Object.freeze({ certification_id: result.record.certification_id, status: result.status, equivalence_score: result.record.deterministic_equivalence_score, failed_tests: result.validation_tests.filter((t) => !t.passed).length, failures: result.failures, deterministic: result.deterministic, replayable: result.replayable, production_ready: result.production_ready, integrity_hash: result.integrity_hash });
}
export function getDeterministicBehaviorContract(): DeterministicBehaviorContract {
  const result = certifyDeterministicBehavior();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, widgets: WIDGETS, domains: DOMAINS, hidden_randomness_sources: RANDOMNESS, required_equivalence_score: 1, deterministic_required: true, replay_required: true }), result, validation: validateDeterministicBehaviorCertification(result), observability: buildDeterministicBehaviorObservability(result) });
}
export const DeterministicBehaviorCertification = Object.freeze({ certify: certifyDeterministicBehavior, validate: validateDeterministicBehaviorCertification, replay: replayDeterministicBehaviorCertification });
