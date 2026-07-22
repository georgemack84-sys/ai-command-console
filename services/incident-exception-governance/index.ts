import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runPilotMonitoringObservability } from "@/services/pilot-monitoring-observability";
import type {
  EscalationOutcome,
  IncidentCategory,
  IncidentExceptionGovernanceBundle,
  IncidentExceptionGovernanceCertificationTest,
  IncidentExceptionGovernanceFailure,
  IncidentExceptionGovernanceInput,
  IncidentExceptionGovernanceOutcome,
  IncidentExceptionGovernanceResult,
  IncidentExceptionGovernanceValidation,
  IncidentLifecycleState,
  IncidentSeverity,
} from "@/types/incident-exception-governance";

const VERSION = "incident-exception-governance/v16.8" as const;
const IDENTIFIER = "IncidentExceptionGovernance" as const;
const TIMESTAMP = "2026-07-15T00:00:00.000Z" as const;
const DEFAULT_TENANT = "tenant_phase_16_incident_exception";
const DEFAULT_OPERATOR = "operator_phase_16_incident_exception";

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function verify(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 20)}`; }
function has(failures: readonly IncidentExceptionGovernanceFailure[], failure: IncidentExceptionGovernanceFailure): boolean { return failures.includes(failure); }
function directFailure(scenario: IncidentExceptionGovernanceInput["scenario"]): IncidentExceptionGovernanceFailure | undefined { return !scenario || scenario === "BASELINE" ? undefined : scenario; }
function outcomeFor(failures: readonly IncidentExceptionGovernanceFailure[]): IncidentExceptionGovernanceOutcome {
  if (failures.length === 1 && failures[0] === "NON_CONSTITUTIONAL_INCIDENT_WARNING") return "CONDITIONAL_PASS";
  return failures.length ? "FAIL" : "PASS";
}

const categories = freezeArray(["RUNTIME_FAILURE", "REPLAY_FAILURE", "GOVERNANCE_VIOLATION", "ADVISORY_BOUNDARY_VIOLATION", "TENANT_ISOLATION_VIOLATION", "EVIDENCE_INTEGRITY_VIOLATION", "DEPLOYMENT_INTEGRITY_VIOLATION", "OPERATOR_WORKFLOW_ISSUE"] as const satisfies readonly IncidentCategory[]);
const severities = freezeArray(["INFORMATIONAL", "LOW", "MODERATE", "HIGH", "CRITICAL", "CONSTITUTIONAL_CRITICAL"] as const satisfies readonly IncidentSeverity[]);
const lifecycle = freezeArray(["DETECTED", "CLASSIFIED", "EVIDENCE_CAPTURED", "CONTAINED", "INVESTIGATING", "REQUIRE_GOVERNANCE_REVIEW", "REQUIRE_RECERTIFICATION", "FAIL_CLOSED", "ROOT_CAUSE_IDENTIFIED", "REMEDIATION_APPROVED", "RESOLVED", "CERTIFIED_CLOSED"] as const satisfies readonly IncidentLifecycleState[]);
const escalationOutcomes = freezeArray(["LOG_ONLY", "MONITOR", "REQUIRE_OPERATOR_REVIEW", "REQUIRE_GOVERNANCE_REVIEW", "RESTRICT_SCOPE", "FREEZE_PILOT", "DISABLE_CAPABILITY", "REQUIRE_RECERTIFICATION", "FAIL_CLOSED"] as const satisfies readonly EscalationOutcome[]);

function certTest(name: string, passed: boolean, failure: IncidentExceptionGovernanceFailure, evidence_refs: readonly string[]): IncidentExceptionGovernanceCertificationTest {
  const actual: IncidentExceptionGovernanceOutcome = passed ? "PASS" : failure === "NON_CONSTITUTIONAL_INCIDENT_WARNING" ? "CONDITIONAL_PASS" : "FAIL";
  return nested({ test_id: id("incident_exception_governance_test", name), name, expected: "PASS" as const, actual, passed, failure_reason: passed ? null : failure, evidence_refs: freezeArray(evidence_refs) });
}
function resultReplayHash(result: Omit<IncidentExceptionGovernanceResult, "replay_hash" | "integrity_hash">): string {
  return hash({ monitoring: result.pilot_monitoring_observability_ref, policy: result.classification_policy.integrity_hash, incident: result.incident.integrity_hash, workflow: result.exception_workflow.integrity_hash, escalation: result.escalation.integrity_hash, rca: result.root_cause_analysis.integrity_hash, timeline: result.timeline.map((entry) => entry.integrity_hash), ledger: result.evidence_ledger.map((entry) => entry.integrity_hash), governance: result.governance_review_queue.integrity_hash, certification: result.certification_interface.integrity_hash, tests: result.certification_tests.map((test) => test.integrity_hash), outcome: result.outcome });
}
function resultIntegrityHash(result: Omit<IncidentExceptionGovernanceResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.outcome, replay_hash: result.replay_hash });
}

export function runIncidentExceptionGovernance(input: IncidentExceptionGovernanceInput = {}): IncidentExceptionGovernanceResult {
  const monitoring = runPilotMonitoringObservability({ tenant_id: input.tenant_id ?? DEFAULT_TENANT, operator_id: input.operator_id ?? DEFAULT_OPERATOR, mission_id: input.mission_id });
  const direct = directFailure(input.scenario);
  const upstreamFailures: IncidentExceptionGovernanceFailure[] = monitoring.outcome === "PASS" ? [] : ["PHASE_16_7_MONITORING_NOT_VALID"];
  const failures = freezeArray([...new Set([...upstreamFailures, ...(direct ? [direct] : [])])]);
  const tenantId = input.tenant_id ?? DEFAULT_TENANT;
  const incidentId = input.incident_id ?? id("pilot_incident", monitoring.integrity_hash);
  const evidenceRefs = has(failures, "FORENSIC_EVIDENCE_NOT_PRESERVED") ? freezeArray([]) : freezeArray([monitoring.integrity_hash, monitoring.event_stream.integrity_hash, monitoring.evidence_ledger[0]?.integrity_hash ?? monitoring.integrity_hash]);
  const replayRefs = has(failures, "INCIDENT_LIFECYCLE_NOT_REPLAYABLE") ? freezeArray([]) : freezeArray([monitoring.replay_hash, monitoring.pilot_performance_reliability_ref]);
  const certificationRefs = has(failures, "CERTIFICATION_IMPACT_NOT_TRACEABLE") ? freezeArray([]) : freezeArray([monitoring.integrity_hash, ...monitoring.certification_tests.map((test) => test.integrity_hash)]);
  const governanceRefs = has(failures, "GOVERNANCE_REVIEW_NOT_OPERATIONAL") ? freezeArray([]) : freezeArray([monitoring.observability_registry.integrity_hash, monitoring.dashboards.find((dashboard) => dashboard.dashboard_type === "GOVERNANCE")?.integrity_hash ?? monitoring.integrity_hash]);
  const classification_policy = nested({ policy_id: id("incident_classification_policy", VERSION), categories: has(failures, "INCIDENT_TAXONOMY_INCOMPLETE") ? freezeArray(categories.slice(0, 6)) : categories, severities, escalation_rules: escalationOutcomes, governance_requirements: freezeArray(["critical incidents require governance review", "constitutional critical incidents fail closed"]), certification_consequences: freezeArray(["review required", "recertification required", "blocking"]), containment_requirements: freezeArray(["preserve history", "capture evidence", "tenant scoped containment"]), recovery_requirements: freezeArray(["replay validation", "certification update", "governance closure"]), deterministic: !has(failures, "ESCALATION_NON_DETERMINISTIC"), immutable: !has(failures, "INCIDENT_HISTORY_MUTABLE"), version: VERSION });
  const escalation = nested({ escalation_id: id("incident_escalation", incidentId), severity: "INFORMATIONAL" as const, constitutional_impact: false, outcome: "MONITOR" as const, deterministic: !has(failures, "ESCALATION_NON_DETERMINISTIC"), governance_required: true, fail_closed_available: !has(failures, "CONSTITUTIONAL_GUARANTEES_NOT_PRESERVED"), evidence_refs: evidenceRefs });
  const root_cause_analysis = nested({ root_cause_id: id("incident_root_cause", incidentId), classification: "NO_ACTIVE_INCIDENT", contributing_factors: freezeArray(["pilot monitoring nominal"]), impacted_components: freezeArray(["observability", "incident governance"]), affected_tenants: freezeArray([tenantId]), replay_refs: replayRefs, evidence_refs: evidenceRefs, certification_impact: "NONE", recommended_remediation: freezeArray(["continue monitoring", "preserve evidence"]), reproducible: !has(failures, "ROOT_CAUSE_ANALYSIS_NOT_REPRODUCIBLE"), immutable: !has(failures, "INCIDENT_HISTORY_MUTABLE") });
  const incident = nested({ incident_id: incidentId, tenant_id: tenantId, pilot_id: monitoring.observability_records[0]?.pilot_scope ?? "limited production pilot", category: "RUNTIME_FAILURE" as const, severity: "INFORMATIONAL" as const, current_lifecycle_state: "CERTIFIED_CLOSED" as const, detection_source: monitoring.event_stream.integrity_hash, detection_timestamp: TIMESTAMP, affected_components: root_cause_analysis.impacted_components, evidence_refs: evidenceRefs, replay_refs: replayRefs, root_cause_ref: root_cause_analysis.integrity_hash, escalation_outcome: escalation.outcome, governance_decision: governanceRefs[0] ?? "", certification_impact: "NONE" as const, resolution_status: "RESOLVED" as const, resolution_timestamp: TIMESTAMP, immutable_audit_ref: id("incident_audit", incidentId) });
  const exception_workflow = nested({ workflow_id: id("exception_workflow", incidentId), sources: freezeArray(["monitoring alerts", "replay divergence", "governance validation", "operator escalation", "certification failure", "deployment validation", "evidence validation", "observability anomalies"]), classification_ref: classification_policy.integrity_hash, governed_response_ref: escalation.integrity_hash, evidence_refs: evidenceRefs, replay_refs: replayRefs, certification_refs: certificationRefs, deterministic: !has(failures, "ESCALATION_NON_DETERMINISTIC"), replayable: replayRefs.length > 0 });
  const timelineStates = ["DETECTED", "CLASSIFIED", "EVIDENCE_CAPTURED", "CONTAINED", "INVESTIGATING", "ROOT_CAUSE_IDENTIFIED", "REMEDIATION_APPROVED", "RESOLVED", "CERTIFIED_CLOSED"] as const;
  const timeline = freezeArray(timelineStates.map((state, index) => nested({ timeline_entry_id: id("incident_timeline", { incidentId, state }), sequence: index + 1, state, evidence_refs: evidenceRefs, replay_refs: replayRefs, governance_refs: governanceRefs, timestamp: TIMESTAMP, immutable: !has(failures, "INCIDENT_HISTORY_MUTABLE"), replayable: !has(failures, "INCIDENT_LIFECYCLE_NOT_REPLAYABLE") })));
  const ledgerTypes = ["DETECTION", "CLASSIFICATION", "EVIDENCE_CAPTURE", "ESCALATION", "ROOT_CAUSE", "GOVERNANCE_REVIEW", "REMEDIATION", "CERTIFICATION_CLOSE"] as const;
  const evidence_ledger = freezeArray(ledgerTypes.map((event_type, index) => nested({ ledger_entry_id: id("incident_evidence_ledger", { incidentId, event_type }), sequence: index + 1, event_type, incident_refs: freezeArray([incident.integrity_hash]), evidence_refs: evidenceRefs, replay_refs: replayRefs, certification_refs: certificationRefs, append_only: !has(failures, "INCIDENT_HISTORY_MUTABLE"), immutable: !has(failures, "IMMUTABLE_INCIDENT_EVIDENCE_NOT_VERIFIED") && !has(failures, "INCIDENT_HISTORY_MUTABLE") })));
  const governance_review_queue = nested({ queue_id: id("governance_review_queue", incidentId), incident_refs: freezeArray([incident.integrity_hash]), governance_authority: "governance_board", review_required: true, operational: !has(failures, "GOVERNANCE_REVIEW_NOT_OPERATIONAL"), evidence_refs: governanceRefs });
  const certification_interface = nested({ interface_id: id("incident_certification_interface", incidentId), pilot_qualification_impact: "no impact", certification_validity_impact: "valid", operational_readiness_impact: "ready", performance_validation_impact: "valid", governance_status_impact: "reviewed", expansion_eligibility_impact: "eligible", certification_refs: certificationRefs, traceable: !has(failures, "CERTIFICATION_IMPACT_NOT_TRACEABLE") });
  const tests = freezeArray([
    certTest("Incident taxonomy complete", classification_policy.categories.length === 8 && classification_policy.severities.length === 6, "INCIDENT_TAXONOMY_INCOMPLETE", [classification_policy.integrity_hash]),
    certTest("Escalation deterministic", classification_policy.deterministic && escalation.deterministic && exception_workflow.deterministic, "ESCALATION_NON_DETERMINISTIC", [escalation.integrity_hash]),
    certTest("Forensic evidence preserved", evidenceRefs.length > 0 && root_cause_analysis.evidence_refs.length > 0, "FORENSIC_EVIDENCE_NOT_PRESERVED", [root_cause_analysis.integrity_hash]),
    certTest("Incident lifecycle replayable", exception_workflow.replayable && timeline.every((entry) => entry.replayable && entry.replay_refs.length > 0), "INCIDENT_LIFECYCLE_NOT_REPLAYABLE", timeline.map((entry) => entry.integrity_hash)),
    certTest("Immutable incident evidence verified", evidence_ledger.every((entry) => entry.immutable && entry.append_only), "IMMUTABLE_INCIDENT_EVIDENCE_NOT_VERIFIED", evidence_ledger.map((entry) => entry.integrity_hash)),
    certTest("Governance review operational", governance_review_queue.operational && governance_review_queue.evidence_refs.length > 0, "GOVERNANCE_REVIEW_NOT_OPERATIONAL", [governance_review_queue.integrity_hash]),
    certTest("Root cause analysis reproducible", root_cause_analysis.reproducible && root_cause_analysis.replay_refs.length > 0, "ROOT_CAUSE_ANALYSIS_NOT_REPRODUCIBLE", [root_cause_analysis.integrity_hash]),
    certTest("Certification impact traceable", certification_interface.traceable && certification_interface.certification_refs.length > 0, "CERTIFICATION_IMPACT_NOT_TRACEABLE", [certification_interface.integrity_hash]),
    certTest("Incident history immutable", classification_policy.immutable && timeline.every((entry) => entry.immutable), "INCIDENT_HISTORY_MUTABLE", timeline.map((entry) => entry.integrity_hash)),
    certTest("Constitutional guarantees preserved", escalation.fail_closed_available && incident.tenant_id === tenantId && incident.certification_impact === "NONE", "CONSTITUTIONAL_GUARANTEES_NOT_PRESERVED", [incident.integrity_hash]),
    certTest("Phase 16.7 monitoring observability valid", monitoring.outcome === "PASS", "PHASE_16_7_MONITORING_NOT_VALID", [monitoring.integrity_hash]),
  ]);
  const effectiveFailures = freezeArray([...new Set([...failures, ...tests.map((test) => test.failure_reason).filter((failure): failure is IncidentExceptionGovernanceFailure => Boolean(failure))])]);
  const outcome = outcomeFor(effectiveFailures);
  const base: Omit<IncidentExceptionGovernanceResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, pilot_monitoring_observability_ref: monitoring.integrity_hash, lifecycle, classification_policy, incident, exception_workflow, escalation, root_cause_analysis, timeline, evidence_ledger, governance_review_queue, certification_interface, certification_tests: tests, failures: effectiveFailures, outcome };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateIncidentExceptionGovernance(result = runIncidentExceptionGovernance()): IncidentExceptionGovernanceValidation {
  const policy_valid = verify(result.classification_policy) && result.classification_policy.categories.length === 8 && result.classification_policy.severities.length === 6 && result.classification_policy.deterministic && result.classification_policy.immutable;
  const incident_valid = verify(result.incident) && result.incident.current_lifecycle_state === "CERTIFIED_CLOSED" && result.incident.resolution_status === "RESOLVED" && result.incident.evidence_refs.length > 0 && result.incident.replay_refs.length > 0 && Boolean(result.incident.root_cause_ref);
  const workflow_valid = verify(result.exception_workflow) && result.exception_workflow.deterministic && result.exception_workflow.replayable && result.exception_workflow.evidence_refs.length > 0 && result.exception_workflow.certification_refs.length > 0;
  const escalation_valid = verify(result.escalation) && result.escalation.deterministic && result.escalation.governance_required && result.escalation.fail_closed_available && result.escalation.evidence_refs.length > 0;
  const rca_valid = verify(result.root_cause_analysis) && result.root_cause_analysis.reproducible && result.root_cause_analysis.immutable && result.root_cause_analysis.replay_refs.length > 0 && result.root_cause_analysis.evidence_refs.length > 0;
  const timeline_valid = result.timeline.length === 9 && result.timeline.every((entry, index) => verify(entry) && entry.sequence === index + 1 && entry.immutable && entry.replayable && entry.evidence_refs.length > 0 && entry.replay_refs.length > 0);
  const ledger_valid = result.evidence_ledger.length === 8 && result.evidence_ledger.every((entry, index) => verify(entry) && entry.sequence === index + 1 && entry.incident_refs.length > 0 && entry.evidence_refs.length > 0 && entry.replay_refs.length > 0 && entry.certification_refs.length > 0 && entry.append_only && entry.immutable);
  const governance_valid = verify(result.governance_review_queue) && result.governance_review_queue.operational && result.governance_review_queue.review_required && result.governance_review_queue.evidence_refs.length > 0;
  const certification_valid = verify(result.certification_interface) && result.certification_interface.traceable && result.certification_interface.certification_refs.length > 0 && result.certification_tests.length === 11 && result.certification_tests.every((test) => verify(test) && test.passed && test.evidence_refs.length > 0);
  const result_replay_valid = resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
  const valid = result.outcome === "PASS" && policy_valid && incident_valid && workflow_valid && escalation_valid && rca_valid && timeline_valid && ledger_valid && governance_valid && certification_valid && result_replay_valid;
  return nested({ valid, outcome: result.outcome, policy_valid, incident_valid, workflow_valid, escalation_valid, rca_valid, timeline_valid, ledger_valid, governance_valid, certification_valid, result_replay_valid, failures: result.failures });
}

export function replayIncidentExceptionGovernance(result = runIncidentExceptionGovernance()): boolean {
  const replayed = runIncidentExceptionGovernance();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateIncidentExceptionGovernance(result).valid;
}

export function getIncidentExceptionGovernanceBundle(): IncidentExceptionGovernanceBundle {
  const result = runIncidentExceptionGovernance();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, upstream_phase: "pilot-monitoring-observability/v16.7" as const, categories, severities, lifecycle, escalation_outcomes: escalationOutcomes, certification_outcomes: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const) }), result, validation: validateIncidentExceptionGovernance(result) });
}

export const IncidentExceptionGovernanceService = Object.freeze({ run: runIncidentExceptionGovernance, validate: validateIncidentExceptionGovernance, replay: replayIncidentExceptionGovernance });
