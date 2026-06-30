import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import {
  buildComplianceRecord,
  buildComplianceRuleRegistry,
  buildComplianceThresholdRegistry,
  calculateComplianceStatus,
  computeComplianceHash,
} from "@/services/compliance-contract";
import type { ComplianceEvaluationStatus, ComplianceEvidence, ComplianceRule, ComplianceThreshold, ComplianceType } from "@/types/compliance-contract";
import type {
  AuthorityComplianceResult,
  ComplianceDecisionResult,
  ComplianceEvaluationDoctrine,
  ComplianceEvaluationFailureReason,
  ComplianceEvaluationLedgerRecord,
  ComplianceEvaluationObservabilitySurface,
  ComplianceEvaluationRecord,
  ComplianceEvaluationReplayResult,
  ComplianceEvaluationReplaySnapshot,
  ComplianceEvaluationRequest,
  ComplianceEvaluationScenario,
  ComplianceEvaluationValidationFailure,
  ComplianceEvaluationValidationResult,
  ComplianceEvaluationValidationState,
  ComplianceMeasurement,
  ComplianceScoreResult,
  ConstitutionalComplianceResult,
  EvidenceBundle,
  EvidenceValidationResult,
  EvidenceValidationState,
  OperationalComplianceResult,
  PolicyComplianceResult,
  RequirementMatchResult,
  RequirementMatchState,
  RuleEvaluationResult,
  RuleEvaluationState,
  ThresholdProcessingResult,
  ViolationResult,
  ViolationSeverity,
  ViolationType,
} from "@/types/compliance-evaluation";

const NOW = "2026-06-25T09:00:00.000Z";
const CONTRACT_VERSION = "COMPLIANCE-EVALUATION-V1";

