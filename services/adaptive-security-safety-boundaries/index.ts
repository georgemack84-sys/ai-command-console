import { runAdaptiveIntelligenceLedger } from "@/services/adaptive-intelligence-ledger";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type { AdaptiveIntelligenceLedgerResult } from "@/types/adaptive-intelligence-ledger";
import type { VisibilityRole } from "@/types/decision-observability-contract";
import type {
  AdaptiveBoundaryEnforcement,
  AdaptiveContainmentAction,
  AdaptiveSafetyCertificationReport,
  AdaptiveSafetyPolicy,
  AdaptiveSafetyPolicyRegistry,
  AdaptiveSafetyReplay,
  AdaptiveSafetyRule,
  AdaptiveSafetyValidation,
  AdaptiveSafetyValidationState,
  AdaptiveSecurityCheck,
  AdaptiveSecurityDashboard,
  AdaptiveSecurityFailure,
  AdaptiveSecurityLedgerRecord,
  AdaptiveSecurityRecord,
  AdaptiveSecuritySafetyBoundariesFoundation,
  AdaptiveSecuritySafetyBoundariesInput,
  AdaptiveSecuritySafetyBoundariesResult,
  AdaptiveSecuritySeverity,
  HiddenLearningDetection,
  HiddenMemoryDetection,
  UnauthorizedAdaptationDetection,
} from "@/types/adaptive-security-safety-boundaries";

const SECURITY_BOUNDARY_VERSION = "adaptive-security-safety-boundaries/v1" as const;

export const ADAPTIVE_SECURITY_CHECKS: readonly AdaptiveSecurityCheck[] = Object.freeze(["SAFETY_POLICY_REGISTRY", "BOUNDARY_ENFORCEMENT", "HIDDEN_LEARNING_DETECTION", "HIDDEN_MEMORY_DETECTION", "UNAUTHORIZED_ADAPTATION_DETECTION", "AUTHORITY_ESCALATION_PREVENTION", "GOVERNANCE_SUPREMACY", "REPLAY_ENFORCEMENT", "LEDGER_INTEGRITY", "TENANT_ISOLATION", "SELF_MODIFICATION_PREVENTION", "SECURITY_EVENT_LEDGER", "DETERMINISTIC_REPLAY"]);
export const ADAPTIVE_SAFETY_RULES: readonly AdaptiveSafetyRule[] = Object.freeze(["ADVISORY_ONLY_LEARNING", "DETERMINISTIC_BEHAVIOR", "MANDATORY_REPLAY", "MANDATORY_GOVERNANCE_APPROVAL", "MANDATORY_OPERATOR_APPROVAL", "NO_AUTOMATIC_AUTHORITY_EXPANSION", "NO_HIDDEN_ADAPTIVE_STATE", "GOVERNED_REPLAYABLE_MEMORY", "NO_CROSS_TENANT_LEARNING", "NO_SELF_MODIFICATION"]);

type Scenario = NonNullable<AdaptiveSecuritySafetyBoundariesInput["scenario"]>;

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

function state(pass: boolean): AdaptiveSafetyValidationState {
  return pass ? "PASS" : "FAIL";
}

function ctx(source: AdaptiveIntelligenceLedgerResult) {
  const first = source.records[0];
  return {
    tenant_id: first.tenant_id,
    mission_scope: first.mission_scope,
    adaptive_component: "adaptive-intelligence-runtime",
    governance_refs: source.index.by_governance_ref,
    replay_refs: source.index.by_replay_ref,
    certification_refs: source.index.by_certification_ref,
  };
}

function visibleToRole(source: AdaptiveIntelligenceLedgerResult, role: VisibilityRole): boolean {
  return source.approval_framework.replay_traceability.authority_binding.adaptation_state.learning_permission.boundary_model.contract_foundation.final_certification.production_readiness.security_certification.observability_certification.ledger_certification.operator_workflow_certification.intelligence_certification.governance_certification.replay_certification.deterministic_certification.foundation_certification.certification_framework.analytics_result.operator_dashboard.replay_monitoring.governance_visibility.priority_dashboard.conflict_visualization.timeline_result.dashboard_result.observability_result.authorizations.some((auth) => auth.role === role && auth.permissions.includes("VIEW_DECISIONS"));
}

