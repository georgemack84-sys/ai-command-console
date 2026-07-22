import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { establishDriftDefenseArchitecture, replayDriftDefenseArchitecture } from "@/services/drift-defense-architecture";
import type {
  CertificationRequirementReport,
  ContainmentDecision,
  DriftContainmentResponse,
  DriftReplayRecord,
  DriftResponseApiSurface,
  DriftResponseContainmentStatus,
  DriftResponseFailure,
  DriftResponseFoundation,
  DriftResponseInput,
  DriftResponseMetrics,
  DriftResponsePolicy,
  DriftResponseRecord,
  DriftResponseResult,
  DriftResponseScenario,
  DriftResponseSeverity,
  EscalationPackage,
  OperatorNotificationPackage,
  RecoveryReadinessReport,
  RollbackEligibilityReport,
  SeverityAssessment,
} from "@/types/drift-response-containment-engine";

const ENGINE_VERSION = "drift-response-containment/v1" as const;
const ENGINE_IDENTIFIER = "DriftResponseContainmentEngine" as const;
const ENGINE_TIMESTAMP = "2026-07-11T00:00:00.000Z" as const;

type Scenario = NonNullable<DriftResponseInput["scenario"]>;

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity<T extends object>(value: T): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function buildApiSurface(): DriftResponseApiSurface {
  const base: Omit<DriftResponseApiSurface, "integrity_hash"> = {
    api_id: "drift_response_containment_api",
    respond_to_drift: "POST /drift-response-containment/respond",
    retrieve_policy: "POST /drift-response-containment/policy",
    retrieve_severity: "POST /drift-response-containment/severity",
    retrieve_containment: "POST /drift-response-containment/containment",
    retrieve_escalation: "POST /drift-response-containment/escalation",
    retrieve_rollback: "POST /drift-response-containment/rollback",
    retrieve_certification: "POST /drift-response-containment/certification",
    retrieve_notification: "POST /drift-response-containment/notification",
    retrieve_replay_record: "POST /drift-response-containment/replay-record",
    retrieve_recovery: "POST /drift-response-containment/recovery",
    retrieve_ledger_record: "POST /drift-response-containment/ledger",
    retrieve_metrics: "POST /drift-response-containment/metrics",
    replay_response: "POST /drift-response-containment/replay",
    inspect_response: "POST /drift-response-containment/inspect",
    retrieve_contract: "GET /drift-response-containment/contract",
    production_mutation_supported: false,
    adaptive_execution_authorization_supported: false,
    governance_bypass_supported: false,
    advisory_only: true,
    fail_open_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function failureForScenario(scenario: Scenario): DriftResponseFailure | undefined {
  const map: Partial<Record<DriftResponseScenario, DriftResponseFailure>> = {
    LOW_CONFIDENCE_DRIFT: "LOW_CONFIDENCE_DRIFT",
    MODERATE_STRATEGIC_DRIFT: "MODERATE_STRATEGIC_DRIFT",
    HIGH_RISK_DRIFT: "HIGH_RISK_DRIFT",
    GOVERNANCE_VIOLATION: "GOVERNANCE_VIOLATION",
    CONSTITUTIONAL_VIOLATION: "CONSTITUTIONAL_VIOLATION",
    AUTHORITY_EXPANSION: "AUTHORITY_EXPANSION",
    REPLAY_FAILURE: "REPLAY_FAILURE",
    TENANT_CONTAMINATION: "TENANT_CONTAMINATION",
    EVIDENCE_POISONING: "EVIDENCE_POISONING",
    FEEDBACK_MANIPULATION: "FEEDBACK_MANIPULATION",
    OPTIMIZATION_PRESSURE: "OPTIMIZATION_PRESSURE",
    ADVERSARIAL_SUCCESS: "ADVERSARIAL_SUCCESS",
    REPEATED_DRIFT: "REPEATED_DRIFT",
    UNRESOLVED_ADAPTIVE_BEHAVIOR: "UNRESOLVED_ADAPTIVE_BEHAVIOR",
    CERTIFICATION_REQUIRED: "CERTIFICATION_REQUIRED",
    ROLLBACK_REQUIRED: "ROLLBACK_REQUIRED",
    RECOVERY_READY: "RECOVERY_READY",
    RECOVERY_DEFERRED: "RECOVERY_DEFERRED",
    UNSUPPORTED_DRIFT: "UNSUPPORTED_DRIFT",
    AMBIGUOUS_DRIFT: "AMBIGUOUS_DRIFT",
    NONDETERMINISTIC_RESPONSE: "NONDETERMINISTIC_RESPONSE",
    NONREPLAYABLE_RESPONSE_EVIDENCE: "NONREPLAYABLE_RESPONSE_EVIDENCE",
    UNKNOWN_DRIFT_BEHAVIOR: "UNKNOWN_DRIFT_BEHAVIOR",
  };
  return map[scenario];
}

function collectFailures(scenario: Scenario, architectureReplayable: boolean): readonly DriftResponseFailure[] {
  const failures: DriftResponseFailure[] = [];
  const direct = failureForScenario(scenario);
  if (direct) failures.push(direct);
  if (!architectureReplayable) failures.push("DRIFT_DEFENSE_ARCHITECTURE_UNAVAILABLE");
  return freezeArray([...new Set(failures)]);
}

function severityFor(failures: readonly DriftResponseFailure[]): DriftResponseSeverity {
  if (failures.includes("UNKNOWN_DRIFT_BEHAVIOR") || failures.includes("UNSUPPORTED_DRIFT") || failures.includes("AMBIGUOUS_DRIFT")) return "CATASTROPHIC";
  if (failures.some((failure) => ["CONSTITUTIONAL_VIOLATION", "AUTHORITY_EXPANSION", "TENANT_CONTAMINATION", "REPLAY_FAILURE", "ADVERSARIAL_SUCCESS"].includes(failure))) return "CRITICAL";
  if (failures.some((failure) => ["GOVERNANCE_VIOLATION", "HIGH_RISK_DRIFT", "EVIDENCE_POISONING", "OPTIMIZATION_PRESSURE", "ROLLBACK_REQUIRED"].includes(failure))) return "HIGH";
  if (failures.some((failure) => ["MODERATE_STRATEGIC_DRIFT", "FEEDBACK_MANIPULATION", "REPEATED_DRIFT", "UNRESOLVED_ADAPTIVE_BEHAVIOR", "CERTIFICATION_REQUIRED"].includes(failure))) return "MODERATE";
  if (failures.includes("LOW_CONFIDENCE_DRIFT") || failures.includes("RECOVERY_DEFERRED")) return "LOW";
  return "INFORMATIONAL";
}

function responseFor(failures: readonly DriftResponseFailure[], severity: DriftResponseSeverity): DriftContainmentResponse {
  if (severity === "CATASTROPHIC" || failures.includes("UNKNOWN_DRIFT_BEHAVIOR")) return "FAIL_CLOSED";
  if (failures.includes("ROLLBACK_REQUIRED") || failures.includes("TENANT_CONTAMINATION") || failures.includes("REPLAY_FAILURE")) return "ROLLBACK";
  if (failures.includes("CERTIFICATION_REQUIRED") || failures.includes("ADVERSARIAL_SUCCESS")) return "REQUIRE_CERTIFICATION";
  if (failures.includes("UNRESOLVED_ADAPTIVE_BEHAVIOR")) return "REQUIRE_SIMULATION";
  if (failures.includes("GOVERNANCE_VIOLATION") || failures.includes("CONSTITUTIONAL_VIOLATION") || failures.includes("AUTHORITY_EXPANSION")) return "REQUIRE_REVIEW";
  if (failures.includes("HIGH_RISK_DRIFT") || failures.includes("EVIDENCE_POISONING") || failures.includes("FEEDBACK_MANIPULATION") || failures.includes("OPTIMIZATION_PRESSURE")) return "SUPPRESS_ADAPTATION";
  if (failures.includes("MODERATE_STRATEGIC_DRIFT") || failures.includes("REPEATED_DRIFT") || failures.includes("RECOVERY_DEFERRED")) return "ESCALATE";
  return "MONITOR";
}

function statusFor(response: DriftContainmentResponse): DriftResponseContainmentStatus {
  if (response === "FAIL_CLOSED") return "FAIL_CLOSED";
  if (response === "ROLLBACK") return "ROLLBACK_REQUIRED";
  if (response === "ESCALATE" || response === "REQUIRE_REVIEW" || response === "REQUIRE_CERTIFICATION") return "ESCALATED";
  if (response === "MONITOR") return "PASS";
  return "CONTAINMENT_SELECTED";
}

function buildPolicy(failures: readonly DriftResponseFailure[], severity: DriftResponseSeverity, response: DriftContainmentResponse): DriftResponsePolicy {
  const category = failures[0] ?? "NO_DRIFT";
  const base: Omit<DriftResponsePolicy, "integrity_hash"> = {
    policy_id: `drift_response_policy_${hash({ category, severity, response }).slice(0, 14)}`,
    drift_category: category,
    severity_level: severity,
    required_response: response,
    containment_level: response === "FAIL_CLOSED" ? "maximum" : response === "MONITOR" ? "none" : "controlled",
    escalation_policy: response === "MONITOR" ? "none" : "route_by_severity_and_impact",
    rollback_policy: response === "ROLLBACK" ? "restore_last_certified_state" : "rollback_requires_policy_trigger",
    certification_policy: response === "REQUIRE_CERTIFICATION" || response === "ROLLBACK" || response === "FAIL_CLOSED" ? "certification_before_recovery" : "certification_if_recovery_requested",
    operator_notification_policy: response === "MONITOR" ? "record_only" : "notify_required_authorities",
    replay_policy: "record_full_deterministic_replay",
    approval_reference: "governance-approval:drift-response-policy:v1",
    version: "drift-response-policy/v1",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildSeverity(failures: readonly DriftResponseFailure[], severity: DriftResponseSeverity): SeverityAssessment {
  const high = failures.length ? 0.82 : 0;
  const base: Omit<SeverityAssessment, "integrity_hash"> = {
    assessment_id: `severity_assessment_${hash({ failures, severity }).slice(0, 14)}`,
    severity,
    governance_impact_score: failures.includes("GOVERNANCE_VIOLATION") ? 0.94 : high,
    constitutional_impact_score: failures.includes("CONSTITUTIONAL_VIOLATION") ? 0.98 : high,
    authority_impact_score: failures.includes("AUTHORITY_EXPANSION") ? 0.96 : high,
    replay_impact_score: failures.includes("REPLAY_FAILURE") ? 0.95 : high,
    tenant_impact_score: failures.includes("TENANT_CONTAMINATION") ? 0.97 : high,
    evidence_integrity_score: failures.includes("EVIDENCE_POISONING") ? 0.93 : high,
    propagation_risk_score: failures.includes("REPEATED_DRIFT") || failures.includes("ADVERSARIAL_SUCCESS") ? 0.88 : high,
    operational_impact_score: severity === "CATASTROPHIC" ? 1 : high,
    recovery_complexity_score: failures.includes("ROLLBACK_REQUIRED") ? 0.9 : high,
    historical_recurrence_score: failures.includes("REPEATED_DRIFT") ? 0.91 : 0,
    severity_justification: failures.length ? "Detected drift requires deterministic containment based on impact and recoverability." : "No drift detected; monitoring response is sufficient.",
    risk_classification: severity === "INFORMATIONAL" ? "stable" : "drift_response_required",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function containmentActions(response: DriftContainmentResponse): readonly string[] {
  const base = {
    MONITOR: ["monitor_drift"],
    ESCALATE: ["route_escalation", "notify_operators", "preserve_replay_evidence"],
    SUPPRESS_ADAPTATION: ["suppress_unsafe_adaptation", "preserve_replay_evidence", "notify_operators"],
    REQUIRE_REVIEW: ["require_governance_review", "require_operator_review", "preserve_replay_evidence", "notify_operators"],
    REQUIRE_SIMULATION: ["require_deterministic_simulation", "suppress_until_simulation_complete", "preserve_replay_evidence"],
    REQUIRE_CERTIFICATION: ["require_certification_before_recovery", "suppress_until_certified", "preserve_replay_evidence", "notify_operators"],
    ROLLBACK: ["execute_approved_rollback_sequence", "restore_last_certified_state", "verify_replay_after_rollback", "preserve_replay_evidence", "notify_operators"],
    FAIL_CLOSED: ["fail_closed", "halt_adaptive_progression", "preserve_current_certified_state", "preserve_forensic_evidence", "notify_operators"],
  } satisfies Record<DriftContainmentResponse, string[]>;
  return freezeArray(base[response]);
}

function buildContainment(response: DriftContainmentResponse, actions: readonly string[]): ContainmentDecision {
  const base: Omit<ContainmentDecision, "integrity_hash"> = {
    decision_id: `containment_decision_${hash({ response, actions }).slice(0, 14)}`,
    selected_response: response,
    containment_scope: response === "MONITOR" ? "observation" : "affected_adaptive_capabilities",
    containment_level: response === "FAIL_CLOSED" ? "maximum" : response === "ROLLBACK" ? "rollback" : response === "MONITOR" ? "none" : "controlled",
    suppression_required: ["SUPPRESS_ADAPTATION", "REQUIRE_SIMULATION", "REQUIRE_CERTIFICATION", "ROLLBACK", "FAIL_CLOSED"].includes(response),
    governance_involvement: response !== "MONITOR",
    operator_involvement: response !== "MONITOR",
    certification_required: ["REQUIRE_CERTIFICATION", "ROLLBACK", "FAIL_CLOSED"].includes(response),
    rollback_eligible: response === "ROLLBACK",
    containment_actions: actions,
    deterministic: true,
    replayable: true,
    explainable: true,
    auditable: true,
    tenant_isolated: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildEscalation(failures: readonly DriftResponseFailure[], severity: DriftResponseSeverity, response: DriftContainmentResponse): EscalationPackage {
  const routes = response === "MONITOR" ? [] : ["Governance Review", "Operator Review"];
  if (["CRITICAL", "CATASTROPHIC"].includes(severity)) routes.push("Executive Review", "Security Review");
  if (failures.includes("CONSTITUTIONAL_VIOLATION") || failures.includes("AUTHORITY_EXPANSION")) routes.push("Constitutional Review");
  if (response === "REQUIRE_SIMULATION") routes.push("Simulation Review");
  if (response === "REQUIRE_CERTIFICATION" || response === "ROLLBACK" || response === "FAIL_CLOSED") routes.push("Certification Review");
  const base: Omit<EscalationPackage, "integrity_hash"> = {
    escalation_id: `escalation_${hash({ failures, response }).slice(0, 14)}`,
    escalation_status: response === "MONITOR" ? "NONE" : response === "FAIL_CLOSED" ? "BLOCKING" : "ROUTED",
    routes: freezeArray([...new Set(routes)]),
    escalation_triggers: failures,
    escalation_timeline: response === "MONITOR" ? freezeArray([]) : freezeArray(["detected", "contained", "routed"]),
    escalation_decision_record: response === "MONITOR" ? "No escalation required." : "Escalation routed according to deterministic response policy.",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildRollback(response: DriftContainmentResponse): RollbackEligibilityReport {
  const required = response === "ROLLBACK";
  const base: Omit<RollbackEligibilityReport, "integrity_hash"> = {
    report_id: `rollback_eligibility_${hash(response).slice(0, 14)}`,
    rollback_safety_score: required ? 0.84 : 0.98,
    rollback_completeness_score: required ? 0.86 : 0.98,
    replay_compatibility_score: required ? 0.88 : 0.98,
    certification_history_score: required ? 0.9 : 0.98,
    evidence_integrity_score: 0.98,
    dependency_impact_score: required ? 0.42 : 0.05,
    governance_approval_required: required,
    recovery_feasibility_score: required ? 0.82 : 0.98,
    rollback_required: required,
    rollback_recommended: required,
    rollback_prohibited: response === "FAIL_CLOSED",
    rollback_sequence: required ? freezeArray(["freeze_current_state", "restore_last_certified_state", "verify_replay", "request_certification"]) : freezeArray([]),
    rollback_verification_requirements: required ? freezeArray(["replay_validation", "evidence_integrity_check", "governance_approval"]) : freezeArray([]),
    recovery_assessment: required ? "Rollback is required to restore the last certified adaptive state." : "Rollback not required for selected response.",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildCertification(response: DriftContainmentResponse): CertificationRequirementReport {
  const required = ["REQUIRE_CERTIFICATION", "ROLLBACK", "FAIL_CLOSED"].includes(response);
  const base: Omit<CertificationRequirementReport, "integrity_hash"> = {
    report_id: `certification_requirement_${hash(response).slice(0, 14)}`,
    certification_required: required,
    certification_scope: required ? freezeArray(["replay", "governance", "simulation", "operator", "audit"]) : freezeArray([]),
    certification_sequence: required ? freezeArray(["simulation_certification", "replay_certification", "governance_certification", "operator_certification"]) : freezeArray([]),
    certification_dependencies: required ? freezeArray(["containment_complete", "replay_evidence_preserved", "operator_review_complete"]) : freezeArray([]),
    affected_certifications: required ? freezeArray(["adaptive_recovery", "production_progression"]) : freezeArray([]),
    replay_certification_required: required,
    governance_certification_required: required,
    simulation_certification_required: response === "REQUIRE_SIMULATION" || required,
    operator_certification_required: required,
    rollback_certification_required: response === "ROLLBACK",
    audit_certification_required: required,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildNotification(failures: readonly DriftResponseFailure[], severity: DriftResponseSeverity, actions: readonly string[], escalation: EscalationPackage): OperatorNotificationPackage {
  const notify = failures.length > 0;
  const base: Omit<OperatorNotificationPackage, "integrity_hash"> = {
    notification_id: `operator_notification_${hash({ failures, severity }).slice(0, 14)}`,
    notification_status: notify ? "SENT" : "NONE",
    recipients: notify ? freezeArray(["operators", "governance_reviewers", "audit_team"]) : freezeArray([]),
    detected_drift: failures,
    severity,
    affected_components: notify ? freezeArray(["adaptive_proposals", "recommendations", "governance_workflows"]) : freezeArray([]),
    containment_actions: actions,
    escalation_status: escalation.escalation_status,
    replay_references: freezeArray(["replay:drift-response-containment"]),
    recommended_actions: notify ? freezeArray(["review_containment", "validate_replay", "complete_required_approvals"]) : freezeArray(["continue_monitoring"]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildReplay(failures: readonly DriftResponseFailure[], severity: SeverityAssessment, containment: ContainmentDecision, escalation: EscalationPackage, rollback: RollbackEligibilityReport, certification: CertificationRequirementReport): DriftReplayRecord {
  const base: Omit<DriftReplayRecord, "integrity_hash"> = {
    replay_record_ref: `drift_response_replay_${hash({ failures, response: containment.selected_response }).slice(0, 14)}`,
    detected_drift: failures,
    severity_assessment_ref: severity.integrity_hash,
    response_selection: containment.selected_response,
    containment_execution: containment.containment_actions,
    escalation_decisions: escalation.routes,
    rollback_actions: rollback.rollback_sequence,
    certification_decisions: certification.certification_sequence,
    operator_actions: containment.operator_involvement ? freezeArray(["operator_notification", "operator_review_required"]) : freezeArray([]),
    governance_actions: containment.governance_involvement ? freezeArray(["governance_review_required"]) : freezeArray([]),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildRecovery(response: DriftContainmentResponse, certification: CertificationRequirementReport): RecoveryReadinessReport {
  const permitted = response === "MONITOR";
  const base: Omit<RecoveryReadinessReport, "integrity_hash"> = {
    report_id: `recovery_readiness_${hash(response).slice(0, 14)}`,
    recovery_decision: response === "FAIL_CLOSED" ? "PERMANENT_SUPPRESSION_REQUIRED" : response === "REQUIRE_SIMULATION" ? "ADDITIONAL_SIMULATION_REQUIRED" : certification.certification_required ? "RECOVERY_DEFERRED" : permitted ? "RECOVERY_PERMITTED" : "ADDITIONAL_EVIDENCE_REQUIRED",
    containment_completion: response !== "FAIL_CLOSED",
    governance_approval: response === "MONITOR",
    simulation_completion: response !== "REQUIRE_SIMULATION",
    certification_completion: !certification.certification_required,
    replay_validation: true,
    rollback_validation: response !== "ROLLBACK",
    operator_approval: response === "MONITOR",
    audit_completion: response === "MONITOR",
    recovery_decision_summary: response === "MONITOR" ? "Recovery is permitted because no containment is active." : "Recovery is deferred until required containment, governance, simulation, certification, and audit conditions are complete.",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildRecord(input: DriftResponseInput, policy: DriftResponsePolicy, severity: SeverityAssessment, containment: ContainmentDecision, escalation: EscalationPackage, rollback: RollbackEligibilityReport, certification: CertificationRequirementReport, notification: OperatorNotificationPackage, replay: DriftReplayRecord): DriftResponseRecord {
  const base: Omit<DriftResponseRecord, "integrity_hash"> = {
    response_id: `drift_response_${hash({ tenant: input.tenant_id ?? "tenant-mission-control", drift: input.drift_id ?? policy.drift_category, response: containment.selected_response }).slice(0, 16)}`,
    tenant_id: input.tenant_id ?? "tenant-mission-control",
    drift_id: input.drift_id ?? `drift_${hash(policy.drift_category).slice(0, 12)}`,
    drift_category: policy.drift_category,
    severity: severity.severity,
    selected_response: containment.selected_response,
    containment_level: containment.containment_level,
    escalation_status: escalation.escalation_status,
    rollback_eligibility: rollback.rollback_required ? "required" : rollback.rollback_prohibited ? "prohibited" : "not_required",
    rollback_executed: rollback.rollback_required,
    certification_required: certification.certification_required,
    operator_notification_status: notification.notification_status,
    replay_record_ref: replay.replay_record_ref,
    affected_adaptations: freezeArray(["adaptation:proposal-generation", "adaptation:simulation", "adaptation:feedback-learning"]),
    affected_recommendations: freezeArray(["recommendation:adaptive", "recommendation:governance-reviewed"]),
    governance_impact: containment.governance_involvement ? "governance_review_required" : "governance_preserved",
    constitutional_impact: severity.constitutional_impact_score > 0.9 ? "constitutional_review_required" : "constitutional_preserved",
    containment_actions: containment.containment_actions,
    supporting_evidence: containment.integrity_hash,
    timestamp: ENGINE_TIMESTAMP,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildMetrics(severity: DriftResponseSeverity, response: DriftContainmentResponse, containment: ContainmentDecision, rollback: RollbackEligibilityReport, certification: CertificationRequirementReport, escalation: EscalationPackage, failures: readonly DriftResponseFailure[]): DriftResponseMetrics {
  const base: Omit<DriftResponseMetrics, "integrity_hash"> = {
    severity,
    selected_response: response,
    containment_required: response !== "MONITOR",
    rollback_required: rollback.rollback_required,
    certification_required: certification.certification_required,
    escalation_required: escalation.escalation_status !== "NONE",
    deterministic_assessment: !failures.includes("NONDETERMINISTIC_RESPONSE"),
    replayable_assessment: !failures.includes("NONREPLAYABLE_RESPONSE_EVIDENCE"),
    governance_preserved: !failures.includes("GOVERNANCE_VIOLATION") && !failures.includes("UNKNOWN_DRIFT_BEHAVIOR"),
    constitutional_preserved: !failures.includes("CONSTITUTIONAL_VIOLATION") && !failures.includes("AUTHORITY_EXPANSION"),
    operator_authority_preserved: !failures.includes("AUTHORITY_EXPANSION"),
    tenant_isolated: !failures.includes("TENANT_CONTAMINATION"),
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<DriftResponseResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    architecture_hash: result.architecture_result.integrity_hash,
    policy_hash: result.response_policy.integrity_hash,
    severity_hash: result.severity_assessment.integrity_hash,
    containment_hash: result.containment_decision.integrity_hash,
    escalation_hash: result.escalation_package.integrity_hash,
    rollback_hash: result.rollback_report.integrity_hash,
    certification_hash: result.certification_report.integrity_hash,
    notification_hash: result.notification_package.integrity_hash,
    replay_record_hash: result.replay_record.integrity_hash,
    recovery_hash: result.recovery_readiness_report.integrity_hash,
    ledger_hash: result.response_record.integrity_hash,
    metrics_hash: result.metrics.integrity_hash,
    status: result.status,
    failures: result.failures,
  });
}

function resultIntegrityHash(result: Omit<DriftResponseResult, "integrity_hash">): string {
  return hash({
    version: result.drift_response_containment_version,
    engine_identifier: result.engine_identifier,
    api_surface_hash: result.api_surface.integrity_hash,
    replay_hash: result.replay_hash,
    record_hash: result.response_record.integrity_hash,
  });
}

function verifyHashedRecord(value: { integrity_hash: string }): boolean {
  return hashWithoutIntegrity(value) === value.integrity_hash;
}

export function respondToDrift(input: DriftResponseInput = {}): DriftResponseResult {
  const scenario = input.scenario ?? "BASELINE";
  const api_surface = buildApiSurface();
  const architecture_result = input.architecture_result ?? establishDriftDefenseArchitecture();
  const failures = collectFailures(scenario, replayDriftDefenseArchitecture(architecture_result));
  const severity = severityFor(failures);
  const response = responseFor(failures, severity);
  const actions = containmentActions(response);
  const response_policy = buildPolicy(failures, severity, response);
  const severity_assessment = buildSeverity(failures, severity);
  const containment_decision = buildContainment(response, actions);
  const escalation_package = buildEscalation(failures, severity, response);
  const rollback_report = buildRollback(response);
  const certification_report = buildCertification(response);
  const notification_package = buildNotification(failures, severity, actions, escalation_package);
  const replay_record = buildReplay(failures, severity_assessment, containment_decision, escalation_package, rollback_report, certification_report);
  const recovery_readiness_report = buildRecovery(response, certification_report);
  const response_record = buildRecord(input, response_policy, severity_assessment, containment_decision, escalation_package, rollback_report, certification_report, notification_package, replay_record);
  const metrics = buildMetrics(severity, response, containment_decision, rollback_report, certification_report, escalation_package, failures);
  const base: Omit<DriftResponseResult, "integrity_hash" | "replay_hash"> = {
    drift_response_containment_version: ENGINE_VERSION,
    engine_identifier: ENGINE_IDENTIFIER,
    status: statusFor(response),
    api_surface,
    architecture_result,
    response_policy,
    severity_assessment,
    containment_decision,
    escalation_package,
    rollback_report,
    certification_report,
    notification_package,
    replay_record,
    recovery_readiness_report,
    response_record,
    metrics,
    failures,
    deterministic: metrics.deterministic_assessment,
    replayable: metrics.replayable_assessment,
    explainable: !failures.includes("UNKNOWN_DRIFT_BEHAVIOR"),
    evidence_backed: !failures.includes("NONREPLAYABLE_RESPONSE_EVIDENCE"),
    governance_preserved: metrics.governance_preserved,
    constitutional_preserved: metrics.constitutional_preserved,
    operator_authority_preserved: metrics.operator_authority_preserved,
    tenant_isolated: metrics.tenant_isolated,
    advisory_only: true,
    mutates_production_behavior: false,
    authorizes_adaptive_execution: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayDriftResponse(result: DriftResponseResult): boolean {
  return (
    verifyHashedRecord(result.api_surface) &&
    replayDriftDefenseArchitecture(result.architecture_result) &&
    verifyHashedRecord(result.response_policy) &&
    verifyHashedRecord(result.severity_assessment) &&
    verifyHashedRecord(result.containment_decision) &&
    verifyHashedRecord(result.escalation_package) &&
    verifyHashedRecord(result.rollback_report) &&
    verifyHashedRecord(result.certification_report) &&
    verifyHashedRecord(result.notification_package) &&
    verifyHashedRecord(result.replay_record) &&
    verifyHashedRecord(result.recovery_readiness_report) &&
    verifyHashedRecord(result.response_record) &&
    verifyHashedRecord(result.metrics) &&
    resultReplayHash(result) === result.replay_hash &&
    resultIntegrityHash(result) === result.integrity_hash
  );
}

export function getDriftResponseFoundation(): DriftResponseFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    drift_response_containment_version: ENGINE_VERSION,
    api_surface,
    result: respondToDrift(),
  });
}

export const DriftResponseContainmentEngine = Object.freeze({
  respond: respondToDrift,
  replay: replayDriftResponse,
});
