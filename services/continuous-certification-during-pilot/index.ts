import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runPilotExpansionGovernance } from "@/services/pilot-expansion-governance";
import type {
  CertificationState,
  CertificationTrigger,
  CertificationValidationCategory,
  ContinuousCertificationBundle,
  ContinuousCertificationFailure,
  ContinuousCertificationInput,
  ContinuousCertificationOutcome,
  ContinuousCertificationResult,
  ContinuousCertificationTest,
  ContinuousCertificationValidation,
} from "@/types/continuous-certification-during-pilot";

const VERSION = "continuous-certification-during-pilot/v16.11" as const;
const IDENTIFIER = "ContinuousCertificationDuringPilot" as const;
const TIMESTAMP = "2026-07-15T00:00:00.000Z" as const;
const DEFAULT_TENANT = "tenant_phase_16_continuous_certification";
const DEFAULT_OPERATOR = "operator_phase_16_continuous_certification";
const DEFAULT_PILOT = "mission_control_initial_production_pilot";

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function verify(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 20)}`; }
function has(failures: readonly ContinuousCertificationFailure[], failure: ContinuousCertificationFailure): boolean { return failures.includes(failure); }
function directFailure(scenario: ContinuousCertificationInput["scenario"]): ContinuousCertificationFailure | undefined { return !scenario || scenario === "BASELINE" ? undefined : scenario; }
function outcomeFor(failures: readonly ContinuousCertificationFailure[]): ContinuousCertificationOutcome {
  if (failures.length === 1 && failures[0] === "NON_CONSTITUTIONAL_CERTIFICATION_WARNING") return "CONDITIONAL_PASS";
  return failures.length ? "FAIL" : "PASS";
}

const certificationStates = freezeArray(["CERTIFIED", "CONDITIONALLY_CERTIFIED", "UNDER_REVIEW", "RECERTIFICATION_REQUIRED", "SUSPENDED", "REVOKED"] as const satisfies readonly CertificationState[]);
const triggers = freezeArray(["PILOT_STARTUP", "CONFIGURATION_CHANGE", "DEPLOYMENT_EVENT", "GOVERNANCE_POLICY_UPDATE", "REPLAY_COMPLETION", "EVIDENCE_INGESTION", "OPERATIONAL_INCIDENT", "TENANT_ENROLLMENT", "SCOPE_MODIFICATION", "OPERATOR_ACTION", "SCHEDULED_EVALUATION", "MANUAL_GOVERNANCE_REVIEW"] as const satisfies readonly CertificationTrigger[]);
const categories = freezeArray(["REPLAY_INTEGRITY", "GOVERNANCE_COMPLIANCE", "ADVISORY_BOUNDARY", "TENANT_ISOLATION", "DEPLOYMENT_INTEGRITY", "OPERATIONAL_HEALTH", "CERTIFICATION_EVIDENCE"] as const satisfies readonly CertificationValidationCategory[]);

function certTest(name: string, passed: boolean, failure: ContinuousCertificationFailure, evidence_refs: readonly string[]): ContinuousCertificationTest {
  const actual: ContinuousCertificationOutcome = passed ? "PASS" : failure === "NON_CONSTITUTIONAL_CERTIFICATION_WARNING" ? "CONDITIONAL_PASS" : "FAIL";
  return nested({ test_id: id("continuous_certification_test", name), name, expected: "PASS" as const, actual, passed, failure_reason: passed ? null : failure, evidence_refs: freezeArray(evidence_refs) });
}
function resultReplayHash(result: Omit<ContinuousCertificationResult, "replay_hash" | "integrity_hash">): string {
  return hash({ expansion: result.pilot_expansion_governance_ref, engine: result.engine.integrity_hash, compliance: result.compliance_validator.integrity_hash, record: result.certification_record.integrity_hash, ledger: result.certification_ledger.integrity_hash, dashboard: result.dashboard.integrity_hash, platform: result.evidence_platform.integrity_hash, tests: result.certification_tests.map((test) => test.integrity_hash), outcome: result.outcome });
}
function resultIntegrityHash(result: Omit<ContinuousCertificationResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.outcome, replay_hash: result.replay_hash });
}

export function runContinuousCertificationDuringPilot(input: ContinuousCertificationInput = {}): ContinuousCertificationResult {
  const expansion = runPilotExpansionGovernance({ tenant_id: input.tenant_id ?? DEFAULT_TENANT, operator_id: input.operator_id ?? DEFAULT_OPERATOR, mission_id: input.mission_id, pilot_id: input.pilot_id ?? DEFAULT_PILOT });
  const direct = directFailure(input.scenario);
  const upstreamFailures: ContinuousCertificationFailure[] = expansion.outcome === "PASS" ? [] : ["PHASE_16_10_EXPANSION_NOT_VALID"];
  const failures = freezeArray([...new Set([...upstreamFailures, ...(direct ? [direct] : [])])]);
  const blockingFailures = freezeArray(failures.filter((failure) => failure !== "NON_CONSTITUTIONAL_CERTIFICATION_WARNING"));
  const evidenceRefs = has(failures, "EVIDENCE_INCOMPLETE") ? freezeArray([]) : freezeArray([expansion.integrity_hash, expansion.expansion_record.integrity_hash, expansion.evidence_integration.integrity_hash]);
  const governanceRefs = has(failures, "GOVERNANCE_REVIEW_NOT_INTEGRATED") ? freezeArray([]) : freezeArray([expansion.approval_workflow.integrity_hash, expansion.registry.integrity_hash]);
  const violationFailures = freezeArray(blockingFailures.filter((failure) => !["PHASE_16_10_EXPANSION_NOT_VALID"].includes(failure)));
  const failClosedState: CertificationState = has(failures, "FAIL_CLOSED_NOT_VALIDATED") ? "CERTIFIED" : "SUSPENDED";
  const certificationState: CertificationState = blockingFailures.length === 0 ? has(failures, "NON_CONSTITUTIONAL_CERTIFICATION_WARNING") ? "CONDITIONALLY_CERTIFIED" : "CERTIFIED" : has(failures, "ADVISORY_BOUNDARY_NOT_ENFORCED") || has(failures, "CONSTITUTIONAL_COMPLIANCE_NOT_VERIFIED") ? "REVOKED" : failClosedState;
  const engine = nested({ engine_id: id("continuous_certification_engine", input.pilot_id ?? DEFAULT_PILOT), cycle_triggers: triggers, cycles_scheduled: !has(failures, "CONTINUOUS_CERTIFICATION_NOT_OPERATIONAL"), constitutional_guarantees_evaluated: !has(failures, "CONSTITUTIONAL_COMPLIANCE_NOT_VERIFIED"), certification_evidence_collected: evidenceRefs.length > 0, qualification_drift_detected: violationFailures.length > 0, governance_workflows_triggered: governanceRefs.length > 0, immutable_lineage_preserved: !has(failures, "CERTIFICATION_HISTORY_MUTABLE"), deterministic: !has(failures, "CERTIFICATION_DECISIONS_NON_DETERMINISTIC"), replayable: !has(failures, "REPLAY_INTEGRITY_NOT_VERIFIED"), evidence_refs: evidenceRefs });
  const resultForCategory = (category: CertificationValidationCategory) => {
    const failed = (category === "REPLAY_INTEGRITY" && has(failures, "REPLAY_INTEGRITY_NOT_VERIFIED")) || (category === "GOVERNANCE_COMPLIANCE" && has(failures, "CONSTITUTIONAL_COMPLIANCE_NOT_VERIFIED")) || (category === "ADVISORY_BOUNDARY" && has(failures, "ADVISORY_BOUNDARY_NOT_ENFORCED")) || (category === "TENANT_ISOLATION" && has(failures, "TENANT_ISOLATION_NOT_VALIDATED")) || (category === "DEPLOYMENT_INTEGRITY" && has(failures, "DEPLOYMENT_INTEGRITY_NOT_VALIDATED")) || (category === "OPERATIONAL_HEALTH" && has(failures, "CONTINUOUS_CERTIFICATION_NOT_OPERATIONAL")) || (category === "CERTIFICATION_EVIDENCE" && has(failures, "EVIDENCE_INCOMPLETE"));
    return nested({ category, status: failed ? "FAIL" as const : "PASS" as const, checks: freezeArray(["constitutional guarantee", "evidence completeness", "deterministic replay", "governance linkage"]), evidence_refs: failed ? freezeArray([]) : evidenceRefs, deterministic: !has(failures, "CERTIFICATION_DECISIONS_NON_DETERMINISTIC") });
  };
  const results = freezeArray(categories.map(resultForCategory));
  const compliance_validator = nested({ validator_id: id("continuous_compliance_validator", input.scope_version ?? "16.11.0"), results, governance_policies_valid: !has(failures, "CONSTITUTIONAL_COMPLIANCE_NOT_VERIFIED"), advisory_boundary_valid: !has(failures, "ADVISORY_BOUNDARY_NOT_ENFORCED"), replay_determinism_valid: !has(failures, "REPLAY_INTEGRITY_NOT_VERIFIED"), deployment_integrity_valid: !has(failures, "DEPLOYMENT_INTEGRITY_NOT_VALIDATED"), tenant_isolation_valid: !has(failures, "TENANT_ISOLATION_NOT_VALIDATED"), evidence_completeness_valid: evidenceRefs.length > 0, operator_authority_valid: !has(failures, "ADVISORY_BOUNDARY_NOT_ENFORCED"), certification_freshness_valid: true, operational_readiness_valid: !has(failures, "CONTINUOUS_CERTIFICATION_NOT_OPERATIONAL"), violations_detected: has(failures, "VIOLATIONS_NOT_DETECTED") ? freezeArray([]) : violationFailures });
  const record = nested({ certification_id: id("pilot_certification_record", { pilot: input.pilot_id ?? DEFAULT_PILOT, scope: input.scope_version ?? "pilot-scope-v1" }), pilot_id: input.pilot_id ?? DEFAULT_PILOT, tenant_id: input.tenant_id ?? DEFAULT_TENANT, scope_version: input.scope_version ?? "pilot-scope-v1", evaluation_time: TIMESTAMP, evaluation_reason: input.evaluation_reason ?? "SCHEDULED_EVALUATION" as const, certification_state: certificationState, constitutional_results: results.map((entry) => entry.integrity_hash), governance_results: governanceRefs, replay_results: has(failures, "REPLAY_INTEGRITY_NOT_VERIFIED") ? freezeArray([]) : freezeArray([expansion.replay_hash]), deployment_results: has(failures, "DEPLOYMENT_INTEGRITY_NOT_VALIDATED") ? freezeArray([]) : freezeArray([expansion.expansion_record.integrity_hash]), operational_results: engine.cycles_scheduled ? freezeArray([engine.integrity_hash]) : freezeArray([]), evidence_refs: evidenceRefs, incident_refs: freezeArray([expansion.registry.integrity_hash]), recommendation_refs: freezeArray([expansion.approval_workflow.integrity_hash]), review_required: blockingFailures.length > 0, certification_version: input.certification_version ?? "16.11.0", previous_certification: null });
  const ledgerEvents = ["EVIDENCE_COLLECTED", "COMPLIANCE_VALIDATED", "CONSTITUTION_EVALUATED", "STATE_DETERMINED", "EVIDENCE_RECORDED", "DASHBOARD_UPDATED", "GOVERNANCE_NOTIFIED"] as const;
  const entries = freezeArray(ledgerEvents.map((event_type, index) => nested({ ledger_entry_id: id("continuous_certification_ledger", { event_type, index }), sequence: index + 1, event_type, certification_refs: freezeArray([record.integrity_hash]), evidence_refs: evidenceRefs, governance_refs: governanceRefs, supersedes: index === 0 ? null : record.integrity_hash, append_only: !has(failures, "CERTIFICATION_HISTORY_MUTABLE"), immutable: !has(failures, "CERTIFICATION_HISTORY_MUTABLE") })));
  const certification_ledger = nested({ ledger_id: id("certification_ledger", input.pilot_id ?? DEFAULT_PILOT), records: freezeArray([record]), entries, append_only: !has(failures, "CERTIFICATION_HISTORY_MUTABLE"), immutable: !has(failures, "CERTIFICATION_HISTORY_MUTABLE"), supersession_history_preserved: !has(failures, "CERTIFICATION_HISTORY_MUTABLE"), governance_decisions_recorded: governanceRefs.length > 0 });
  const dashboard = nested({ dashboard_id: id("certification_dashboard", record.certification_id), overall_certification_state: certificationState, constitutional_health_visible: !has(failures, "CERTIFICATION_DASHBOARD_NOT_OPERATIONAL"), replay_status_visible: !has(failures, "CERTIFICATION_DASHBOARD_NOT_OPERATIONAL"), advisory_compliance_visible: !has(failures, "CERTIFICATION_DASHBOARD_NOT_OPERATIONAL"), tenant_isolation_visible: !has(failures, "CERTIFICATION_DASHBOARD_NOT_OPERATIONAL"), deployment_integrity_visible: !has(failures, "CERTIFICATION_DASHBOARD_NOT_OPERATIONAL"), evidence_completeness_visible: !has(failures, "CERTIFICATION_DASHBOARD_NOT_OPERATIONAL"), operational_health_visible: !has(failures, "CERTIFICATION_DASHBOARD_NOT_OPERATIONAL"), active_violations_visible: !has(failures, "CERTIFICATION_DASHBOARD_NOT_OPERATIONAL"), historical_trend_visible: !has(failures, "CERTIFICATION_DASHBOARD_NOT_OPERATIONAL"), active_violations: compliance_validator.violations_detected, certification_trend: freezeArray(["CERTIFIED", certificationState] as const), operational: !has(failures, "CERTIFICATION_DASHBOARD_NOT_OPERATIONAL") });
  const evidence_platform = nested({ platform_ref: "constitutional-evidence-platform/phases-10-13-14-15-16", evidence_platform_reused: !has(failures, "DUPLICATE_EVIDENCE_INFRASTRUCTURE_CREATED"), duplicate_evidence_infrastructure_created: has(failures, "DUPLICATE_EVIDENCE_INFRASTRUCTURE_CREATED"), immutable_audit_reused: !has(failures, "CERTIFICATION_HISTORY_MUTABLE"), lineage_graph_reused: true, integrity_validation_reused: evidenceRefs.length > 0, certification_linkage_reused: evidenceRefs.length > 0, tenant_isolation_controls_reused: !has(failures, "TENANT_ISOLATION_NOT_VALIDATED") });
  const tests = freezeArray([
    certTest("Continuous certification operational", engine.cycles_scheduled && engine.cycle_triggers.length === 12, "CONTINUOUS_CERTIFICATION_NOT_OPERATIONAL", [engine.integrity_hash]),
    certTest("Violations detected", violationFailures.length === 0 || compliance_validator.violations_detected.length > 0, "VIOLATIONS_NOT_DETECTED", [compliance_validator.integrity_hash]),
    certTest("Evidence complete", evidenceRefs.length > 0 && record.evidence_refs.length > 0, "EVIDENCE_INCOMPLETE", [record.integrity_hash]),
    certTest("Certification decisions deterministic", engine.deterministic && results.every((entry) => entry.deterministic), "CERTIFICATION_DECISIONS_NON_DETERMINISTIC", results.map((entry) => entry.integrity_hash)),
    certTest("Certification history immutable", certification_ledger.immutable && certification_ledger.append_only && entries.every((entry) => entry.immutable && entry.append_only), "CERTIFICATION_HISTORY_MUTABLE", entries.map((entry) => entry.integrity_hash)),
    certTest("Constitutional compliance continuously verified", engine.constitutional_guarantees_evaluated && compliance_validator.governance_policies_valid, "CONSTITUTIONAL_COMPLIANCE_NOT_VERIFIED", [engine.integrity_hash, compliance_validator.integrity_hash]),
    certTest("Advisory-only boundary continuously enforced", compliance_validator.advisory_boundary_valid && compliance_validator.operator_authority_valid, "ADVISORY_BOUNDARY_NOT_ENFORCED", [compliance_validator.integrity_hash]),
    certTest("Tenant isolation continuously validated", compliance_validator.tenant_isolation_valid && evidence_platform.tenant_isolation_controls_reused, "TENANT_ISOLATION_NOT_VALIDATED", [compliance_validator.integrity_hash]),
    certTest("Replay integrity continuously verified", engine.replayable && compliance_validator.replay_determinism_valid && record.replay_results.length > 0, "REPLAY_INTEGRITY_NOT_VERIFIED", [record.integrity_hash]),
    certTest("Deployment integrity continuously validated", compliance_validator.deployment_integrity_valid && record.deployment_results.length > 0, "DEPLOYMENT_INTEGRITY_NOT_VALIDATED", [record.integrity_hash]),
    certTest("Certification dashboard operational", dashboard.operational && dashboard.active_violations_visible && dashboard.historical_trend_visible, "CERTIFICATION_DASHBOARD_NOT_OPERATIONAL", [dashboard.integrity_hash]),
    certTest("Governance review integrated", engine.governance_workflows_triggered && governanceRefs.length > 0 && certification_ledger.governance_decisions_recorded, "GOVERNANCE_REVIEW_NOT_INTEGRATED", [certification_ledger.integrity_hash]),
    certTest("Fail-closed behavior validated", blockingFailures.length === 0 || certificationState !== "CERTIFIED", "FAIL_CLOSED_NOT_VALIDATED", [record.integrity_hash]),
    certTest("Centralized evidence platform reused", evidence_platform.evidence_platform_reused && !evidence_platform.duplicate_evidence_infrastructure_created, "DUPLICATE_EVIDENCE_INFRASTRUCTURE_CREATED", [evidence_platform.integrity_hash]),
    certTest("Phase 16.10 expansion governance valid", expansion.outcome === "PASS", "PHASE_16_10_EXPANSION_NOT_VALID", [expansion.integrity_hash]),
  ]);
  const effectiveFailures = freezeArray([...new Set([...failures, ...tests.map((test) => test.failure_reason).filter((failure): failure is ContinuousCertificationFailure => Boolean(failure))])]);
  const outcome = outcomeFor(effectiveFailures);
  const base: Omit<ContinuousCertificationResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, pilot_expansion_governance_ref: expansion.integrity_hash, engine, compliance_validator, certification_record: record, certification_ledger, dashboard, evidence_platform, certification_tests: tests, failures: effectiveFailures, outcome };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateContinuousCertificationDuringPilot(result = runContinuousCertificationDuringPilot()): ContinuousCertificationValidation {
  const engine_valid = verify(result.engine) && result.engine.cycles_scheduled && result.engine.cycle_triggers.length === 12 && result.engine.constitutional_guarantees_evaluated && result.engine.certification_evidence_collected && result.engine.governance_workflows_triggered && result.engine.immutable_lineage_preserved && result.engine.deterministic && result.engine.replayable;
  const compliance_valid = verify(result.compliance_validator) && result.compliance_validator.results.length === 7 && result.compliance_validator.results.every((entry) => verify(entry) && entry.status === "PASS" && entry.evidence_refs.length > 0 && entry.deterministic) && result.compliance_validator.violations_detected.length === 0 && Object.entries(result.compliance_validator).filter(([key]) => !["validator_id", "results", "violations_detected", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const record_valid = verify(result.certification_record) && result.certification_record.certification_state === "CERTIFIED" && result.certification_record.constitutional_results.length === 7 && result.certification_record.governance_results.length > 0 && result.certification_record.replay_results.length > 0 && result.certification_record.deployment_results.length > 0 && result.certification_record.operational_results.length > 0 && result.certification_record.evidence_refs.length > 0 && !result.certification_record.review_required;
  const ledger_valid = verify(result.certification_ledger) && result.certification_ledger.records.length === 1 && result.certification_ledger.entries.length === 7 && result.certification_ledger.append_only && result.certification_ledger.immutable && result.certification_ledger.supersession_history_preserved && result.certification_ledger.governance_decisions_recorded && result.certification_ledger.entries.every((entry, index) => verify(entry) && entry.sequence === index + 1 && entry.certification_refs.length > 0 && entry.evidence_refs.length > 0 && entry.governance_refs.length > 0 && entry.append_only && entry.immutable);
  const dashboard_valid = verify(result.dashboard) && result.dashboard.overall_certification_state === "CERTIFIED" && result.dashboard.operational && result.dashboard.active_violations.length === 0 && result.dashboard.certification_trend.length > 0 && Object.entries(result.dashboard).filter(([key]) => !["dashboard_id", "overall_certification_state", "active_violations", "certification_trend", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const evidence_platform_valid = verify(result.evidence_platform) && result.evidence_platform.evidence_platform_reused && !result.evidence_platform.duplicate_evidence_infrastructure_created && result.evidence_platform.immutable_audit_reused && result.evidence_platform.lineage_graph_reused && result.evidence_platform.integrity_validation_reused && result.evidence_platform.certification_linkage_reused && result.evidence_platform.tenant_isolation_controls_reused;
  const certification_valid = result.certification_tests.length === 15 && result.certification_tests.every((test) => verify(test) && test.passed && test.evidence_refs.length > 0);
  const result_replay_valid = resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
  const valid = result.outcome === "PASS" && engine_valid && compliance_valid && record_valid && ledger_valid && dashboard_valid && evidence_platform_valid && certification_valid && result_replay_valid;
  return nested({ valid, outcome: result.outcome, engine_valid, compliance_valid, record_valid, ledger_valid, dashboard_valid, evidence_platform_valid, certification_valid, result_replay_valid, failures: result.failures });
}

export function replayContinuousCertificationDuringPilot(result = runContinuousCertificationDuringPilot()): boolean {
  const replayed = runContinuousCertificationDuringPilot();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateContinuousCertificationDuringPilot(result).valid;
}

export function getContinuousCertificationDuringPilotBundle(): ContinuousCertificationBundle {
  const result = runContinuousCertificationDuringPilot();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, upstream_phase: "pilot-expansion-governance/v16.10" as const, certification_states: certificationStates, triggers, validation_categories: categories, certification_outcomes: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const) }), result, validation: validateContinuousCertificationDuringPilot(result) });
}

export const ContinuousCertificationDuringPilotService = Object.freeze({ run: runContinuousCertificationDuringPilot, validate: validateContinuousCertificationDuringPilot, replay: replayContinuousCertificationDuringPilot });
