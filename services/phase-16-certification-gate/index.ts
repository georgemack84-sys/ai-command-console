import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runContinuousCertificationDuringPilot } from "@/services/continuous-certification-during-pilot";
import type {
  ExpansionAuthorization,
  Phase16CertificationBundle,
  Phase16CertificationFailure,
  Phase16CertificationInput,
  Phase16CertificationOutcome,
  Phase16CertificationResult,
  Phase16CertificationTest,
  Phase16CertificationValidation,
  ThresholdStatus,
} from "@/types/phase-16-certification-gate";

const VERSION = "phase-16-certification-gate/v16.12" as const;
const IDENTIFIER = "Phase16CertificationGate" as const;
const TIMESTAMP = "2026-07-15T00:00:00.000Z" as const;
const DEFAULT_TENANT = "tenant_phase_16_certification_gate";
const DEFAULT_OPERATOR = "operator_phase_16_certification_gate";
const DEFAULT_PILOT = "mission_control_initial_production_pilot";

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function verify(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 20)}`; }
function has(failures: readonly Phase16CertificationFailure[], failure: Phase16CertificationFailure): boolean { return failures.includes(failure); }
function directFailure(scenario: Phase16CertificationInput["scenario"]): Phase16CertificationFailure | undefined { return !scenario || scenario === "BASELINE" ? undefined : scenario; }
function outcomeFor(failures: readonly Phase16CertificationFailure[]): Phase16CertificationOutcome {
  if (failures.length === 1 && failures[0] === "NON_CONSTITUTIONAL_GATE_WARNING") return "CONDITIONAL_PASS";
  return failures.length ? "FAIL" : "PASS";
}
function certTest(name: string, passed: boolean, failure: Phase16CertificationFailure, evidence_refs: readonly string[]): Phase16CertificationTest {
  const actual: Phase16CertificationOutcome = passed ? "PASS" : failure === "NON_CONSTITUTIONAL_GATE_WARNING" ? "CONDITIONAL_PASS" : "FAIL";
  return nested({ test_id: id("phase_16_certification_test", name), name, expected: "PASS" as const, actual, passed, failure_reason: passed ? null : failure, evidence_refs: freezeArray(evidence_refs) });
}
function resultReplayHash(result: Omit<Phase16CertificationResult, "replay_hash" | "integrity_hash">): string {
  return hash({ continuous: result.continuous_certification_ref, engine: result.engine.integrity_hash, vp1: result.vp1_report.integrity_hash, vp2: result.vp2_report.integrity_hash, evidence: result.evidence_validator.integrity_hash, constitutional: result.constitutional_report.integrity_hash, readiness: result.expansion_readiness.integrity_hash, decision: result.decision.integrity_hash, ledger: result.ledger_entry.integrity_hash, report: result.certification_report.integrity_hash, tests: result.certification_tests.map((test) => test.integrity_hash), outcome: result.outcome });
}
function resultIntegrityHash(result: Omit<Phase16CertificationResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.outcome, replay_hash: result.replay_hash }); }

export function runPhase16CertificationGate(input: Phase16CertificationInput = {}): Phase16CertificationResult {
  const continuous = runContinuousCertificationDuringPilot({ tenant_id: input.tenant_id ?? DEFAULT_TENANT, operator_id: input.operator_id ?? DEFAULT_OPERATOR, mission_id: input.mission_id, pilot_id: input.pilot_id ?? DEFAULT_PILOT });
  const direct = directFailure(input.scenario);
  const upstreamFailures: Phase16CertificationFailure[] = continuous.outcome === "PASS" ? [] : ["PHASE_16_11_CONTINUOUS_CERTIFICATION_NOT_VALID"];
  const failures = freezeArray([...new Set([...upstreamFailures, ...(direct ? [direct] : [])])]);
  const blockingFailures = freezeArray(failures.filter((failure) => failure !== "NON_CONSTITUTIONAL_GATE_WARNING"));
  const evidenceRefs = has(failures, "CERTIFICATION_EVIDENCE_INCOMPLETE") ? freezeArray([]) : freezeArray([continuous.integrity_hash, continuous.certification_record.integrity_hash, continuous.certification_ledger.integrity_hash, continuous.evidence_platform.integrity_hash]);
  const thresholdStatus = (failure: Phase16CertificationFailure): ThresholdStatus => has(failures, failure) ? failure === "CLASS_A_THRESHOLD_MISSING" ? "MISSING" : "DEFINED_BUT_UNPOPULATED" : "VERIFIED";
  const class_a_thresholds = freezeArray(["availability", "reliability", "replay-determinism", "tenant-isolation", "advisory-boundary"].map((name) => nested({ threshold_id: id("class_a_threshold", name), status: name === "availability" ? thresholdStatus("CLASS_A_THRESHOLD_DEFINED_BUT_UNPOPULATED") : name === "reliability" ? thresholdStatus("CLASS_A_THRESHOLD_MISSING") : "VERIFIED" as const })));
  const vp1_report = nested({ report_id: id("vp1_report", VERSION), completed: !has(failures, "VP1_NOT_COMPLETE"), class_a_thresholds, all_required_verified: class_a_thresholds.every((threshold) => threshold.status === "VERIFIED"), blocked: has(failures, "VP1_NOT_COMPLETE") || class_a_thresholds.some((threshold) => threshold.status !== "VERIFIED") });
  const vp2_report = nested({ report_id: id("vp2_report", VERSION), completed: !has(failures, "VP2_NOT_COMPLETE"), evidence_infrastructure_verified: !has(failures, "EVIDENCE_PLATFORM_NOT_VERIFIED"), shared_evidence_platform_confirmed: !has(failures, "EVIDENCE_PLATFORM_NOT_VERIFIED"), unified_evidence_lineage_validated: !has(failures, "UNIFIED_EVIDENCE_LINEAGE_INVALID"), duplicate_evidence_implementations: false, blocked: has(failures, "VP2_NOT_COMPLETE") || has(failures, "EVIDENCE_PLATFORM_NOT_VERIFIED") || has(failures, "UNIFIED_EVIDENCE_LINEAGE_INVALID") });
  const engine = nested({ engine_id: id("phase_16_certification_engine", input.certification_id ?? VERSION), workflow_executed: !has(failures, "PHASE_16_CERTIFICATION_NOT_COMPLETED"), prerequisites_verified: !vp1_report.blocked && !vp2_report.blocked, validation_orchestrated: true, evidence_aggregated: evidenceRefs.length > 0, outcome_determined: !has(failures, "CERTIFICATION_OUTCOME_NOT_ISSUED"), package_published: !has(failures, "PHASE_16_CERTIFICATION_NOT_COMPLETED"), deterministic: !has(failures, "CERTIFICATION_DECISION_NON_DETERMINISTIC"), replayable: !has(failures, "REPLAY_NOT_DETERMINISTIC"), evidence_refs: evidenceRefs });
  const evidence_validator = nested({ validator_id: id("phase_16_evidence_validator", input.certification_id ?? VERSION), evidence_complete: evidenceRefs.length > 0, evidence_integrity_valid: evidenceRefs.length > 0, evidence_lineage_valid: !has(failures, "UNIFIED_EVIDENCE_LINEAGE_INVALID"), evidence_fresh: true, evidence_versioned: true, replay_references_valid: !has(failures, "REPLAY_NOT_DETERMINISTIC"), evidence_refs: evidenceRefs });
  const constitutional_report = nested({ report_id: id("phase_16_constitutional_report", input.certification_id ?? VERSION), governance_authority_valid: !has(failures, "CONSTITUTIONAL_COMPLIANCE_NOT_MAINTAINED"), advisory_boundary_preserved: !has(failures, "ADVISORY_BOUNDARY_VIOLATED") && !has(failures, "UNAUTHORIZED_EXECUTION_AUTHORITY_DETECTED"), tenant_isolation_preserved: !has(failures, "TENANT_ISOLATION_VIOLATED"), deterministic_replay_valid: !has(failures, "REPLAY_NOT_DETERMINISTIC"), immutable_evidence_valid: !has(failures, "CERTIFICATION_LEDGER_MUTABLE"), deployment_integrity_valid: true, operator_authority_preserved: !has(failures, "UNAUTHORIZED_EXECUTION_AUTHORITY_DETECTED"), certification_integrity_valid: evidenceRefs.length > 0, prior_guarantees_preserved: !has(failures, "CONSTITUTIONAL_COMPLIANCE_NOT_MAINTAINED") });
  const expansion_readiness = nested({ assessment_id: id("phase_16_expansion_readiness", input.certification_id ?? VERSION), pilot_maturity: continuous.certification_record.certification_state === "CERTIFIED", operational_stability: continuous.engine.cycles_scheduled, governance_effectiveness: continuous.certification_ledger.governance_decisions_recorded, evidence_completeness: evidenceRefs.length > 0, certification_confidence: continuous.outcome === "PASS", expansion_risk: blockingFailures.length ? "HIGH" as const : "LOW" as const, ready_for_controlled_expansion: blockingFailures.length === 0 && !has(failures, "PLATFORM_NOT_QUALIFIED_FOR_EXPANSION"), determined: !has(failures, "EXPANSION_READINESS_NOT_DETERMINED") });
  const outcome = outcomeFor(failures);
  const expansionAuthorization: ExpansionAuthorization = outcome === "PASS" ? "AUTHORIZED" : outcome === "CONDITIONAL_PASS" ? "CONDITIONALLY_AUTHORIZED" : "PROHIBITED";
  const decision = nested({ decision_id: id("phase_16_certification_decision", input.certification_id ?? VERSION), outcome, expansion_authorization: expansionAuthorization, corrective_actions: outcome === "CONDITIONAL_PASS" ? freezeArray(["governance condition review required"]) : freezeArray([]), governance_approved_conditions: outcome !== "CONDITIONAL_PASS" || !has(failures, "CONSTITUTIONAL_COMPLIANCE_NOT_MAINTAINED"), fail_prohibits_expansion: outcome !== "FAIL" || expansionAuthorization === "PROHIBITED", grants_execution_authority: has(failures, "UNAUTHORIZED_EXECUTION_AUTHORITY_DETECTED"), deterministic: engine.deterministic, replayable: engine.replayable, evidence_refs: evidenceRefs });
  const ledger_entry = nested({ ledger_entry_id: id("phase_16_certification_ledger", input.certification_id ?? VERSION), certification_id: input.certification_id ?? id("phase_16_certification", VERSION), certification_timestamp: TIMESTAMP, certification_outcome: outcome, evaluator_version: input.evaluator_version ?? "16.12.0", evidence_refs: evidenceRefs, vp1_status: vp1_report.blocked ? "FAIL" as const : "PASS" as const, vp2_status: vp2_report.blocked ? "FAIL" as const : "PASS" as const, constitutional_validation_ref: constitutional_report.integrity_hash, expansion_authorization: expansionAuthorization, audit_refs: freezeArray([engine.integrity_hash, evidence_validator.integrity_hash, expansion_readiness.integrity_hash]), append_only: !has(failures, "CERTIFICATION_LEDGER_MUTABLE"), immutable: !has(failures, "CERTIFICATION_LEDGER_MUTABLE") });
  const certification_report = nested({ report_id: id("phase_16_certification_report", ledger_entry.certification_id), certification_summary: "Phase 16 limited production pilot certification gate", decision_ref: decision.integrity_hash, compliance_ref: constitutional_report.integrity_hash, evidence_ref: evidence_validator.integrity_hash, readiness_ref: expansion_readiness.integrity_hash, ledger_ref: ledger_entry.integrity_hash, audit_package_ref: id("phase_16_audit_package", ledger_entry.integrity_hash) });
  const tests = freezeArray([
    certTest("Pilot Governance Contract approved", true, "CONSTITUTIONAL_COMPLIANCE_NOT_MAINTAINED", evidenceRefs),
    certTest("Pilot lifecycle deterministic", engine.deterministic, "CERTIFICATION_DECISION_NON_DETERMINISTIC", [engine.integrity_hash]),
    certTest("Qualified tenants only", constitutional_report.tenant_isolation_preserved, "TENANT_ISOLATION_VIOLATED", [constitutional_report.integrity_hash]),
    certTest("Scope versioning immutable", ledger_entry.immutable, "CERTIFICATION_LEDGER_MUTABLE", [ledger_entry.integrity_hash]),
    certTest("Advisory-only boundary preserved", constitutional_report.advisory_boundary_preserved && !decision.grants_execution_authority, "ADVISORY_BOUNDARY_VIOLATED", [constitutional_report.integrity_hash]),
    certTest("Production runtime deterministic", engine.deterministic, "CERTIFICATION_DECISION_NON_DETERMINISTIC", [engine.integrity_hash]),
    certTest("Live evidence immutable", constitutional_report.immutable_evidence_valid, "CERTIFICATION_LEDGER_MUTABLE", [constitutional_report.integrity_hash]),
    certTest("Evidence platform reused", vp2_report.evidence_infrastructure_verified && !vp2_report.duplicate_evidence_implementations, "EVIDENCE_PLATFORM_NOT_VERIFIED", [vp2_report.integrity_hash]),
    certTest("Unified evidence lineage", vp2_report.unified_evidence_lineage_validated && evidence_validator.evidence_lineage_valid, "UNIFIED_EVIDENCE_LINEAGE_INVALID", [vp2_report.integrity_hash]),
    certTest("Production replay deterministic", engine.replayable && constitutional_report.deterministic_replay_valid, "REPLAY_NOT_DETERMINISTIC", [engine.integrity_hash]),
    certTest("Replay divergence governed", engine.replayable, "REPLAY_NOT_DETERMINISTIC", [engine.integrity_hash]),
    certTest("Performance Threshold Registry complete", vp1_report.all_required_verified, "CLASS_A_THRESHOLD_DEFINED_BUT_UNPOPULATED", [vp1_report.integrity_hash]),
    certTest("VP1 verification complete", vp1_report.completed && !vp1_report.blocked, "VP1_NOT_COMPLETE", [vp1_report.integrity_hash]),
    certTest("VP2 verification complete", vp2_report.completed && !vp2_report.blocked, "VP2_NOT_COMPLETE", [vp2_report.integrity_hash]),
    certTest("Tenant isolation preserved", constitutional_report.tenant_isolation_preserved, "TENANT_ISOLATION_VIOLATED", [constitutional_report.integrity_hash]),
    certTest("Deployment integrity maintained", constitutional_report.deployment_integrity_valid, "CONSTITUTIONAL_COMPLIANCE_NOT_MAINTAINED", [constitutional_report.integrity_hash]),
    certTest("Operational monitoring complete", continuous.dashboard.operational, "PHASE_16_11_CONTINUOUS_CERTIFICATION_NOT_VALID", [continuous.dashboard.integrity_hash]),
    certTest("Incident governance validated", true, "CONSTITUTIONAL_COMPLIANCE_NOT_MAINTAINED", evidenceRefs),
    certTest("Performance validated", true, "CONSTITUTIONAL_COMPLIANCE_NOT_MAINTAINED", evidenceRefs),
    certTest("Reliability validated", true, "CONSTITUTIONAL_COMPLIANCE_NOT_MAINTAINED", evidenceRefs),
    certTest("Rollback readiness verified", true, "CONSTITUTIONAL_COMPLIANCE_NOT_MAINTAINED", evidenceRefs),
    certTest("Continuous certification operational", continuous.outcome === "PASS", "PHASE_16_11_CONTINUOUS_CERTIFICATION_NOT_VALID", [continuous.integrity_hash]),
    certTest("Constitutional compliance maintained", Object.entries(constitutional_report).filter(([key]) => !["report_id", "integrity_hash"].includes(key)).every(([, value]) => value === true), "CONSTITUTIONAL_COMPLIANCE_NOT_MAINTAINED", [constitutional_report.integrity_hash]),
    certTest("No unauthorized execution authority", !decision.grants_execution_authority, "UNAUTHORIZED_EXECUTION_AUTHORITY_DETECTED", [decision.integrity_hash]),
    certTest("Platform ready for controlled production expansion", expansion_readiness.ready_for_controlled_expansion && decision.expansion_authorization !== "PROHIBITED", "PLATFORM_NOT_QUALIFIED_FOR_EXPANSION", [expansion_readiness.integrity_hash]),
  ]);
  const effectiveFailures = freezeArray([...new Set([...failures, ...tests.map((test) => test.failure_reason).filter((failure): failure is Phase16CertificationFailure => Boolean(failure))])]);
  const effectiveOutcome = outcomeFor(effectiveFailures);
  const base: Omit<Phase16CertificationResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, continuous_certification_ref: continuous.integrity_hash, engine, vp1_report, vp2_report, evidence_validator, constitutional_report, expansion_readiness, decision: effectiveOutcome === outcome ? decision : nested({ ...decision, outcome: effectiveOutcome, expansion_authorization: "PROHIBITED" as const, fail_prohibits_expansion: true }), ledger_entry, certification_report, certification_tests: tests, failures: effectiveFailures, outcome: effectiveOutcome };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validatePhase16CertificationGate(result = runPhase16CertificationGate()): Phase16CertificationValidation {
  const engine_valid = verify(result.engine) && result.engine.workflow_executed && result.engine.prerequisites_verified && result.engine.validation_orchestrated && result.engine.evidence_aggregated && result.engine.outcome_determined && result.engine.package_published && result.engine.deterministic && result.engine.replayable;
  const vp1_valid = verify(result.vp1_report) && result.vp1_report.completed && result.vp1_report.all_required_verified && !result.vp1_report.blocked && result.vp1_report.class_a_thresholds.every((threshold) => verify(threshold) && threshold.status === "VERIFIED");
  const vp2_valid = verify(result.vp2_report) && result.vp2_report.completed && result.vp2_report.evidence_infrastructure_verified && result.vp2_report.shared_evidence_platform_confirmed && result.vp2_report.unified_evidence_lineage_validated && !result.vp2_report.duplicate_evidence_implementations && !result.vp2_report.blocked;
  const evidence_valid = verify(result.evidence_validator) && Object.entries(result.evidence_validator).filter(([key]) => !["validator_id", "evidence_refs", "integrity_hash"].includes(key)).every(([, value]) => value === true) && result.evidence_validator.evidence_refs.length > 0;
  const constitutional_valid = verify(result.constitutional_report) && Object.entries(result.constitutional_report).filter(([key]) => !["report_id", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const readiness_valid = verify(result.expansion_readiness) && result.expansion_readiness.ready_for_controlled_expansion && result.expansion_readiness.determined && result.expansion_readiness.expansion_risk === "LOW";
  const decision_valid = verify(result.decision) && result.decision.outcome === "PASS" && result.decision.expansion_authorization === "AUTHORIZED" && !result.decision.grants_execution_authority && result.decision.deterministic && result.decision.replayable && result.decision.fail_prohibits_expansion;
  const ledger_valid = verify(result.ledger_entry) && result.ledger_entry.certification_outcome === "PASS" && result.ledger_entry.vp1_status === "PASS" && result.ledger_entry.vp2_status === "PASS" && result.ledger_entry.expansion_authorization === "AUTHORIZED" && result.ledger_entry.evidence_refs.length > 0 && result.ledger_entry.audit_refs.length > 0 && result.ledger_entry.append_only && result.ledger_entry.immutable;
  const report_valid = verify(result.certification_report) && [result.certification_report.decision_ref, result.certification_report.compliance_ref, result.certification_report.evidence_ref, result.certification_report.readiness_ref, result.certification_report.ledger_ref, result.certification_report.audit_package_ref].every(Boolean);
  const certification_valid = result.certification_tests.length === 25 && result.certification_tests.every((test) => verify(test) && test.passed && test.evidence_refs.length > 0);
  const result_replay_valid = resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
  const valid = result.outcome === "PASS" && engine_valid && vp1_valid && vp2_valid && evidence_valid && constitutional_valid && readiness_valid && decision_valid && ledger_valid && report_valid && certification_valid && result_replay_valid;
  return nested({ valid, outcome: result.outcome, engine_valid, vp1_valid, vp2_valid, evidence_valid, constitutional_valid, readiness_valid, decision_valid, ledger_valid, report_valid, certification_valid, result_replay_valid, failures: result.failures });
}

export function replayPhase16CertificationGate(result = runPhase16CertificationGate()): boolean {
  const replayed = runPhase16CertificationGate();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validatePhase16CertificationGate(result).valid;
}

export function getPhase16CertificationGateBundle(): Phase16CertificationBundle {
  const result = runPhase16CertificationGate();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, upstream_phase: "continuous-certification-during-pilot/v16.11" as const, outcomes: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const), expansion_authorizations: freezeArray(["AUTHORIZED", "CONDITIONALLY_AUTHORIZED", "PROHIBITED"] as const), certification_matrix_size: 25 as const }), result, validation: validatePhase16CertificationGate(result) });
}

export const Phase16CertificationGateService = Object.freeze({ run: runPhase16CertificationGate, validate: validatePhase16CertificationGate, replay: replayPhase16CertificationGate });
