import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { analyzeGovernanceWeakness } from "@/services/governance-weakness";
import type { GovernanceRiskCategory, GovernanceRiskSeverity } from "@/types/governance-risk";
import type { GovernanceWeaknessRecord, GovernanceWeaknessReviewPriority } from "@/types/governance-weakness";
import type {
  AuthorityImpact,
  CertificationStatus,
  ControlImportance,
  GovernanceRiskScoreObservabilitySurface,
  GovernanceRiskScoreRecord,
  GovernanceRiskScoreReplayResult,
  GovernanceRiskScoreState,
  GovernanceRiskScoringDoctrine,
  GovernanceRiskScoringFailureReason,
  GovernanceRiskScoringResult,
  GovernanceRiskScoringValidationFailure,
  GovernanceRiskScoringValidationResult,
  GovernanceRiskScoringValidationState,
  HistoricalRecurrence,
  NormalizedRiskScoringInputs,
  OperatorVisibilityStatus,
  PolicyCriticality,
  ReplayImpact,
  RiskDriver,
  RiskEvidenceSummary,
  RiskScoreConfidenceBasis,
  TenantIsolationImpact,
} from "@/types/governance-risk-scoring";
import type { ViolationPatternStrength, ViolationTrendDirection } from "@/types/violation-patterns";

const NOW = "2026-06-25T09:00:00.000Z";
export const RISK_SCORE_SEVERITIES = ["LOW", "MODERATE", "HIGH", "CRITICAL"] as const;
export const RISK_SCORE_STATES = ["SCORED", "VALIDATED", "UNDER_REVIEW", "MITIGATED", "SUPERSEDED", "DISMISSED", "ARCHIVED"] as const;
export const RISK_SCORE_CATEGORIES = ["POLICY_RISK", "AUTHORITY_RISK", "ESCALATION_RISK", "CONTROL_WEAKNESS_RISK", "OVERSIGHT_RISK", "LINEAGE_RISK", "REPLAY_RISK", "TENANT_ISOLATION_RISK", "CERTIFICATION_RISK", "GOVERNANCE_DRIFT_RISK", "EVIDENCE_RISK", "EXCEPTION_RISK"] as const;

const ALLOWED_TRANSITIONS: Readonly<Record<GovernanceRiskScoreState, readonly GovernanceRiskScoreState[]>> = Object.freeze({
  SCORED: Object.freeze(["VALIDATED", "DISMISSED"] as const),
  VALIDATED: Object.freeze(["UNDER_REVIEW", "SUPERSEDED", "ARCHIVED"] as const),
  UNDER_REVIEW: Object.freeze(["MITIGATED", "DISMISSED", "SUPERSEDED"] as const),
  MITIGATED: Object.freeze(["ARCHIVED"] as const),
  SUPERSEDED: Object.freeze(["ARCHIVED"] as const),
  DISMISSED: Object.freeze(["ARCHIVED"] as const),
  ARCHIVED: Object.freeze([] as const),
});

const BASE_SCORES: Readonly<Record<GovernanceRiskCategory, number>> = Object.freeze({
  POLICY_RISK: 10,
  AUTHORITY_RISK: 25,
  ESCALATION_RISK: 20,
  CONTROL_WEAKNESS_RISK: 20,
  OVERSIGHT_RISK: 20,
  LINEAGE_RISK: 20,
  REPLAY_RISK: 30,
  TENANT_ISOLATION_RISK: 40,
  CERTIFICATION_RISK: 25,
  GOVERNANCE_DRIFT_RISK: 25,
  EVIDENCE_RISK: 15,
  EXCEPTION_RISK: 15,
});

const CATEGORY_BY_WEAKNESS: Readonly<Record<string, GovernanceRiskCategory>> = Object.freeze({
  WEAK_CONTROL: "CONTROL_WEAKNESS_RISK",
  MISSING_CONTROL: "CONTROL_WEAKNESS_RISK",
  AMBIGUOUS_POLICY: "POLICY_RISK",
  UNRESOLVED_POLICY_CONFLICT: "POLICY_RISK",
  AUTHORITY_BOUNDARY_WEAKNESS: "AUTHORITY_RISK",
  ESCALATION_PATH_WEAKNESS: "ESCALATION_RISK",
  OVERSIGHT_DEFICIENCY: "OVERSIGHT_RISK",
  REPEATED_EXCEPTION_DEPENDENCY: "EXCEPTION_RISK",
  CERTIFICATION_GAP: "CERTIFICATION_RISK",
  REPLAY_GAP: "REPLAY_RISK",
  LINEAGE_GAP: "LINEAGE_RISK",
  EVIDENCE_GAP: "EVIDENCE_RISK",
  VISIBILITY_GAP: "OVERSIGHT_RISK",
  TENANT_BOUNDARY_WEAKNESS: "TENANT_ISOLATION_RISK",
});

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function uniq(items: readonly (string | undefined)[]): readonly string[] {
  return Object.freeze([...new Set(items.filter((item): item is string => Boolean(item)))].sort());
}

function failure(reason: GovernanceRiskScoringFailureReason, field_path: string, message: string): GovernanceRiskScoringValidationFailure {
  return Object.freeze({ failure_id: hashValue("governance-risk-scoring-validation-failure", { reason, field_path, message }), reason, field_path, message, fail_closed: true });
}

export function buildGovernanceRiskScoringDoctrine(): GovernanceRiskScoringDoctrine {
  return Object.freeze({
    principles: Object.freeze(["advisory-only", "deterministic", "evidence-bound", "tenant-isolated", "lineage-preserving", "replayable", "operator-visible", "fail-closed"] as const),
    prohibited_behaviors: Object.freeze(["policy enforcement", "action approval", "action denial", "authority modification", "violation closure", "automatic remediation", "runtime containment", "operator override", "historical record mutation"]),
    allowed_severities: Object.freeze([...RISK_SCORE_SEVERITIES]),
    allowed_categories: Object.freeze([...RISK_SCORE_CATEGORIES]),
    allowed_states: Object.freeze([...RISK_SCORE_STATES]),
    allowed_state_transitions: ALLOWED_TRANSITIONS,
  });
}