function sourceForScenario(input: AdaptiveSecuritySafetyBoundariesInput, scenario: Scenario): AdaptiveIntelligenceLedgerResult {
  if (input.adaptive_ledger) return input.adaptive_ledger;
  if (scenario === "MISSING_REPLAY_REFS") return runAdaptiveIntelligenceLedger({ scenario: "MISSING_REPLAY_REFS" });
  if (scenario === "TENANT_VIOLATION" || scenario === "CROSS_TENANT_CONTAMINATION") return runAdaptiveIntelligenceLedger({ scenario: "TENANT_VIOLATION" });
  if (scenario === "LEDGER_MODIFICATION") return runAdaptiveIntelligenceLedger({ scenario: "RECORD_MODIFICATION" });
  if (scenario === "HASH_MISMATCH") return runAdaptiveIntelligenceLedger({ scenario: "HASH_MISMATCH" });
  return runAdaptiveIntelligenceLedger();
}

function containmentForScenario(scenario: Scenario): AdaptiveContainmentAction {
  if (scenario === "BASELINE") return "ALLOW_ADVISORY";
  if (scenario === "TENANT_VIOLATION" || scenario === "CROSS_TENANT_CONTAMINATION") return "ENFORCE_TENANT_ISOLATION";
  if (scenario === "LEDGER_MODIFICATION" || scenario === "HASH_MISMATCH" || scenario === "SECURITY_LEDGER_MUTATION" || scenario === "SECURITY_REPLAY_MISMATCH") return "OPEN_FORENSIC_INVESTIGATION";
  if (scenario === "CERTIFICATION_BYPASS") return "INVALIDATE_CERTIFICATION";
  if (scenario === "SELF_MODIFICATION" || scenario === "AUTONOMOUS_SELF_IMPROVEMENT") return "SUSPEND_ADAPTIVE_COMPONENT";
  if (scenario === "GOVERNANCE_BYPASS" || scenario === "AUTHORITY_ESCALATION") return "ESCALATE_GOVERNANCE";
  return "REJECT_PROPOSAL";
}

function severityForScenario(scenario: Scenario): AdaptiveSecuritySeverity {
  if (scenario === "BASELINE") return "INFO";
  if (["SELF_MODIFICATION", "AUTONOMOUS_SELF_IMPROVEMENT", "LEDGER_MODIFICATION", "HASH_MISMATCH", "SECURITY_LEDGER_MUTATION", "CROSS_TENANT_CONTAMINATION"].includes(scenario)) return "CRITICAL";
  if (["HIDDEN_LEARNING", "HIDDEN_MEMORY", "UNAUTHORIZED_ADAPTATION", "AUTHORITY_ESCALATION", "GOVERNANCE_BYPASS"].includes(scenario)) return "HIGH";
  return "MEDIUM";
}

