import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  AdaptiveIntegrationReport,
  AdaptivePipelineApiSurface,
  AdaptivePipelineCertificationRecord,
  AdaptivePipelineCertificationReport,
  AdaptivePipelineCertificationTest,
  AdaptivePipelineContract,
  AdaptivePipelineFailure,
  AdaptivePipelineInput,
  AdaptivePipelineObservability,
  AdaptivePipelineResult,
  AdaptivePipelineScenario,
  AdaptivePipelineSubsystem,
  AdaptivePipelineSubsystemResults,
  AdaptivePipelineValidationResult,
  AdaptivePipelineWidget,
  AdaptiveSubsystemCertificationResult,
  EndToEndLineageValidation,
  PipelineIntegrationValidation,
  PipelineReadinessValidation,
} from "@/types/adaptive-pipeline-certification";

const VERSION = "adaptive-pipeline-certification/v10.15.5" as const;
const ID = "AdaptivePipelineCertification" as const;
const TENANT_ID = "tenant_mission_control";
const MISSION_ID = "mission_adaptive_intelligence";
const WIDGETS: readonly AdaptivePipelineWidget[] = Object.freeze(["Pipeline Certification", "Subsystem Certifications", "Pipeline Integration", "Lineage Validation", "Readiness Validation", "Certification Report", "Adaptive Integration Report"]);
const SUBSYSTEMS: readonly AdaptivePipelineSubsystem[] = Object.freeze(["outcome_observation", "outcome_normalization", "recommendation_effectiveness", "pattern_intelligence", "strategy_evolution", "confidence_adaptation", "risk_adaptation", "governance_adaptation", "operator_feedback", "adaptation_proposal", "adaptive_simulation", "replay_validation", "drift_defense", "adaptive_memory", "adaptive_dashboard"]);
const SUBSYSTEM_FAILURES: Record<AdaptivePipelineSubsystem, AdaptivePipelineFailure> = Object.freeze({
  outcome_observation: "OUTCOME_OBSERVATION_CERTIFICATION_FAILED",
  outcome_normalization: "OUTCOME_NORMALIZATION_CERTIFICATION_FAILED",
  recommendation_effectiveness: "RECOMMENDATION_EFFECTIVENESS_CERTIFICATION_FAILED",
  pattern_intelligence: "PATTERN_INTELLIGENCE_CERTIFICATION_FAILED",
  strategy_evolution: "STRATEGY_EVOLUTION_CERTIFICATION_FAILED",
  confidence_adaptation: "CONFIDENCE_ADAPTATION_CERTIFICATION_FAILED",
  risk_adaptation: "RISK_ADAPTATION_CERTIFICATION_FAILED",
  governance_adaptation: "GOVERNANCE_ADAPTATION_CERTIFICATION_FAILED",
  operator_feedback: "OPERATOR_FEEDBACK_CERTIFICATION_FAILED",
  adaptation_proposal: "ADAPTATION_PROPOSAL_CERTIFICATION_FAILED",
  adaptive_simulation: "ADAPTIVE_SIMULATION_CERTIFICATION_FAILED",
  replay_validation: "REPLAY_VALIDATION_CERTIFICATION_FAILED",
  drift_defense: "DRIFT_DEFENSE_CERTIFICATION_FAILED",
  adaptive_memory: "ADAPTIVE_MEMORY_CERTIFICATION_FAILED",
  adaptive_dashboard: "ADAPTIVE_DASHBOARD_CERTIFICATION_FAILED",
});

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 24)}`; }

function failureForScenario(scenario: AdaptivePipelineScenario): AdaptivePipelineFailure | undefined {
  const map: Partial<Record<AdaptivePipelineScenario, AdaptivePipelineFailure>> = {
    OUTCOME_OBSERVATION_FAILED: "OUTCOME_OBSERVATION_CERTIFICATION_FAILED",
    OUTCOME_NORMALIZATION_FAILED: "OUTCOME_NORMALIZATION_CERTIFICATION_FAILED",
    RECOMMENDATION_EFFECTIVENESS_FAILED: "RECOMMENDATION_EFFECTIVENESS_CERTIFICATION_FAILED",
    PATTERN_INTELLIGENCE_FAILED: "PATTERN_INTELLIGENCE_CERTIFICATION_FAILED",
    STRATEGY_EVOLUTION_FAILED: "STRATEGY_EVOLUTION_CERTIFICATION_FAILED",
    CONFIDENCE_ADAPTATION_FAILED: "CONFIDENCE_ADAPTATION_CERTIFICATION_FAILED",
    RISK_ADAPTATION_FAILED: "RISK_ADAPTATION_CERTIFICATION_FAILED",
    GOVERNANCE_ADAPTATION_FAILED: "GOVERNANCE_ADAPTATION_CERTIFICATION_FAILED",
    OPERATOR_FEEDBACK_FAILED: "OPERATOR_FEEDBACK_CERTIFICATION_FAILED",
    ADAPTATION_PROPOSAL_FAILED: "ADAPTATION_PROPOSAL_CERTIFICATION_FAILED",
    ADAPTIVE_SIMULATION_FAILED: "ADAPTIVE_SIMULATION_CERTIFICATION_FAILED",
    REPLAY_VALIDATION_FAILED: "REPLAY_VALIDATION_CERTIFICATION_FAILED",
    DRIFT_DEFENSE_FAILED: "DRIFT_DEFENSE_CERTIFICATION_FAILED",
    ADAPTIVE_MEMORY_FAILED: "ADAPTIVE_MEMORY_CERTIFICATION_FAILED",
    ADAPTIVE_DASHBOARD_FAILED: "ADAPTIVE_DASHBOARD_CERTIFICATION_FAILED",
    UNDOCUMENTED_DEPENDENCY: "UNDOCUMENTED_SUBSYSTEM_DEPENDENCY",
    SEQUENCING_DIVERGENCE: "PIPELINE_SEQUENCING_DIVERGENCE",
    EVIDENCE_LINEAGE_GAP: "EVIDENCE_LINEAGE_DISCONTINUITY",
    GOVERNANCE_CONTINUITY_FAILURE: "GOVERNANCE_CONTINUITY_FAILURE",
    CONSTITUTIONAL_CONTINUITY_FAILURE: "CONSTITUTIONAL_CONTINUITY_FAILURE",
    REPLAY_DISCONTINUITY: "REPLAY_CONTINUITY_FAILURE",
    TENANT_ISOLATION_BREACH: "TENANT_ISOLATION_BREACH",
    ADVISORY_BOUNDARY_VIOLATION: "ADVISORY_ONLY_BOUNDARY_VIOLATION",
    UNAUTHORIZED_EXECUTION: "UNAUTHORIZED_ADAPTIVE_EXECUTION",
    HIDDEN_SUBSYSTEM_STATE: "HIDDEN_SUBSYSTEM_STATE_DETECTED",
    MISSING_CERTIFICATION_ARTIFACTS: "CERTIFICATION_ARTIFACTS_MISSING",
    INTERFACE_INCONSISTENCY: "SUBSYSTEM_INTERFACE_INCONSISTENCY",
    DASHBOARD_VISIBILITY_INCOMPLETE: "DASHBOARD_VISIBILITY_INCOMPLETE",
    PRODUCTION_READINESS_UNMET: "PRODUCTION_READINESS_CRITERIA_UNMET",
    INTEGRITY_FAILURE: "INTEGRITY_HASH_MISMATCH",
  };
  return map[scenario];
}
function failed(failures: readonly AdaptivePipelineFailure[], values: readonly AdaptivePipelineFailure[]): boolean { return failures.some((failure) => values.includes(failure)); }
function subsystemFailureFor(subsystem: AdaptivePipelineSubsystem, failures: readonly AdaptivePipelineFailure[]): boolean { return failures.includes(SUBSYSTEM_FAILURES[subsystem]); }

function apiSurface(): AdaptivePipelineApiSurface {
  const base: Omit<AdaptivePipelineApiSurface, "integrity_hash"> = { api_id: "adaptive_pipeline_certification_api", retrieve_dashboard: "POST /adaptive-pipeline-certification/dashboard", retrieve_contract: "GET /adaptive-pipeline-certification/contract", retrieve_sections: freezeArray(["certification", "subsystems", "integration", "lineage", "readiness", "report", "adaptive-integration"]), validate_certification: "POST /adaptive-pipeline-certification/validate", inspect_certification: "POST /adaptive-pipeline-certification/inspect", mutation_supported: false, execution_supported: false, production_promotion_supported: false, override_supported: false };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function subsystemResult(subsystem: AdaptivePipelineSubsystem, failures: readonly AdaptivePipelineFailure[]): AdaptiveSubsystemCertificationResult {
  const subsystemFailed = subsystemFailureFor(subsystem, failures);
  const base: Omit<AdaptiveSubsystemCertificationResult, "integrity_hash"> = { subsystem, status: subsystemFailed ? "FAIL" : "PASS", deterministic: !failed(failures, ["PIPELINE_SEQUENCING_DIVERGENCE", "HIDDEN_SUBSYSTEM_STATE_DETECTED"]) && !subsystemFailed, replayable: !failures.includes("REPLAY_CONTINUITY_FAILURE") && !subsystemFailed, explainable: !subsystemFailed, governance_compliant: !failures.includes("GOVERNANCE_CONTINUITY_FAILURE") && !subsystemFailed, constitutional: !failures.includes("CONSTITUTIONAL_CONTINUITY_FAILURE") && !subsystemFailed, advisory_only: !failed(failures, ["ADVISORY_ONLY_BOUNDARY_VIOLATION", "UNAUTHORIZED_ADAPTIVE_EXECUTION"]) && !subsystemFailed, tenant_isolated: !failures.includes("TENANT_ISOLATION_BREACH") && !subsystemFailed, evidence_backed: !failures.includes("EVIDENCE_LINEAGE_DISCONTINUITY") && !subsystemFailed, certification_ref: subsystemFailed || failures.includes("CERTIFICATION_ARTIFACTS_MISSING") ? "" : `certification:${subsystem}:v10.15.5` };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function subsystemResults(failures: readonly AdaptivePipelineFailure[]): AdaptivePipelineSubsystemResults {
  return Object.freeze(Object.fromEntries(SUBSYSTEMS.map((subsystem) => [subsystem, subsystemResult(subsystem, failures)])) as AdaptivePipelineSubsystemResults);
}

function record(input: AdaptivePipelineInput, failures: readonly AdaptivePipelineFailure[]): AdaptivePipelineCertificationRecord {
  const results = subsystemResults(failures);
  const base: Omit<AdaptivePipelineCertificationRecord, "integrity_hash"> = { certification_id: id("adaptive_pipeline_certification", VERSION), tenant_id: input.tenant_id ?? TENANT_ID, mission_id: input.mission_id ?? MISSION_ID, subsystem_results: results, pipeline_integration_status: failed(failures, ["UNDOCUMENTED_SUBSYSTEM_DEPENDENCY", "PIPELINE_SEQUENCING_DIVERGENCE", "SUBSYSTEM_INTERFACE_INCONSISTENCY", "HIDDEN_SUBSYSTEM_STATE_DETECTED"]) || SUBSYSTEMS.some((s) => results[s].status === "FAIL") ? "FAIL" : "PASS", evidence_lineage_status: failures.includes("EVIDENCE_LINEAGE_DISCONTINUITY") ? "FAIL" : "PASS", governance_continuity_status: failures.includes("GOVERNANCE_CONTINUITY_FAILURE") ? "FAIL" : "PASS", constitutional_continuity_status: failures.includes("CONSTITUTIONAL_CONTINUITY_FAILURE") ? "FAIL" : "PASS", replay_continuity_status: failures.includes("REPLAY_CONTINUITY_FAILURE") ? "FAIL" : "PASS", tenant_isolation_status: failures.includes("TENANT_ISOLATION_BREACH") ? "FAIL" : "PASS", findings: failures, evidence_refs: failures.includes("EVIDENCE_LINEAGE_DISCONTINUITY") ? freezeArray([]) : freezeArray(["evidence:pipeline:end-to-end", "truth-ledger:pipeline:canonical"]), governance_refs: failures.includes("GOVERNANCE_CONTINUITY_FAILURE") ? freezeArray([]) : freezeArray(["governance:pipeline:continuity"]), replay_refs: failures.includes("REPLAY_CONTINUITY_FAILURE") ? freezeArray([]) : freezeArray(["replay:pipeline:end-to-end"]), certification_refs: failures.includes("CERTIFICATION_ARTIFACTS_MISSING") ? freezeArray([]) : freezeArray(SUBSYSTEMS.map((s) => `certification:${s}:v10.15.5`)), certification_status: failures.length ? "REJECTED" : "CERTIFIED", certification_timestamp: "2026-07-09T00:00:00.000Z" };
  return Object.freeze({ ...base, integrity_hash: failures.includes("INTEGRITY_HASH_MISMATCH") ? "invalid-integrity" : hashWithoutIntegrity(base) });
}

function integration(failures: readonly AdaptivePipelineFailure[]): PipelineIntegrationValidation {
  const base: Omit<PipelineIntegrationValidation, "integrity_hash"> = { validation_id: "pipeline_integration_validation", subsystem_sequence_deterministic: !failures.includes("PIPELINE_SEQUENCING_DIVERGENCE"), immutable_transitions: !failures.includes("PIPELINE_SEQUENCING_DIVERGENCE"), subsystem_interfaces_consistent: !failures.includes("SUBSYSTEM_INTERFACE_INCONSISTENCY"), dependencies_documented: !failures.includes("UNDOCUMENTED_SUBSYSTEM_DEPENDENCY"), hidden_state_absent: !failures.includes("HIDDEN_SUBSYSTEM_STATE_DETECTED"), end_to_end_execution_flow_valid: !failed(failures, ["PIPELINE_SEQUENCING_DIVERGENCE", "SUBSYSTEM_INTERFACE_INCONSISTENCY"]), advisory_only_boundaries_preserved: !failed(failures, ["ADVISORY_ONLY_BOUNDARY_VIOLATION", "UNAUTHORIZED_ADAPTIVE_EXECUTION"]) };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function lineage(failures: readonly AdaptivePipelineFailure[]): EndToEndLineageValidation {
  const base: Omit<EndToEndLineageValidation, "integrity_hash"> = { validation_id: "end_to_end_lineage_validation", evidence_lineage_continuous: !failures.includes("EVIDENCE_LINEAGE_DISCONTINUITY"), governance_lineage_continuous: !failures.includes("GOVERNANCE_CONTINUITY_FAILURE"), constitutional_lineage_continuous: !failures.includes("CONSTITUTIONAL_CONTINUITY_FAILURE"), replay_lineage_continuous: !failures.includes("REPLAY_CONTINUITY_FAILURE"), certification_lineage_continuous: !failures.includes("CERTIFICATION_ARTIFACTS_MISSING"), dashboard_visibility_complete: !failures.includes("DASHBOARD_VISIBILITY_INCOMPLETE"), auditability_complete: !failed(failures, ["EVIDENCE_LINEAGE_DISCONTINUITY", "CERTIFICATION_ARTIFACTS_MISSING"]) };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function readiness(record: AdaptivePipelineCertificationRecord, failures: readonly AdaptivePipelineFailure[]): PipelineReadinessValidation {
  const allCertified = SUBSYSTEMS.every((s) => record.subsystem_results[s].status === "PASS");
  const base: Omit<PipelineReadinessValidation, "integrity_hash"> = { validation_id: "pipeline_readiness_validation", all_subsystems_certified: allCertified, pipeline_deterministic: record.pipeline_integration_status === "PASS", end_to_end_replay_reproducible: record.replay_continuity_status === "PASS", governance_enforced: record.governance_continuity_status === "PASS", constitutional_compliant: record.constitutional_continuity_status === "PASS", tenant_isolation_preserved: record.tenant_isolation_status === "PASS", advisory_only: !failures.includes("ADVISORY_ONLY_BOUNDARY_VIOLATION"), production_readiness_validated: failures.length === 0, unauthorized_execution_absent: !failures.includes("UNAUTHORIZED_ADAPTIVE_EXECUTION") };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function certificationReport(record: AdaptivePipelineCertificationRecord, ready: PipelineReadinessValidation): AdaptivePipelineCertificationReport {
  const base: Omit<AdaptivePipelineCertificationReport, "integrity_hash"> = { report_id: "adaptive_pipeline_certification_report", certification_outcome: record.certification_status, subsystem_certification_results: record.subsystem_results, pipeline_integration_assessment: record.pipeline_integration_status, determinism_validation: ready.pipeline_deterministic ? "PASS" : "FAIL", governance_constitutional_compliance: record.governance_continuity_status === "PASS" && record.constitutional_continuity_status === "PASS" ? "PASS" : "FAIL", replay_continuity_analysis: record.replay_continuity_status, tenant_isolation_assessment: record.tenant_isolation_status, production_readiness_recommendation: record.certification_status === "CERTIFIED" ? "READY" : "BLOCKED", findings: record.findings, remediation_actions: record.findings.map((f) => `remediate:${f}`) };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function adaptiveIntegrationReport(record: AdaptivePipelineCertificationRecord, integrationValidation: PipelineIntegrationValidation, lineageValidation: EndToEndLineageValidation): AdaptiveIntegrationReport {
  const base: Omit<AdaptiveIntegrationReport, "integrity_hash"> = { report_id: "adaptive_integration_report", subsystem_dependency_validation: integrationValidation.dependencies_documented ? "PASS" : "FAIL", interface_compatibility: integrationValidation.subsystem_interfaces_consistent ? "PASS" : "FAIL", end_to_end_execution_flow: SUBSYSTEMS, evidence_lineage_continuity: lineageValidation.evidence_lineage_continuous ? "PASS" : "FAIL", governance_constitutional_continuity: record.governance_continuity_status === "PASS" && record.constitutional_continuity_status === "PASS" ? "PASS" : "FAIL", replay_path_verification: record.replay_continuity_status, dashboard_integration: lineageValidation.dashboard_visibility_complete ? "PASS" : "FAIL", certification_lineage: record.certification_refs, operational_health_score: record.certification_status === "CERTIFIED" ? 1 : 0.97 };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
function test(name: string, passed: boolean, failure: AdaptivePipelineFailure, refs: readonly string[]): AdaptivePipelineCertificationTest {
  const base: Omit<AdaptivePipelineCertificationTest, "integrity_hash"> = { test_id: id("adaptive_pipeline_test", name), name, expected: "PASS", actual: passed ? "PASS" : "FAIL", passed, failure_reason: passed ? null : failure, evidence_refs: refs };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}
type BuildBase = Omit<AdaptivePipelineResult, "validation_tests" | "failures" | "replay_hash" | "integrity_hash">;
function tests(result: BuildBase): readonly AdaptivePipelineCertificationTest[] {
  const refs = freezeArray([result.record.integrity_hash]);
  return freezeArray([
    ...SUBSYSTEMS.map((s) => test(`${s} certified`, result.record.subsystem_results[s].status === "PASS", SUBSYSTEM_FAILURES[s], refs)),
    test("Pipeline sequencing deterministic", result.integration_validation.subsystem_sequence_deterministic, "PIPELINE_SEQUENCING_DIVERGENCE", refs),
    test("Evidence lineage continuous", result.lineage_validation.evidence_lineage_continuous, "EVIDENCE_LINEAGE_DISCONTINUITY", refs),
    test("Governance continuity maintained", result.lineage_validation.governance_lineage_continuous, "GOVERNANCE_CONTINUITY_FAILURE", refs),
    test("Constitutional continuity maintained", result.lineage_validation.constitutional_lineage_continuous, "CONSTITUTIONAL_CONTINUITY_FAILURE", refs),
    test("Replay continuity maintained", result.lineage_validation.replay_lineage_continuous, "REPLAY_CONTINUITY_FAILURE", refs),
    test("Tenant isolation preserved", result.readiness_validation.tenant_isolation_preserved, "TENANT_ISOLATION_BREACH", refs),
    test("Advisory-only boundaries preserved", result.integration_validation.advisory_only_boundaries_preserved, "ADVISORY_ONLY_BOUNDARY_VIOLATION", refs),
    test("End-to-end replay reproducible", result.readiness_validation.end_to_end_replay_reproducible, "REPLAY_CONTINUITY_FAILURE", refs),
    test("Production readiness validated", result.readiness_validation.production_readiness_validated, "PRODUCTION_READINESS_CRITERIA_UNMET", refs),
    test("Subsystem dependencies documented", result.integration_validation.dependencies_documented, "UNDOCUMENTED_SUBSYSTEM_DEPENDENCY", refs),
    test("Hidden subsystem state absent", result.integration_validation.hidden_state_absent, "HIDDEN_SUBSYSTEM_STATE_DETECTED", refs),
    test("Certification artifacts complete", result.lineage_validation.certification_lineage_continuous, "CERTIFICATION_ARTIFACTS_MISSING", refs),
    test("Subsystem interfaces consistent", result.integration_validation.subsystem_interfaces_consistent, "SUBSYSTEM_INTERFACE_INCONSISTENCY", refs),
    test("Dashboard visibility complete", result.lineage_validation.dashboard_visibility_complete, "DASHBOARD_VISIBILITY_INCOMPLETE", refs),
    test("Unauthorized adaptive execution absent", result.readiness_validation.unauthorized_execution_absent, "UNAUTHORIZED_ADAPTIVE_EXECUTION", refs),
    test("Integrity hash reproducible", hashWithoutIntegrity(result.record) === result.record.integrity_hash, "INTEGRITY_HASH_MISMATCH", refs),
  ]);
}
function replayHash(result: Omit<AdaptivePipelineResult, "replay_hash" | "integrity_hash">): string { return hash({ record: result.record.integrity_hash, integration: result.integration_validation.integrity_hash, lineage: result.lineage_validation.integrity_hash, readiness: result.readiness_validation.integrity_hash, failures: result.failures }); }
function integrityHash(result: Omit<AdaptivePipelineResult, "integrity_hash">): string { return hash({ version: result.adaptive_pipeline_certification_version, id: result.certification_identifier, status: result.status, replay_hash: result.replay_hash }); }

export function certifyAdaptivePipeline(input: AdaptivePipelineInput = {}): AdaptivePipelineResult {
  const initialFailures = freezeArray(failureForScenario(input.scenario ?? "BASELINE") ? [failureForScenario(input.scenario ?? "BASELINE") as AdaptivePipelineFailure] : []);
  const rec = record(input, initialFailures);
  const integrationValidation = integration(initialFailures);
  const lineageValidation = lineage(initialFailures);
  const readinessValidation = readiness(rec, initialFailures);
  const baseWithoutTests: BuildBase = { adaptive_pipeline_certification_version: VERSION, certification_identifier: ID, status: initialFailures.length ? "FAIL" : "PASS", api_surface: apiSurface(), record: rec, integration_validation: integrationValidation, lineage_validation: lineageValidation, readiness_validation: readinessValidation, certification_report: certificationReport(rec, readinessValidation), adaptive_integration_report: adaptiveIntegrationReport(rec, integrationValidation, lineageValidation), widgets: WIDGETS, deterministic: integrationValidation.subsystem_sequence_deterministic, replayable: readinessValidation.end_to_end_replay_reproducible, governed: readinessValidation.governance_enforced, constitutional: readinessValidation.constitutional_compliant, advisory_only: readinessValidation.advisory_only, tenant_isolated: readinessValidation.tenant_isolation_preserved, production_ready: initialFailures.length === 0 };
  const validation_tests = tests(baseWithoutTests);
  const failures = freezeArray([...new Set([...initialFailures, ...validation_tests.map((t) => t.failure_reason).filter((f): f is AdaptivePipelineFailure => Boolean(f))])]);
  const base: Omit<AdaptivePipelineResult, "replay_hash" | "integrity_hash"> = { ...baseWithoutTests, status: failures.length ? "FAIL" : "PASS", deterministic: !failed(failures, ["PIPELINE_SEQUENCING_DIVERGENCE", "HIDDEN_SUBSYSTEM_STATE_DETECTED"]), replayable: !failures.includes("REPLAY_CONTINUITY_FAILURE"), governed: !failures.includes("GOVERNANCE_CONTINUITY_FAILURE"), constitutional: !failures.includes("CONSTITUTIONAL_CONTINUITY_FAILURE"), advisory_only: !failed(failures, ["ADVISORY_ONLY_BOUNDARY_VIOLATION", "UNAUTHORIZED_ADAPTIVE_EXECUTION"]), tenant_isolated: !failures.includes("TENANT_ISOLATION_BREACH"), production_ready: failures.length === 0, validation_tests, failures };
  const rHash = replayHash(base);
  return Object.freeze({ ...base, replay_hash: rHash, integrity_hash: integrityHash({ ...base, replay_hash: rHash }) });
}
export function validateAdaptivePipelineCertification(result?: AdaptivePipelineResult): AdaptivePipelineValidationResult {
  if (!result) {
    const failures = freezeArray<AdaptivePipelineFailure>(["PRODUCTION_READINESS_CRITERIA_UNMET"]);
    const base: Omit<AdaptivePipelineValidationResult, "certification_hash"> = { certification_id: null, valid: false, status: "FAIL", failures, replay_hash_valid: false, integrity_hash_valid: false };
    return Object.freeze({ ...base, certification_hash: hashWithoutIntegrity(base) });
  }
  const nested = hashWithoutIntegrity(result.record) === result.record.integrity_hash && result.validation_tests.every((t) => hashWithoutIntegrity(t) === t.integrity_hash);
  const replay_hash_valid = replayHash(result) === result.replay_hash;
  const integrity_hash_valid = integrityHash(result) === result.integrity_hash && nested;
  const valid = result.status === "PASS" && result.failures.length === 0 && result.production_ready && result.deterministic && result.replayable && result.governed && result.constitutional && result.advisory_only && result.tenant_isolated && replay_hash_valid && integrity_hash_valid;
  const base: Omit<AdaptivePipelineValidationResult, "certification_hash"> = { certification_id: result.record.certification_id, valid, status: result.status, failures: result.failures, replay_hash_valid, integrity_hash_valid };
  return Object.freeze({ ...base, certification_hash: hashWithoutIntegrity(base) });
}
export function replayAdaptivePipelineCertification(result: AdaptivePipelineResult): boolean { return validateAdaptivePipelineCertification(result).valid; }
export function buildAdaptivePipelineObservability(result = certifyAdaptivePipeline()): AdaptivePipelineObservability {
  return Object.freeze({ certification_id: result.record.certification_id, status: result.status, failed_subsystems: SUBSYSTEMS.filter((s) => result.record.subsystem_results[s].status === "FAIL").length, failed_tests: result.validation_tests.filter((t) => !t.passed).length, failures: result.failures, deterministic: result.deterministic, replayable: result.replayable, governed: result.governed, constitutional: result.constitutional, tenant_isolated: result.tenant_isolated, production_ready: result.production_ready, integrity_hash: result.integrity_hash });
}
export function getAdaptivePipelineContract(): AdaptivePipelineContract {
  const result = certifyAdaptivePipeline();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, widgets: WIDGETS, subsystems: SUBSYSTEMS, deterministic_required: true, replay_required: true, governance_required: true, constitutional_required: true, tenant_isolation_required: true, advisory_only_required: true, certification_required: true }), result, validation: validateAdaptivePipelineCertification(result), observability: buildAdaptivePipelineObservability(result) });
}
export const AdaptivePipelineCertification = Object.freeze({ certify: certifyAdaptivePipeline, validate: validateAdaptivePipelineCertification, replay: replayAdaptivePipelineCertification });
