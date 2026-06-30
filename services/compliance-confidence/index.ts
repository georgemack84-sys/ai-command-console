import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { evaluateCompliance, replayComplianceEvaluation } from "@/services/compliance-evaluation";
import { analyzeComplianceTrend, replayComplianceTrend } from "@/services/compliance-trend";
import type { ComplianceConfidenceLevel } from "@/types/compliance-contract";
import type { ComplianceEvaluationRecord } from "@/types/compliance-evaluation";
import type { ComplianceTrendRecord } from "@/types/compliance-trend";
import type {
  AuthorityVerificationState,
  ComplianceConfidenceDoctrine,
  ComplianceConfidenceFailureReason,
  ComplianceConfidenceInputs,
  ComplianceConfidenceObservabilitySurface,
  ComplianceConfidenceRecord,
  ComplianceConfidenceReplayResult,
  ComplianceConfidenceType,
  ComplianceConfidenceValidationFailure,
  ComplianceConfidenceValidationResult,
  ComplianceConfidenceValidationState,
  ConfidenceFactorAssessment,
  ConfidenceLineage,
  ConfidenceReplaySnapshot,
  ConfidenceScenario,
  EvidenceConfidenceState,
  LineageIntegrityState,
} from "@/types/compliance-confidence";

const NOW = "2026-06-25T09:00:00.000Z";
const CONTRACT_VERSION = "COMPLIANCE-CONFIDENCE-V1";
const CONFIDENCE_TYPES: readonly ComplianceConfidenceType[] = Object.freeze(["COMPLIANCE_CONFIDENCE", "EVIDENCE_CONFIDENCE", "RECOMMENDATION_CONFIDENCE"]);
const CONFIDENCE_LEVELS: readonly ComplianceConfidenceLevel[] = Object.freeze(["VERY_HIGH", "HIGH", "MODERATE", "LOW", "VERY_LOW", "UNKNOWN"]);
const WEIGHTS = Object.freeze({ evidence_completeness: 0.2, rule_coverage: 0.15, replay_validation: 0.15, lineage_integrity: 0.15, policy_consistency: 0.1, constitutional_consistency: 0.1, authority_verification: 0.1, historical_stability: 0.05 });

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function failure(reason: ComplianceConfidenceFailureReason, field_path: string, message: string): ComplianceConfidenceValidationFailure {
  return Object.freeze({ failure_id: hashValue("compliance-confidence-validation-failure", { reason, field_path, message }), reason, field_path, message, fail_closed: true });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function tenantLeak(ref: unknown, tenant_id: string | undefined): boolean {
  if (!tenant_id || typeof ref !== "string") return false;
  const match = ref.match(/tenant_(alpha|beta|[0-9]+)/i);
  return Boolean(match && match[0] !== tenant_id);
}

function containsTenantLeak(value: unknown, tenant_id: string | undefined): boolean {
  if (tenantLeak(value, tenant_id)) return true;
  if (Array.isArray(value)) return value.some((item) => containsTenantLeak(item, tenant_id));
  if (isRecord(value)) return Object.values(value).some((item) => containsTenantLeak(item, tenant_id));
  return false;
}

export function mapConfidenceLevel(score: number, unknown = false): ComplianceConfidenceLevel {
  if (unknown) return "UNKNOWN";
  if (score >= 95) return "VERY_HIGH";
  if (score >= 85) return "HIGH";
  if (score >= 70) return "MODERATE";
  if (score >= 50) return "LOW";
  if (score >= 1) return "VERY_LOW";
  return "UNKNOWN";
}

export function buildComplianceConfidenceDoctrine(): ComplianceConfidenceDoctrine {
  return Object.freeze({ principles: Object.freeze(["deterministic", "explainable", "replayable", "tenant-scoped", "ledger-recorded", "certification-ready", "fail-closed"] as const), confidence_types: CONFIDENCE_TYPES, confidence_levels: CONFIDENCE_LEVELS, weight_model: WEIGHTS, contract_version: CONTRACT_VERSION });
}

function assessment(name: string, score: number, state: string, supporting: readonly string[], missing: readonly string[] = [], penalties: readonly string[] = []): ConfidenceFactorAssessment {
  return Object.freeze({ score, state, supporting_factors: Object.freeze([...supporting]), missing_factors: Object.freeze([...missing]), penalty_factors: Object.freeze([...penalties]), assessment_hash: hashValue(`compliance-confidence-${name}`, { score, state, supporting, missing, penalties }) });
}

export function assessEvidenceConfidence(evaluation: ComplianceEvaluationRecord) {
  const evidence = evaluation.supporting_evidence;
  const missing = evaluation.evidence_validation_result.missing_evidence_refs;
  const invalid = evaluation.evidence_validation_result.invalid_evidence_refs;
  const conflicting = evaluation.evidence_validation_result.conflicting_evidence_refs;
  const state: EvidenceConfidenceState = evaluation.evidence_validation_result.evidence_validation_state === "TAMPERED" ? "TAMPERED" : invalid.length ? "INVALID" : missing.length ? "MISSING" : conflicting.length ? "CONFLICTING" : evaluation.evidence_validation_result.evidence_validation_state === "PARTIAL" ? "PARTIAL" : "COMPLETE_TRUSTED";
  const score = state === "COMPLETE_TRUSTED" ? 100 : state === "PARTIAL" ? 78 : state === "CONFLICTING" ? 55 : state === "MISSING" ? 35 : state === "INVALID" || state === "TAMPERED" ? 5 : 0;
  return Object.freeze({ ...assessment("evidence", score, state, evidence.map((item) => item.evidence_id), missing, [...invalid, ...conflicting]), evidence_state: state, trusted_evidence_refs: Object.freeze(evidence.map((item) => item.evidence_id)), missing_evidence_refs: missing, conflicting_evidence_refs: conflicting, invalid_evidence_refs: invalid });
}

export function assessRuleCoverage(evaluation: ComplianceEvaluationRecord, scenario?: ConfidenceScenario) {
  const missing = scenario === "INCOMPLETE_RULE_COVERAGE" ? ["required_rule_missing"] : evaluation.rule_version === "UNKNOWN" ? [evaluation.rule_reference] : [];
  const invalid = evaluation.rule_version === "UNKNOWN" ? [evaluation.rule_reference] : [];
  const score = missing.length || invalid.length ? 60 : 100;
  return Object.freeze({ ...assessment("rule-coverage", score, missing.length ? "INCOMPLETE" : "COMPLETE", [evaluation.rule_reference], missing, invalid), covered_rules: Object.freeze(missing.length ? [] : [evaluation.rule_reference]), missing_rules: Object.freeze(missing), invalid_rules: Object.freeze(invalid) });
}

export function assessConsistency(evaluation: ComplianceEvaluationRecord, scenario?: ConfidenceScenario) {
  const conflicts = scenario === "POLICY_INCONSISTENCY" ? ["policy conflict"] : scenario === "CONSTITUTIONAL_INCONSISTENCY" ? ["constitutional inconsistency"] : [];
  const score = conflicts.length ? 45 : evaluation.evaluation_status === "UNKNOWN" ? 65 : 95;
  return Object.freeze({ ...assessment("consistency", score, conflicts.length ? "CONFLICTING" : "CONSISTENT", conflicts.length ? [] : ["policy", "constitution", "threshold"], [], conflicts), consistency_conflicts: Object.freeze(conflicts) });
}

export function assessAuthorityVerification(evaluation: ComplianceEvaluationRecord, scenario?: ConfidenceScenario) {
  const state: AuthorityVerificationState = scenario === "AUTHORITY_UNCERTAIN" ? "UNCERTAIN" : evaluation.authority_result === "AUTHORITY_RESPECTED" ? "VERIFIED" : evaluation.evaluation_status === "CRITICAL" ? "FAILED" : "PARTIAL";
  const score = state === "VERIFIED" ? 95 : state === "PARTIAL" ? 75 : state === "UNCERTAIN" ? 55 : state === "FAILED" ? 20 : 0;
  return Object.freeze({ ...assessment("authority", score, state, state === "VERIFIED" ? ["authority verified"] : [], state === "UNCERTAIN" ? ["authority verification"] : [], state === "FAILED" ? ["authority failure"] : []), authority_verification_state: state });
}

export function assessLineageIntegrity(evaluation: ComplianceEvaluationRecord, scenario?: ConfidenceScenario) {
  const state: LineageIntegrityState = scenario === "BROKEN_LINEAGE" || !evaluation.lineage_reference ? "BROKEN" : "INTACT";
  const breaks = state === "BROKEN" ? ["lineage_reference"] : [];
  const score = state === "INTACT" ? 100 : state === "BROKEN" ? 20 : 0;
  return Object.freeze({ ...assessment("lineage", score, state, state === "INTACT" ? [evaluation.lineage_reference] : [], breaks, breaks), lineage_integrity_state: state, lineage_breaks: Object.freeze(breaks) });
}

export function assessReplayValidation(evaluation: ComplianceEvaluationRecord, scenario?: ConfidenceScenario) {
  const replay = replayComplianceEvaluation(evaluation);
  const state = scenario === "REPLAY_MISMATCH" ? "MISMATCH" : !evaluation.replay_reference ? "INCOMPLETE" : replay.replay_state;
  const score = state === "REPRODUCED" ? 100 : state === "INCOMPLETE" ? 45 : state === "MISMATCH" ? 5 : state === "INVALID" ? 0 : 25;
  return Object.freeze({ ...assessment("replay", score, state, state === "REPRODUCED" ? [evaluation.replay_reference] : [], state === "INCOMPLETE" ? ["replay_reference"] : [], state === "MISMATCH" ? ["replay mismatch"] : []), replay_validation_state: state, replay_failure_reason: state === "REPRODUCED" ? null : String(replay.failure_reason ?? state) });
}

export function assessHistoricalStability(trend: ComplianceTrendRecord, scenario?: ConfidenceScenario) {
  const volatile = scenario === "VOLATILE_HISTORY" || trend.trend_direction === "VOLATILE";
  const score = volatile ? 45 : trend.stability_index.stability_index;
  return Object.freeze(assessment("historical-stability", score, volatile ? "VOLATILE" : trend.stability_index.stability_level, trend.supporting_evidence.slice(0, 3), [], volatile ? ["historical volatility"] : []));
}

export function collectConfidenceInputs(evaluation: ComplianceEvaluationRecord, trend: ComplianceTrendRecord, scenario?: ConfidenceScenario): ComplianceConfidenceInputs {
  const evidence = assessEvidenceConfidence(evaluation);
  const rules = assessRuleCoverage(evaluation, scenario);
  const replay = assessReplayValidation(evaluation, scenario);
  const lineage = assessLineageIntegrity(evaluation, scenario);
  const consistency = assessConsistency(evaluation, scenario);
  const authority = assessAuthorityVerification(evaluation, scenario);
  const stability = assessHistoricalStability(trend, scenario);
  const inputs = { evidence_completeness: evidence.score, rule_coverage: rules.score, replay_validation: replay.score, lineage_integrity: lineage.score, policy_consistency: consistency.score, constitutional_consistency: scenario === "CONSTITUTIONAL_INCONSISTENCY" ? 35 : consistency.score, authority_verification: authority.score, historical_stability: stability.score };
  return Object.freeze({ ...inputs, input_hash: hashValue("compliance-confidence-inputs", inputs) });
}

export function calculateConfidenceScore(inputs: ComplianceConfidenceInputs, scenario?: ConfidenceScenario): { score: number; level: ComplianceConfidenceLevel; supporting: readonly string[]; missing: readonly string[]; penalties: readonly string[]; blockers: readonly string[]; calculation_hash: string } {
  const raw = Math.round(inputs.evidence_completeness * WEIGHTS.evidence_completeness + inputs.rule_coverage * WEIGHTS.rule_coverage + inputs.replay_validation * WEIGHTS.replay_validation + inputs.lineage_integrity * WEIGHTS.lineage_integrity + inputs.policy_consistency * WEIGHTS.policy_consistency + inputs.constitutional_consistency * WEIGHTS.constitutional_consistency + inputs.authority_verification * WEIGHTS.authority_verification + inputs.historical_stability * WEIGHTS.historical_stability);
  const missing = Object.entries(inputs).filter(([key, value]) => key !== "input_hash" && typeof value === "number" && value < 50).map(([key]) => key);
  const penalties = Object.entries(inputs).filter(([key, value]) => key !== "input_hash" && typeof value === "number" && value >= 50 && value < 85).map(([key]) => key);
  const blockers = [inputs.replay_validation < 10 ? "replay mismatch" : "", inputs.lineage_integrity < 30 ? "broken lineage" : "", inputs.evidence_completeness < 10 ? "invalid evidence" : "", scenario === "CROSS_TENANT_INPUT" ? "tenant leakage" : ""].filter(Boolean);
  const capped = blockers.length ? Math.min(raw, 20) : missing.length ? Math.min(raw, 69) : penalties.length ? Math.min(raw, 84) : raw;
  const level = mapConfidenceLevel(capped, scenario === "RECOMMENDATION_UNLINKED" && inputs.evidence_completeness === 0);
  const supporting = Object.entries(inputs).filter(([key, value]) => key !== "input_hash" && typeof value === "number" && value >= 85).map(([key]) => key);
  return Object.freeze({ score: capped, level, supporting: Object.freeze(supporting), missing: Object.freeze(missing), penalties: Object.freeze(penalties), blockers: Object.freeze(blockers), calculation_hash: hashValue("compliance-confidence-calculation", { inputs, capped, level, missing, penalties, blockers }) });
}

export function generateComplianceConfidenceId(tenant_id: string, compliance_evaluation_id: string, type: ComplianceConfidenceType): string {
  return `CCONF-7D4-${hashValue("compliance-confidence-id", { tenant_id, compliance_evaluation_id, type }).slice(0, 10).toUpperCase()}`;
}

function buildLineage(confidence_id: string, evaluation: ComplianceEvaluationRecord, trend: ComplianceTrendRecord, truth_ledger_reference: string): ConfidenceLineage {
  const refs = evaluation.supporting_evidence.map((item) => item.evidence_id);
  const source = { confidence_id, evaluation: evaluation.compliance_evaluation_id, trend: trend.trend_id, refs };
  return Object.freeze({ confidence_lineage_id: `CLIN-${hashValue("compliance-confidence-lineage-id", source).slice(0, 10).toUpperCase()}`, confidence_id, source_compliance_evaluation_id: evaluation.compliance_evaluation_id, source_evidence_refs: Object.freeze(refs), source_rule_refs: Object.freeze([evaluation.rule_reference]), source_threshold_refs: Object.freeze([evaluation.threshold_reference]), source_policy_refs: Object.freeze([`policy_${evaluation.tenant_id}_recommendation_governance_v1`]), source_constitution_refs: Object.freeze(["constitution_operator_supremacy_v1"]), source_authority_refs: Object.freeze([`authority_${evaluation.tenant_id}_advisory_boundary_v1`]), source_trend_refs: Object.freeze([trend.trend_id]), source_replay_refs: Object.freeze([evaluation.replay_reference, trend.replay_reference]), parent_confidence_refs: Object.freeze([]), truth_ledger_reference, lineage_hash: hashValue("compliance-confidence-lineage", source) });
}

function confidenceReason(level: ComplianceConfidenceLevel, type: ComplianceConfidenceType): string {
  if (level === "VERY_HIGH") return `${type} is strongly supported by complete evidence, intact lineage, reproduced replay, verified authority, and stable history.`;
  if (level === "HIGH") return `${type} is well supported with only minor non-critical gaps.`;
  if (level === "MODERATE") return `${type} is plausible but has meaningful evidence, replay, lineage, authority, or stability limitations.`;
  if (level === "LOW") return `${type} has weak support and is not certification-ready.`;
  if (level === "VERY_LOW") return `${type} is poorly supported or not reliably reproducible.`;
  return `${type} cannot be determined from available inputs.`;
}

export function scoreComplianceConfidence(input: { confidence_type?: ComplianceConfidenceType; scenario?: ConfidenceScenario; evaluation?: ComplianceEvaluationRecord; trend?: ComplianceTrendRecord; tenant_id?: string } = {}): ComplianceConfidenceRecord {
  const type = input.confidence_type ?? "COMPLIANCE_CONFIDENCE";
  const tenant_id = input.tenant_id ?? "tenant_alpha";
  const evaluation = input.evaluation ?? evaluateCompliance({ tenant_id, scenario: input.scenario === "MISSING_EVIDENCE" ? "MISSING_EVIDENCE" : input.scenario === "CROSS_TENANT_INPUT" ? "CROSS_TENANT_EVIDENCE" : "COMPLIANT" });
  const trend = input.trend ?? analyzeComplianceTrend({ tenant_id, scenario: input.scenario === "VOLATILE_HISTORY" ? "VOLATILE" : input.scenario === "CROSS_TENANT_INPUT" ? "CROSS_TENANT_HISTORY" : "STABLE" });
  const evidence = assessEvidenceConfidence(evaluation);
  const rule = assessRuleCoverage(evaluation, input.scenario);
  const consistency = assessConsistency(evaluation, input.scenario);
  const authority = assessAuthorityVerification(evaluation, input.scenario);
  const lineage = assessLineageIntegrity(evaluation, input.scenario);
  const replay = assessReplayValidation(evaluation, input.scenario);
  const historical = assessHistoricalStability(trend, input.scenario);
  const inputs = collectConfidenceInputs(evaluation, trend, input.scenario);
  const recommendationPenalty = type === "RECOMMENDATION_CONFIDENCE" && input.scenario === "RECOMMENDATION_UNLINKED";
  const adjustedInputs = recommendationPenalty ? Object.freeze({ ...inputs, evidence_completeness: 0, input_hash: hashValue("compliance-confidence-inputs-recommendation-unlinked", inputs) }) : inputs;
  const calculation = calculateConfidenceScore(adjustedInputs, input.scenario);
  const confidence_id = generateComplianceConfidenceId(evaluation.tenant_id, evaluation.compliance_evaluation_id, type);
  const lineage_reference = input.scenario === "BROKEN_LINEAGE" ? "" : `lineage_${evaluation.tenant_id}_confidence_7d4`;
  const replay_reference = input.scenario === "REPLAY_MISMATCH" ? "" : `replay_${evaluation.tenant_id}_confidence_7d4`;
  const truth_ledger_reference = input.scenario === "LEDGER_WRITE_FAILURE" ? "" : `truth_ledger_${evaluation.tenant_id}_confidence_7d4`;
  const confidence_lineage = buildLineage(confidence_id, evaluation, trend, truth_ledger_reference);
  const ledger = Object.freeze({ confidence_ledger_id: `CLEDGER-${hashValue("compliance-confidence-ledger-id", { confidence_id }).slice(0, 10).toUpperCase()}`, confidence_id, tenant_id: evaluation.tenant_id, mission_id: evaluation.mission_id, compliance_id: evaluation.compliance_id, confidence_type: type, confidence_level: calculation.level, confidence_score: calculation.score, confidence_inputs: adjustedInputs, supporting_factors: calculation.supporting, missing_factors: calculation.missing, penalty_factors: calculation.penalties, lineage_reference, replay_reference, truth_ledger_reference, calculation_hash: calculation.calculation_hash, created_timestamp: NOW });
  const replay_snapshot: ConfidenceReplaySnapshot = Object.freeze({ confidence_id, confidence_input_set: adjustedInputs, confidence_model_version: CONTRACT_VERSION, confidence_weights: WEIGHTS, confidence_penalties: calculation.penalties, confidence_blockers: calculation.blockers, source_evidence_refs: confidence_lineage.source_evidence_refs, source_rule_refs: confidence_lineage.source_rule_refs, source_threshold_refs: confidence_lineage.source_threshold_refs, source_policy_refs: confidence_lineage.source_policy_refs, source_authority_refs: confidence_lineage.source_authority_refs, source_lineage_refs: Object.freeze([evaluation.lineage_reference, trend.lineage_reference]), source_trend_refs: confidence_lineage.source_trend_refs, expected_confidence_score: calculation.score, expected_confidence_level: calculation.level, expected_calculation_hash: calculation.calculation_hash, replay_hash: hashValue("compliance-confidence-replay-snapshot", { adjustedInputs, calculation, confidence_lineage }) });
  return Object.freeze({ contract_version: CONTRACT_VERSION, confidence_id, tenant_id: evaluation.tenant_id, mission_id: evaluation.mission_id, compliance_id: evaluation.compliance_id, compliance_evaluation_id: evaluation.compliance_evaluation_id, trend_id: trend.trend_id, evaluation_scope: evaluation.evaluation_scope, compliance_type: evaluation.compliance_type, confidence_type: type, confidence_level: calculation.level, confidence_score: calculation.score, confidence_reason: confidenceReason(calculation.level, type), evidence_confidence: evidence, rule_coverage: rule, consistency_confidence: consistency, authority_confidence: authority, lineage_confidence: lineage, replay_confidence: replay, historical_stability_confidence: historical, recommendation_basis: Object.freeze(type === "RECOMMENDATION_CONFIDENCE" ? [evaluation.compliance_evaluation_id, trend.trend_id] : []), required_reviews: Object.freeze(type === "RECOMMENDATION_CONFIDENCE" ? ["governance_review", "operator_review"] : []), supporting_factors: calculation.supporting, missing_factors: calculation.missing, penalty_factors: calculation.penalties, confidence_inputs: adjustedInputs, confidence_model_version: CONTRACT_VERSION, confidence_calculator_version: "COMPLIANCE-CONFIDENCE-CALC-V1", lineage_reference, replay_reference, truth_ledger_reference, confidence_lineage, confidence_ledger_record: ledger, replay_snapshot, calculation_hash: calculation.calculation_hash, created_timestamp: NOW });
}

export function computeComplianceConfidenceHash(record: ComplianceConfidenceRecord): string {
  return hashValue("compliance-confidence-record", { ...record, calculation_hash: undefined });
}

export function buildComplianceConfidenceRecord(overrides: Partial<ComplianceConfidenceRecord> = {}): ComplianceConfidenceRecord {
  const base = scoreComplianceConfidence();
  return Object.freeze({ ...base, ...overrides });
}

export function validateComplianceConfidenceRecord(record: Partial<ComplianceConfidenceRecord> | undefined): ComplianceConfidenceValidationResult {
  const errors: ComplianceConfidenceValidationFailure[] = [];
  if (!record) errors.push(failure("CONFIDENCE_RECORD_MISSING", "record", "confidence record missing"));
  if (record?.contract_version !== CONTRACT_VERSION) errors.push(failure("UNSUPPORTED_SCHEMA_VERSION", "contract_version", "unsupported confidence contract"));
  if (!record?.confidence_id) errors.push(failure("CONFIDENCE_ID_MISSING", "confidence_id", "confidence id missing"));
  if (!record?.tenant_id) errors.push(failure("TENANT_ID_MISSING", "tenant_id", "tenant id missing"));
  if (!record?.mission_id) errors.push(failure("MISSION_ID_MISSING", "mission_id", "mission id missing"));
  if (!record?.confidence_type || !CONFIDENCE_TYPES.includes(record.confidence_type)) errors.push(failure("UNKNOWN_CONFIDENCE_TYPE", "confidence_type", "unknown confidence type"));
  if (!record?.confidence_inputs) errors.push(failure("CONFIDENCE_INPUTS_MISSING", "confidence_inputs", "confidence inputs missing"));
  if (!record?.confidence_model_version) errors.push(failure("CONFIDENCE_MODEL_MISSING", "confidence_model_version", "confidence model missing"));
  if (!record?.replay_snapshot?.confidence_weights) errors.push(failure("CONFIDENCE_WEIGHTS_MISSING", "replay_snapshot.confidence_weights", "confidence weights missing"));
  if (!record?.compliance_evaluation_id) errors.push(failure("SOURCE_EVALUATION_MISSING", "compliance_evaluation_id", "source evaluation missing"));
  if (!record?.lineage_reference) errors.push(failure("LINEAGE_REFERENCE_MISSING", "lineage_reference", "lineage reference missing"));
  if (record?.lineage_confidence?.lineage_integrity_state === "BROKEN") errors.push(failure("BROKEN_LINEAGE", "lineage_confidence", "broken lineage"));
  if (!record?.replay_reference) errors.push(failure("REPLAY_REFERENCE_MISSING", "replay_reference", "replay reference missing"));
  if (record?.replay_confidence?.replay_validation_state === "MISMATCH") errors.push(failure("REPLAY_MISMATCH", "replay_confidence", "replay mismatch"));
  if (record?.authority_confidence?.authority_verification_state === "FAILED") errors.push(failure("AUTHORITY_VERIFICATION_FAILED", "authority_confidence", "authority verification failed"));
  if (!record?.truth_ledger_reference || !record.confidence_ledger_record?.truth_ledger_reference) errors.push(failure("LEDGER_WRITE_FAILED", "truth_ledger_reference", "confidence ledger write failed"));
  if (record?.confidence_inputs) {
    const expected = calculateConfidenceScore(record.confidence_inputs);
    if (expected.score !== record.confidence_score) errors.push(failure("CONFIDENCE_SCORE_MISMATCH", "confidence_score", "confidence score mismatch"));
    if (expected.level !== record.confidence_level) errors.push(failure("CONFIDENCE_LEVEL_MISMATCH", "confidence_level", "confidence level mismatch"));
    if (expected.calculation_hash !== record.calculation_hash) errors.push(failure("CALCULATION_HASH_MISMATCH", "calculation_hash", "calculation hash mismatch"));
  }
  if (record?.evidence_confidence && record.evidence_confidence.score !== record.confidence_inputs?.evidence_completeness) errors.push(failure("EVIDENCE_CONFIDENCE_MISMATCH", "evidence_confidence", "evidence confidence mismatch"));
  if (record?.rule_coverage && record.rule_coverage.score !== record.confidence_inputs?.rule_coverage) errors.push(failure("COMPLIANCE_CONFIDENCE_MISMATCH", "rule_coverage", "compliance confidence mismatch"));
  if (record?.confidence_type === "RECOMMENDATION_CONFIDENCE" && !record.recommendation_basis?.length) errors.push(failure("RECOMMENDATION_CONFIDENCE_MISMATCH", "recommendation_basis", "recommendation confidence missing finding linkage"));
  if (containsTenantLeak(record, record?.tenant_id)) errors.push(failure("TENANT_SCOPE_VIOLATION", "tenant_id", "cross-tenant confidence input detected"));
  if (isRecord(record) && ("hidden_state" in record || "hidden_confidence_state" in record)) errors.push(failure("HIDDEN_STATE_DETECTED", "record", "hidden confidence state is prohibited"));
  const validation_state: ComplianceConfidenceValidationState = errors.some((error) => ["HIDDEN_STATE_DETECTED", "LEDGER_WRITE_FAILED", "BROKEN_LINEAGE"].includes(error.reason)) ? "CERTIFICATION_BLOCKED" : errors.some((error) => error.reason === "TENANT_SCOPE_VIOLATION") ? "TENANT_SCOPE_VIOLATION" : errors.some((error) => ["REPLAY_MISMATCH", "REPLAY_REFERENCE_MISSING"].includes(error.reason)) ? "REPLAY_MISMATCH" : errors.some((error) => ["CONFIDENCE_INPUTS_MISSING", "CONFIDENCE_MODEL_MISSING", "CONFIDENCE_WEIGHTS_MISSING", "SOURCE_EVALUATION_MISSING"].includes(error.reason)) ? "UNKNOWN" : errors.length ? "INVALID" : "VALID";
  return Object.freeze({ confidence_id: record?.confidence_id, validation_state, validator_version: "COMPLIANCE-CONFIDENCE-VALIDATOR-V1", checks: Object.freeze({ schema_valid: !errors.some((error) => ["CONFIDENCE_RECORD_MISSING", "UNSUPPORTED_SCHEMA_VERSION"].includes(error.reason)), required_fields_present: !errors.some((error) => ["CONFIDENCE_ID_MISSING", "TENANT_ID_MISSING", "MISSION_ID_MISSING"].includes(error.reason)), confidence_type_registered: !errors.some((error) => error.reason === "UNKNOWN_CONFIDENCE_TYPE"), source_evaluation_present: !errors.some((error) => error.reason === "SOURCE_EVALUATION_MISSING"), evidence_confidence_reproducible: !errors.some((error) => error.reason === "EVIDENCE_CONFIDENCE_MISMATCH"), compliance_confidence_reproducible: !errors.some((error) => error.reason === "COMPLIANCE_CONFIDENCE_MISMATCH"), recommendation_confidence_reproducible: !errors.some((error) => error.reason === "RECOMMENDATION_CONFIDENCE_MISMATCH"), score_deterministic: !errors.some((error) => error.reason === "CONFIDENCE_SCORE_MISMATCH"), level_deterministic: !errors.some((error) => error.reason === "CONFIDENCE_LEVEL_MISMATCH"), calculation_hash_valid: !errors.some((error) => error.reason === "CALCULATION_HASH_MISMATCH"), lineage_valid: !errors.some((error) => ["LINEAGE_REFERENCE_MISSING", "BROKEN_LINEAGE"].includes(error.reason)), replay_valid: !errors.some((error) => ["REPLAY_REFERENCE_MISSING", "REPLAY_MISMATCH"].includes(error.reason)), ledger_recorded: !errors.some((error) => error.reason === "LEDGER_WRITE_FAILED"), tenant_isolation_valid: !errors.some((error) => error.reason === "TENANT_SCOPE_VIOLATION"), hidden_state_absent: !errors.some((error) => error.reason === "HIDDEN_STATE_DETECTED") }), errors: Object.freeze(errors), warnings: Object.freeze([]), validation_timestamp: NOW });
}

export function replayComplianceConfidence(record: ComplianceConfidenceRecord): ComplianceConfidenceReplayResult {
  const expected = calculateConfidenceScore(record.confidence_inputs);
  const validation = validateComplianceConfidenceRecord(record);
  const reproduced = validation.validation_state === "VALID" && expected.calculation_hash === record.calculation_hash;
  return Object.freeze({ replay_id: hashValue("compliance-confidence-replay-result", { id: record.confidence_id, hash: expected.calculation_hash }), confidence_id: record.confidence_id, replay_state: reproduced ? "REPRODUCED" : record.replay_snapshot ? "MISMATCH" : "INCOMPLETE", reconstructed_calculation_hash: expected.calculation_hash, expected_calculation_hash: record.calculation_hash, reconstructed_confidence_score: expected.score, expected_confidence_score: record.confidence_score, reconstructed_confidence_level: expected.level, expected_confidence_level: record.confidence_level, failure_reason: reproduced ? null : validation.errors[0]?.reason ?? "CALCULATION_HASH_MISMATCH" });
}

export function buildComplianceConfidenceObservabilitySurface(record = scoreComplianceConfidence()): ComplianceConfidenceObservabilitySurface {
  const validation = validateComplianceConfidenceRecord(record);
  return Object.freeze({ confidence_id: record.confidence_id, confidence_type: record.confidence_type, confidence_level: record.confidence_level, confidence_score: record.confidence_score, supporting_factors: record.supporting_factors, missing_factors: record.missing_factors, penalty_factors: record.penalty_factors, evidence_confidence_score: record.evidence_confidence.score, rule_coverage_score: record.rule_coverage.score, replay_validation_state: record.replay_confidence.replay_validation_state, lineage_integrity_state: record.lineage_confidence.lineage_integrity_state, policy_consistency_state: record.consistency_confidence.state, constitutional_consistency_state: record.consistency_confidence.state, authority_verification_state: record.authority_confidence.authority_verification_state, historical_stability_state: record.historical_stability_confidence.state, calculation_hash: record.calculation_hash, truth_ledger_reference: record.truth_ledger_reference, validation_failures: Object.freeze(validation.errors.map((error) => error.reason)) });
}

export function buildComplianceConfidenceContract() {
  return Object.freeze({ doctrine: buildComplianceConfidenceDoctrine(), baseline_confidence: scoreComplianceConfidence(), evidence_confidence: scoreComplianceConfidence({ confidence_type: "EVIDENCE_CONFIDENCE" }), recommendation_confidence: scoreComplianceConfidence({ confidence_type: "RECOMMENDATION_CONFIDENCE" }) });
}