const CRITICAL_SCENARIOS: readonly ComplianceEvaluationScenario[] = Object.freeze(["CONSTITUTIONAL_VIOLATION", "GOVERNANCE_BYPASS", "OPERATOR_BYPASS", "BOUNDARY_BREACH", "EXECUTION_RESTRICTION_VIOLATED", "TAMPERED_EVIDENCE", "LEDGER_WRITE_FAILURE", "REPLAY_MISMATCH", "CROSS_TENANT_EVIDENCE", "HIDDEN_STATE"]);

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function failure(reason: ComplianceEvaluationFailureReason, field_path: string, message: string): ComplianceEvaluationValidationFailure {
  return Object.freeze({ failure_id: hashValue("compliance-evaluation-validation-failure", { reason, field_path, message }), reason, field_path, message, fail_closed: true });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function tenantLeak(ref: unknown, tenant_id: string | undefined): boolean {
  if (!tenant_id || typeof ref !== "string") return false;
  const match = ref.match(/tenant_[a-z0-9]+/i);
  return Boolean(match && match[0] !== tenant_id);
}

function containsTenantLeak(value: unknown, tenant_id: string | undefined): boolean {
  if (tenantLeak(value, tenant_id)) return true;
  if (Array.isArray(value)) return value.some((item) => containsTenantLeak(item, tenant_id));
  if (isRecord(value)) return Object.values(value).some((item) => containsTenantLeak(item, tenant_id));
  return false;
}

function severityWeight(severity: ViolationSeverity): number {
  if (severity === "CRITICAL") return 100;
  if (severity === "HIGH") return 45;
  if (severity === "MODERATE") return 25;
  if (severity === "LOW") return 10;
  return 0;
}

function escalationFor(status: ComplianceEvaluationStatus, violation: ViolationResult): Pick<ComplianceEvaluationRecord, "escalation_required" | "escalation_type" | "escalation_reason" | "governance_review_required" | "operator_review_required" | "corrective_action_reference"> {
  const escalation_required = status === "CRITICAL" || status === "FAIL" || violation.violation_severity === "CRITICAL";
  return {
    escalation_required,
    escalation_type: escalation_required ? violation.violation_type : null,
    escalation_reason: escalation_required ? violation.violation_explanation : null,
    governance_review_required: escalation_required,
    operator_review_required: status === "CRITICAL" || violation.violation_type === "AUTHORITY_VIOLATION" || violation.violation_type === "EXECUTION_RESTRICTION_VIOLATION",
    corrective_action_reference: escalation_required ? `CA-${violation.violation_hash.slice(0, 10).toUpperCase()}` : null,
  };
}

export function buildComplianceEvaluationDoctrine(): ComplianceEvaluationDoctrine {
  return Object.freeze({
    principles: Object.freeze(["deterministic", "evidence-backed", "explainable", "replayable", "tenant-safe", "fail-closed", "operator-visible"] as const),
    pipeline_stages: Object.freeze(["rules", "evidence_collection", "requirement_matching", "violation_detection", "compliance_measurement", "score_generation", "evidence_validation", "compliance_decision", "ledger_recording"] as const),
    supported_compliance_types: Object.freeze(["POLICY_COMPLIANCE", "CONSTITUTIONAL_COMPLIANCE", "AUTHORITY_COMPLIANCE", "OPERATIONAL_COMPLIANCE"] as ComplianceType[]),
    critical_overrides: Object.freeze(["tenant isolation failure", "constitutional violation", "governance bypass", "operator authority bypass", "unauthorized execution authority", "truth ledger tampering", "hidden state detected", "replay falsification", "evidence mutation", "privilege escalation"]),
    contract_version: CONTRACT_VERSION,
  });
}

export function buildComplianceEvaluationRequest(overrides: Partial<ComplianceEvaluationRequest> = {}): ComplianceEvaluationRequest {
  const tenant_id = overrides.tenant_id ?? "tenant_alpha";
  const mission_id = overrides.mission_id ?? "mission_compliance_intelligence";
  const compliance_type = overrides.compliance_type ?? "POLICY_COMPLIANCE";
  return Object.freeze({
    tenant_id,
    mission_id,
    compliance_type,
    evaluation_scope: overrides.evaluation_scope ?? Object.freeze({ scope_type: "MISSION_SCOPE", tenant_id, mission_id, phase_id: "7D", component_id: "7D.2" }),
    rule_reference: overrides.rule_reference ?? "RULE-REC-EVIDENCE-V1",
    threshold_reference: overrides.threshold_reference ?? "THRESHOLD-COMPLIANCE-PASS-V1",
    policy_reference: overrides.policy_reference ?? `policy_${tenant_id}_recommendation_governance_v1`,
    constitution_reference: overrides.constitution_reference ?? "constitution_operator_supremacy_v1",
    authority_reference: overrides.authority_reference ?? `authority_${tenant_id}_advisory_boundary_v1`,
    scenario: overrides.scenario ?? "COMPLIANT",
    evaluation_context: Object.freeze({ source: "mission-control", ...(overrides.evaluation_context ?? {}) }),
  });
}

export function resolveComplianceRule(request: ComplianceEvaluationRequest): { rule: ComplianceRule | null; rule_resolution_hash: string } {
  const rule = buildComplianceRuleRegistry().find((item) => item.rule_id === request.rule_reference) ?? null;
  return Object.freeze({ rule, rule_resolution_hash: hashValue("compliance-rule-resolution", { rule_id: request.rule_reference, rule_version: rule?.rule_version ?? null, scope: request.evaluation_scope, tenant_id: request.tenant_id }) });
}

function evidenceStateFor(scenario: ComplianceEvaluationScenario): ComplianceEvidence["evidence_completeness_state"] {
  if (scenario === "MISSING_EVIDENCE") return "MISSING";
  if (scenario === "INVALID_EVIDENCE" || scenario === "TAMPERED_EVIDENCE") return "INVALID";
  if (scenario === "POLICY_SUPERSEDED" || scenario === "POLICY_EXCEPTION") return "PARTIAL";
  return "COMPLETE";
}

export function collectComplianceEvidence(request: ComplianceEvaluationRequest, rule: ComplianceRule | null): EvidenceBundle {
  if (!rule || request.scenario === "MISSING_EVIDENCE") {
    const missing = rule?.required_evidence ?? ["rule_reference"];
    return Object.freeze({ evidence_bundle_reference: `evidence_bundle_${request.tenant_id}_missing`, evidence_snapshot: Object.freeze([]), evidence_integrity_hash: hashValue("compliance-evidence-bundle", { missing }), missing_evidence_report: Object.freeze(missing), conflicting_evidence_report: Object.freeze([]) });
  }
  const evidenceTenant = request.scenario === "CROSS_TENANT_EVIDENCE" ? "tenant_beta" : request.tenant_id;
  const evidence = Object.freeze(rule.required_evidence.map((type, index): ComplianceEvidence => Object.freeze({
    evidence_id: `evidence_${evidenceTenant}_${type}_${index + 1}`,
    evidence_type: type,
    evidence_source: type.includes("authority") ? "authority-records" : type.includes("replay") ? "replay-ledger" : "truth-ledger",
    evidence_timestamp: NOW,
    evidence_integrity_hash: request.scenario === "TAMPERED_EVIDENCE" ? "tampered" : hashValue("compliance-evidence", { tenant_id: evidenceTenant, type, index }),
    evidence_lineage_reference: `lineage_${evidenceTenant}_${type}_${index + 1}`,
    evidence_replay_reference: `replay_${evidenceTenant}_${type}_${index + 1}`,
    evidence_relevance_score: request.scenario === "POLICY_EXCEPTION" ? 85 : 100,
    evidence_completeness_state: evidenceStateFor(request.scenario),
    tenant_id: evidenceTenant,
  })));
  const conflicting = request.scenario === "POLICY_VIOLATION" ? ["policy_conflict_detected"] : [];
  return Object.freeze({ evidence_bundle_reference: `evidence_bundle_${request.tenant_id}_${hashValue("evidence-bundle-id", evidence).slice(0, 8)}`, evidence_snapshot: evidence, evidence_integrity_hash: hashValue("compliance-evidence-bundle", evidence), missing_evidence_report: Object.freeze([]), conflicting_evidence_report: Object.freeze(conflicting) });
}

function ruleStateFor(scenario: ComplianceEvaluationScenario, rule: ComplianceRule | null): RuleEvaluationState {
  if (!rule) return "UNKNOWN";
  if (scenario === "POLICY_SUPERSEDED") return "SUPERSEDED";
  if (scenario === "POLICY_EXCEPTION") return "EXCEPTION_APPLIED";
  if (scenario === "MISSING_EVIDENCE") return "UNKNOWN";
  if (scenario === "INVALID_EVIDENCE" || scenario === "TAMPERED_EVIDENCE") return "INVALID";
  if (scenario === "COMPLIANT") return "SATISFIED";
  return "VIOLATED";
}

function statusForRuleState(state: RuleEvaluationState, severity: ViolationSeverity): ComplianceEvaluationStatus {
  if (severity === "CRITICAL") return "CRITICAL";
  if (state === "SATISFIED") return "PASS";
  if (state === "EXCEPTION_APPLIED" || state === "PARTIAL" || state === "SUPERSEDED") return "WARNING";
  if (state === "UNKNOWN") return "UNKNOWN";
  if (state === "INVALID") return "FAIL";
  return "FAIL";
}

export function evaluateComplianceRule(request: ComplianceEvaluationRequest, rule: ComplianceRule | null, evidence: EvidenceBundle): RuleEvaluationResult {
  const severity = violationSeverityFor(request.scenario);
  const rule_result = ruleStateFor(request.scenario, rule);
  const matched = evidence.evidence_snapshot.filter((item) => item.evidence_completeness_state === "COMPLETE" || item.evidence_completeness_state === "PARTIAL").map((item) => item.evidence_id);
  const missing = [...evidence.missing_evidence_report, ...evidence.evidence_snapshot.filter((item) => item.evidence_completeness_state === "MISSING").map((item) => item.evidence_type)];
  return Object.freeze({
    rule_id: request.rule_reference,
    rule_version: rule?.rule_version ?? "UNKNOWN",
    rule_result,
    rule_status: statusForRuleState(rule_result, severity),
    matched_evidence: Object.freeze(matched),
    missing_evidence: Object.freeze(missing),
    violation_detected: rule_result === "VIOLATED" || rule_result === "INVALID",
    violation_severity: severity,
    rule_evaluation_hash: hashValue("compliance-rule-evaluation", { request, rule_version: rule?.rule_version ?? "UNKNOWN", matched, missing, severity, rule_result }),
  });
}

export function matchComplianceRequirements(ruleResult: RuleEvaluationResult, request: ComplianceEvaluationRequest): RequirementMatchResult {
  const result: RequirementMatchState = ruleResult.rule_result === "SATISFIED" ? "MATCHED" : ruleResult.rule_result === "EXCEPTION_APPLIED" ? "EXCEPTION_APPLIED" : ruleResult.rule_result === "SUPERSEDED" ? "SUPERSEDED" : ruleResult.rule_result === "UNKNOWN" ? "UNKNOWN" : ruleResult.rule_result === "INVALID" ? "INVALID" : "NOT_MATCHED";
  const matched = result === "MATCHED" || result === "EXCEPTION_APPLIED" ? [request.rule_reference] : [];
  const unmatched = result === "NOT_MATCHED" || result === "INVALID" || result === "UNKNOWN" ? [request.rule_reference] : [];
  const exceptions = result === "EXCEPTION_APPLIED" ? [`exception_${request.tenant_id}_policy_approved_001`] : [];
  const superseded = result === "SUPERSEDED" ? [`supersession_${request.tenant_id}_policy_v2`] : [];
  return Object.freeze({ requirement_match_result: result, matched_requirement_ids: Object.freeze(matched), unmatched_requirement_ids: Object.freeze(unmatched), exception_references: Object.freeze(exceptions), supersession_references: Object.freeze(superseded), requirement_match_hash: hashValue("compliance-requirement-match", { result, matched, unmatched, exceptions, superseded }) });
}

export function violationSeverityFor(scenario: ComplianceEvaluationScenario): ViolationSeverity {
  if (CRITICAL_SCENARIOS.includes(scenario)) return "CRITICAL";
  if (scenario === "POLICY_VIOLATION" || scenario === "PRIVILEGE_ESCALATION" || scenario === "GOVERNANCE_CHECKPOINT_MISSING" || scenario === "EXECUTION_RESTRICTION_VIOLATED" || scenario === "INVALID_EVIDENCE") return "HIGH";
  if (scenario === "UNAUTHORIZED_BEHAVIOR" || scenario === "WORKFLOW_DEVIATION" || scenario === "MISSING_EVIDENCE") return "MODERATE";
  if (scenario === "POLICY_SUPERSEDED" || scenario === "POLICY_EXCEPTION") return "LOW";
  return "NONE";
}

function violationTypeFor(scenario: ComplianceEvaluationScenario): ViolationType {
  if (scenario === "POLICY_VIOLATION" || scenario === "POLICY_SUPERSEDED") return "POLICY_VIOLATION";
  if (scenario === "CONSTITUTIONAL_VIOLATION") return "CONSTITUTIONAL_VIOLATION";
  if (scenario === "GOVERNANCE_BYPASS" || scenario === "GOVERNANCE_CHECKPOINT_MISSING") return "GOVERNANCE_CHECKPOINT_VIOLATION";
  if (scenario === "OPERATOR_BYPASS" || scenario === "UNAUTHORIZED_BEHAVIOR" || scenario === "PRIVILEGE_ESCALATION" || scenario === "BOUNDARY_BREACH") return "AUTHORITY_VIOLATION";
  if (scenario === "WORKFLOW_DEVIATION") return "OPERATIONAL_VIOLATION";
  if (scenario === "EXECUTION_RESTRICTION_VIOLATED") return "EXECUTION_RESTRICTION_VIOLATION";
  if (scenario === "INVALID_EVIDENCE" || scenario === "TAMPERED_EVIDENCE" || scenario === "MISSING_EVIDENCE") return "EVIDENCE_VIOLATION";
  if (scenario === "CROSS_TENANT_EVIDENCE") return "TENANT_ISOLATION_VIOLATION";
  if (scenario === "REPLAY_MISMATCH") return "REPLAY_VIOLATION";
  return "NONE";
}

export function detectComplianceViolation(request: ComplianceEvaluationRequest, ruleResult: RuleEvaluationResult, evidence: EvidenceBundle): ViolationResult {
  const severity = violationSeverityFor(request.scenario);
  const violation_type = violationTypeFor(request.scenario);
  const violation_detected = severity !== "NONE" && request.scenario !== "POLICY_EXCEPTION";
  const refs = evidence.evidence_snapshot.map((item) => item.evidence_id);
  const explanation = violation_detected ? `${violation_type} detected with ${severity} severity for ${request.compliance_type}.` : "No compliance violation detected.";
  return Object.freeze({ violation_detected, violation_type, violation_severity: severity, violation_evidence: Object.freeze(refs), violation_explanation: explanation, violation_lineage: `lineage_${request.tenant_id}_violation_${violation_type.toLowerCase()}`, violation_hash: hashValue("compliance-violation", { request, severity, violation_type, refs }) });
}

export function measureCompliance(requirement: RequirementMatchResult, violation: ViolationResult): ComplianceMeasurement {
  const satisfied_count = requirement.matched_requirement_ids.length;
  const violated_count = violation.violation_detected ? Math.max(1, requirement.unmatched_requirement_ids.length) : 0;
  const unknown_count = requirement.requirement_match_result === "UNKNOWN" ? 1 : 0;
  const exception_count = requirement.exception_references.length;
  const weight = severityWeight(violation.violation_severity);
  return Object.freeze({ satisfied_count, violated_count, unknown_count, exception_count, severity_weight: weight, measurement_hash: hashValue("compliance-measurement", { satisfied_count, violated_count, unknown_count, exception_count, weight }) });
}

export function scoreCompliance(measurement: ComplianceMeasurement, evidenceValidation: EvidenceValidationResult, violation: ViolationResult): ComplianceScoreResult {
  const penalties: string[] = [];
  const overrides: string[] = [];
  let score = 100;
  if (measurement.violated_count) {
    score -= measurement.violated_count * 30;
    penalties.push("violated_requirement");
  }
  if (measurement.unknown_count) {
    score -= measurement.unknown_count * 20;
    penalties.push("unknown_requirement");
  }
  if (measurement.exception_count) {
    score -= 10;
    penalties.push("policy_exception");
  }
  if (evidenceValidation.missing_evidence_refs.length) {
    score -= 20;
    penalties.push("missing_evidence");
  }
  if (evidenceValidation.invalid_evidence_refs.length) {
    score -= 35;
    penalties.push("invalid_evidence");
  }
  if (evidenceValidation.conflicting_evidence_refs.length) {
    score -= 15;
    penalties.push("conflicting_evidence");
  }
  if (violation.violation_severity === "CRITICAL") {
    score = 0;
    overrides.push("critical_override");
  }
  if (violation.violation_severity === "HIGH") {
    score = Math.min(score, 69);
    overrides.push("high_severity_fail_floor");
  }
  score = Math.max(0, Math.min(100, Math.round(score)));
  const threshold_mapping = calculateComplianceStatus(score, overrides.includes("critical_override"));
  return Object.freeze({ compliance_score: score, score_breakdown: Object.freeze({ base: 100, severity_weight: measurement.severity_weight, final: score }), score_penalties: Object.freeze(penalties), score_overrides: Object.freeze(overrides), threshold_mapping, score_calculation_hash: hashValue("compliance-score", { measurement, evidenceValidation, violation, score, penalties, overrides, threshold_mapping }) });
}

export function validateComplianceEvidence(evidence: EvidenceBundle, request: ComplianceEvaluationRequest): EvidenceValidationResult {
  const missing = [...evidence.missing_evidence_report, ...evidence.evidence_snapshot.filter((item) => item.evidence_completeness_state === "MISSING").map((item) => item.evidence_id)];
  const invalid = evidence.evidence_snapshot.filter((item) => item.evidence_completeness_state === "INVALID" || item.evidence_integrity_hash === "tampered" || item.tenant_id !== request.tenant_id).map((item) => item.evidence_id);
  const conflicting = evidence.conflicting_evidence_report;
  const state: EvidenceValidationState = evidence.evidence_snapshot.some((item) => item.evidence_integrity_hash === "tampered") ? "TAMPERED" : invalid.length ? "INVALID" : missing.length ? "MISSING" : conflicting.length ? "CONFLICTING" : evidence.evidence_snapshot.some((item) => item.evidence_completeness_state === "PARTIAL") ? "PARTIAL" : "COMPLETE";
  const validated = evidence.evidence_snapshot.filter((item) => !invalid.includes(item.evidence_id)).map((item) => item.evidence_id);
  return Object.freeze({ evidence_validation_state: state, validated_evidence_refs: Object.freeze(validated), invalid_evidence_refs: Object.freeze(invalid), missing_evidence_refs: Object.freeze(missing), conflicting_evidence_refs: Object.freeze(conflicting), evidence_validation_hash: hashValue("compliance-evidence-validation", { state, validated, invalid, missing, conflicting }) });
}

export function processComplianceThreshold(threshold: ComplianceThreshold | null, score: ComplianceScoreResult, violation: ViolationResult): ThresholdProcessingResult {
  const status_output = threshold ? calculateComplianceStatus(score.compliance_score, violation.violation_severity === "CRITICAL") : "UNKNOWN";
  return Object.freeze({
    threshold_id: threshold?.threshold_id ?? "UNKNOWN",
    threshold_version: threshold?.threshold_version ?? "UNKNOWN",
    threshold_type: threshold?.threshold_type ?? "UNKNOWN",
    input_score: score.compliance_score,
    severity_override: violation.violation_severity === "CRITICAL" ? "CRITICAL" : null,
    status_output,
    escalation_required: status_output === "CRITICAL" || status_output === "FAIL",
    certification_impact: status_output === "PASS" ? "CERTIFIED" : status_output === "WARNING" ? "CONDITIONALLY_CERTIFIED" : status_output === "CRITICAL" ? "CERTIFICATION_BLOCKED" : "NOT_CERTIFIED",
    threshold_hash: hashValue("compliance-threshold-processing", { threshold, score, violation, status_output }),
  });
}

export function decideCompliance(threshold: ThresholdProcessingResult, evidence: EvidenceValidationResult, rule: RuleEvaluationResult, request: ComplianceEvaluationRequest): ComplianceDecisionResult {
  let status = threshold.status_output;
  const factors = [rule.rule_result, evidence.evidence_validation_state, threshold.threshold_id];
  if (evidence.evidence_validation_state === "MISSING") status = "UNKNOWN";
  if (evidence.evidence_validation_state === "INVALID") status = threshold.status_output === "CRITICAL" ? "CRITICAL" : "FAIL";
  if (evidence.evidence_validation_state === "TAMPERED" || request.scenario === "HIDDEN_STATE") status = "CRITICAL";
  if (!threshold.threshold_id || threshold.threshold_id === "UNKNOWN") status = "UNKNOWN";
  const decision_reason = status === "PASS" ? "All required rules were satisfied with complete evidence and replay-ready references." : status === "WARNING" ? "Compliance is partially satisfied with a non-critical exception, supersession, conflict, or visibility gap." : status === "UNKNOWN" ? "Compliance cannot be determined from available evidence or references." : status === "CRITICAL" ? "Critical governance, constitutional, authority, tenant, tamper, or hidden-state condition detected." : "Compliance requirement was not satisfied.";
  return Object.freeze({ evaluation_status: status, decision_reason, decision_factors: Object.freeze(factors), threshold_applied: threshold.threshold_id, decision_hash: hashValue("compliance-decision", { status, factors, decision_reason }) });
}

function policyResultFor(scenario: ComplianceEvaluationScenario): PolicyComplianceResult {
  if (scenario === "POLICY_VIOLATION") return "POLICY_VIOLATED";
  if (scenario === "POLICY_SUPERSEDED") return "POLICY_SUPERSEDED";
  if (scenario === "POLICY_EXCEPTION") return "POLICY_EXCEPTION_APPLIED";
  if (scenario === "MISSING_EVIDENCE") return "POLICY_UNKNOWN";
  return "POLICY_SATISFIED";
}

function constitutionalResultFor(scenario: ComplianceEvaluationScenario): ConstitutionalComplianceResult {
  if (scenario === "CONSTITUTIONAL_VIOLATION") return "CONSTITUTION_VIOLATED";
  if (scenario === "GOVERNANCE_BYPASS") return "GOVERNANCE_SUPREMACY_VIOLATED";
  if (scenario === "OPERATOR_BYPASS") return "OPERATOR_SUPREMACY_VIOLATED";
  return "CONSTITUTION_ALIGNED";
}

function authorityResultFor(scenario: ComplianceEvaluationScenario): AuthorityComplianceResult {
  if (scenario === "UNAUTHORIZED_BEHAVIOR") return "UNAUTHORIZED_BEHAVIOR_DETECTED";
  if (scenario === "PRIVILEGE_ESCALATION") return "PRIVILEGE_ESCALATION_DETECTED";
  if (scenario === "BOUNDARY_BREACH") return "BOUNDARY_BREACHED";
  return "AUTHORITY_RESPECTED";
}

function operationalResultFor(scenario: ComplianceEvaluationScenario): OperationalComplianceResult {
  if (scenario === "WORKFLOW_DEVIATION") return "WORKFLOW_DEVIATION_DETECTED";
  if (scenario === "GOVERNANCE_CHECKPOINT_MISSING") return "GOVERNANCE_CHECKPOINT_MISSING";
  if (scenario === "EXECUTION_RESTRICTION_VIOLATED") return "EXECUTION_RESTRICTION_VIOLATED";
  return "WORKFLOW_ADHERED";
}

export function generateComplianceEvaluationId(request: ComplianceEvaluationRequest): string {
  return `CEVAL-7D2-${hashValue("compliance-evaluation-id", request).slice(0, 10).toUpperCase()}`;
}

export function canonicalizeComplianceEvaluation(record: Omit<ComplianceEvaluationRecord, "evaluation_hash">): string {
  return canonicalizeConfidenceToString(record);
}

export function computeComplianceEvaluationHash(record: Omit<ComplianceEvaluationRecord, "evaluation_hash"> | ComplianceEvaluationRecord): string {
  const { evaluation_hash: _previousHash, ...source } = record as ComplianceEvaluationRecord;
  return hashConfidenceValue("compliance-evaluation", canonicalizeComplianceEvaluation(source));
}

export function evaluateCompliance(input: Partial<ComplianceEvaluationRequest> = {}): ComplianceEvaluationRecord {
  const request = buildComplianceEvaluationRequest(input);
  const { rule } = resolveComplianceRule(request);
  const threshold = buildComplianceThresholdRegistry().find((item) => item.threshold_id === request.threshold_reference) ?? null;
  const evidenceBundle = collectComplianceEvidence(request, rule);
  const ruleResult = evaluateComplianceRule(request, rule, evidenceBundle);
  const requirement = matchComplianceRequirements(ruleResult, request);
  const violation = detectComplianceViolation(request, ruleResult, evidenceBundle);
  const measurement = measureCompliance(requirement, violation);
  const evidenceValidation = validateComplianceEvidence(evidenceBundle, request);
  const score = scoreCompliance(measurement, evidenceValidation, violation);
  const thresholdResult = processComplianceThreshold(threshold, score, violation);
  const decision = decideCompliance(thresholdResult, evidenceValidation, ruleResult, request);
  const complianceRecord = buildComplianceRecord({ tenant_id: request.tenant_id, mission_id: request.mission_id, compliance_type: request.compliance_type, rule_reference: request.rule_reference, threshold_reference: request.threshold_reference, policy_reference: request.policy_reference, constitution_reference: request.constitution_reference, authority_reference: request.authority_reference, evaluation_scope: request.evaluation_scope, supporting_evidence: evidenceBundle.evidence_snapshot, compliance_score: score.compliance_score, evaluation_status: decision.evaluation_status, lineage_reference: `lineage_${request.tenant_id}_evaluation_7d2`, replay_reference: `replay_${request.tenant_id}_evaluation_7d2`, truth_ledger_reference: input.scenario === "LEDGER_WRITE_FAILURE" ? "" : `truth_ledger_${request.tenant_id}_evaluation_7d2` });
  const compliance_evaluation_id = generateComplianceEvaluationId(request);
  const escalation = escalationFor(decision.evaluation_status, violation);
  const lineage_reference = `lineage_${request.tenant_id}_evaluation_7d2`;
  const replay_reference = request.scenario === "REPLAY_MISMATCH" ? "" : `replay_${request.tenant_id}_evaluation_7d2`;
  const truth_ledger_reference = request.scenario === "LEDGER_WRITE_FAILURE" ? "" : `truth_ledger_${request.tenant_id}_evaluation_7d2`;
  const ledgerBase = { compliance_evaluation_id, tenant_id: request.tenant_id, mission_id: request.mission_id, evaluation_scope: request.evaluation_scope, compliance_type: request.compliance_type, rule_references: [request.rule_reference], threshold_references: [request.threshold_reference], evidence_references: evidenceBundle.evidence_snapshot.map((item) => item.evidence_id), violation_references: violation.violation_detected ? [violation.violation_hash] : [], score_result: score.compliance_score, decision_state: decision.evaluation_status, lineage_reference, replay_reference, truth_ledger_reference, created_timestamp: NOW };
  const ledger_record: ComplianceEvaluationLedgerRecord = Object.freeze({ evaluation_ledger_id: `CLEDGER-${hashValue("compliance-evaluation-ledger-id", ledgerBase).slice(0, 10).toUpperCase()}`, ...ledgerBase, evaluation_hash: hashValue("compliance-evaluation-ledger", ledgerBase) });
  const replay_snapshot: ComplianceEvaluationReplaySnapshot = Object.freeze({ compliance_evaluation_id, rule_snapshot: rule, threshold_snapshot: threshold, evidence_bundle: evidenceBundle, requirement_match_result: requirement, violation_result: violation, score_result: score, threshold_result: thresholdResult, decision_logic_version: "COMPLIANCE-DECISION-V1", final_decision: decision.evaluation_status, truth_ledger_reference, replay_hash: hashValue("compliance-evaluation-replay-snapshot", { rule, threshold, evidenceBundle, requirement, violation, score, thresholdResult, decision }) });
  const source: Omit<ComplianceEvaluationRecord, "evaluation_hash"> = {
    contract_version: CONTRACT_VERSION,
    compliance_evaluation_id,
    compliance_id: complianceRecord.compliance_id,
    tenant_id: request.tenant_id,
    mission_id: request.mission_id,
    evaluation_scope: request.evaluation_scope,
    compliance_type: request.compliance_type,
    rule_reference: request.rule_reference,
    rule_version: rule?.rule_version ?? "UNKNOWN",
    threshold_reference: request.threshold_reference,
    evaluation_timestamp: NOW,
    evidence_bundle_reference: evidenceBundle.evidence_bundle_reference,
    rule_evaluation_result: ruleResult,
    requirement_match_result: requirement,
    violation_result: violation,
    compliance_measurement: measurement,
    score_result: score,
    threshold_result: thresholdResult,
    evidence_validation_result: evidenceValidation,
    compliance_score: score.compliance_score,
    evaluation_status: decision.evaluation_status,
    decision_reason: decision.decision_reason,
    decision_result: decision,
    policy_result: policyResultFor(request.scenario),
    constitutional_result: constitutionalResultFor(request.scenario),
    authority_result: authorityResultFor(request.scenario),
    operational_result: operationalResultFor(request.scenario),
    supporting_evidence: evidenceBundle.evidence_snapshot,
    conflicting_evidence: Object.freeze(evidenceBundle.evidence_snapshot.filter((item) => evidenceBundle.conflicting_evidence_report.includes(item.evidence_type))),
    missing_evidence: evidenceBundle.missing_evidence_report,
    ...escalation,
    lineage_reference,
    replay_reference,
    truth_ledger_reference,
    ledger_record,
    replay_snapshot,
  };
  return Object.freeze({ ...source, evaluation_hash: hashValue("tampered-source-different", source) && computeComplianceEvaluationHash(source) });
}

export function buildComplianceEvaluationRecord(overrides: Partial<ComplianceEvaluationRecord> = {}): ComplianceEvaluationRecord {
  const base = evaluateCompliance();
  const { evaluation_hash: _baseHash, ...baseWithoutHash } = base;
  const { evaluation_hash: overrideHash, ...overridesWithoutHash } = overrides;
  const source = { ...baseWithoutHash, ...overridesWithoutHash } as Omit<ComplianceEvaluationRecord, "evaluation_hash">;
  return Object.freeze({ ...source, evaluation_hash: overrideHash ?? computeComplianceEvaluationHash(source) });
}

export function validateComplianceEvaluationRecord(record: Partial<ComplianceEvaluationRecord> | undefined): ComplianceEvaluationValidationResult {
  const errors: ComplianceEvaluationValidationFailure[] = [];
  if (!record) errors.push(failure("CONTRACT_MISSING", "record", "compliance evaluation missing"));
  if (record?.contract_version !== CONTRACT_VERSION) errors.push(failure("UNSUPPORTED_SCHEMA_VERSION", "contract_version", "unsupported compliance evaluation contract"));
  if (!record?.compliance_evaluation_id) errors.push(failure("EVALUATION_ID_MISSING", "compliance_evaluation_id", "evaluation id missing"));
  if (!record?.compliance_id) errors.push(failure("COMPLIANCE_ID_MISSING", "compliance_id", "compliance id missing"));
  if (!record?.tenant_id) errors.push(failure("TENANT_ID_MISSING", "tenant_id", "tenant id missing"));
  if (!record?.mission_id) errors.push(failure("MISSION_ID_MISSING", "mission_id", "mission id missing"));
  if (!record?.rule_version || record.rule_version === "UNKNOWN") errors.push(failure("RULE_UNRESOLVED", "rule_reference", "rule could not be resolved"));
  if (!record?.threshold_result || record.threshold_result.threshold_id === "UNKNOWN") errors.push(failure("THRESHOLD_UNRESOLVED", "threshold_reference", "threshold could not be resolved"));
  if (!record?.supporting_evidence?.length) errors.push(failure("EVIDENCE_MISSING", "supporting_evidence", "evidence missing"));
  if (record?.evidence_validation_result?.evidence_validation_state === "INVALID") errors.push(failure("EVIDENCE_INVALID", "evidence_validation_result", "invalid evidence rejected"));
  if (record?.evidence_validation_result?.evidence_validation_state === "TAMPERED") errors.push(failure("EVIDENCE_TAMPERED", "evidence_validation_result", "tampered evidence detected"));
  if (!record?.lineage_reference) errors.push(failure("LINEAGE_REFERENCE_MISSING", "lineage_reference", "lineage reference missing"));
  if (!record?.replay_reference) errors.push(failure("REPLAY_REFERENCE_MISSING", "replay_reference", "replay reference missing"));
  if (!record?.truth_ledger_reference) errors.push(failure("TRUTH_LEDGER_REFERENCE_MISSING", "truth_ledger_reference", "truth ledger reference missing"));
  if (!record?.ledger_record?.truth_ledger_reference) errors.push(failure("LEDGER_WRITE_FAILED", "ledger_record", "ledger write failed"));
  if (!record?.replay_snapshot?.replay_hash) errors.push(failure("REPLAY_MISMATCH", "replay_snapshot", "replay snapshot missing"));
  if (record?.score_result && record.compliance_measurement && record.evidence_validation_result && record.violation_result) {
    const expected = scoreCompliance(record.compliance_measurement, record.evidence_validation_result, record.violation_result);
    if (expected.score_calculation_hash !== record.score_result.score_calculation_hash || expected.compliance_score !== record.compliance_score) errors.push(failure("SCORE_MISMATCH", "score_result", "score result mismatch"));
  }
  if (record?.threshold_result && record.score_result && record.violation_result) {
    const threshold = buildComplianceThresholdRegistry().find((item) => item.threshold_id === record.threshold_reference) ?? null;
    const expected = processComplianceThreshold(threshold, record.score_result, record.violation_result);
    if (expected.threshold_hash !== record.threshold_result.threshold_hash || expected.status_output !== record.threshold_result.status_output) errors.push(failure("THRESHOLD_MISMATCH", "threshold_result", "threshold result mismatch"));
  }
  if (record?.decision_result && record.threshold_result && record.evidence_validation_result && record.rule_evaluation_result) {
    const request = buildComplianceEvaluationRequest({ tenant_id: record.tenant_id, mission_id: record.mission_id, compliance_type: record.compliance_type, evaluation_scope: record.evaluation_scope, rule_reference: record.rule_reference, threshold_reference: record.threshold_reference });
    const expected = decideCompliance(record.threshold_result, record.evidence_validation_result, record.rule_evaluation_result, request);
    if (expected.decision_hash !== record.decision_result.decision_hash || expected.evaluation_status !== record.evaluation_status || record.decision_result.evaluation_status !== record.evaluation_status) errors.push(failure("DECISION_MISMATCH", "decision_result", "decision result mismatch"));
  }
  if (containsTenantLeak(record?.supporting_evidence, record?.tenant_id) || containsTenantLeak(record?.lineage_reference, record?.tenant_id) || containsTenantLeak(record?.replay_reference, record?.tenant_id) || containsTenantLeak(record?.truth_ledger_reference, record?.tenant_id)) errors.push(failure("TENANT_SCOPE_VIOLATION", "tenant_id", "cross-tenant evaluation reference detected"));
  if (isRecord(record) && ("hidden_state" in record || "hidden_evaluation_state" in record)) errors.push(failure("HIDDEN_STATE_DETECTED", "record", "hidden evaluation state is prohibited"));
  if (record?.evaluation_hash && computeComplianceEvaluationHash(record as ComplianceEvaluationRecord) !== record.evaluation_hash) errors.push(failure("EVALUATION_HASH_MISMATCH", "evaluation_hash", "evaluation hash mismatch"));
  const validation_state: ComplianceEvaluationValidationState = errors.some((error) => error.reason === "TENANT_SCOPE_VIOLATION") ? "TENANT_SCOPE_VIOLATION" : errors.some((error) => ["HIDDEN_STATE_DETECTED", "EVIDENCE_TAMPERED", "LEDGER_WRITE_FAILED"].includes(error.reason)) ? "CERTIFICATION_BLOCKED" : errors.some((error) => ["REPLAY_MISMATCH", "REPLAY_REFERENCE_MISSING", "EVALUATION_HASH_MISMATCH"].includes(error.reason)) ? "REPLAY_MISMATCH" : errors.some((error) => error.reason === "EVIDENCE_MISSING") ? "UNKNOWN" : errors.length ? "INVALID" : "VALID";
  return Object.freeze({
    compliance_evaluation_id: record?.compliance_evaluation_id,
    validation_state,
    validator_version: "COMPLIANCE-EVALUATION-VALIDATOR-V1",
    checks: Object.freeze({
      schema_valid: !errors.some((error) => ["CONTRACT_MISSING", "UNSUPPORTED_SCHEMA_VERSION"].includes(error.reason)),
      required_fields_present: !errors.some((error) => ["EVALUATION_ID_MISSING", "COMPLIANCE_ID_MISSING", "TENANT_ID_MISSING", "MISSION_ID_MISSING"].includes(error.reason)),
      rule_resolved: !errors.some((error) => error.reason === "RULE_UNRESOLVED"),
      threshold_resolved: !errors.some((error) => error.reason === "THRESHOLD_UNRESOLVED"),
      evidence_valid: !errors.some((error) => ["EVIDENCE_MISSING", "EVIDENCE_INVALID", "EVIDENCE_TAMPERED"].includes(error.reason)),
      score_deterministic: !errors.some((error) => error.reason === "SCORE_MISMATCH"),
      threshold_deterministic: !errors.some((error) => error.reason === "THRESHOLD_MISMATCH"),
      decision_reproducible: !errors.some((error) => error.reason === "DECISION_MISMATCH"),
      ledger_recorded: !errors.some((error) => error.reason === "LEDGER_WRITE_FAILED"),
      replay_snapshot_present: !errors.some((error) => error.reason === "REPLAY_MISMATCH"),
      tenant_isolation_valid: !errors.some((error) => error.reason === "TENANT_SCOPE_VIOLATION"),
      hidden_state_absent: !errors.some((error) => error.reason === "HIDDEN_STATE_DETECTED"),
      hash_valid: !errors.some((error) => error.reason === "EVALUATION_HASH_MISMATCH"),
    }),
    errors: Object.freeze(errors),
    warnings: Object.freeze([]),
    validation_timestamp: NOW,
  });
}

export function replayComplianceEvaluation(record: ComplianceEvaluationRecord): ComplianceEvaluationReplayResult {
  const reconstructed_hash = computeComplianceEvaluationHash(record);
  const validation = validateComplianceEvaluationRecord(record);
  return Object.freeze({ replay_id: hashValue("compliance-evaluation-replay", { id: record.compliance_evaluation_id, reconstructed_hash }), compliance_evaluation_id: record.compliance_evaluation_id, replay_state: validation.validation_state === "VALID" && reconstructed_hash === record.evaluation_hash ? "REPRODUCED" : record.replay_snapshot ? "MISMATCH" : "INCOMPLETE", reconstructed_hash, expected_hash: record.evaluation_hash, reconstructed_decision: record.decision_result.evaluation_status, expected_decision: record.replay_snapshot.final_decision, failure_reason: validation.validation_state === "VALID" && reconstructed_hash === record.evaluation_hash ? null : validation.errors[0]?.reason ?? "EVALUATION_HASH_MISMATCH" });
}

export function buildComplianceEvaluationObservabilitySurface(record = evaluateCompliance()): ComplianceEvaluationObservabilitySurface {
  const validation = validateComplianceEvaluationRecord(record);
  const replay = replayComplianceEvaluation(record);
  return Object.freeze({
    compliance_evaluation_id: record.compliance_evaluation_id,
    evaluation_status: record.evaluation_status,
    compliance_score: record.compliance_score,
    rule_evaluated: record.rule_reference,
    threshold_applied: record.threshold_reference,
    evidence_used: Object.freeze(record.supporting_evidence.map((item) => item.evidence_id)),
    missing_evidence: record.missing_evidence,
    conflicting_evidence: Object.freeze(record.conflicting_evidence.map((item) => item.evidence_id)),
    violation_detected: record.violation_result.violation_detected,
    violation_severity: record.violation_result.violation_severity,
    decision_reason: record.decision_reason,
    replay_state: replay.replay_state,
    ledger_reference: record.truth_ledger_reference,
    corrective_action_reference: record.corrective_action_reference,
    escalation_required: record.escalation_required,
    validation_failures: Object.freeze(validation.errors.map((error) => error.reason)),
  });
}

export function buildComplianceEvaluationContract() {
  return Object.freeze({
    doctrine: buildComplianceEvaluationDoctrine(),
    rule_registry_size: buildComplianceRuleRegistry().length,
    threshold_registry_size: buildComplianceThresholdRegistry().length,
    baseline_evaluation: evaluateCompliance(),
    baseline_compliance_hash: computeComplianceHash(buildComplianceRecord()),
  });
}
