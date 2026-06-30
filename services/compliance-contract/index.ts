import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  ComplianceCertificationState,
  ComplianceConfidenceBasis,
  ComplianceConfidenceLevel,
  ComplianceContractDoctrine,
  ComplianceContractLifecycleState,
  ComplianceCorrectiveAction,
  ComplianceEvaluationScope,
  ComplianceEvaluationScopeType,
  ComplianceEvaluationStatus,
  ComplianceEvidence,
  ComplianceEvidenceState,
  ComplianceLifecycleTransitionResult,
  ComplianceObservabilitySurface,
  ComplianceRecord,
  ComplianceReplayPackage,
  ComplianceReplayResult,
  ComplianceRule,
  ComplianceRuleType,
  ComplianceThreshold,
  ComplianceThresholdType,
  ComplianceType,
  ComplianceValidationFailure,
  ComplianceValidationFailureReason,
  ComplianceValidationResult,
  ComplianceValidationState,
} from "@/types/compliance-contract";

const NOW = "2026-06-25T09:00:00.000Z";
const CONTRACT_VERSION = "COMPLIANCE-CONTRACT-V1";

export const COMPLIANCE_TYPES: readonly ComplianceType[] = Object.freeze([
  "POLICY_COMPLIANCE",
  "CONSTITUTIONAL_COMPLIANCE",
  "AUTHORITY_COMPLIANCE",
  "OPERATIONAL_COMPLIANCE",
  "GOVERNANCE_COMPLIANCE",
  "RUNTIME_COMPLIANCE",
  "RECOMMENDATION_COMPLIANCE",
  "CERTIFICATION_COMPLIANCE",
]);

export const COMPLIANCE_SCOPE_TYPES: readonly ComplianceEvaluationScopeType[] = Object.freeze([
  "SYSTEM_SCOPE",
  "MISSION_SCOPE",
  "PHASE_SCOPE",
  "COMPONENT_SCOPE",
  "POLICY_SCOPE",
  "RECOMMENDATION_SCOPE",
  "RUNTIME_SCOPE",
  "TENANT_SCOPE",
  "CERTIFICATION_SCOPE",
]);

export const COMPLIANCE_RULE_TYPES: readonly ComplianceRuleType[] = Object.freeze(["MANDATORY", "CONDITIONAL", "PROHIBITIVE", "THRESHOLD_BASED", "EVIDENCE_BASED", "CERTIFICATION_BASED", "AUTHORITY_BASED", "CONSTITUTIONAL"]);
export const COMPLIANCE_THRESHOLD_TYPES: readonly ComplianceThresholdType[] = Object.freeze(["PASS_THRESHOLD", "WARNING_THRESHOLD", "FAIL_THRESHOLD", "CRITICAL_THRESHOLD"]);
const EVALUATION_STATUSES: readonly ComplianceEvaluationStatus[] = Object.freeze(["PASS", "WARNING", "FAIL", "CRITICAL", "UNKNOWN", "INVALID"]);
const CERTIFICATION_STATES: readonly ComplianceCertificationState[] = Object.freeze(["CERTIFIED", "CONDITIONALLY_CERTIFIED", "NOT_CERTIFIED", "CERTIFICATION_BLOCKED"]);
const EVIDENCE_STATES: readonly ComplianceEvidenceState[] = Object.freeze(["COMPLETE", "PARTIAL", "MISSING", "CONFLICTING", "INVALID"]);
const CORRECTIVE_ACTION_STATES = Object.freeze(["RECOMMENDED", "REVIEW_REQUIRED", "APPROVED", "IN_PROGRESS", "VERIFICATION_REQUIRED", "RESOLVED", "REJECTED", "SUPERSEDED"]);
const IMMUTABLE_FIELDS: readonly (keyof ComplianceRecord)[] = Object.freeze(["compliance_id", "tenant_id", "mission_id", "evaluation_scope", "compliance_type", "rule_reference", "evaluation_timestamp", "truth_ledger_reference"]);