function buildPolicy(id: string, domain: string, scenario: Scenario): AdaptiveSafetyPolicy {
  const base: Omit<AdaptiveSafetyPolicy, "integrity_hash"> = {
    policy_id: id,
    protected_domain: domain,
    allowed_behavior: freezeArray(["advisory-analysis", "deterministic-replay", "governed-memory", "operator-approved-recommendation"]),
    prohibited_behavior: freezeArray(["hidden-learning", "hidden-memory", "authority-escalation", "governance-bypass", "replay-suppression", "self-modification"]),
    containment_actions: freezeArray(["REJECT_PROPOSAL", "SUSPEND_ADAPTIVE_COMPONENT", "ESCALATE_GOVERNANCE", "NOTIFY_OPERATOR", "OPEN_FORENSIC_INVESTIGATION"]),
    replay_requirements: scenario === "MISSING_REPLAY_REFS" ? freezeArray([]) : freezeArray(["security-replay", "ledger-replay", "operator-approval-replay"]),
    certification_refs: scenario === "CERTIFICATION_BYPASS" ? freezeArray([]) : freezeArray(["cert:adaptive-security-boundary", "cert:adaptive-ledger"]),
    immutable_after_certification: scenario !== "MISSING_POLICY",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildRegistry(scenario: Scenario): AdaptiveSafetyPolicyRegistry {
  const policies = scenario === "MISSING_POLICY" ? freezeArray([]) : freezeArray([
    buildPolicy("policy:hidden-learning", "adaptive-learning", scenario),
    buildPolicy("policy:hidden-memory", "adaptive-memory", scenario),
    buildPolicy("policy:boundary-enforcement", "adaptive-runtime", scenario),
  ]);
  const base: Omit<AdaptiveSafetyPolicyRegistry, "integrity_hash"> = {
    registry_id: "adaptive_safety_policy_registry",
    policies,
    active_rules: scenario === "MISSING_POLICY" ? freezeArray([]) : ADAPTIVE_SAFETY_RULES,
    certified: scenario !== "MISSING_POLICY" && scenario !== "CERTIFICATION_BYPASS",
    immutable: scenario !== "MISSING_POLICY",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildHiddenLearning(scenario: Scenario): HiddenLearningDetection {
  const base: Omit<HiddenLearningDetection, "integrity_hash"> = {
    detector_id: "hidden_learning_detector",
    undocumented_learning: scenario === "HIDDEN_LEARNING",
    hidden_optimization: scenario === "HIDDEN_OPTIMIZATION" || scenario === "UNAUTHORIZED_OPTIMIZATION",
    unauthorized_calibration: scenario === "UNAUTHORIZED_CALIBRATION",
    silent_recommendation_changes: scenario === "SILENT_RECOMMENDATION_CHANGE",
    unexplained_behavior_drift: scenario === "BEHAVIOR_DRIFT",
    undocumented_parameter_evolution: scenario === "PARAMETER_EVOLUTION",
    hidden_memory_creation: scenario === "HIDDEN_MEMORY",
    containment_triggered: scenario !== "BASELINE",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildHiddenMemory(scenario: Scenario): HiddenMemoryDetection {
  const base: Omit<HiddenMemoryDetection, "integrity_hash"> = {
    detector_id: "hidden_memory_detector",
    memory_registered: scenario !== "MEMORY_NOT_REGISTERED" && scenario !== "HIDDEN_MEMORY",
    memory_governed: scenario !== "MEMORY_NOT_GOVERNED" && scenario !== "HIDDEN_MEMORY",
    memory_replayable: scenario !== "MEMORY_NOT_REPLAYABLE" && scenario !== "HIDDEN_MEMORY",
    memory_tenant_isolated: scenario !== "MEMORY_NOT_TENANT_ISOLATED" && scenario !== "HIDDEN_MEMORY" && scenario !== "CROSS_TENANT_CONTAMINATION",
    lifecycle_metadata_present: scenario !== "HIDDEN_MEMORY",
    lineage_references_present: scenario !== "HIDDEN_MEMORY",
    undocumented_memory_detected: scenario === "HIDDEN_MEMORY",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildUnauthorizedAdaptation(scenario: Scenario): UnauthorizedAdaptationDetection {
  const base: Omit<UnauthorizedAdaptationDetection, "integrity_hash"> = {
    detector_id: "unauthorized_adaptation_detector",
    behavior_mutation: scenario === "UNAUTHORIZED_ADAPTATION" || scenario === "SELF_MODIFICATION",
    unauthorized_heuristics: scenario === "UNAUTHORIZED_ADAPTATION",
    hidden_prioritization_changes: scenario === "UNAUTHORIZED_ADAPTATION",
    confidence_manipulation: scenario === "UNAUTHORIZED_ADAPTATION",
    risk_manipulation: scenario === "UNAUTHORIZED_ADAPTATION",
    recommendation_mutation: scenario === "SILENT_RECOMMENDATION_CHANGE" || scenario === "UNAUTHORIZED_ADAPTATION",
    simulation_alteration: scenario === "UNAUTHORIZED_ADAPTATION",
    policy_circumvention: scenario === "POLICY_CIRCUMVENTION",
    rejected_before_execution: scenario !== "BASELINE",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(input: {
  source: AdaptiveIntelligenceLedgerResult;
  registry: AdaptiveSafetyPolicyRegistry;
  hiddenLearning: HiddenLearningDetection;
  hiddenMemory: HiddenMemoryDetection;
  unauthorizedAdaptation: UnauthorizedAdaptationDetection;
  securityLedger: readonly AdaptiveSecurityLedgerRecord[];
  replay: AdaptiveSafetyReplay | undefined;
  role: VisibilityRole;
  scenario: Scenario;
}): readonly AdaptiveSecurityFailure[] {
  const failures: AdaptiveSecurityFailure[] = [];
  if (input.hiddenLearning.undocumented_learning) failures.push("HIDDEN_LEARNING_DETECTED");
  if (input.hiddenMemory.undocumented_memory_detected || input.hiddenLearning.hidden_memory_creation) failures.push("HIDDEN_MEMORY_DETECTED");
  if (Object.entries(input.unauthorizedAdaptation).some(([key, value]) => key !== "detector_id" && key !== "rejected_before_execution" && key !== "integrity_hash" && value === true)) failures.push("UNAUTHORIZED_ADAPTATION_DETECTED");
  if (input.scenario === "AUTHORITY_ESCALATION") failures.push("AUTHORITY_ESCALATION_DETECTED");
  if (input.scenario === "GOVERNANCE_BYPASS") failures.push("GOVERNANCE_BYPASS_DETECTED");
  if (!input.source.index.by_replay_ref.length || input.registry.policies.some((policy) => !policy.replay_requirements.length) || input.scenario === "MISSING_REPLAY_REFS") failures.push("REPLAY_REFERENCES_MISSING");
  if (!input.source.validation.tenant_isolated || input.scenario === "TENANT_VIOLATION") failures.push("TENANT_ISOLATION_VIOLATED");
  if (!input.source.validation.append_only || input.scenario === "LEDGER_MODIFICATION") failures.push("IMMUTABLE_LEDGER_MODIFICATION_ATTEMPTED");
  if (input.scenario === "SELF_MODIFICATION") failures.push("SELF_MODIFICATION_DETECTED");
  if (!input.source.validation.hash_integrity || input.scenario === "HASH_MISMATCH") failures.push("INTEGRITY_VERIFICATION_FAILED");
  if (input.scenario === "UNAUTHORIZED_ADAPTATION") failures.push("UNAUTHORIZED_BEHAVIORAL_CHANGE");
  if (input.hiddenLearning.hidden_optimization) failures.push("HIDDEN_OPTIMIZATION");
  if (input.hiddenLearning.unauthorized_calibration) failures.push("UNAUTHORIZED_CALIBRATION");
  if (input.hiddenLearning.silent_recommendation_changes) failures.push("SILENT_RECOMMENDATION_CHANGE");
  if (input.hiddenLearning.unexplained_behavior_drift) failures.push("UNEXPLAINED_BEHAVIOR_DRIFT");
  if (input.hiddenLearning.undocumented_parameter_evolution) failures.push("UNDOCUMENTED_PARAMETER_EVOLUTION");
  if (!input.hiddenMemory.memory_registered) failures.push("MEMORY_NOT_REGISTERED");
  if (!input.hiddenMemory.memory_governed) failures.push("MEMORY_NOT_GOVERNED");
  if (!input.hiddenMemory.memory_replayable) failures.push("MEMORY_NOT_REPLAYABLE");
  if (!input.hiddenMemory.memory_tenant_isolated) failures.push("MEMORY_NOT_TENANT_ISOLATED");
  if (input.unauthorizedAdaptation.policy_circumvention || input.scenario === "POLICY_CIRCUMVENTION") failures.push("POLICY_CIRCUMVENTION");
  if (!input.registry.certified || input.scenario === "CERTIFICATION_BYPASS") failures.push("CERTIFICATION_BYPASS");
  if (input.scenario === "CROSS_TENANT_CONTAMINATION") failures.push("CROSS_TENANT_CONTAMINATION");
  if (input.scenario === "AUTONOMOUS_SELF_IMPROVEMENT") failures.push("AUTONOMOUS_SELF_IMPROVEMENT");
  if (input.scenario === "UNAUTHORIZED_OPTIMIZATION") failures.push("UNAUTHORIZED_OPTIMIZATION");
  if (!input.registry.policies.length || !input.registry.active_rules.length) failures.push("SAFETY_POLICY_MISSING");
  if (input.securityLedger.some((entry) => !entry.append_only || entry.deleted) || input.scenario === "SECURITY_LEDGER_MUTATION") failures.push("SECURITY_LEDGER_NOT_APPEND_ONLY");
  if ((input.replay && input.replay.replay_result !== "PASS") || input.scenario === "SECURITY_REPLAY_MISMATCH") failures.push("SECURITY_REPLAY_MISMATCH");
  if (!visibleToRole(input.source, input.role)) failures.push("AUTHORIZATION_FAILURE");
  if (input.scenario === "FAIL_OPEN") failures.push("FAIL_OPEN_SECURITY_BEHAVIOR");
  return freezeArray([...new Set(failures)]);
}

function buildEnforcement(source: AdaptiveIntelligenceLedgerResult, registry: AdaptiveSafetyPolicyRegistry, failures: readonly AdaptiveSecurityFailure[]): AdaptiveBoundaryEnforcement {
  const base: Omit<AdaptiveBoundaryEnforcement, "integrity_hash"> = {
    enforcement_id: "adaptive_boundary_enforcement",
    adaptive_capability_authorized: registry.certified && !failures.includes("SAFETY_POLICY_MISSING"),
    learning_registered: !failures.includes("HIDDEN_LEARNING_DETECTED"),
    memory_registered: !failures.includes("MEMORY_NOT_REGISTERED") && !failures.includes("HIDDEN_MEMORY_DETECTED"),
    replay_references_complete: source.index.by_replay_ref.length > 0 && !failures.includes("REPLAY_REFERENCES_MISSING"),
    governance_approval_exists: source.index.by_governance_ref.length > 0 && !failures.includes("GOVERNANCE_BYPASS_DETECTED"),
    authority_unchanged: !failures.includes("AUTHORITY_ESCALATION_DETECTED"),
    tenant_isolation_preserved: source.validation.tenant_isolated && !failures.includes("TENANT_ISOLATION_VIOLATED") && !failures.includes("CROSS_TENANT_CONTAMINATION"),
    integrity_hashes_valid: source.validation.hash_integrity && !failures.includes("INTEGRITY_VERIFICATION_FAILED"),
    boundary_decision: failures.length ? "REJECT" : "ALLOW",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildSecurityRecord(source: AdaptiveIntelligenceLedgerResult, registry: AdaptiveSafetyPolicyRegistry, failures: readonly AdaptiveSecurityFailure[], scenario: Scenario): AdaptiveSecurityRecord {
  const c = ctx(source);
  const base: Omit<AdaptiveSecurityRecord, "integrity_hash"> = {
    security_event_id: "adaptive_security_event_001",
    tenant_id: c.tenant_id,
    mission_scope: c.mission_scope,
    adaptive_component: c.adaptive_component,
    security_event_type: failures.length ? "BOUNDARY_REJECT" : "BOUNDARY_ALLOW",
    detection_source: failures.length ? "adaptive-boundary-enforcement-engine" : "adaptive-safety-policy-registry",
    policy_reference: registry.policies[0]?.policy_id ?? "",
    violation_detected: failures.length > 0,
    severity: severityForScenario(scenario),
    containment_action: containmentForScenario(scenario),
    governance_refs: c.governance_refs,
    replay_refs: scenario === "MISSING_REPLAY_REFS" ? freezeArray([]) : c.replay_refs,
    certification_refs: scenario === "CERTIFICATION_BYPASS" ? freezeArray([]) : c.certification_refs,
    timestamp: "2026-07-05T10:01:30.000Z",
  };
  const built = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "HASH_MISMATCH") return Object.freeze({ ...built, integrity_hash: hash({ tampered: built.security_event_id }) });
  return built;
}

function buildSecurityLedger(record: AdaptiveSecurityRecord, scenario: Scenario): readonly AdaptiveSecurityLedgerRecord[] {
  const event: Omit<AdaptiveSecurityLedgerRecord, "integrity_hash"> = {
    record_id: "adaptive_security_ledger_001",
    security_event_id: record.security_event_id,
    tenant_id: record.tenant_id,
    mission_scope: record.mission_scope,
    adaptive_component: record.adaptive_component,
    event_type: record.security_event_type,
    violation_summary: record.violation_detected ? "Adaptive security boundary rejected unsafe adaptive activity." : "Adaptive security boundary allowed advisory-only adaptive activity.",
    severity: record.severity,
    containment_action: record.containment_action,
    governance_refs: record.governance_refs,
    replay_refs: record.replay_refs,
    certification_refs: record.certification_refs,
    timestamp: record.timestamp,
    sequence_number: 1,
    append_only: (scenario === "SECURITY_LEDGER_MUTATION" ? false : true) as true,
    deleted: (scenario === "SECURITY_LEDGER_MUTATION" ? true : false) as false,
  };
  return freezeArray([Object.freeze({ ...event, integrity_hash: hashWithoutIntegrity(event) })]);
}

function buildReplay(record: AdaptiveSecurityRecord, failures: readonly AdaptiveSecurityFailure[], scenario: Scenario): AdaptiveSafetyReplay {
  const base: Omit<AdaptiveSafetyReplay, "integrity_hash"> = {
    replay_id: "adaptive_safety_replay",
    detected_threats: failures,
    violated_policies: failures.length ? freezeArray([record.policy_reference || "policy:missing"]) : freezeArray([]),
    validation_results: freezeArray([state(failures.length === 0)]),
    containment_actions: freezeArray([record.containment_action]),
    governance_refs: record.governance_refs,
    replay_refs: record.replay_refs,
    identical_security_outcome: scenario !== "SECURITY_REPLAY_MISMATCH",
    identical_containment: scenario !== "SECURITY_REPLAY_MISMATCH",
    identical_integrity_hashes: scenario !== "HASH_MISMATCH",
    replay_result: "PASS",
  };
  const normalized = { ...base, replay_result: state(base.replay_refs.length > 0 && base.identical_security_outcome && base.identical_containment && base.identical_integrity_hashes) };
  return Object.freeze({ ...normalized, integrity_hash: hashWithoutIntegrity(normalized) });
}

function buildDashboard(registry: AdaptiveSafetyPolicyRegistry, failures: readonly AdaptiveSecurityFailure[], replay: AdaptiveSafetyReplay, reportStatus: AdaptiveSafetyValidationState): AdaptiveSecurityDashboard {
  const base: Omit<AdaptiveSecurityDashboard, "integrity_hash"> = {
    dashboard_id: "adaptive_security_dashboard",
    active_safety_policies: registry.policies.length,
    detected_threats: failures,
    hidden_learning_events: failures.includes("HIDDEN_LEARNING_DETECTED") ? 1 : 0,
    hidden_memory_events: failures.includes("HIDDEN_MEMORY_DETECTED") ? 1 : 0,
    behavioral_drift_indicators: failures.includes("UNEXPLAINED_BEHAVIOR_DRIFT") || failures.includes("SILENT_RECOMMENDATION_CHANGE") ? 1 : 0,
    authority_violations: failures.includes("AUTHORITY_ESCALATION_DETECTED") ? 1 : 0,
    governance_bypass_attempts: failures.includes("GOVERNANCE_BYPASS_DETECTED") ? 1 : 0,
    replay_compliance: replay.replay_result,
    containment_actions: replay.containment_actions,
    certification_status: reportStatus,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildReport(source: AdaptiveIntelligenceLedgerResult, registry: AdaptiveSafetyPolicyRegistry, securityLedger: readonly AdaptiveSecurityLedgerRecord[], replay: AdaptiveSafetyReplay, failures: readonly AdaptiveSecurityFailure[]): AdaptiveSafetyCertificationReport {
  const has = (failure: AdaptiveSecurityFailure) => failures.includes(failure);
  const base: Omit<AdaptiveSafetyCertificationReport, "integrity_hash"> = {
    report_id: "adaptive_security_safety_certification_report",
    tenant_id: source.records[0].tenant_id,
    checks: ADAPTIVE_SECURITY_CHECKS,
    safety_rules_enforced: registry.active_rules.length === ADAPTIVE_SAFETY_RULES.length && !has("SAFETY_POLICY_MISSING"),
    hidden_learning_blocked: !has("HIDDEN_LEARNING_DETECTED") && !has("HIDDEN_OPTIMIZATION") && !has("UNAUTHORIZED_CALIBRATION"),
    hidden_memory_blocked: !has("HIDDEN_MEMORY_DETECTED") && !has("MEMORY_NOT_REGISTERED"),
    unauthorized_adaptation_blocked: !has("UNAUTHORIZED_ADAPTATION_DETECTED") && !has("UNAUTHORIZED_BEHAVIORAL_CHANGE"),
    authority_escalation_prevented: !has("AUTHORITY_ESCALATION_DETECTED"),
    governance_supremacy_preserved: !has("GOVERNANCE_BYPASS_DETECTED"),
    replay_enforced: !has("REPLAY_REFERENCES_MISSING") && replay.replay_result === "PASS",
    ledger_integrity_protected: !has("IMMUTABLE_LEDGER_MODIFICATION_ATTEMPTED") && !has("SECURITY_LEDGER_NOT_APPEND_ONLY"),
    tenant_isolation_preserved: !has("TENANT_ISOLATION_VIOLATED") && !has("CROSS_TENANT_CONTAMINATION"),
    self_modification_prevented: !has("SELF_MODIFICATION_DETECTED") && !has("AUTONOMOUS_SELF_IMPROVEMENT"),
    immutable_audit_trail: securityLedger.every((entry) => entry.append_only && !entry.deleted),
    failure_analysis: failures,
    certification_decision: state(failures.length === 0),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildValidation(failures: readonly AdaptiveSecurityFailure[]): AdaptiveSafetyValidation {
  const has = (failure: AdaptiveSecurityFailure) => failures.includes(failure);
  const base: Omit<AdaptiveSafetyValidation, "integrity_hash"> = {
    validation_id: "adaptive_security_safety_validation",
    validation_status: failures.length ? "BLOCKED" : "VALID",
    safety_policy_present: !has("SAFETY_POLICY_MISSING"),
    hidden_learning_absent: !has("HIDDEN_LEARNING_DETECTED") && !has("HIDDEN_OPTIMIZATION") && !has("UNAUTHORIZED_CALIBRATION"),
    hidden_memory_absent: !has("HIDDEN_MEMORY_DETECTED"),
    unauthorized_adaptation_absent: !has("UNAUTHORIZED_ADAPTATION_DETECTED") && !has("UNAUTHORIZED_BEHAVIORAL_CHANGE"),
    authority_escalation_absent: !has("AUTHORITY_ESCALATION_DETECTED"),
    governance_bypass_absent: !has("GOVERNANCE_BYPASS_DETECTED"),
    replay_references_present: !has("REPLAY_REFERENCES_MISSING"),
    tenant_isolated: !has("TENANT_ISOLATION_VIOLATED") && !has("CROSS_TENANT_CONTAMINATION"),
    ledger_integrity_preserved: !has("IMMUTABLE_LEDGER_MODIFICATION_ATTEMPTED") && !has("SECURITY_LEDGER_NOT_APPEND_ONLY"),
    self_modification_absent: !has("SELF_MODIFICATION_DETECTED") && !has("AUTONOMOUS_SELF_IMPROVEMENT"),
    integrity_verified: !has("INTEGRITY_VERIFICATION_FAILED"),
    security_ledger_immutable: !has("SECURITY_LEDGER_NOT_APPEND_ONLY"),
    deterministic_replay: !has("SECURITY_REPLAY_MISMATCH"),
    authorization_valid: !has("AUTHORIZATION_FAILURE"),
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<AdaptiveSecuritySafetyBoundariesResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    registry: result.policy_registry,
    record: result.security_record,
    hiddenLearning: result.hidden_learning_detection,
    hiddenMemory: result.hidden_memory_detection,
    unauthorizedAdaptation: result.unauthorized_adaptation_detection,
    enforcement: result.boundary_enforcement,
    ledger: result.security_ledger,
    replay: result.safety_replay,
    report: result.certification_report,
    validation: result.validation,
  });
}

export function runAdaptiveSecuritySafetyBoundaries(input: AdaptiveSecuritySafetyBoundariesInput = {}): AdaptiveSecuritySafetyBoundariesResult {
  const scenario = input.scenario ?? "BASELINE";
  const role = input.role ?? "OPERATOR";
  const adaptive_ledger = sourceForScenario(input, scenario);
  const policy_registry = buildRegistry(scenario);
  const hidden_learning_detection = buildHiddenLearning(scenario);
  const hidden_memory_detection = buildHiddenMemory(scenario);
  const unauthorized_adaptation_detection = buildUnauthorizedAdaptation(scenario);
  const preliminaryFailures = collectFailures({ source: adaptive_ledger, registry: policy_registry, hiddenLearning: hidden_learning_detection, hiddenMemory: hidden_memory_detection, unauthorizedAdaptation: unauthorized_adaptation_detection, securityLedger: [], replay: undefined, role, scenario });
  const boundary_enforcement = buildEnforcement(adaptive_ledger, policy_registry, preliminaryFailures);
  const security_record = buildSecurityRecord(adaptive_ledger, policy_registry, preliminaryFailures, scenario);
  const security_ledger = buildSecurityLedger(security_record, scenario);
  const safety_replay = buildReplay(security_record, preliminaryFailures, scenario);
  const failures = collectFailures({ source: adaptive_ledger, registry: policy_registry, hiddenLearning: hidden_learning_detection, hiddenMemory: hidden_memory_detection, unauthorizedAdaptation: unauthorized_adaptation_detection, securityLedger: security_ledger, replay: safety_replay, role, scenario });
  const certification_report = buildReport(adaptive_ledger, policy_registry, security_ledger, safety_replay, failures);
  const validation = buildValidation(failures);
  const dashboard = buildDashboard(policy_registry, failures, safety_replay, certification_report.certification_decision);
  const base: Omit<AdaptiveSecuritySafetyBoundariesResult, "integrity_hash" | "replay_hash"> = {
    security_boundary_version: SECURITY_BOUNDARY_VERSION,
    adaptive_ledger,
    policy_registry,
    security_record,
    hidden_learning_detection,
    hidden_memory_detection,
    unauthorized_adaptation_detection,
    boundary_enforcement,
    security_ledger,
    safety_replay,
    dashboard,
    certification_report,
    validation,
    deterministic: true,
    replayable: true,
    advisory_only: true,
    fail_closed: true,
    permits_adaptation: validation.validation_status === "VALID" && boundary_enforcement.boundary_decision === "ALLOW",
    permits_execution: false,
    permits_self_modification: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayAdaptiveSecuritySafetyBoundaries(result: AdaptiveSecuritySafetyBoundariesResult): boolean {
  return resultReplayHash(result) === result.replay_hash && hashWithoutIntegrity(result) === result.integrity_hash;
}

export function computeAdaptiveSecurityRecordHash(record: Omit<AdaptiveSecurityRecord, "integrity_hash"> | AdaptiveSecurityRecord): string {
  return hashWithoutIntegrity(record);
}

export function getAdaptiveSecuritySafetyBoundariesFoundation(): AdaptiveSecuritySafetyBoundariesFoundation {
  return Object.freeze({
    security_boundary_version: SECURITY_BOUNDARY_VERSION,
    checks: ADAPTIVE_SECURITY_CHECKS,
    safety_rules: ADAPTIVE_SAFETY_RULES,
    result: runAdaptiveSecuritySafetyBoundaries(),
  });
}

export const AdaptiveSecuritySafetyBoundaries = Object.freeze({
  run: runAdaptiveSecuritySafetyBoundaries,
  replay: replayAdaptiveSecuritySafetyBoundaries,
});
