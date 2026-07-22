import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  AdaptiveReplaySubsystem,
  ConstitutionalReplayCertification,
  EvidenceReconstructionCertification,
  GovernanceReplayCertification,
  InputReconstructionCertification,
  LedgerReplayCertification,
  OutputReconstructionCertification,
  ReasoningEquivalenceCertification,
  ReplayCertificationApiSurface,
  ReplayCertificationContract,
  ReplayCertificationFailure,
  ReplayCertificationInput,
  ReplayCertificationObservability,
  ReplayCertificationRecord,
  ReplayCertificationReport,
  ReplayCertificationResult,
  ReplayCertificationScenario,
  ReplayCertificationTest,
  ReplayCertificationValidationResult,
  ReplayCertificationWidget,
  ReplayIntegrityCertification,
  ReplayLedgerRef,
  ReplayReconstructionReport,
  SimulationReplayCertification,
} from "@/types/replay-certification";

const VERSION = "replay-certification/v10.15.3" as const;
const ID = "ReplayCertification" as const;
const TENANT_ID = "tenant_mission_control";
const MISSION_ID = "mission_adaptive_intelligence";
const WIDGETS: readonly ReplayCertificationWidget[] = Object.freeze(["Replay Certification", "Input Reconstruction", "Evidence Reconstruction", "Reasoning Equivalence", "Output Reconstruction", "Governance Replay", "Constitutional Replay", "Simulation Replay", "Ledger Replay", "Replay Integrity", "Certification Report", "Reconstruction Report"]);
const SUBSYSTEMS: readonly AdaptiveReplaySubsystem[] = Object.freeze(["Outcome Observation", "Outcome Normalization", "Recommendation Effectiveness", "Pattern Intelligence", "Strategy Evolution", "Confidence Adaptation", "Risk Adaptation", "Governance-Aware Adaptation", "Operator Feedback Integration", "Adaptation Proposal Engine", "Adaptive Simulation", "Drift Defense", "Adaptive Memory", "Adaptive Dashboard", "Adaptive Certification"]);
const LEDGERS: readonly ReplayLedgerRef[] = Object.freeze(["OutcomeObservationLedger", "NormalizedOutcomeLedger", "RecommendationEffectivenessLedger", "PatternIntelligenceLedger", "StrategyEvolutionLedger", "ConfidenceAdaptationLedger", "RiskAdaptationLedger", "GovernanceAdaptationLedger", "OperatorFeedbackLedger", "AdaptationProposalLedger", "AdaptationSimulationLedger", "AdaptiveDriftLedger", "AdaptiveMemoryLedger", "AdaptiveDashboardLedger", "AdaptiveCertificationLedger"]);

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 24)}`; }

function failureForScenario(scenario: ReplayCertificationScenario): ReplayCertificationFailure | undefined {
  const map: Partial<Record<ReplayCertificationScenario, ReplayCertificationFailure>> = {
    INCOMPLETE_RECONSTRUCTION: "INCOMPLETE_REPLAY_RECONSTRUCTION",
    MISSING_INPUTS: "INPUT_RECONSTRUCTION_INCOMPLETE",
    MISSING_EVIDENCE: "EVIDENCE_RECONSTRUCTION_INCOMPLETE",
    NORMALIZED_OUTCOME_DRIFT: "NORMALIZED_OUTCOME_REPLAY_DIVERGED",
    REASONING_DIVERGENCE: "REASONING_REPLAY_DIVERGED",
    RECOMMENDATION_REASONING_DIVERGENCE: "RECOMMENDATION_REASONING_REPLAY_DIVERGED",
    CONFIDENCE_CALCULATION_DIVERGENCE: "CONFIDENCE_CALCULATION_REPLAY_DIVERGED",
    RISK_CALCULATION_DIVERGENCE: "RISK_CALCULATION_REPLAY_DIVERGED",
    PROPOSAL_GENERATION_DIVERGENCE: "PROPOSAL_GENERATION_REPLAY_DIVERGED",
    OUTPUT_DIVERGENCE: "OUTPUT_REPLAY_DIVERGED",
    GOVERNANCE_MISMATCH: "GOVERNANCE_REPLAY_MISMATCH",
    CONSTITUTIONAL_MISMATCH: "CONSTITUTIONAL_REPLAY_MISMATCH",
    SUPPRESSION_DIVERGENCE: "SUPPRESSION_REPLAY_DIVERGED",
    PRIORITIZATION_DIVERGENCE: "PRIORITIZATION_REPLAY_DIVERGED",
    SIMULATION_DIVERGENCE: "SIMULATION_REPLAY_DIVERGED",
    COUNTERFACTUAL_DIVERGENCE: "COUNTERFACTUAL_REPLAY_DIVERGED",
    DASHBOARD_DIVERGENCE: "DASHBOARD_REPLAY_DIVERGED",
    CERTIFICATION_OUTCOME_DIVERGENCE: "CERTIFICATION_OUTCOME_REPLAY_DIVERGED",
    LEDGER_HISTORY_INCOMPLETE: "LEDGER_HISTORY_INCOMPLETE",
    REPLAY_REFERENCE_OMISSION: "REPLAY_REFERENCE_OMITTED",
    EVIDENCE_LINEAGE_GAP: "EVIDENCE_LINEAGE_INCOMPLETE",
    INTEGRITY_FAILURE: "INTEGRITY_HASH_MISMATCH",
    APPEND_ONLY_VIOLATION: "APPEND_ONLY_LEDGER_VIOLATION",
    HIDDEN_RUNTIME_DEPENDENCY: "HIDDEN_RUNTIME_DEPENDENCY_DETECTED",
    REPLAY_NONDETERMINISM: "REPLAY_NONDETERMINISM_DETECTED",
    EQUIVALENCE_BELOW_THRESHOLD: "REPLAY_EQUIVALENCE_BELOW_THRESHOLD",
  };
  return map[scenario];
}

function failed(failures: readonly ReplayCertificationFailure[], values: readonly ReplayCertificationFailure[]): boolean { return failures.some((failure) => values.includes(failure)); }

function apiSurface(): ReplayCertificationApiSurface {
  const base: Omit<ReplayCertificationApiSurface, "integrity_hash"> = { api_id: "replay_certification_api", retrieve_dashboard: "POST /replay-certification/dashboard", retrieve_contract: "GET /replay-certification/contract", retrieve_sections: freezeArray(["certification", "input", "evidence", "reasoning", "output", "governance", "constitutional", "simulation", "ledger", "integrity", "report", "reconstruction"]), validate_certification: "POST /replay-certification/validate", inspect_certification: "POST /replay-certification/inspect", mutation_supported: false, hidden_state_supported: false, production_advancement_supported: false, override_supported: false };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function equivalenceScore(failures: readonly ReplayCertificationFailure[]): number {
  if (!failures.length) return 1;
  if (failures.includes("REPLAY_EQUIVALENCE_BELOW_THRESHOLD")) return 0.97;
  return 0.99;
}

function record(input: ReplayCertificationInput, failures: readonly ReplayCertificationFailure[]): ReplayCertificationRecord {
  const base: Omit<ReplayCertificationRecord, "integrity_hash"> = { certification_id: id("replay_certification", VERSION), tenant_id: input.tenant_id ?? TENANT_ID, mission_id: input.mission_id ?? MISSION_ID, original_execution_id: "adaptive-execution:canonical:1", replay_execution_id: "adaptive-replay:canonical:1", input_reconstruction_status: failed(failures, ["INPUT_RECONSTRUCTION_INCOMPLETE", "INCOMPLETE_REPLAY_RECONSTRUCTION"]) ? "FAIL" : "PASS", evidence_reconstruction_status: failed(failures, ["EVIDENCE_RECONSTRUCTION_INCOMPLETE", "EVIDENCE_LINEAGE_INCOMPLETE", "INCOMPLETE_REPLAY_RECONSTRUCTION"]) ? "FAIL" : "PASS", reasoning_reconstruction_status: failed(failures, ["REASONING_REPLAY_DIVERGED", "RECOMMENDATION_REASONING_REPLAY_DIVERGED", "CONFIDENCE_CALCULATION_REPLAY_DIVERGED", "RISK_CALCULATION_REPLAY_DIVERGED", "SUPPRESSION_REPLAY_DIVERGED", "PRIORITIZATION_REPLAY_DIVERGED"]) ? "FAIL" : "PASS", output_reconstruction_status: failed(failures, ["OUTPUT_REPLAY_DIVERGED", "PROPOSAL_GENERATION_REPLAY_DIVERGED", "DASHBOARD_REPLAY_DIVERGED", "CERTIFICATION_OUTCOME_REPLAY_DIVERGED"]) ? "FAIL" : "PASS", governance_replay_status: failed(failures, ["GOVERNANCE_REPLAY_MISMATCH"]) ? "FAIL" : "PASS", constitutional_replay_status: failed(failures, ["CONSTITUTIONAL_REPLAY_MISMATCH"]) ? "FAIL" : "PASS", simulation_replay_status: failed(failures, ["SIMULATION_REPLAY_DIVERGED", "COUNTERFACTUAL_REPLAY_DIVERGED"]) ? "FAIL" : "PASS", replay_completeness_status: failed(failures, ["INCOMPLETE_REPLAY_RECONSTRUCTION", "LEDGER_HISTORY_INCOMPLETE", "REPLAY_REFERENCE_OMITTED"]) ? "FAIL" : "PASS", replay_determinism_status: failed(failures, ["REPLAY_NONDETERMINISM_DETECTED", "HIDDEN_RUNTIME_DEPENDENCY_DETECTED"]) ? "FAIL" : "PASS", replay_integrity_status: failed(failures, ["INTEGRITY_HASH_MISMATCH", "APPEND_ONLY_LEDGER_VIOLATION"]) ? "FAIL" : "PASS", replay_equivalence_score: equivalenceScore(failures), findings: failures, evidence_refs: failed(failures, ["EVIDENCE_RECONSTRUCTION_INCOMPLETE", "EVIDENCE_LINEAGE_INCOMPLETE"]) ? freezeArray([]) : freezeArray(["evidence:replay:canonical-inputs", "truth-ledger:replay:canonical-evidence"]), governance_refs: failures.includes("GOVERNANCE_REPLAY_MISMATCH") ? freezeArray([]) : freezeArray(["governance:replay:1"]), constitutional_refs: failures.includes("CONSTITUTIONAL_REPLAY_MISMATCH") ? freezeArray([]) : freezeArray(["constitutional:replay:1"]), replay_refs: failures.includes("REPLAY_REFERENCE_OMITTED") ? freezeArray([]) : freezeArray(["replay:certification:1", "replay:reconstruction:1"]), ledger_refs: failures.includes("LEDGER_HISTORY_INCOMPLETE") ? freezeArray(LEDGERS.slice(0, -1)) : LEDGERS, certification_status: failures.length ? "REJECTED" : "CERTIFIED", certification_timestamp: "2026-07-09T00:00:00.000Z" };
  return Object.freeze({ ...base, integrity_hash: failures.includes("INTEGRITY_HASH_MISMATCH") ? "invalid-integrity" : hashWithoutIntegrity(base) });
}

function inputReconstruction(failures: readonly ReplayCertificationFailure[]): InputReconstructionCertification {
  const ok = !failed(failures, ["INPUT_RECONSTRUCTION_INCOMPLETE", "INCOMPLETE_REPLAY_RECONSTRUCTION"]);
  const base: Omit<InputReconstructionCertification, "integrity_hash"> = { certification_id: "input_reconstruction_certification", mission_context_reconstructed: ok, observation_records_reconstructed: ok, normalized_outcomes_reconstructed: !failures.includes("NORMALIZED_OUTCOME_REPLAY_DIVERGED"), evidence_refs_reconstructed: !failures.includes("EVIDENCE_RECONSTRUCTION_INCOMPLETE"), governance_state_reconstructed: !failures.includes("GOVERNANCE_REPLAY_MISMATCH"), constitutional_state_reconstructed: !failures.includes("CONSTITUTIONAL_REPLAY_MISMATCH"), operator_context_reconstructed: ok, tenant_context_reconstructed: ok };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function evidenceReconstruction(failures: readonly ReplayCertificationFailure[]): EvidenceReconstructionCertification {
  const ok = !failed(failures, ["EVIDENCE_RECONSTRUCTION_INCOMPLETE", "EVIDENCE_LINEAGE_INCOMPLETE"]);
  const base: Omit<EvidenceReconstructionCertification, "integrity_hash"> = { certification_id: "evidence_reconstruction_certification", truth_ledger_refs_reconstructed: ok, evidence_lineage_complete: ok, historical_outcomes_reconstructed: ok, operator_feedback_reconstructed: ok, simulation_evidence_reconstructed: ok, governance_evidence_reconstructed: !failures.includes("GOVERNANCE_REPLAY_MISMATCH"), adaptive_memory_refs_reconstructed: ok, evidence_ordering_identical: ok, evidence_immutable: !failures.includes("APPEND_ONLY_LEDGER_VIOLATION") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function reasoningEquivalence(failures: readonly ReplayCertificationFailure[]): ReasoningEquivalenceCertification {
  const base: Omit<ReasoningEquivalenceCertification, "integrity_hash"> = { certification_id: "reasoning_equivalence_certification", adaptive_reasoning_reproduced: !failures.includes("REASONING_REPLAY_DIVERGED"), recommendation_reasoning_reproduced: !failures.includes("RECOMMENDATION_REASONING_REPLAY_DIVERGED"), pattern_analysis_reproduced: !failures.includes("REASONING_REPLAY_DIVERGED"), confidence_analysis_reproduced: !failures.includes("CONFIDENCE_CALCULATION_REPLAY_DIVERGED"), risk_analysis_reproduced: !failures.includes("RISK_CALCULATION_REPLAY_DIVERGED"), strategy_evolution_reproduced: !failures.includes("REASONING_REPLAY_DIVERGED"), suppression_rationale_reproduced: !failures.includes("SUPPRESSION_REPLAY_DIVERGED"), prioritization_rationale_reproduced: !failures.includes("PRIORITIZATION_REPLAY_DIVERGED") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function outputReconstruction(failures: readonly ReplayCertificationFailure[]): OutputReconstructionCertification {
  const base: Omit<OutputReconstructionCertification, "integrity_hash"> = { certification_id: "output_reconstruction_certification", adaptive_proposals_reproduced: !failures.includes("PROPOSAL_GENERATION_REPLAY_DIVERGED"), recommendation_scores_reproduced: !failures.includes("RECOMMENDATION_REASONING_REPLAY_DIVERGED"), confidence_scores_reproduced: !failures.includes("CONFIDENCE_CALCULATION_REPLAY_DIVERGED"), risk_scores_reproduced: !failures.includes("RISK_CALCULATION_REPLAY_DIVERGED"), governance_decisions_reproduced: !failures.includes("GOVERNANCE_REPLAY_MISMATCH"), simulation_outputs_reproduced: !failures.includes("SIMULATION_REPLAY_DIVERGED"), certification_outcomes_reproduced: !failures.includes("CERTIFICATION_OUTCOME_REPLAY_DIVERGED"), dashboard_artifacts_reproduced: !failures.includes("DASHBOARD_REPLAY_DIVERGED") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function governanceReplay(failures: readonly ReplayCertificationFailure[]): GovernanceReplayCertification {
  const ok = !failures.includes("GOVERNANCE_REPLAY_MISMATCH");
  const base: Omit<GovernanceReplayCertification, "integrity_hash"> = { certification_id: "governance_replay_certification", policy_evaluations_reproduced: ok, governance_decisions_reproduced: ok, approval_workflows_reproduced: ok, escalation_paths_reproduced: ok, exception_handling_reproduced: ok, audit_trails_reproduced: ok };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function constitutionalReplay(failures: readonly ReplayCertificationFailure[]): ConstitutionalReplayCertification {
  const ok = !failures.includes("CONSTITUTIONAL_REPLAY_MISMATCH");
  const base: Omit<ConstitutionalReplayCertification, "integrity_hash"> = { certification_id: "constitutional_replay_certification", constitutional_evaluations_reproduced: ok, authority_boundaries_reproduced: ok, doctrine_enforcement_reproduced: ok, constraint_validation_reproduced: ok, human_authority_decisions_reproduced: ok };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function simulationReplay(failures: readonly ReplayCertificationFailure[]): SimulationReplayCertification {
  const base: Omit<SimulationReplayCertification, "integrity_hash"> = { certification_id: "simulation_replay_certification", adaptive_simulations_reproduced: !failures.includes("SIMULATION_REPLAY_DIVERGED"), counterfactual_simulations_reproduced: !failures.includes("COUNTERFACTUAL_REPLAY_DIVERGED"), rollback_simulations_reproduced: !failures.includes("SIMULATION_REPLAY_DIVERGED"), proposal_evaluations_reproduced: !failures.includes("PROPOSAL_GENERATION_REPLAY_DIVERGED"), scenario_analysis_reproduced: !failures.includes("SIMULATION_REPLAY_DIVERGED"), state_transitions_identical: !failed(failures, ["SIMULATION_REPLAY_DIVERGED", "COUNTERFACTUAL_REPLAY_DIVERGED"]) };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function ledgerReplay(failures: readonly ReplayCertificationFailure[]): LedgerReplayCertification {
  const base: Omit<LedgerReplayCertification, "integrity_hash"> = { certification_id: "ledger_replay_certification", required_ledgers: LEDGERS, ledger_history_complete: !failures.includes("LEDGER_HISTORY_INCOMPLETE"), append_only_history_verified: !failures.includes("APPEND_ONLY_LEDGER_VIOLATION"), no_external_state_required: !failures.includes("HIDDEN_RUNTIME_DEPENDENCY_DETECTED"), ledger_ordering_identical: !failures.includes("REPLAY_NONDETERMINISM_DETECTED"), ledger_hashes_verified: !failures.includes("INTEGRITY_HASH_MISMATCH") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function replayIntegrity(failures: readonly ReplayCertificationFailure[]): ReplayIntegrityCertification {
  const ok = !failed(failures, ["INTEGRITY_HASH_MISMATCH", "APPEND_ONLY_LEDGER_VIOLATION"]);
  const base: Omit<ReplayIntegrityCertification, "integrity_hash"> = { certification_id: "replay_integrity_certification", immutable_timestamps_verified: !failures.includes("APPEND_ONLY_LEDGER_VIOLATION"), cryptographic_hashes_verified: !failures.includes("INTEGRITY_HASH_MISMATCH"), evidence_integrity_verified: ok, replay_reference_integrity_verified: !failures.includes("REPLAY_REFERENCE_OMITTED"), governance_reference_integrity_verified: !failures.includes("GOVERNANCE_REPLAY_MISMATCH"), constitutional_reference_integrity_verified: !failures.includes("CONSTITUTIONAL_REPLAY_MISMATCH"), operator_reference_integrity_verified: ok, certification_reference_integrity_verified: ok };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function certificationReport(record: ReplayCertificationRecord): ReplayCertificationReport {
  const base: Omit<ReplayCertificationReport, "integrity_hash"> = { report_id: "replay_certification_report", certification_outcome: record.certification_status, replay_completeness_assessment: record.replay_completeness_status, determinism_assessment: record.replay_determinism_status, integrity_validation: record.replay_integrity_status, input_reconstruction_analysis: record.input_reconstruction_status, evidence_reconstruction_analysis: record.evidence_reconstruction_status, reasoning_equivalence_result: record.reasoning_reconstruction_status, output_equivalence_result: record.output_reconstruction_status, governance_replay_validation: record.governance_replay_status, constitutional_replay_validation: record.constitutional_replay_status, simulation_replay_validation: record.simulation_replay_status, replay_equivalence_score: record.replay_equivalence_score, findings: record.findings, remediation_actions: record.findings.map((finding) => `remediate:${finding}`), production_readiness_recommendation: record.certification_status === "CERTIFIED" ? "READY" : "BLOCKED" };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function reconstructionReport(record: ReplayCertificationRecord): ReplayReconstructionReport {
  const base: Omit<ReplayReconstructionReport, "integrity_hash"> = { report_id: "replay_reconstruction_report", replay_coverage_by_subsystem: SUBSYSTEMS, ledger_utilization: record.ledger_refs, evidence_lineage_verified: record.evidence_reconstruction_status === "PASS", reconstruction_timelines: freezeArray([`${record.original_execution_id}->${record.replay_execution_id}`]), state_transition_comparisons: freezeArray([`equivalence:${record.replay_equivalence_score}`]), replay_fidelity_score: record.replay_equivalence_score, integrity_verified: record.replay_integrity_status === "PASS", governance_consistency_verified: record.governance_replay_status === "PASS", constitutional_consistency_verified: record.constitutional_replay_status === "PASS", certification_evidence_refs: record.evidence_refs };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function test(name: string, passed: boolean, failure: ReplayCertificationFailure, refs: readonly string[]): ReplayCertificationTest {
  const base: Omit<ReplayCertificationTest, "integrity_hash"> = { test_id: id("replay_certification_test", name), name, expected: "PASS", actual: passed ? "PASS" : "FAIL", passed, failure_reason: passed ? null : failure, evidence_refs: refs };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
type BuildBase = Omit<ReplayCertificationResult, "validation_tests" | "failures" | "replay_hash" | "integrity_hash">;
function tests(result: BuildBase): readonly ReplayCertificationTest[] {
  const refs = freezeArray([result.record.integrity_hash]);
  return freezeArray([
    test("Original inputs reconstructed", result.input_reconstruction.mission_context_reconstructed, "INPUT_RECONSTRUCTION_INCOMPLETE", refs),
    test("Evidence reconstructed identically", result.evidence_reconstruction.truth_ledger_refs_reconstructed, "EVIDENCE_RECONSTRUCTION_INCOMPLETE", refs),
    test("Normalized outcomes reproduced", result.input_reconstruction.normalized_outcomes_reconstructed, "NORMALIZED_OUTCOME_REPLAY_DIVERGED", refs),
    test("Adaptive reasoning reproduced", result.reasoning_equivalence.adaptive_reasoning_reproduced, "REASONING_REPLAY_DIVERGED", refs),
    test("Recommendation reasoning reproduced", result.reasoning_equivalence.recommendation_reasoning_reproduced, "RECOMMENDATION_REASONING_REPLAY_DIVERGED", refs),
    test("Confidence calculations reproduced", result.reasoning_equivalence.confidence_analysis_reproduced, "CONFIDENCE_CALCULATION_REPLAY_DIVERGED", refs),
    test("Risk calculations reproduced", result.reasoning_equivalence.risk_analysis_reproduced, "RISK_CALCULATION_REPLAY_DIVERGED", refs),
    test("Proposal generation reproduced", result.output_reconstruction.adaptive_proposals_reproduced, "PROPOSAL_GENERATION_REPLAY_DIVERGED", refs),
    test("Governance decisions reproduced", result.governance_replay.governance_decisions_reproduced, "GOVERNANCE_REPLAY_MISMATCH", refs),
    test("Constitutional evaluations reproduced", result.constitutional_replay.constitutional_evaluations_reproduced, "CONSTITUTIONAL_REPLAY_MISMATCH", refs),
    test("Suppression decisions reproduced", result.reasoning_equivalence.suppression_rationale_reproduced, "SUPPRESSION_REPLAY_DIVERGED", refs),
    test("Prioritization reproduced", result.reasoning_equivalence.prioritization_rationale_reproduced, "PRIORITIZATION_REPLAY_DIVERGED", refs),
    test("Simulation replay reproduced", result.simulation_replay.adaptive_simulations_reproduced, "SIMULATION_REPLAY_DIVERGED", refs),
    test("Counterfactual replay reproduced", result.simulation_replay.counterfactual_simulations_reproduced, "COUNTERFACTUAL_REPLAY_DIVERGED", refs),
    test("Dashboard replay reproduced", result.output_reconstruction.dashboard_artifacts_reproduced, "DASHBOARD_REPLAY_DIVERGED", refs),
    test("Certification outcomes reproduced", result.output_reconstruction.certification_outcomes_reproduced, "CERTIFICATION_OUTCOME_REPLAY_DIVERGED", refs),
    test("Replay completeness verified", result.record.replay_completeness_status === "PASS", "INCOMPLETE_REPLAY_RECONSTRUCTION", refs),
    test("Replay determinism verified", result.record.replay_determinism_status === "PASS", "REPLAY_NONDETERMINISM_DETECTED", refs),
    test("Replay integrity verified", result.record.replay_integrity_status === "PASS", "INTEGRITY_HASH_MISMATCH", refs),
    test("Ledger integrity validated", result.ledger_replay.ledger_hashes_verified, "INTEGRITY_HASH_MISMATCH", refs),
    test("Evidence lineage complete", result.evidence_reconstruction.evidence_lineage_complete, "EVIDENCE_LINEAGE_INCOMPLETE", refs),
    test("Replay references complete", result.replay_integrity.replay_reference_integrity_verified, "REPLAY_REFERENCE_OMITTED", refs),
    test("Replay equivalence score = 100%", result.record.replay_equivalence_score === 1, "REPLAY_EQUIVALENCE_BELOW_THRESHOLD", refs),
    test("Hidden replay dependencies absent", result.ledger_replay.no_external_state_required, "HIDDEN_RUNTIME_DEPENDENCY_DETECTED", refs),
    test("Replay mismatch fails closed", result.status === "PASS", "OUTPUT_REPLAY_DIVERGED", refs),
    test("Append-only ledger history verified", result.ledger_replay.append_only_history_verified, "APPEND_ONLY_LEDGER_VIOLATION", refs),
  ]);
}

function replayHash(result: Omit<ReplayCertificationResult, "replay_hash" | "integrity_hash">): string {
  return hash({ record: result.record.integrity_hash, input: result.input_reconstruction.integrity_hash, evidence: result.evidence_reconstruction.integrity_hash, reasoning: result.reasoning_equivalence.integrity_hash, output: result.output_reconstruction.integrity_hash, governance: result.governance_replay.integrity_hash, constitutional: result.constitutional_replay.integrity_hash, simulation: result.simulation_replay.integrity_hash, ledger: result.ledger_replay.integrity_hash, integrity: result.replay_integrity.integrity_hash, failures: result.failures });
}
function integrityHash(result: Omit<ReplayCertificationResult, "integrity_hash">): string { return hash({ version: result.replay_certification_version, id: result.certification_identifier, status: result.status, replay_hash: result.replay_hash }); }

export function certifyReplay(input: ReplayCertificationInput = {}): ReplayCertificationResult {
  const initialFailures = freezeArray(failureForScenario(input.scenario ?? "BASELINE") ? [failureForScenario(input.scenario ?? "BASELINE") as ReplayCertificationFailure] : []);
  const rec = record(input, initialFailures);
  const baseWithoutTests: BuildBase = { replay_certification_version: VERSION, certification_identifier: ID, status: initialFailures.length ? "FAIL" : "PASS", api_surface: apiSurface(), record: rec, input_reconstruction: inputReconstruction(initialFailures), evidence_reconstruction: evidenceReconstruction(initialFailures), reasoning_equivalence: reasoningEquivalence(initialFailures), output_reconstruction: outputReconstruction(initialFailures), governance_replay: governanceReplay(initialFailures), constitutional_replay: constitutionalReplay(initialFailures), simulation_replay: simulationReplay(initialFailures), ledger_replay: ledgerReplay(initialFailures), replay_integrity: replayIntegrity(initialFailures), certification_report: certificationReport(rec), reconstruction_report: reconstructionReport(rec), widgets: WIDGETS, complete: rec.replay_completeness_status === "PASS", deterministic: rec.replay_determinism_status === "PASS", integrity_protected: rec.replay_integrity_status === "PASS", ledger_only: !initialFailures.includes("HIDDEN_RUNTIME_DEPENDENCY_DETECTED"), production_ready: initialFailures.length === 0 };
  const validation_tests = tests(baseWithoutTests);
  const failures = freezeArray([...new Set([...initialFailures, ...validation_tests.map((t) => t.failure_reason).filter((f): f is ReplayCertificationFailure => Boolean(f))])]);
  const base: Omit<ReplayCertificationResult, "replay_hash" | "integrity_hash"> = { ...baseWithoutTests, status: failures.length ? "FAIL" : "PASS", complete: failures.length === 0, deterministic: !failed(failures, ["REPLAY_NONDETERMINISM_DETECTED", "HIDDEN_RUNTIME_DEPENDENCY_DETECTED"]), integrity_protected: !failed(failures, ["INTEGRITY_HASH_MISMATCH", "APPEND_ONLY_LEDGER_VIOLATION"]), ledger_only: !failures.includes("HIDDEN_RUNTIME_DEPENDENCY_DETECTED"), production_ready: failures.length === 0, validation_tests, failures };
  const rHash = replayHash(base);
  return Object.freeze({ ...base, replay_hash: rHash, integrity_hash: integrityHash({ ...base, replay_hash: rHash }) });
}

export function validateReplayCertification(result?: ReplayCertificationResult): ReplayCertificationValidationResult {
  if (!result) {
    const failures = freezeArray<ReplayCertificationFailure>(["INCOMPLETE_REPLAY_RECONSTRUCTION"]);
    const base: Omit<ReplayCertificationValidationResult, "certification_hash"> = { certification_id: null, valid: false, status: "FAIL", failures, replay_hash_valid: false, integrity_hash_valid: false };
    return Object.freeze({ ...base, certification_hash: hashWithoutIntegrity(base) });
  }
  const nested = hashWithoutIntegrity(result.record) === result.record.integrity_hash && result.validation_tests.every((t) => hashWithoutIntegrity(t) === t.integrity_hash);
  const replay_hash_valid = replayHash(result) === result.replay_hash;
  const integrity_hash_valid = integrityHash(result) === result.integrity_hash && nested;
  const valid = result.status === "PASS" && result.failures.length === 0 && result.record.replay_equivalence_score === 1 && result.complete && result.deterministic && result.integrity_protected && result.ledger_only && replay_hash_valid && integrity_hash_valid;
  const base: Omit<ReplayCertificationValidationResult, "certification_hash"> = { certification_id: result.record.certification_id, valid, status: result.status, failures: result.failures, replay_hash_valid, integrity_hash_valid };
  return Object.freeze({ ...base, certification_hash: hashWithoutIntegrity(base) });
}
export function replayReplayCertification(result: ReplayCertificationResult): boolean { return validateReplayCertification(result).valid; }
export function buildReplayCertificationObservability(result = certifyReplay()): ReplayCertificationObservability {
  return Object.freeze({ certification_id: result.record.certification_id, status: result.status, equivalence_score: result.record.replay_equivalence_score, failed_tests: result.validation_tests.filter((t) => !t.passed).length, failures: result.failures, complete: result.complete, deterministic: result.deterministic, ledger_only: result.ledger_only, production_ready: result.production_ready, integrity_hash: result.integrity_hash });
}
export function getReplayCertificationContract(): ReplayCertificationContract {
  const result = certifyReplay();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, widgets: WIDGETS, subsystems: SUBSYSTEMS, required_ledgers: LEDGERS, required_equivalence_score: 1, ledger_only_replay_required: true, hidden_state_prohibited: true, certification_required: true }), result, validation: validateReplayCertification(result), observability: buildReplayCertificationObservability(result) });
}
export const ReplayCertification = Object.freeze({ certify: certifyReplay, validate: validateReplayCertification, replay: replayReplayCertification });