const LIFECYCLE_TRANSITIONS: Readonly<Record<ComplianceContractLifecycleState, readonly ComplianceContractLifecycleState[]>> = Object.freeze({
  DRAFT: Object.freeze(["ACTIVE"] as const),
  ACTIVE: Object.freeze(["SUPERSEDED", "RESTRICTED"] as const),
  RESTRICTED: Object.freeze(["ACTIVE", "SUPERSEDED"] as const),
  SUPERSEDED: Object.freeze(["ARCHIVED"] as const),
  ARCHIVED: Object.freeze([] as const),
});

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function failure(reason: ComplianceValidationFailureReason, field_path: string, message: string): ComplianceValidationFailure {
  return Object.freeze({ failure_id: hashValue("compliance-validation-failure", { reason, field_path, message }), reason, field_path, message, fail_closed: true });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasOwn<T extends object>(object: Partial<T>, key: keyof T): boolean {
  return Object.prototype.hasOwnProperty.call(object, key);
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

function certificationForStatus(status: ComplianceEvaluationStatus, evidence: readonly ComplianceEvidence[]): ComplianceCertificationState {
  if (status === "PASS" && evidence.every((item) => item.evidence_completeness_state === "COMPLETE")) return "CERTIFIED";
  if (status === "PASS" || status === "WARNING") return "CONDITIONALLY_CERTIFIED";
  if (status === "CRITICAL" || status === "INVALID") return "CERTIFICATION_BLOCKED";
  return "NOT_CERTIFIED";
}

function confidenceLevel(score: number): ComplianceConfidenceLevel {
  if (score >= 95) return "VERY_HIGH";
  if (score >= 85) return "HIGH";
  if (score >= 70) return "MODERATE";
  if (score >= 50) return "LOW";
  if (score >= 0) return "VERY_LOW";
  return "UNKNOWN";
}

export function buildComplianceContractDoctrine(): ComplianceContractDoctrine {
  return Object.freeze({
    principles: Object.freeze(["deterministic", "explainable", "replayable", "tenant-safe", "certification-ready", "fail-closed"] as const),
    prohibited_behaviors: Object.freeze(["hidden state", "random weighting", "implicit rules", "non-versioned thresholds", "cross-tenant evidence leakage", "operator authority bypass", "record mutation"]),
    required_fields: Object.freeze(["compliance_id", "tenant_id", "mission_id", "evaluation_scope", "compliance_type", "rule_reference", "policy_reference", "constitution_reference", "authority_reference", "threshold_reference", "evaluation_timestamp", "evaluation_status", "compliance_score", "confidence_score", "supporting_evidence", "supporting_decisions", "lineage_reference", "replay_reference", "truth_ledger_reference", "certification_state"] as const),
    allowed_types: COMPLIANCE_TYPES,
    allowed_scopes: COMPLIANCE_SCOPE_TYPES,
    contract_version: CONTRACT_VERSION,
  });
}

export function buildComplianceCategoryRegistry(): readonly ComplianceType[] {
  return COMPLIANCE_TYPES;
}

export function buildComplianceRuleRegistry(): readonly ComplianceRule[] {
  return Object.freeze([
    Object.freeze({
      rule_id: "RULE-REC-EVIDENCE-V1",
      rule_name: "Recommendations require supporting evidence",
      rule_version: "1.0.0",
      rule_type: "EVIDENCE_BASED",
      rule_description: "Every governed recommendation must include evidence, lineage, replay, and confidence inputs.",
      governing_source: "policy:recommendation-governance:v1",
      required_evidence: Object.freeze(["recommendation_evidence", "lineage_reference", "replay_reference"]),
      evaluation_method: "deterministic evidence completeness and threshold mapping",
      threshold_reference: "THRESHOLD-COMPLIANCE-PASS-V1",
      failure_condition: "recommendation exists without complete evidence or replay binding",
      criticality_level: "HIGH",
      corrective_action_reference: "CA-REC-EVIDENCE-V1",
      replay_requirements: Object.freeze(["rule_version", "evidence_snapshot", "scoring_inputs", "confidence_inputs", "expected_output"]),
      certification_requirements: Object.freeze(["evidence_complete", "score_reproducible", "confidence_reproducible", "tenant_isolated"]),
    }),
    Object.freeze({
      rule_id: "RULE-AUTHORITY-BOUNDARY-V1",
      rule_name: "Recommendations cannot assume execution authority",
      rule_version: "1.0.0",
      rule_type: "AUTHORITY_BASED",
      rule_description: "Advisory recommendations must preserve operator supremacy and cannot create execution authority.",
      governing_source: "constitution:operator-supremacy:v1",
      required_evidence: Object.freeze(["authority_boundary", "operator_review_state", "governance_decision"]),
      evaluation_method: "deterministic authority boundary verification",
      threshold_reference: "THRESHOLD-COMPLIANCE-CRITICAL-V1",
      failure_condition: "recommendation assumes execution authority without operator approval",
      criticality_level: "CRITICAL",
      corrective_action_reference: "CA-AUTHORITY-BOUNDARY-V1",
      replay_requirements: Object.freeze(["authority_reference", "decision_snapshot", "expected_output"]),
      certification_requirements: Object.freeze(["authority_preserved", "operator_supremacy_preserved", "replay_successful"]),
    }),
  ]);
}

export function buildComplianceThresholdRegistry(): readonly ComplianceThreshold[] {
  return Object.freeze([
    Object.freeze({ threshold_id: "THRESHOLD-COMPLIANCE-PASS-V1", threshold_name: "Pass", threshold_version: "1.0.0", threshold_type: "PASS_THRESHOLD", minimum_score: 90, maximum_score: 100, status_output: "PASS", severity_level: "NONE", escalation_required: false, corrective_action_required: false, certification_impact: "CERTIFIED", effective_date: NOW, superseded_by: null }),
    Object.freeze({ threshold_id: "THRESHOLD-COMPLIANCE-WARNING-V1", threshold_name: "Warning", threshold_version: "1.0.0", threshold_type: "WARNING_THRESHOLD", minimum_score: 70, maximum_score: 89, status_output: "WARNING", severity_level: "LOW", escalation_required: false, corrective_action_required: true, certification_impact: "CONDITIONALLY_CERTIFIED", effective_date: NOW, superseded_by: null }),
    Object.freeze({ threshold_id: "THRESHOLD-COMPLIANCE-FAIL-V1", threshold_name: "Fail", threshold_version: "1.0.0", threshold_type: "FAIL_THRESHOLD", minimum_score: 1, maximum_score: 69, status_output: "FAIL", severity_level: "HIGH", escalation_required: true, corrective_action_required: true, certification_impact: "NOT_CERTIFIED", effective_date: NOW, superseded_by: null }),
    Object.freeze({ threshold_id: "THRESHOLD-COMPLIANCE-CRITICAL-V1", threshold_name: "Critical", threshold_version: "1.0.0", threshold_type: "CRITICAL_THRESHOLD", minimum_score: 0, maximum_score: 0, status_output: "CRITICAL", severity_level: "CRITICAL", escalation_required: true, corrective_action_required: true, certification_impact: "CERTIFICATION_BLOCKED", effective_date: NOW, superseded_by: null }),
  ]);
}

export function generateComplianceId(tenant_id: string, mission_id: string, compliance_type: ComplianceType, rule_reference: string): string {
  return `COMP-7D-${hashValue("compliance-id", { tenant_id, mission_id, compliance_type, rule_reference }).slice(0, 10).toUpperCase()}`;
}

export function calculateComplianceStatus(score: number, disqualifying = false): ComplianceEvaluationStatus {
  if (!Number.isFinite(score) || score < 0 || score > 100) return "INVALID";
  if (disqualifying || score === 0) return "CRITICAL";
  if (score >= 90) return "PASS";
  if (score >= 70) return "WARNING";
  return "FAIL";
}

export function calculateComplianceConfidence(input: {
  supporting_evidence: readonly ComplianceEvidence[];
  rule_reference: string;
  threshold_reference: string;
  lineage_reference: string;
  replay_reference: string;
  policy_reference?: string;
  constitution_reference?: string;
  authority_reference?: string;
}): ComplianceConfidenceBasis {
  let score = 100;
  const penalties: string[] = [];
  const missing: string[] = [];
  const conflicting: string[] = [];
  for (const evidence of input.supporting_evidence) {
    if (evidence.evidence_completeness_state === "PARTIAL") penalties.push(`partial:${evidence.evidence_id}`);
    if (evidence.evidence_completeness_state === "MISSING") missing.push(evidence.evidence_id);
    if (evidence.evidence_completeness_state === "CONFLICTING") conflicting.push(evidence.evidence_id);
    if (evidence.evidence_completeness_state === "INVALID") penalties.push(`invalid:${evidence.evidence_id}`);
  }
  if (!input.rule_reference) missing.push("rule_reference");
  if (!input.threshold_reference) missing.push("threshold_reference");
  if (!input.lineage_reference) missing.push("lineage_reference");
  if (!input.replay_reference) missing.push("replay_reference");
  if (!input.policy_reference) penalties.push("policy_reference_absent");
  if (!input.constitution_reference) penalties.push("constitution_reference_absent");
  if (!input.authority_reference) penalties.push("authority_reference_absent");
  score -= penalties.length * 5;
  score -= missing.length * 15;
  score -= conflicting.length * 10;
  score = Math.max(0, Math.min(100, score));
  const source = { score, factors: ["evidence_integrity", "rule_clarity", "threshold_clarity", "lineage_completeness", "replay_readiness"], penalties, missing, conflicting };
  return Object.freeze({
    confidence_score: score,
    confidence_level: confidenceLevel(score),
    confidence_factors: Object.freeze(source.factors),
    confidence_penalties: Object.freeze(penalties),
    missing_inputs: Object.freeze(missing),
    conflicting_inputs: Object.freeze(conflicting),
    confidence_calculation_hash: hashValue("compliance-confidence", source),
  });
}

function buildEvidence(tenant_id: string): readonly ComplianceEvidence[] {
  return Object.freeze([
    Object.freeze({
      evidence_id: `evidence_${tenant_id}_recommendation_001`,
      evidence_type: "recommendation_evidence",
      evidence_source: "recommendation-ledger",
      evidence_timestamp: NOW,
      evidence_integrity_hash: hashValue("compliance-evidence", { tenant_id, type: "recommendation_evidence" }),
      evidence_lineage_reference: `lineage_${tenant_id}_recommendation_001`,
      evidence_replay_reference: `replay_${tenant_id}_recommendation_001`,
      evidence_relevance_score: 100,
      evidence_completeness_state: "COMPLETE",
      tenant_id,
    }),
  ]);
}

function buildCorrectiveAction(record: Omit<ComplianceRecord, "corrective_actions" | "compliance_hash">, status: ComplianceEvaluationStatus): readonly ComplianceCorrectiveAction[] {
  if (status === "PASS") return Object.freeze([]);
  return Object.freeze([
    Object.freeze({
      corrective_action_id: `CA-${hashValue("compliance-corrective-action", { id: record.compliance_id, status }).slice(0, 8).toUpperCase()}`,
      compliance_id: record.compliance_id,
      failure_type: status,
      severity: status === "WARNING" ? "WARNING" : status === "CRITICAL" ? "CRITICAL" : "FAIL",
      recommended_action: "Open governance-scoped review, attach closure evidence, and preserve operator approval before any remediation.",
      required_governance_review: true,
      operator_review_required: true,
      deadline_policy: "governance-policy:compliance-remediation:v1",
      evidence_required_for_closure: Object.freeze(["closure_evidence", "verification_replay", "truth_ledger_entry"]),
      verification_method: "deterministic replay and evidence verification",
      status: "REVIEW_REQUIRED",
      lineage_reference: `${record.lineage_reference}:corrective_action`,
      truth_ledger_reference: `${record.truth_ledger_reference}:corrective_action`,
    }),
  ]);
}

export function canonicalizeComplianceRecord(record: Omit<ComplianceRecord, "compliance_hash">): string {
  return canonicalizeConfidenceToString(record);
}

export function computeComplianceHash(record: Omit<ComplianceRecord, "compliance_hash"> | ComplianceRecord): string {
  const { compliance_hash: _previousHash, ...source } = record as ComplianceRecord;
  return hashConfidenceValue("compliance-contract", canonicalizeComplianceRecord(source));
}

function buildReplayPackage(source: Omit<ComplianceRecord, "replay_package" | "corrective_actions" | "compliance_hash">): ComplianceReplayPackage {
  const rule = buildComplianceRuleRegistry().find((item) => item.rule_id === source.rule_reference);
  const confidence_inputs = {
    evidence: source.supporting_evidence.map((item) => ({ evidence_id: item.evidence_id, state: item.evidence_completeness_state, relevance: item.evidence_relevance_score })),
    rule_reference: source.rule_reference,
    threshold_reference: source.threshold_reference,
    lineage_reference: source.lineage_reference,
    replay_reference: source.replay_reference,
  };
  const scoring_inputs = { compliance_score: source.compliance_score, disqualifying: source.evaluation_status === "CRITICAL" };
  const calculation_hash = hashValue("compliance-replay-calculation", { scoring_inputs, confidence_inputs, expected_status: source.evaluation_status, expected_confidence: source.confidence_score });
  return Object.freeze({
    compliance_id: source.compliance_id,
    rule_reference: source.rule_reference,
    rule_version: rule?.rule_version ?? "UNKNOWN",
    policy_reference: source.policy_reference,
    constitution_reference: source.constitution_reference,
    authority_reference: source.authority_reference,
    threshold_reference: source.threshold_reference,
    evidence_snapshot: source.supporting_evidence,
    evaluation_inputs: Object.freeze({ compliance_type: source.compliance_type, evaluation_scope: source.evaluation_scope }),
    scoring_inputs: Object.freeze(scoring_inputs),
    confidence_inputs: Object.freeze(confidence_inputs),
    evaluation_algorithm_version: "COMPLIANCE-EVAL-V1",
    calculation_hash,
    expected_output: Object.freeze({ evaluation_status: source.evaluation_status, compliance_score: source.compliance_score, confidence_score: source.confidence_score, certification_state: source.certification_state }),
    truth_ledger_reference: source.truth_ledger_reference,
  });
}

export function buildComplianceRecord(overrides: Partial<ComplianceRecord> = {}): ComplianceRecord {
  const tenant_id = hasOwn(overrides, "tenant_id") ? overrides.tenant_id! : "tenant_alpha";
  const mission_id = hasOwn(overrides, "mission_id") ? overrides.mission_id! : "mission_compliance_intelligence";
  const compliance_type = hasOwn(overrides, "compliance_type") ? overrides.compliance_type! : "RECOMMENDATION_COMPLIANCE";
  const rule_reference = hasOwn(overrides, "rule_reference") ? overrides.rule_reference! : "RULE-REC-EVIDENCE-V1";
  const threshold_reference = hasOwn(overrides, "threshold_reference") ? overrides.threshold_reference! : "THRESHOLD-COMPLIANCE-PASS-V1";
  const supporting_evidence = hasOwn(overrides, "supporting_evidence") ? overrides.supporting_evidence! : buildEvidence(tenant_id);
  const evaluation_scope = hasOwn(overrides, "evaluation_scope") ? overrides.evaluation_scope! : Object.freeze({ scope_type: "COMPONENT_SCOPE", phase_id: "7D", component_id: "7D.1", tenant_id, mission_id });
  const score = hasOwn(overrides, "compliance_score") ? overrides.compliance_score! : 100;
  const evaluation_status = hasOwn(overrides, "evaluation_status") ? overrides.evaluation_status! : calculateComplianceStatus(score);
  const confidence_basis = hasOwn(overrides, "confidence_basis") ? overrides.confidence_basis! : calculateComplianceConfidence({ supporting_evidence, rule_reference, threshold_reference, lineage_reference: `lineage_${tenant_id}_7d1`, replay_reference: `replay_${tenant_id}_7d1`, policy_reference: `policy_${tenant_id}_recommendation_governance_v1`, constitution_reference: "constitution_operator_supremacy_v1", authority_reference: `authority_${tenant_id}_advisory_boundary_v1` });
  const source: Omit<ComplianceRecord, "replay_package" | "corrective_actions" | "compliance_hash"> = {
    contract_version: hasOwn(overrides, "contract_version") ? overrides.contract_version! : CONTRACT_VERSION,
    compliance_id: hasOwn(overrides, "compliance_id") ? overrides.compliance_id! : generateComplianceId(tenant_id, mission_id, compliance_type, rule_reference),
    tenant_id,
    mission_id,
    evaluation_scope,
    compliance_type,
    rule_reference,
    policy_reference: hasOwn(overrides, "policy_reference") ? overrides.policy_reference! : `policy_${tenant_id}_recommendation_governance_v1`,
    constitution_reference: hasOwn(overrides, "constitution_reference") ? overrides.constitution_reference! : "constitution_operator_supremacy_v1",
    authority_reference: hasOwn(overrides, "authority_reference") ? overrides.authority_reference! : `authority_${tenant_id}_advisory_boundary_v1`,
    threshold_reference,
    evaluation_timestamp: hasOwn(overrides, "evaluation_timestamp") ? overrides.evaluation_timestamp! : NOW,
    evaluation_status,
    compliance_score: score,
    confidence_score: hasOwn(overrides, "confidence_score") ? overrides.confidence_score! : confidence_basis.confidence_score,
    confidence_basis,
    supporting_evidence,
    supporting_decisions: hasOwn(overrides, "supporting_decisions") ? overrides.supporting_decisions! : Object.freeze([`decision_${tenant_id}_recommendation_review_001`]),
    lineage_reference: hasOwn(overrides, "lineage_reference") ? overrides.lineage_reference! : `lineage_${tenant_id}_7d1`,
    replay_reference: hasOwn(overrides, "replay_reference") ? overrides.replay_reference! : `replay_${tenant_id}_7d1`,
    truth_ledger_reference: hasOwn(overrides, "truth_ledger_reference") ? overrides.truth_ledger_reference! : `truth_ledger_${tenant_id}_compliance_7d1`,
    certification_state: hasOwn(overrides, "certification_state") ? overrides.certification_state! : certificationForStatus(evaluation_status, supporting_evidence),
    lifecycle_state: hasOwn(overrides, "lifecycle_state") ? overrides.lifecycle_state! : "ACTIVE",
  };
  const replay_package = hasOwn(overrides, "replay_package") ? overrides.replay_package! : buildReplayPackage(source);
  const withoutHash: Omit<ComplianceRecord, "compliance_hash"> = { ...source, replay_package, corrective_actions: hasOwn(overrides, "corrective_actions") ? overrides.corrective_actions! : buildCorrectiveAction({ ...source, replay_package } as Omit<ComplianceRecord, "corrective_actions" | "compliance_hash">, evaluation_status) };
  return Object.freeze({ ...withoutHash, compliance_hash: hasOwn(overrides, "compliance_hash") ? overrides.compliance_hash! : computeComplianceHash(withoutHash) });
}

function validateRule(rule: ComplianceRule | undefined): boolean {
  return Boolean(rule?.rule_id && rule.rule_name && rule.rule_version && COMPLIANCE_RULE_TYPES.includes(rule.rule_type) && rule.required_evidence.length && rule.threshold_reference && rule.replay_requirements.length && rule.certification_requirements.length);
}

function validateThreshold(threshold: ComplianceThreshold | undefined): boolean {
  return Boolean(threshold?.threshold_id && threshold.threshold_version && COMPLIANCE_THRESHOLD_TYPES.includes(threshold.threshold_type) && threshold.minimum_score >= 0 && threshold.maximum_score <= 100 && threshold.minimum_score <= threshold.maximum_score);
}

export function validateComplianceRecord(record: Partial<ComplianceRecord> | undefined, options: { original_record?: ComplianceRecord } = {}): ComplianceValidationResult {
  const errors: ComplianceValidationFailure[] = [];
  if (!record) errors.push(failure("CONTRACT_MISSING", "record", "compliance record missing"));
  if (record?.contract_version !== CONTRACT_VERSION) errors.push(failure("UNSUPPORTED_SCHEMA_VERSION", "contract_version", "unsupported compliance contract"));
  if (!record?.compliance_id) errors.push(failure("COMPLIANCE_ID_MISSING", "compliance_id", "compliance_id missing"));
  if (!record?.tenant_id) errors.push(failure("TENANT_ID_MISSING", "tenant_id", "tenant_id missing"));
  if (!record?.mission_id) errors.push(failure("MISSION_ID_MISSING", "mission_id", "mission_id missing"));
  if (!record?.evaluation_scope) errors.push(failure("EVALUATION_SCOPE_MISSING", "evaluation_scope", "evaluation scope missing"));
  if (record?.evaluation_scope && (!COMPLIANCE_SCOPE_TYPES.includes(record.evaluation_scope.scope_type) || record.evaluation_scope.tenant_id !== record.tenant_id)) errors.push(failure("INVALID_EVALUATION_SCOPE", "evaluation_scope", "invalid or cross-tenant evaluation scope"));
  if (!record?.compliance_type || !COMPLIANCE_TYPES.includes(record.compliance_type)) errors.push(failure("UNKNOWN_COMPLIANCE_CATEGORY", "compliance_type", "unknown compliance category"));
  if (!record?.rule_reference) errors.push(failure("RULE_REFERENCE_MISSING", "rule_reference", "rule reference missing"));
  if (record?.rule_reference && !validateRule(buildComplianceRuleRegistry().find((item) => item.rule_id === record.rule_reference))) errors.push(failure("INVALID_RULE_REFERENCE", "rule_reference", "rule reference is not registered or schema-valid"));
  if (!record?.threshold_reference) errors.push(failure("THRESHOLD_REFERENCE_MISSING", "threshold_reference", "threshold reference missing"));
  if (record?.threshold_reference && !validateThreshold(buildComplianceThresholdRegistry().find((item) => item.threshold_id === record.threshold_reference))) errors.push(failure("INVALID_THRESHOLD_REFERENCE", "threshold_reference", "threshold reference is not registered or schema-valid"));
  if (!record?.supporting_evidence?.length) errors.push(failure("EVIDENCE_MISSING", "supporting_evidence", "supporting evidence missing"));
  if (record?.supporting_evidence?.some((item) => !item.evidence_id || item.tenant_id !== record.tenant_id || !EVIDENCE_STATES.includes(item.evidence_completeness_state))) errors.push(failure("EVIDENCE_INVALID", "supporting_evidence", "evidence is malformed or crosses tenant boundary"));
  if (!record?.lineage_reference) errors.push(failure("LINEAGE_REFERENCE_MISSING", "lineage_reference", "lineage reference missing"));
  if (!record?.replay_reference) errors.push(failure("REPLAY_REFERENCE_MISSING", "replay_reference", "replay reference missing"));
  if (!record?.replay_package) errors.push(failure("REPLAY_PACKAGE_MISSING", "replay_package", "replay package missing"));
  if (!record?.truth_ledger_reference) errors.push(failure("TRUTH_LEDGER_REFERENCE_MISSING", "truth_ledger_reference", "truth ledger reference missing"));
  if (!record?.evaluation_status || !EVALUATION_STATUSES.includes(record.evaluation_status)) errors.push(failure("INVALID_EVALUATION_STATUS", "evaluation_status", "invalid evaluation status"));
  if (record?.compliance_score === undefined || !Number.isFinite(record.compliance_score) || record.compliance_score < 0 || record.compliance_score > 100) errors.push(failure("SCORE_OUT_OF_RANGE", "compliance_score", "compliance score must be 0-100"));
  if (record?.evaluation_status && record.compliance_score !== undefined && calculateComplianceStatus(record.compliance_score, record.evaluation_status === "CRITICAL") !== record.evaluation_status && !["UNKNOWN", "INVALID"].includes(record.evaluation_status)) errors.push(failure("SCORE_STATUS_MISMATCH", "evaluation_status", "evaluation status does not match deterministic score threshold"));
  if (record?.confidence_score === undefined || !Number.isFinite(record.confidence_score) || record.confidence_score < 0 || record.confidence_score > 100) errors.push(failure("CONFIDENCE_OUT_OF_RANGE", "confidence_score", "confidence score must be 0-100"));
  if (record?.confidence_basis && record.supporting_evidence && record.confidence_score !== undefined) {
    const expected = calculateComplianceConfidence({ supporting_evidence: record.supporting_evidence, rule_reference: record.rule_reference ?? "", threshold_reference: record.threshold_reference ?? "", lineage_reference: record.lineage_reference ?? "", replay_reference: record.replay_reference ?? "", policy_reference: record.policy_reference, constitution_reference: record.constitution_reference, authority_reference: record.authority_reference });
    if (expected.confidence_score !== record.confidence_score || expected.confidence_calculation_hash !== record.confidence_basis.confidence_calculation_hash) errors.push(failure("CONFIDENCE_MISMATCH", "confidence_score", "confidence score does not match deterministic confidence basis"));
  } else {
    errors.push(failure("CONFIDENCE_MISMATCH", "confidence_basis", "confidence basis missing"));
  }
  if (!record?.certification_state || !CERTIFICATION_STATES.includes(record.certification_state)) errors.push(failure("INVALID_CERTIFICATION_STATE", "certification_state", "invalid certification state"));
  if (record?.corrective_actions?.some((action) => !action.compliance_id || action.compliance_id !== record.compliance_id || !CORRECTIVE_ACTION_STATES.includes(action.status))) errors.push(failure("CORRECTIVE_ACTION_INVALID", "corrective_actions", "corrective action missing compliance reference or valid status"));
  if (containsTenantLeak(record?.policy_reference, record?.tenant_id) || containsTenantLeak(record?.authority_reference, record?.tenant_id) || containsTenantLeak(record?.supporting_evidence, record?.tenant_id) || containsTenantLeak(record?.lineage_reference, record?.tenant_id) || containsTenantLeak(record?.replay_reference, record?.tenant_id) || containsTenantLeak(record?.truth_ledger_reference, record?.tenant_id)) errors.push(failure("TENANT_SCOPE_VIOLATION", "tenant_id", "cross-tenant compliance reference detected"));
  if (isRecord(record) && ("hidden_state" in record || "hidden_scoring_state" in record || "implicit_rule" in record)) errors.push(failure("HIDDEN_STATE_DETECTED", "record", "hidden compliance state is prohibited"));
  if (options.original_record) {
    for (const key of IMMUTABLE_FIELDS) {
      if (canonicalizeConfidenceToString(options.original_record[key]) !== canonicalizeConfidenceToString(record?.[key])) errors.push(failure("IMMUTABLE_FIELD_MUTATION", String(key), `${String(key)} cannot be mutated; create a superseding record instead`));
    }
  }
  if (record?.compliance_hash && computeComplianceHash(record as ComplianceRecord) !== record.compliance_hash) errors.push(failure("COMPLIANCE_HASH_MISMATCH", "compliance_hash", "compliance hash mismatch"));
  const validation_state: ComplianceValidationState = errors.some((error) => error.reason === "TENANT_SCOPE_VIOLATION") ? "TENANT_SCOPE_VIOLATION" : errors.some((error) => ["HIDDEN_STATE_DETECTED", "IMMUTABLE_FIELD_MUTATION"].includes(error.reason)) ? "CERTIFICATION_BLOCKED" : errors.some((error) => error.reason === "COMPLIANCE_HASH_MISMATCH" || error.reason === "REPLAY_PACKAGE_MISSING") ? "REPLAY_MISMATCH" : errors.some((error) => error.reason === "EVIDENCE_MISSING") ? "UNKNOWN" : errors.length ? "INVALID" : "VALID";
  return Object.freeze({
    compliance_id: record?.compliance_id,
    validation_state,
    validator_version: "COMPLIANCE-VALIDATOR-V1",
    checks: Object.freeze({
      schema_valid: !errors.some((error) => ["CONTRACT_MISSING", "UNSUPPORTED_SCHEMA_VERSION"].includes(error.reason)),
      required_fields_present: !errors.some((error) => ["COMPLIANCE_ID_MISSING", "TENANT_ID_MISSING", "MISSION_ID_MISSING", "EVALUATION_SCOPE_MISSING"].includes(error.reason)),
      category_registered: !errors.some((error) => error.reason === "UNKNOWN_COMPLIANCE_CATEGORY"),
      scope_valid: !errors.some((error) => error.reason === "INVALID_EVALUATION_SCOPE"),
      rule_valid: !errors.some((error) => ["RULE_REFERENCE_MISSING", "INVALID_RULE_REFERENCE"].includes(error.reason)),
      threshold_valid: !errors.some((error) => ["THRESHOLD_REFERENCE_MISSING", "INVALID_THRESHOLD_REFERENCE"].includes(error.reason)),
      evidence_valid: !errors.some((error) => ["EVIDENCE_MISSING", "EVIDENCE_INVALID"].includes(error.reason)),
      score_deterministic: !errors.some((error) => ["SCORE_OUT_OF_RANGE", "SCORE_STATUS_MISMATCH"].includes(error.reason)),
      confidence_deterministic: !errors.some((error) => ["CONFIDENCE_OUT_OF_RANGE", "CONFIDENCE_MISMATCH"].includes(error.reason)),
      corrective_actions_valid: !errors.some((error) => error.reason === "CORRECTIVE_ACTION_INVALID"),
      lineage_present: !errors.some((error) => error.reason === "LINEAGE_REFERENCE_MISSING"),
      replay_present: !errors.some((error) => ["REPLAY_REFERENCE_MISSING", "REPLAY_PACKAGE_MISSING"].includes(error.reason)),
      truth_ledger_present: !errors.some((error) => error.reason === "TRUTH_LEDGER_REFERENCE_MISSING"),
      tenant_isolation_valid: !errors.some((error) => error.reason === "TENANT_SCOPE_VIOLATION"),
      immutable_fields_valid: !errors.some((error) => error.reason === "IMMUTABLE_FIELD_MUTATION"),
      hidden_state_absent: !errors.some((error) => error.reason === "HIDDEN_STATE_DETECTED"),
      hash_valid: !errors.some((error) => error.reason === "COMPLIANCE_HASH_MISMATCH"),
    }),
    errors: Object.freeze(errors),
    warnings: Object.freeze([]),
    validation_timestamp: NOW,
  });
}

export function replayComplianceRecord(record: ComplianceRecord): ComplianceReplayResult {
  const reconstructed_hash = computeComplianceHash(record);
  const validation = validateComplianceRecord(record);
  const replay_state = validation.validation_state === "VALID" && reconstructed_hash === record.compliance_hash ? "REPRODUCED" : record.replay_package ? "MISMATCH" : "INCOMPLETE";
  return Object.freeze({
    replay_id: hashValue("compliance-replay-result", { compliance_id: record.compliance_id, reconstructed_hash }),
    compliance_id: record.compliance_id,
    replay_state,
    reconstructed_hash,
    expected_hash: record.compliance_hash,
    reconstructed_status: record.evaluation_status,
    expected_status: record.replay_package?.expected_output.evaluation_status ?? "INVALID",
    failure_reason: replay_state === "REPRODUCED" ? null : validation.errors[0]?.reason ?? "COMPLIANCE_HASH_MISMATCH",
  });
}

export function transitionComplianceContractLifecycle(from_state: ComplianceContractLifecycleState, to_state: ComplianceContractLifecycleState): ComplianceLifecycleTransitionResult {
  const allowed = LIFECYCLE_TRANSITIONS[from_state].includes(to_state);
  return Object.freeze({ from_state, to_state, allowed, reason: allowed ? "lifecycle transition allowed" : `invalid compliance contract lifecycle transition: ${from_state} to ${to_state}` });
}

export function buildComplianceObservabilitySurface(record = buildComplianceRecord()): ComplianceObservabilitySurface {
  const validation = validateComplianceRecord(record);
  const replay = replayComplianceRecord(record);
  const missing = record.supporting_evidence.filter((item) => item.evidence_completeness_state === "MISSING").length;
  const conflicting = record.supporting_evidence.filter((item) => item.evidence_completeness_state === "CONFLICTING").length;
  const invalid = record.supporting_evidence.filter((item) => item.evidence_completeness_state === "INVALID").length;
  return Object.freeze({
    compliance_id: record.compliance_id,
    evaluation_status: record.evaluation_status,
    compliance_score: record.compliance_score,
    confidence_score: record.confidence_score,
    confidence_level: record.confidence_basis.confidence_level,
    rule_evaluated: record.rule_reference,
    threshold_applied: record.threshold_reference,
    evidence_summary: Object.freeze({ supporting_evidence_count: record.supporting_evidence.length, missing_evidence_count: missing, conflicting_evidence_count: conflicting, invalid_evidence_count: invalid }),
    corrective_actions: record.corrective_actions,
    replay_state: replay.replay_state,
    certification_state: record.certification_state,
    explanation: validation.validation_state === "VALID" ? "Compliance record is deterministic, replayable, tenant-scoped, evidence-backed, and certification-ready." : `Compliance record failed closed: ${validation.errors.map((error) => error.reason).join(", ")}`,
  });
}