export function mapScoreToSeverity(score: number): GovernanceRiskSeverity {
  if (score >= 75) return "CRITICAL";
  if (score >= 50) return "HIGH";
  if (score >= 25) return "MODERATE";
  return "LOW";
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function strengthRank(strength: ViolationPatternStrength): number {
  return strength === "SEVERE" ? 1 : strength === "STRONG" ? 0.8 : strength === "MODERATE" ? 0.5 : 0.25;
}

function priorityFor(severity: GovernanceRiskSeverity, category: GovernanceRiskCategory): GovernanceWeaknessReviewPriority {
  if (category === "TENANT_ISOLATION_RISK" || severity === "CRITICAL") return "IMMEDIATE_REVIEW";
  if (severity === "HIGH" || category === "AUTHORITY_RISK" || category === "REPLAY_RISK" || category === "CERTIFICATION_RISK") return "PRIORITY_REVIEW";
  if (severity === "MODERATE") return "STANDARD_REVIEW";
  return "WATCH";
}

export function selectRiskCategory(weakness: GovernanceWeaknessRecord): GovernanceRiskCategory {
  return CATEGORY_BY_WEAKNESS[weakness.weakness_category] ?? "GOVERNANCE_DRIFT_RISK";
}

export function normalizeScoringInputs(weakness: GovernanceWeaknessRecord, overrides: Partial<NormalizedRiskScoringInputs> = {}): NormalizedRiskScoringInputs {
  const pattern = weakness.supporting_patterns[0];
  const category = weakness.weakness_category;
  const defaults: NormalizedRiskScoringInputs = {
    risk_source_severity: category === "TENANT_BOUNDARY_WEAKNESS" ? "CRITICAL" : category === "AUTHORITY_BOUNDARY_WEAKNESS" || category === "REPLAY_GAP" || category === "CERTIFICATION_GAP" ? "HIGH" : "MODERATE",
    pattern_frequency: pattern?.frequency ?? weakness.weakness_indicators.violation_frequency,
    pattern_trend: (pattern?.trend_direction ?? "INCREASING") as ViolationTrendDirection,
    pattern_strength: (pattern?.pattern_strength ?? "STRONG") as ViolationPatternStrength,
    weakness_category: category,
    control_importance: category === "WEAK_CONTROL" ? "HIGH_IMPORTANCE" : category === "TENANT_BOUNDARY_WEAKNESS" ? "CRITICAL_IMPORTANCE" : "STANDARD_IMPORTANCE",
    policy_criticality: category === "TENANT_BOUNDARY_WEAKNESS" || category === "AUTHORITY_BOUNDARY_WEAKNESS" ? "CRITICAL" : "HIGH",
    authority_impact: category === "AUTHORITY_BOUNDARY_WEAKNESS" ? "SEVERE" : "NONE",
    tenant_isolation_impact: category === "TENANT_BOUNDARY_WEAKNESS" ? "CONFIRMED" : "NONE",
    replay_impact: category === "REPLAY_GAP" ? "MISMATCH" : "NONE",
    lineage_completeness: weakness.confidence_basis.lineage_completeness,
    evidence_completeness: weakness.weakness_indicators.evidence_completeness,
    certification_status: category === "CERTIFICATION_GAP" ? "FAIL" : "PASS",
    operator_visibility_status: category === "VISIBILITY_GAP" ? "INCOMPLETE" : "COMPLETE",
    historical_recurrence: weakness.weakness_indicators.violation_frequency >= 4 ? "HIGH" : "LOW",
  };
  return Object.freeze({ ...defaults, ...overrides });
}

export function calculateBaseScore(category: GovernanceRiskCategory): number {
  return BASE_SCORES[category];
}

function driver(type: string, description: string, impact: number, evidence_refs: readonly string[]): RiskDriver {
  return Object.freeze({ driver_type: type, driver_description: description, score_impact: impact, evidence_refs: Object.freeze([...evidence_refs]) });
}

export function calculateModifiers(inputs: NormalizedRiskScoringInputs, evidence_refs: readonly string[]): { modifier_score: number; rules: readonly string[]; drivers: readonly RiskDriver[] } {
  const rules: string[] = [];
  const drivers: RiskDriver[] = [];
  const add = (rule: string, impact: number, description: string) => {
    rules.push(rule);
    drivers.push(driver(rule, description, impact, evidence_refs.slice(0, 3)));
  };
  if (inputs.pattern_frequency >= 3) add("recurring_pattern", 10, "Recurring governance pattern exceeded the scoring threshold.");
  if (inputs.pattern_trend === "INCREASING") add("increasing_trend", 10, "Pattern trend is increasing in the scoring window.");
  if (inputs.pattern_strength === "SEVERE") add("severe_pattern_strength", 15, "Pattern strength is severe.");
  if (inputs.pattern_strength === "STRONG") add("strong_pattern_strength", 10, "Pattern strength is strong.");
  if (inputs.weakness_category === "REPEATED_EXCEPTION_DEPENDENCY") add("repeated_exception_dependency", 10, "Weakness shows repeated exception dependency.");
  if (inputs.evidence_completeness < 0.6) add("weak_evidence", 5, "Evidence completeness is below the configured threshold.");
  if (inputs.policy_criticality === "CRITICAL") add("critical_policy", 15, "Critical policy or boundary is affected.");
  if (inputs.control_importance === "HIGH_IMPORTANCE") add("high_importance_control", 10, "High importance governance control is affected.");
  if (inputs.control_importance === "CRITICAL_IMPORTANCE") add("critical_importance_control", 20, "Critical governance control is affected.");
  if (inputs.authority_impact === "MATERIAL") add("authority_drift_detected", 15, "Authority impact is material.");
  if (inputs.authority_impact === "SEVERE") add("authority_expansion_detected", 25, "Authority impact is severe.");
  if (inputs.replay_impact === "MISMATCH") add("replay_mismatch", 20, "Replay mismatch affects risk reconstruction.");
  if (inputs.replay_impact === "UNREPLAYABLE") add("unreplayable_behavior", 30, "Governance behavior is unreplayable.");
  if (inputs.lineage_completeness < 0.8) add("lineage_gap", 10, "Lineage completeness is below threshold.");
  if (inputs.certification_status === "FAIL") add("certification_failure", 15, "Related certification status failed.");
  if (inputs.operator_visibility_status === "PARTIAL") add("operator_visibility_partial", 5, "Operator visibility is partial.");
  if (inputs.operator_visibility_status === "INCOMPLETE" || inputs.operator_visibility_status === "HIDDEN") add("operator_visibility_missing", 10, "Operator visibility is missing or incomplete.");
  if (inputs.tenant_isolation_impact === "POTENTIAL") add("tenant_isolation_implicated", 25, "Tenant isolation is implicated.");
  if (inputs.tenant_isolation_impact === "CONFIRMED" || inputs.tenant_isolation_impact === "SEVERE") add("confirmed_tenant_boundary_issue", 35, "Tenant boundary issue is confirmed.");
  if (inputs.pattern_trend === "DECREASING") add("decreasing_trend", -5, "Pattern trend is decreasing.");
  if (inputs.evidence_completeness >= 0.95) add("evidence_complete", -5, "Evidence is complete.");
  if (inputs.lineage_completeness >= 0.95) add("lineage_complete", -5, "Lineage is complete.");
  if (inputs.replay_impact === "NONE") add("replay_successful", -5, "Replay references support reconstruction.");
  return Object.freeze({ modifier_score: drivers.reduce((sum, item) => sum + item.score_impact, 0), rules: Object.freeze(rules), drivers: Object.freeze(drivers) });
}

export function applyCriticalFloors(score: number, inputs: NormalizedRiskScoringInputs): { final_score: number; rules: readonly string[] } {
  const rules: string[] = [];
  let final_score = score;
  if (inputs.tenant_isolation_impact === "CONFIRMED" || inputs.tenant_isolation_impact === "SEVERE") {
    final_score = Math.max(final_score, 75);
    rules.push("confirmed_tenant_boundary_issue");
  }
  if (inputs.authority_impact === "SEVERE") {
    final_score = Math.max(final_score, 50);
    rules.push("authority_expansion_beyond_scope");
  }
  if (inputs.replay_impact === "UNREPLAYABLE") {
    final_score = Math.max(final_score, 75);
    rules.push("unreplayable_critical_governance_behavior");
  }
  if (inputs.certification_status === "FAIL" && inputs.replay_impact !== "NONE") {
    final_score = Math.max(final_score, 75);
    rules.push("repeated_certification_failure_affecting_replay");
  }
  return Object.freeze({ final_score: clampScore(final_score), rules: Object.freeze(rules) });
}

export function calculateRiskConfidence(inputs: NormalizedRiskScoringInputs, weakness: GovernanceWeaknessRecord): { confidence_score: number; confidence_basis: RiskScoreConfidenceBasis } {
  const basis: RiskScoreConfidenceBasis = Object.freeze({
    evidence_completeness: inputs.evidence_completeness,
    source_reliability: 0.93,
    lineage_completeness: inputs.lineage_completeness,
    replay_success: inputs.replay_impact === "NONE" ? 1 : inputs.replay_impact === "PARTIAL" ? 0.65 : 0.35,
    policy_match_strength: 0.88,
    pattern_strength: strengthRank(inputs.pattern_strength),
    weakness_confidence: weakness.confidence_score,
    data_consistency: 0.95,
  });
  const confidence_score = Number((basis.evidence_completeness * 0.2 + basis.source_reliability * 0.15 + basis.lineage_completeness * 0.15 + basis.replay_success * 0.15 + basis.policy_match_strength * 0.1 + basis.pattern_strength * 0.1 + basis.weakness_confidence * 0.1 + basis.data_consistency * 0.05).toFixed(2));
  return Object.freeze({ confidence_score, confidence_basis: basis });
}

export function generateGovernanceRiskScoreId(tenant_id: string, mission_id: string, weakness_id: string): string {
  return `GRSCORE-${hashValue("governance-risk-score-id", { tenant_id, mission_id, weakness_id }).slice(0, 12).toUpperCase()}`;
}

function evidenceSummary(weakness: GovernanceWeaknessRecord, patterns: readonly string[]): RiskEvidenceSummary {
  return Object.freeze({
    supporting_evidence_count: weakness.evidence_refs.length,
    policy_refs_count: weakness.related_policies.length,
    violation_refs_count: weakness.related_violations.length,
    exception_refs_count: weakness.related_exceptions.length,
    escalation_refs_count: weakness.related_escalations.length,
    related_pattern_count: patterns.length,
    related_weakness_count: 1,
    replay_refs_count: weakness.replay_refs.length,
    lineage_refs_count: weakness.lineage_refs.length,
    evidence_completeness: weakness.weakness_indicators.evidence_completeness,
    strongest_evidence_refs: Object.freeze(weakness.evidence_refs.slice(0, 3)),
    weakest_evidence_refs: Object.freeze(weakness.weakness_indicators.evidence_completeness < 1 ? weakness.evidence_refs.slice(-2) : []),
    missing_evidence: Object.freeze(weakness.weakness_indicators.evidence_completeness < 1 ? ["escalation_acknowledgement_record"] : []),
  });
}

export function canonicalizeGovernanceRiskScore(record: Omit<GovernanceRiskScoreRecord, "risk_hash">): string {
  return canonicalizeConfidenceToString(record);
}

export function computeGovernanceRiskScoreHash(record: Omit<GovernanceRiskScoreRecord, "risk_hash"> | GovernanceRiskScoreRecord): string {
  const { risk_hash: _previousHash, ...source } = record as GovernanceRiskScoreRecord;
  return hashConfidenceValue("governance-risk-score-contract", canonicalizeGovernanceRiskScore(source));
}

function explanationFor(record: Omit<GovernanceRiskScoreRecord, "risk_hash" | "risk_replay_package">): string {
  return `Risk ${record.risk_severity} scored at ${record.risk_score} for ${record.risk_category}. Base score ${record.scoring_basis.base_score} and modifier score ${record.scoring_basis.modifier_score} were derived from ${record.scoring_basis.scoring_rules_applied.join(", ")}. Confidence is ${record.confidence_score} from evidence completeness ${record.confidence_basis.evidence_completeness}, lineage completeness ${record.confidence_basis.lineage_completeness}, replay status ${record.replay_status}, and weakness confidence ${record.confidence_basis.weakness_confidence}. Evidence summary contains ${record.evidence_summary.supporting_evidence_count} supporting records. Review priority is ${record.recommended_review_priority}.`;
}

function buildReplayPackage(record: Omit<GovernanceRiskScoreRecord, "risk_hash" | "risk_replay_package">, source_hashes: readonly string[]) {
  const scoring_input_refs = Object.freeze({
    policy_refs: record.related_policies,
    violation_refs: record.related_violations,
    exception_refs: record.related_exceptions,
    escalation_refs: record.related_escalations,
    pattern_refs: record.related_patterns,
    weakness_refs: record.related_weaknesses,
    evidence_refs: record.evidence_refs,
    lineage_refs: record.lineage_refs,
    replay_refs: record.replay_refs,
    certification_refs: Object.freeze([] as string[]),
    operator_visibility_refs: Object.freeze(record.operator_visibility_status === "COMPLETE" ? ["operator_visibility_complete"] : ["operator_visibility_gap"]),
  });
  const scoring_result_hash = hashValue("governance-risk-score-result", { final_score: record.risk_score, severity: record.risk_severity, confidence: record.confidence_score, drivers: record.risk_drivers });
  return Object.freeze({
    governance_risk_id: record.governance_risk_id,
    tenant_id: record.tenant_id,
    mission_id: record.mission_id,
    scoring_model_version: "GOV-RISK-SCORE-V1",
    confidence_model_version: "GOV-RISK-CONFIDENCE-V1",
    severity_threshold_version: "GOV-RISK-THRESHOLD-V1",
    driver_extraction_model_version: "GOV-RISK-DRIVER-V1",
    explanation_model_version: "GOV-RISK-EXPLANATION-V1",
    scoring_input_refs,
    normalized_scoring_inputs: record.scoring_basis.scoring_inputs,
    source_record_hashes: Object.freeze([...source_hashes].sort()),
    scoring_result_hash,
    risk_hash: hashValue("governance-risk-score-replay", { scoring_result_hash, source_hashes }),
  });
}

function buildScoreFromWeakness(weakness: GovernanceWeaknessRecord, overrides: Partial<NormalizedRiskScoringInputs> = {}): GovernanceRiskScoreRecord {
  const risk_category = selectRiskCategory(weakness);
  const inputs = normalizeScoringInputs(weakness, overrides);
  const base_score = calculateBaseScore(risk_category);
  const modifiers = calculateModifiers(inputs, weakness.evidence_refs);
  const floor = applyCriticalFloors(base_score + modifiers.modifier_score, inputs);
  const risk_score = floor.final_score;
  const risk_severity = mapScoreToSeverity(risk_score);
  const confidence = calculateRiskConfidence(inputs, weakness);
  const related_patterns = weakness.supporting_patterns.map((pattern) => pattern.violation_pattern_id).sort();
  const evidence_summary = evidenceSummary(weakness, related_patterns);
  const priority = priorityFor(risk_severity, risk_category);
  const sourceWithoutReplay: Omit<GovernanceRiskScoreRecord, "risk_hash" | "risk_replay_package"> = {
    contract_version: "GOV-RISK-SCORE-CONTRACT-V1",
    governance_risk_id: generateGovernanceRiskScoreId(weakness.tenant_id, weakness.mission_id, weakness.governance_weakness_id),
    tenant_id: weakness.tenant_id,
    mission_id: weakness.mission_id,
    governance_intelligence_id: weakness.governance_intelligence_id,
    policy_intelligence_id: weakness.policy_intelligence_id,
    governance_weakness_id: weakness.governance_weakness_id,
    violation_pattern_refs: related_patterns,
    risk_category,
    risk_severity,
    risk_score,
    confidence_score: confidence.confidence_score,
    confidence_basis: confidence.confidence_basis,
    scoring_basis: Object.freeze({ scoring_model_version: "GOV-RISK-SCORE-V1", confidence_model_version: "GOV-RISK-CONFIDENCE-V1", severity_threshold_version: "GOV-RISK-THRESHOLD-V1", base_score, modifier_score: modifiers.modifier_score, final_score: risk_score, severity_threshold_result: risk_severity, scoring_inputs: inputs, scoring_rules_applied: modifiers.rules, critical_floor_rules_applied: floor.rules }),
    risk_drivers: Object.freeze([driver("BASE_SCORE", `Base score selected from ${risk_category}.`, base_score, weakness.evidence_refs.slice(0, 3)), ...modifiers.drivers]),
    evidence_summary,
    related_policies: weakness.related_policies,
    related_controls: weakness.related_controls,
    related_violations: weakness.related_violations,
    related_exceptions: weakness.related_exceptions,
    related_escalations: weakness.related_escalations,
    related_patterns,
    related_weaknesses: Object.freeze([weakness.governance_weakness_id]),
    tenant_isolation_status: inputs.tenant_isolation_impact === "CONFIRMED" ? "CONFIRMED" : inputs.tenant_isolation_impact === "SEVERE" ? "SEVERE" : inputs.tenant_isolation_impact === "POTENTIAL" ? "POTENTIAL" : "VALID",
    lineage_status: inputs.lineage_completeness >= 0.95 ? "COMPLETE" : inputs.lineage_completeness > 0 ? "PARTIAL" : "BROKEN",
    replay_status: inputs.replay_impact === "NONE" ? "REPLAY_SUCCESSFUL" : inputs.replay_impact === "PARTIAL" ? "REPLAY_INCOMPLETE" : "REPLAY_MISMATCH",
    certification_status: inputs.certification_status,
    operator_visibility_status: inputs.operator_visibility_status,
    evidence_refs: weakness.evidence_refs,
    lineage_refs: weakness.lineage_refs,
    replay_refs: weakness.replay_refs,
    risk_detected_timestamp: weakness.created_timestamp,
    risk_window: { start: weakness.analysis_window.start, end: weakness.analysis_window.end, window_type: "30_DAY_ROLLING" },
    scored_timestamp: NOW,
    explanation: "",
    recommended_operator_review: priority !== "WATCH",
    recommended_review_priority: priority,
    risk_state: "VALIDATED",
    scoring_model_version: "GOV-RISK-SCORE-V1",
    confidence_model_version: "GOV-RISK-CONFIDENCE-V1",
    severity_threshold_version: "GOV-RISK-THRESHOLD-V1",
    driver_extraction_model_version: "GOV-RISK-DRIVER-V1",
    explanation_model_version: "GOV-RISK-EXPLANATION-V1",
  };
  const withExplanation = { ...sourceWithoutReplay, explanation: explanationFor(sourceWithoutReplay) };
  const replay = buildReplayPackage(withExplanation, [weakness.weakness_hash, ...weakness.supporting_patterns.map((pattern) => pattern.pattern_hash)]);
  return Object.freeze({ ...withExplanation, risk_replay_package: replay, risk_hash: computeGovernanceRiskScoreHash({ ...withExplanation, risk_replay_package: replay }) });
}

export function scoreGovernanceRisk(input: { weaknesses?: readonly GovernanceWeaknessRecord[]; overrides?: Partial<NormalizedRiskScoringInputs> } = {}): GovernanceRiskScoringResult {
  const weaknesses = input.weaknesses ?? analyzeGovernanceWeakness().weaknesses;
  const scores = weaknesses.map((weakness) => buildScoreFromWeakness(weakness, input.overrides));
  return Object.freeze({ scoring_engine_version: "GOV-RISK-SCORE-V1", tenant_id: weaknesses[0]?.tenant_id ?? "tenant_alpha", mission_id: weaknesses[0]?.mission_id ?? "mission_query_layer", scores: Object.freeze(scores.sort((a, b) => a.risk_category.localeCompare(b.risk_category))) });
}

export function buildGovernanceRiskScoreRecord(overrides: Partial<GovernanceRiskScoreRecord> = {}): GovernanceRiskScoreRecord {
  const has = (key: keyof GovernanceRiskScoreRecord) => Object.prototype.hasOwnProperty.call(overrides, key);
  const detected = scoreGovernanceRisk().scores.find((score) => score.risk_category === "CONTROL_WEAKNESS_RISK") ?? scoreGovernanceRisk().scores[0];
  const sourceWithoutReplay: Omit<GovernanceRiskScoreRecord, "risk_hash" | "risk_replay_package"> = {
    ...detected,
    contract_version: has("contract_version") ? overrides.contract_version! : detected.contract_version,
    governance_risk_id: has("governance_risk_id") ? overrides.governance_risk_id! : detected.governance_risk_id,
    tenant_id: has("tenant_id") ? overrides.tenant_id! : detected.tenant_id,
    mission_id: has("mission_id") ? overrides.mission_id! : detected.mission_id,
    governance_intelligence_id: has("governance_intelligence_id") ? overrides.governance_intelligence_id! : detected.governance_intelligence_id,
    policy_intelligence_id: has("policy_intelligence_id") ? overrides.policy_intelligence_id! : detected.policy_intelligence_id,
    governance_weakness_id: has("governance_weakness_id") ? overrides.governance_weakness_id! : detected.governance_weakness_id,
    violation_pattern_refs: has("violation_pattern_refs") ? overrides.violation_pattern_refs! : detected.violation_pattern_refs,
    risk_category: has("risk_category") ? overrides.risk_category! : detected.risk_category,
    risk_severity: has("risk_severity") ? overrides.risk_severity! : detected.risk_severity,
    risk_score: has("risk_score") ? overrides.risk_score! : detected.risk_score,
    confidence_score: has("confidence_score") ? overrides.confidence_score! : detected.confidence_score,
    confidence_basis: has("confidence_basis") ? overrides.confidence_basis! : detected.confidence_basis,
    scoring_basis: has("scoring_basis") ? overrides.scoring_basis! : detected.scoring_basis,
    risk_drivers: has("risk_drivers") ? overrides.risk_drivers! : detected.risk_drivers,
    evidence_summary: has("evidence_summary") ? overrides.evidence_summary! : detected.evidence_summary,
    related_policies: has("related_policies") ? overrides.related_policies! : detected.related_policies,
    related_controls: has("related_controls") ? overrides.related_controls! : detected.related_controls,
    related_violations: has("related_violations") ? overrides.related_violations! : detected.related_violations,
    related_exceptions: has("related_exceptions") ? overrides.related_exceptions! : detected.related_exceptions,
    related_escalations: has("related_escalations") ? overrides.related_escalations! : detected.related_escalations,
    related_patterns: has("related_patterns") ? overrides.related_patterns! : detected.related_patterns,
    related_weaknesses: has("related_weaknesses") ? overrides.related_weaknesses! : detected.related_weaknesses,
    tenant_isolation_status: has("tenant_isolation_status") ? overrides.tenant_isolation_status! : detected.tenant_isolation_status,
    lineage_status: has("lineage_status") ? overrides.lineage_status! : detected.lineage_status,
    replay_status: has("replay_status") ? overrides.replay_status! : detected.replay_status,
    certification_status: has("certification_status") ? overrides.certification_status! : detected.certification_status,
    operator_visibility_status: has("operator_visibility_status") ? overrides.operator_visibility_status! : detected.operator_visibility_status,
    evidence_refs: has("evidence_refs") ? overrides.evidence_refs! : detected.evidence_refs,
    lineage_refs: has("lineage_refs") ? overrides.lineage_refs! : detected.lineage_refs,
    replay_refs: has("replay_refs") ? overrides.replay_refs! : detected.replay_refs,
    risk_detected_timestamp: has("risk_detected_timestamp") ? overrides.risk_detected_timestamp! : detected.risk_detected_timestamp,
    risk_window: has("risk_window") ? overrides.risk_window! : detected.risk_window,
    scored_timestamp: has("scored_timestamp") ? overrides.scored_timestamp! : detected.scored_timestamp,
    explanation: has("explanation") ? overrides.explanation! : detected.explanation,
    recommended_operator_review: has("recommended_operator_review") ? overrides.recommended_operator_review! : detected.recommended_operator_review,
    recommended_review_priority: has("recommended_review_priority") ? overrides.recommended_review_priority! : detected.recommended_review_priority,
    risk_state: has("risk_state") ? overrides.risk_state! : detected.risk_state,
    scoring_model_version: has("scoring_model_version") ? overrides.scoring_model_version! : detected.scoring_model_version,
    confidence_model_version: has("confidence_model_version") ? overrides.confidence_model_version! : detected.confidence_model_version,
    severity_threshold_version: has("severity_threshold_version") ? overrides.severity_threshold_version! : detected.severity_threshold_version,
    driver_extraction_model_version: has("driver_extraction_model_version") ? overrides.driver_extraction_model_version! : detected.driver_extraction_model_version,
    explanation_model_version: has("explanation_model_version") ? overrides.explanation_model_version! : detected.explanation_model_version,
  };
  const replay = overrides.risk_replay_package ?? detected.risk_replay_package;
  return Object.freeze({ ...sourceWithoutReplay, risk_replay_package: replay, risk_hash: overrides.risk_hash ?? computeGovernanceRiskScoreHash({ ...sourceWithoutReplay, risk_replay_package: replay }) });
}

export function validateGovernanceRiskScoreRecord(record: Partial<GovernanceRiskScoreRecord> | undefined, context: { original_record?: GovernanceRiskScoreRecord } = {}): GovernanceRiskScoringValidationResult {
  const errors: GovernanceRiskScoringValidationFailure[] = [];
  if (!record) errors.push(failure("CONTRACT_MISSING", "record", "risk score contract missing"));
  if (record?.contract_version !== "GOV-RISK-SCORE-CONTRACT-V1") errors.push(failure("UNSUPPORTED_SCHEMA_VERSION", "contract_version", "unsupported contract version"));
  if (!record?.governance_risk_id) errors.push(failure("RISK_ID_MISSING", "governance_risk_id", "governance_risk_id missing"));
  if (!record?.tenant_id) errors.push(failure("TENANT_ID_MISSING", "tenant_id", "tenant_id missing"));
  if (!record?.mission_id) errors.push(failure("MISSION_ID_MISSING", "mission_id", "mission_id missing"));
  if (!record?.scoring_basis?.scoring_inputs) errors.push(failure("SCORING_INPUTS_MISSING", "scoring_basis.scoring_inputs", "scoring inputs missing"));
  if (!record?.risk_category || !(RISK_SCORE_CATEGORIES as readonly string[]).includes(record.risk_category)) errors.push(failure("UNKNOWN_RISK_CATEGORY", "risk_category", "unknown risk category"));
  if (!record?.risk_severity || !(RISK_SCORE_SEVERITIES as readonly string[]).includes(record.risk_severity)) errors.push(failure("INVALID_SEVERITY", "risk_severity", "invalid risk severity"));
  if (!record?.risk_state || !(RISK_SCORE_STATES as readonly string[]).includes(record.risk_state)) errors.push(failure("INVALID_STATE", "risk_state", "invalid risk state"));
  if (typeof record?.risk_score !== "number" || record.risk_score < 0 || record.risk_score > 100) errors.push(failure("INVALID_RISK_SCORE", "risk_score", "invalid risk score"));
  if (!record?.scoring_model_version) errors.push(failure("SCORING_MODEL_VERSION_MISSING", "scoring_model_version", "scoring model version missing"));
  if (!record?.confidence_model_version) errors.push(failure("CONFIDENCE_MODEL_VERSION_MISSING", "confidence_model_version", "confidence model version missing"));
  if (!record?.severity_threshold_version) errors.push(failure("THRESHOLD_VERSION_MISSING", "severity_threshold_version", "threshold version missing"));
  if (!record?.driver_extraction_model_version) errors.push(failure("DRIVER_MODEL_VERSION_MISSING", "driver_extraction_model_version", "driver model version missing"));
  if (!record?.explanation_model_version) errors.push(failure("EXPLANATION_MODEL_VERSION_MISSING", "explanation_model_version", "explanation model version missing"));
  const inputs = record?.scoring_basis?.scoring_inputs;
  if (inputs?.weakness_category && !["WEAK_CONTROL", "MISSING_CONTROL", "AMBIGUOUS_POLICY", "UNRESOLVED_POLICY_CONFLICT", "AUTHORITY_BOUNDARY_WEAKNESS", "ESCALATION_PATH_WEAKNESS", "OVERSIGHT_DEFICIENCY", "REPEATED_EXCEPTION_DEPENDENCY", "CERTIFICATION_GAP", "REPLAY_GAP", "LINEAGE_GAP", "EVIDENCE_GAP", "VISIBILITY_GAP", "TENANT_BOUNDARY_WEAKNESS"].includes(inputs.weakness_category)) errors.push(failure("UNKNOWN_WEAKNESS_CATEGORY", "scoring_basis.scoring_inputs.weakness_category", "unknown weakness category"));
  if (inputs?.pattern_strength && !["WEAK", "MODERATE", "STRONG", "SEVERE"].includes(inputs.pattern_strength)) errors.push(failure("INVALID_PATTERN_STRENGTH", "scoring_basis.scoring_inputs.pattern_strength", "invalid pattern strength"));
  if (inputs?.pattern_trend && !["INCREASING", "DECREASING", "STABLE", "VOLATILE", "NEW", "INSUFFICIENT_HISTORY"].includes(inputs.pattern_trend)) errors.push(failure("INVALID_TREND_DIRECTION", "scoring_basis.scoring_inputs.pattern_trend", "invalid trend direction"));
  if (record?.risk_category && record.scoring_basis && calculateBaseScore(record.risk_category) !== record.scoring_basis.base_score) errors.push(failure("BASE_SCORE_MISMATCH", "scoring_basis.base_score", "base score mismatch"));
  if (record?.scoring_basis && record.risk_drivers?.length) {
    const driverModifier = record.risk_drivers.filter((item) => item.driver_type !== "BASE_SCORE").reduce((sum, item) => sum + item.score_impact, 0);
    if (driverModifier !== record.scoring_basis.modifier_score) errors.push(failure("MODIFIER_SCORE_MISMATCH", "scoring_basis.modifier_score", "modifier score mismatch"));
  }
  if (typeof record?.risk_score === "number" && record.risk_severity && mapScoreToSeverity(record.risk_score) !== record.risk_severity) errors.push(failure("THRESHOLD_MISMATCH", "risk_severity", "severity threshold mismatch"));
  if (!record?.confidence_basis) errors.push(failure("CONFIDENCE_BASIS_MISSING", "confidence_basis", "confidence basis missing"));
  if (record?.confidence_score === undefined || record.confidence_score < 0 || record.confidence_score > 1) errors.push(failure("CONFIDENCE_MISMATCH", "confidence_score", "confidence score invalid"));
  if (!record?.risk_drivers?.length) errors.push(failure("RISK_DRIVERS_MISSING", "risk_drivers", "risk drivers missing"));
  if (record?.risk_drivers?.some((item) => !item.evidence_refs.length)) errors.push(failure("RISK_DRIVER_EVIDENCE_MISSING", "risk_drivers", "risk driver lacks evidence"));
  if (!record?.evidence_summary) errors.push(failure("EVIDENCE_SUMMARY_MISSING", "evidence_summary", "evidence summary missing"));
  if (!record?.evidence_refs?.length) errors.push(failure("EVIDENCE_REFS_MISSING", "evidence_refs", "evidence refs missing"));
  if (!record?.lineage_refs?.length) errors.push(failure("LINEAGE_REFS_MISSING", "lineage_refs", "lineage refs missing"));
  if (!record?.replay_refs?.length || !record.risk_replay_package?.scoring_result_hash) errors.push(failure("REPLAY_REFS_MISSING", "replay_refs", "replay refs missing"));
  if (!record?.risk_replay_package?.source_record_hashes?.length) errors.push(failure("SOURCE_HASHES_MISSING", "risk_replay_package.source_record_hashes", "source hashes missing"));
  if (record?.evidence_refs?.some((ref) => ref.includes("tenant_beta")) || record?.related_policies?.some((ref) => ref.includes("tenant_beta"))) errors.push(failure("TENANT_SCOPE_VIOLATION", "references", "cross-tenant scoring input detected"));
  if ((record as { hidden_scoring_state?: unknown } | undefined)?.hidden_scoring_state !== undefined) errors.push(failure("HIDDEN_SCORING_STATE", "hidden_scoring_state", "hidden scoring state prohibited"));
  if (!record?.explanation || !record.explanation.includes("Risk") || record.explanation.includes("unsupported claim")) errors.push(failure(record?.explanation?.includes("unsupported claim") ? "UNSUPPORTED_EXPLANATION" : "UNSUPPORTED_EXPLANATION", "explanation", "unsupported scoring explanation"));
  if (typeof record?.recommended_operator_review !== "boolean") errors.push(failure("OPERATOR_REVIEW_FLAG_MISSING", "recommended_operator_review", "operator review flag missing"));
  if (context.original_record && (context.original_record.governance_risk_id !== record?.governance_risk_id || context.original_record.tenant_id !== record?.tenant_id || context.original_record.mission_id !== record?.mission_id || context.original_record.scored_timestamp !== record?.scored_timestamp)) errors.push(failure("IDENTITY_MUTATION", "identity", "immutable risk score identity mutated"));
  if (record?.risk_hash && computeGovernanceRiskScoreHash(record as GovernanceRiskScoreRecord) !== record.risk_hash) errors.push(failure("RISK_HASH_MISMATCH", "risk_hash", "risk score hash mismatch"));
  const state: GovernanceRiskScoringValidationState = errors.some((error) => error.reason === "TENANT_SCOPE_VIOLATION") ? "TENANT_SCOPE_VIOLATION" : errors.some((error) => error.reason === "REPLAY_REFS_MISSING" || error.reason === "RISK_HASH_MISMATCH") ? "REPLAY_REFERENCE_MISSING" : errors.some((error) => error.reason === "LINEAGE_REFS_MISSING") ? "LINEAGE_REFERENCE_MISSING" : errors.some((error) => error.reason === "INVALID_STATE") ? "INVALID_STATE" : errors.length ? "INVALID" : "VALID";
  return Object.freeze({
    governance_risk_id: record?.governance_risk_id,
    validation_state: state,
    validator_version: "GOV-RISK-SCORE-VALIDATOR-V1",
    checks: Object.freeze({
      schema_valid: !errors.some((error) => ["CONTRACT_MISSING", "UNSUPPORTED_SCHEMA_VERSION"].includes(error.reason)),
      required_fields_present: !errors.some((error) => ["REQUIRED_FIELD_MISSING", "TENANT_ID_MISSING", "MISSION_ID_MISSING", "RISK_ID_MISSING", "SCORING_INPUTS_MISSING"].includes(error.reason)),
      category_valid: !errors.some((error) => error.reason === "UNKNOWN_RISK_CATEGORY"),
      severity_valid: !errors.some((error) => error.reason === "INVALID_SEVERITY" || error.reason === "THRESHOLD_MISMATCH"),
      scoring_basis_valid: !errors.some((error) => ["BASE_SCORE_MISMATCH", "MODIFIER_SCORE_MISMATCH", "SCORING_MODEL_VERSION_MISSING", "THRESHOLD_VERSION_MISSING"].includes(error.reason)),
      confidence_valid: !errors.some((error) => error.reason === "CONFIDENCE_MISMATCH" || error.reason === "CONFIDENCE_BASIS_MISSING"),
      risk_drivers_valid: !errors.some((error) => error.reason === "RISK_DRIVERS_MISSING" || error.reason === "RISK_DRIVER_EVIDENCE_MISSING"),
      evidence_summary_valid: !errors.some((error) => error.reason === "EVIDENCE_SUMMARY_MISSING"),
      evidence_refs_valid: !errors.some((error) => error.reason === "EVIDENCE_REFS_MISSING"),
      lineage_refs_valid: !errors.some((error) => error.reason === "LINEAGE_REFS_MISSING"),
      replay_refs_valid: !errors.some((error) => error.reason === "REPLAY_REFS_MISSING" || error.reason === "RISK_HASH_MISMATCH"),
      tenant_isolation_valid: !errors.some((error) => error.reason === "TENANT_SCOPE_VIOLATION"),
      lifecycle_state_valid: !errors.some((error) => error.reason === "INVALID_STATE" || error.reason === "INVALID_STATE_TRANSITION"),
    }),
    errors: Object.freeze(errors),
    warnings: Object.freeze([]),
    validation_timestamp: NOW,
  });
}

export function transitionGovernanceRiskScoreState(record: GovernanceRiskScoreRecord, to_state: GovernanceRiskScoreState): GovernanceRiskScoringValidationResult {
  if (!ALLOWED_TRANSITIONS[record.risk_state]?.includes(to_state)) {
    return Object.freeze({ ...validateGovernanceRiskScoreRecord(record), validation_state: "INVALID_STATE" as const, errors: Object.freeze([failure("INVALID_STATE_TRANSITION", "risk_state", `${record.risk_state} to ${to_state} blocked`)]) });
  }
  const { risk_hash: _previousHash, ...source } = record;
  return validateGovernanceRiskScoreRecord({ ...source, risk_state: to_state, risk_hash: computeGovernanceRiskScoreHash({ ...source, risk_state: to_state }) });
}

export function replayGovernanceRiskScore(record: GovernanceRiskScoreRecord): GovernanceRiskScoreReplayResult {
  const reconstructed_hash = computeGovernanceRiskScoreHash(record);
  const validation = validateGovernanceRiskScoreRecord(record);
  return Object.freeze({ replay_id: hashValue("governance-risk-score-replay-result", { id: record.governance_risk_id, reconstructed_hash }), governance_risk_id: record.governance_risk_id, validation_state: validation.validation_state === "VALID" && reconstructed_hash === record.risk_hash ? "PASS" : "FAIL", reconstructed_hash, expected_hash: record.risk_hash, failure_reason: reconstructed_hash === record.risk_hash ? validation.errors[0]?.reason ?? null : "RISK_HASH_MISMATCH" });
}

export function buildGovernanceRiskScoreObservabilitySurface(record = buildGovernanceRiskScoreRecord()): GovernanceRiskScoreObservabilitySurface {
  const validation = validateGovernanceRiskScoreRecord(record);
  return Object.freeze({ governance_risk_id: record.governance_risk_id, risk_category: record.risk_category, risk_severity: record.risk_severity, risk_score: record.risk_score, confidence_score: record.confidence_score, risk_drivers: record.risk_drivers, base_score: record.scoring_basis.base_score, modifier_score: record.scoring_basis.modifier_score, critical_floor_rules: record.scoring_basis.critical_floor_rules_applied, severity_threshold_version: record.severity_threshold_version, scoring_model_version: record.scoring_model_version, confidence_model_version: record.confidence_model_version, evidence_summary: record.evidence_summary, related_policies: record.related_policies, related_controls: record.related_controls, related_patterns: record.related_patterns, related_weaknesses: record.related_weaknesses, tenant_isolation_status: record.tenant_isolation_status, lineage_status: record.lineage_status, replay_status: record.replay_status, certification_status: record.certification_status, operator_visibility_status: record.operator_visibility_status, recommended_review_priority: record.recommended_review_priority, explanation: record.explanation, validation_failures: validation.errors });
}
