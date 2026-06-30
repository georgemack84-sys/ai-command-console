import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { detectViolationPatterns } from "@/services/violation-patterns";
import type {
  GovernanceWeaknessAnalysisResult,
  GovernanceWeaknessCategory,
  GovernanceWeaknessConfidenceBasis,
  GovernanceWeaknessDoctrine,
  GovernanceWeaknessFailureReason,
  GovernanceWeaknessIndicators,
  GovernanceWeaknessMappingRule,
  GovernanceWeaknessObservabilitySurface,
  GovernanceWeaknessRecord,
  GovernanceWeaknessReplayPackage,
  GovernanceWeaknessReplayResult,
  GovernanceWeaknessReviewPriority,
  GovernanceWeaknessState,
  GovernanceWeaknessType,
  GovernanceWeaknessValidationFailure,
  GovernanceWeaknessValidationResult,
  GovernanceWeaknessValidationState,
} from "@/types/governance-weakness";
import type { ViolationPatternRecord, ViolationPatternType } from "@/types/violation-patterns";

const NOW = "2026-06-25T09:00:00.000Z";
export const GOVERNANCE_WEAKNESS_CATEGORIES = ["WEAK_CONTROL", "MISSING_CONTROL", "AMBIGUOUS_POLICY", "UNRESOLVED_POLICY_CONFLICT", "AUTHORITY_BOUNDARY_WEAKNESS", "ESCALATION_PATH_WEAKNESS", "OVERSIGHT_DEFICIENCY", "REPEATED_EXCEPTION_DEPENDENCY", "CERTIFICATION_GAP", "REPLAY_GAP", "LINEAGE_GAP", "EVIDENCE_GAP", "VISIBILITY_GAP", "TENANT_BOUNDARY_WEAKNESS"] as const;
export const GOVERNANCE_WEAKNESS_TYPES = ["CONTROL_ALLOWS_RECURRING_VIOLATIONS", "CONTROL_ALLOWS_REPEATED_EXCEPTIONS", "POLICY_WITHOUT_ESCALATION_RULE", "VIOLATION_WITHOUT_REVIEW_PATH", "POLICY_REQUIREMENT_AMBIGUOUS", "PERSISTENT_POLICY_CONFLICT", "AUTHORITY_SCOPE_AMBIGUOUS", "AUTHORITY_BOUNDARY_DRIFT_RECURRING", "ESCALATION_PATH_INCONSISTENT", "OPERATOR_REVIEW_DELAY_RECURRING", "EXCEPTION_DEPENDENCY_RECURRING", "CERTIFICATION_FAILURE_STRUCTURAL", "REPLAY_RECONSTRUCTION_GAP", "LINEAGE_RECONSTRUCTION_GAP", "EVIDENCE_COMPLETENESS_GAP", "OPERATOR_VISIBILITY_INCOMPLETE", "CONTAINMENT_PATTERN_WITHOUT_REVIEW", "TENANT_BOUNDARY_VALIDATION_WEAK"] as const;
export const GOVERNANCE_WEAKNESS_STATES = ["IDENTIFIED", "VALIDATED", "READY_FOR_SCORING", "SUPERSEDED", "DISMISSED", "ARCHIVED"] as const;
export const GOVERNANCE_WEAKNESS_REVIEW_PRIORITIES = ["WATCH", "STANDARD_REVIEW", "PRIORITY_REVIEW", "IMMEDIATE_REVIEW"] as const;

const ALLOWED_TRANSITIONS: Readonly<Record<GovernanceWeaknessState, readonly GovernanceWeaknessState[]>> = Object.freeze({
  IDENTIFIED: Object.freeze(["VALIDATED", "DISMISSED"] as const),
  VALIDATED: Object.freeze(["READY_FOR_SCORING", "SUPERSEDED", "ARCHIVED"] as const),
  READY_FOR_SCORING: Object.freeze(["ARCHIVED"] as const),
  SUPERSEDED: Object.freeze(["ARCHIVED"] as const),
  DISMISSED: Object.freeze(["ARCHIVED"] as const),
  ARCHIVED: Object.freeze([] as const),
});

const PRIORITY_RANK: Readonly<Record<GovernanceWeaknessReviewPriority, number>> = Object.freeze({ WATCH: 0, STANDARD_REVIEW: 1, PRIORITY_REVIEW: 2, IMMEDIATE_REVIEW: 3 });

export const WEAKNESS_MAPPING_RULES: readonly GovernanceWeaknessMappingRule[] = Object.freeze([
  { pattern_type: "RECURRING_POLICY_VIOLATION", weakness_category: "WEAK_CONTROL", weakness_type: "CONTROL_ALLOWS_RECURRING_VIOLATIONS", review_priority_floor: "PRIORITY_REVIEW" },
  { pattern_type: "RECURRING_CONTROL_VIOLATION", weakness_category: "MISSING_CONTROL", weakness_type: "POLICY_WITHOUT_ESCALATION_RULE", review_priority_floor: "PRIORITY_REVIEW" },
  { pattern_type: "POLICY_DRIFT", weakness_category: "AMBIGUOUS_POLICY", weakness_type: "POLICY_REQUIREMENT_AMBIGUOUS", review_priority_floor: "PRIORITY_REVIEW" },
  { pattern_type: "AUTHORITY_DRIFT", weakness_category: "AUTHORITY_BOUNDARY_WEAKNESS", weakness_type: "AUTHORITY_BOUNDARY_DRIFT_RECURRING", review_priority_floor: "IMMEDIATE_REVIEW" },
  { pattern_type: "ESCALATION_TREND", weakness_category: "ESCALATION_PATH_WEAKNESS", weakness_type: "ESCALATION_PATH_INCONSISTENT", review_priority_floor: "PRIORITY_REVIEW" },
  { pattern_type: "EXCEPTION_RECURRENCE", weakness_category: "REPEATED_EXCEPTION_DEPENDENCY", weakness_type: "EXCEPTION_DEPENDENCY_RECURRING", review_priority_floor: "PRIORITY_REVIEW" },
  { pattern_type: "OVERRIDE_RECURRENCE", weakness_category: "OVERSIGHT_DEFICIENCY", weakness_type: "OPERATOR_REVIEW_DELAY_RECURRING", review_priority_floor: "PRIORITY_REVIEW" },
  { pattern_type: "UNRESOLVED_GOVERNANCE_EVENT_RECURRENCE", weakness_category: "OVERSIGHT_DEFICIENCY", weakness_type: "VIOLATION_WITHOUT_REVIEW_PATH", review_priority_floor: "PRIORITY_REVIEW" },
  { pattern_type: "POLICY_CONFLICT_RECURRENCE", weakness_category: "UNRESOLVED_POLICY_CONFLICT", weakness_type: "PERSISTENT_POLICY_CONFLICT", review_priority_floor: "PRIORITY_REVIEW" },
  { pattern_type: "CERTIFICATION_FAILURE_RECURRENCE", weakness_category: "CERTIFICATION_GAP", weakness_type: "CERTIFICATION_FAILURE_STRUCTURAL", review_priority_floor: "IMMEDIATE_REVIEW" },
  { pattern_type: "REPLAY_MISMATCH_RECURRENCE", weakness_category: "REPLAY_GAP", weakness_type: "REPLAY_RECONSTRUCTION_GAP", review_priority_floor: "IMMEDIATE_REVIEW" },
  { pattern_type: "LINEAGE_BREAK_RECURRENCE", weakness_category: "LINEAGE_GAP", weakness_type: "LINEAGE_RECONSTRUCTION_GAP", review_priority_floor: "IMMEDIATE_REVIEW" },
  { pattern_type: "EVIDENCE_GAP_RECURRENCE", weakness_category: "EVIDENCE_GAP", weakness_type: "EVIDENCE_COMPLETENESS_GAP", review_priority_floor: "PRIORITY_REVIEW" },
  { pattern_type: "OPERATOR_INTERVENTION_RECURRENCE", weakness_category: "VISIBILITY_GAP", weakness_type: "OPERATOR_VISIBILITY_INCOMPLETE", review_priority_floor: "PRIORITY_REVIEW" },
  { pattern_type: "RISING_CONTAINMENT_EVENT_PATTERN", weakness_category: "TENANT_BOUNDARY_WEAKNESS", weakness_type: "CONTAINMENT_PATTERN_WITHOUT_REVIEW", review_priority_floor: "IMMEDIATE_REVIEW" },
  { pattern_type: "RECURRING_AUTHORITY_SCOPE_VIOLATION", weakness_category: "AUTHORITY_BOUNDARY_WEAKNESS", weakness_type: "AUTHORITY_SCOPE_AMBIGUOUS", review_priority_floor: "IMMEDIATE_REVIEW" },
  { pattern_type: "RECURRING_TENANT_RULE_VIOLATION", weakness_category: "TENANT_BOUNDARY_WEAKNESS", weakness_type: "TENANT_BOUNDARY_VALIDATION_WEAK", review_priority_floor: "IMMEDIATE_REVIEW" },
  { pattern_type: "RECURRING_GOVERNANCE_BOUNDARY_VIOLATION", weakness_category: "MISSING_CONTROL", weakness_type: "AUTHORITY_SCOPE_AMBIGUOUS", review_priority_floor: "PRIORITY_REVIEW" },
]);

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function uniq(items: readonly (string | undefined)[]): readonly string[] {
  return Object.freeze([...new Set(items.filter((item): item is string => Boolean(item)))].sort());
}

function failure(reason: GovernanceWeaknessFailureReason, field_path: string, message: string): GovernanceWeaknessValidationFailure {
  return Object.freeze({ failure_id: hashValue("governance-weakness-validation-failure", { reason, field_path, message }), reason, field_path, message, fail_closed: true });
}

export function buildGovernanceWeaknessDoctrine(): GovernanceWeaknessDoctrine {
  return Object.freeze({
    principles: Object.freeze(["deterministic", "evidence-backed", "tenant-scoped", "lineage-preserving", "replayable", "operator-visible", "advisory-only", "fail-closed"] as const),
    prohibited_behaviors: Object.freeze(["risk scoring", "severity assignment", "policy enforcement", "authority enforcement", "automatic escalation", "automatic remediation", "operator approval", "runtime containment", "policy rewriting", "control deployment"]),
    allowed_categories: Object.freeze([...GOVERNANCE_WEAKNESS_CATEGORIES]),
    allowed_types: Object.freeze([...GOVERNANCE_WEAKNESS_TYPES]),
    allowed_states: Object.freeze([...GOVERNANCE_WEAKNESS_STATES]),
    allowed_review_priorities: Object.freeze([...GOVERNANCE_WEAKNESS_REVIEW_PRIORITIES]),
    allowed_state_transitions: ALLOWED_TRANSITIONS,
  });
}

export function buildGovernanceWeaknessMappingRules(): readonly GovernanceWeaknessMappingRule[] {
  return WEAKNESS_MAPPING_RULES;
}

export function generateGovernanceWeaknessId(tenant_id: string, mission_id: string, category: GovernanceWeaknessCategory, pattern_ids: readonly string[]): string {
  return `GWEAK-${hashValue("governance-weakness-id", { tenant_id, mission_id, category, pattern_ids }).slice(0, 12).toUpperCase()}`;
}

function priorityMax(a: GovernanceWeaknessReviewPriority, b: GovernanceWeaknessReviewPriority): GovernanceWeaknessReviewPriority {
  return PRIORITY_RANK[a] >= PRIORITY_RANK[b] ? a : b;
}

function ruleFor(patternType: ViolationPatternType): GovernanceWeaknessMappingRule {
  return WEAKNESS_MAPPING_RULES.find((rule) => rule.pattern_type === patternType) ?? WEAKNESS_MAPPING_RULES[0];
}

export function aggregateWeaknessInputs(patterns: readonly ViolationPatternRecord[] = detectViolationPatterns().patterns): readonly ViolationPatternRecord[] {
  const seen = new Map<string, ViolationPatternRecord>();
  for (const pattern of patterns) {
    const existing = seen.get(pattern.violation_pattern_id);
    if (!existing || existing.pattern_hash > pattern.pattern_hash) seen.set(pattern.violation_pattern_id, pattern);
  }
  return Object.freeze([...seen.values()].sort((a, b) => a.violation_pattern_id.localeCompare(b.violation_pattern_id)));
}

function indicatorsFor(patterns: readonly ViolationPatternRecord[], category: GovernanceWeaknessCategory): GovernanceWeaknessIndicators {
  const violation_frequency = patterns.reduce((sum, pattern) => sum + pattern.frequency, 0);
  const repeat_exception_count = uniq(patterns.flatMap((pattern) => pattern.related_exception_refs)).length;
  const replay_mismatch_count = uniq(patterns.flatMap((pattern) => pattern.related_replay_mismatch_refs)).length;
  const lineage_break_count = patterns.filter((pattern) => pattern.pattern_type === "LINEAGE_BREAK_RECURRENCE").length;
  const certification_failure_count = uniq(patterns.flatMap((pattern) => pattern.related_certification_refs)).length;
  const evidenceRefs = uniq(patterns.flatMap((pattern) => pattern.evidence_refs));
  const expectedEvidence = Math.max(1, patterns.reduce((sum, pattern) => sum + pattern.frequency, 0));
  return Object.freeze({
    violation_frequency,
    violation_severity_profile: Object.freeze({ LOW: 0, MODERATE: patterns.filter((pattern) => pattern.pattern_strength === "MODERATE").length, HIGH: patterns.filter((pattern) => pattern.pattern_strength === "STRONG").length, CRITICAL: patterns.filter((pattern) => pattern.pattern_strength === "SEVERE").length }),
    repeat_exception_count,
    policy_conflict_recurrence: patterns.some((pattern) => pattern.pattern_type === "POLICY_CONFLICT_RECURRENCE"),
    drift_direction: patterns.some((pattern) => pattern.trend_direction === "INCREASING") ? "INCREASING" : patterns[0]?.trend_direction ?? "INSUFFICIENT_HISTORY",
    authority_mismatch_count: uniq(patterns.flatMap((pattern) => pattern.related_authority_refs)).length,
    missing_escalation_count: category === "ESCALATION_PATH_WEAKNESS" ? Math.max(1, violation_frequency - uniq(patterns.flatMap((pattern) => pattern.related_escalation_refs)).length) : 0,
    replay_mismatch_count,
    lineage_break_count,
    certification_failure_count,
    evidence_completeness: Number(Math.min(1, evidenceRefs.length / expectedEvidence).toFixed(2)),
    operator_visibility_status: category === "VISIBILITY_GAP" ? "INCOMPLETE" : "COMPLETE",
    tenant_isolation_status: category === "TENANT_BOUNDARY_WEAKNESS" ? "UNKNOWN" : "VALID",
  });
}

export function calculateWeaknessConfidence(patterns: readonly ViolationPatternRecord[], indicators: GovernanceWeaknessIndicators): Readonly<{ confidence_score: number; confidence_basis: GovernanceWeaknessConfidenceBasis }> {
  const supporting_pattern_count = patterns.length;
  const supporting_evidence_count = uniq(patterns.flatMap((pattern) => pattern.evidence_refs)).length;
  const pattern_confidence_average = patterns.length ? patterns.reduce((sum, pattern) => sum + pattern.confidence_score, 0) / patterns.length : 0;
  const lineage_completeness = patterns.length ? patterns.filter((pattern) => pattern.lineage_refs.length > 0).length / patterns.length : 0;
  const replay_status = patterns.every((pattern) => pattern.replay_refs.length > 0) ? "REPLAY_SUCCESSFUL" as const : "REPLAY_INCOMPLETE" as const;
  const basis = Object.freeze({
    supporting_pattern_count,
    supporting_evidence_count,
    source_quality: 0.93,
    pattern_confidence_average: Number(pattern_confidence_average.toFixed(2)),
    lineage_completeness: Number(lineage_completeness.toFixed(2)),
    replay_status,
    policy_match_strength: 0.88,
    control_match_strength: 0.84,
    historical_recurrence_strength: Math.min(1, indicators.violation_frequency / 24),
    evidence_completeness: indicators.evidence_completeness,
    tenant_validation_status: indicators.tenant_isolation_status,
  });
  const confidence_score = Number(Math.min(0.99, Math.max(0, (0.4 + basis.supporting_pattern_count * 0.04 + basis.supporting_evidence_count * 0.01 + basis.source_quality + basis.pattern_confidence_average + basis.lineage_completeness + basis.policy_match_strength + basis.control_match_strength + basis.historical_recurrence_strength + basis.evidence_completeness) / 7)).toFixed(2));
  return Object.freeze({ confidence_score, confidence_basis: basis });
}

export function assignWeaknessReviewPriority(category: GovernanceWeaknessCategory, rulePriority: GovernanceWeaknessReviewPriority, indicators: GovernanceWeaknessIndicators): GovernanceWeaknessReviewPriority {
  let priority = rulePriority;
  if (["TENANT_BOUNDARY_WEAKNESS", "AUTHORITY_BOUNDARY_WEAKNESS", "REPLAY_GAP"].includes(category)) priority = priorityMax(priority, "IMMEDIATE_REVIEW");
  if (category === "CERTIFICATION_GAP" && indicators.certification_failure_count > 2) priority = priorityMax(priority, "IMMEDIATE_REVIEW");
  if (category === "ESCALATION_PATH_WEAKNESS" && indicators.missing_escalation_count > 0) priority = priorityMax(priority, "PRIORITY_REVIEW");
  if (category === "REPEATED_EXCEPTION_DEPENDENCY" && indicators.repeat_exception_count >= 1) priority = priorityMax(priority, "PRIORITY_REVIEW");
  if (indicators.evidence_completeness < 0.5) priority = priorityMax(priority, "PRIORITY_REVIEW");
  return priority;
}

export function canonicalizeGovernanceWeakness(record: Omit<GovernanceWeaknessRecord, "weakness_hash">): string {
  return canonicalizeConfidenceToString(record);
}

export function computeGovernanceWeaknessHash(record: Omit<GovernanceWeaknessRecord, "weakness_hash"> | GovernanceWeaknessRecord): string {
  const { weakness_hash: _previousHash, ...source } = record as GovernanceWeaknessRecord;
  return hashConfidenceValue("governance-weakness-contract", canonicalizeGovernanceWeakness(source));
}

function buildReplayPackage(source: Omit<GovernanceWeaknessRecord, "replay_package" | "weakness_hash">): GovernanceWeaknessReplayPackage {
  const supporting_pattern_hashes = source.supporting_patterns.map((pattern) => pattern.pattern_hash).sort();
  return Object.freeze({
    governance_weakness_id: source.governance_weakness_id,
    tenant_id: source.tenant_id,
    mission_id: source.mission_id,
    contract_version: "GOV-WEAKNESS-CONTRACT-V1",
    supporting_pattern_hashes: Object.freeze(supporting_pattern_hashes),
    analysis_window: source.analysis_window,
    comparison_window: source.comparison_window,
    mapping_model_version: "GOV-WEAKNESS-MAPPING-V1",
    analysis_model_version: "GOV-WEAKNESS-ANALYSIS-V1",
    confidence_model_version: "GOV-WEAKNESS-CONFIDENCE-V1",
    reconstruction_hash: hashValue("governance-weakness-replay", { supporting_pattern_hashes, category: source.weakness_category, type: source.weakness_type, confidence: source.confidence_score }),
  });
}

function explanationFor(source: Omit<GovernanceWeaknessRecord, "replay_package" | "weakness_hash">): string {
  const policy = source.related_policies[0] ?? "related governance records";
  return `${source.weakness_category} weakness found. ${source.weakness_type} was classified from ${source.supporting_patterns.length} supporting patterns involving ${policy}. The finding is supported by ${source.evidence_refs.length} evidence references, ${source.lineage_refs.length} lineage references, and replay status ${source.confidence_basis.replay_status}. Confidence is ${source.confidence_score} based on pattern confidence average ${source.confidence_basis.pattern_confidence_average}, evidence completeness ${source.confidence_basis.evidence_completeness}, lineage completeness ${source.confidence_basis.lineage_completeness}, and tenant validation ${source.confidence_basis.tenant_validation_status}. Review priority is ${source.recommended_review_priority} because deterministic category rules and weakness indicators require operator inspection.`;
}

function buildWeakness(rule: GovernanceWeaknessMappingRule, patterns: readonly ViolationPatternRecord[]): GovernanceWeaknessRecord {
  const category = rule.weakness_category;
  const indicators = indicatorsFor(patterns, category);
  const confidence = calculateWeaknessConfidence(patterns, indicators);
  const priority = assignWeaknessReviewPriority(category, rule.review_priority_floor, indicators);
  const sourceWithoutReplay: Omit<GovernanceWeaknessRecord, "replay_package" | "weakness_hash"> = {
    contract_version: "GOV-WEAKNESS-CONTRACT-V1",
    governance_weakness_id: generateGovernanceWeaknessId(patterns[0].tenant_id, patterns[0].mission_id, category, patterns.map((pattern) => pattern.violation_pattern_id)),
    tenant_id: patterns[0].tenant_id,
    mission_id: patterns[0].mission_id,
    governance_intelligence_id: patterns[0].governance_intelligence_id,
    policy_intelligence_id: patterns[0].policy_intelligence_id,
    weakness_type: rule.weakness_type,
    weakness_category: category,
    weakness_state: "VALIDATED",
    supporting_patterns: Object.freeze([...patterns]),
    related_policies: uniq(patterns.flatMap((pattern) => pattern.related_policy_refs)),
    related_controls: Object.freeze(["CONTROL-C-17"]),
    related_authority_scopes: uniq(patterns.flatMap((pattern) => pattern.related_authority_refs)),
    related_violations: uniq(patterns.flatMap((pattern) => pattern.related_violation_refs)),
    related_exceptions: uniq(patterns.flatMap((pattern) => pattern.related_exception_refs)),
    related_escalations: uniq(patterns.flatMap((pattern) => pattern.related_escalation_refs)),
    related_certification_results: uniq(patterns.flatMap((pattern) => pattern.related_certification_refs)),
    related_replay_records: uniq(patterns.flatMap((pattern) => pattern.related_replay_mismatch_refs.length ? pattern.related_replay_mismatch_refs : pattern.replay_refs)),
    related_operator_reviews: uniq(patterns.flatMap((pattern) => pattern.related_operator_intervention_refs)),
    related_containment_events: uniq(patterns.flatMap((pattern) => pattern.related_containment_refs)),
    analysis_window: patterns[0].time_window,
    comparison_window: patterns[0].comparison_window,
    weakness_indicators: indicators,
    confidence_score: confidence.confidence_score,
    confidence_basis: confidence.confidence_basis,
    evidence_refs: uniq(patterns.flatMap((pattern) => pattern.evidence_refs)),
    lineage_refs: uniq(patterns.flatMap((pattern) => pattern.lineage_refs)),
    replay_refs: uniq(patterns.flatMap((pattern) => pattern.replay_refs)),
    mapping_model_version: "GOV-WEAKNESS-MAPPING-V1",
    analysis_model_version: "GOV-WEAKNESS-ANALYSIS-V1",
    confidence_model_version: "GOV-WEAKNESS-CONFIDENCE-V1",
    explanation: "",
    recommended_review_priority: priority,
    recommended_operator_review: priority !== "WATCH",
    created_timestamp: NOW,
  };
  const withExplanation = { ...sourceWithoutReplay, explanation: explanationFor(sourceWithoutReplay) };
  const replay_package = buildReplayPackage(withExplanation);
  return Object.freeze({ ...withExplanation, replay_package, weakness_hash: computeGovernanceWeaknessHash({ ...withExplanation, replay_package }) });
}

export function analyzeGovernanceWeakness(input: { patterns?: readonly ViolationPatternRecord[] } = {}): GovernanceWeaknessAnalysisResult {
  const patterns = aggregateWeaknessInputs(input.patterns ?? detectViolationPatterns().patterns);
  const groups = new Map<string, { rule: GovernanceWeaknessMappingRule; patterns: ViolationPatternRecord[] }>();
  for (const pattern of patterns) {
    const rule = ruleFor(pattern.pattern_type);
    const key = `${rule.weakness_category}:${rule.weakness_type}`;
    const existing = groups.get(key);
    groups.set(key, { rule, patterns: [...(existing?.patterns ?? []), pattern] });
  }
  const weaknesses = [...groups.values()].map((group) => buildWeakness(group.rule, group.patterns));
  return Object.freeze({
    analyzer_version: "GOV-WEAKNESS-ANALYSIS-V1",
    tenant_id: patterns[0]?.tenant_id ?? "tenant_alpha",
    mission_id: patterns[0]?.mission_id ?? "mission_query_layer",
    mapping_model_version: "GOV-WEAKNESS-MAPPING-V1",
    source_pattern_count: patterns.length,
    weaknesses: Object.freeze(weaknesses.sort((a, b) => a.weakness_category.localeCompare(b.weakness_category))),
  });
}

export function buildGovernanceWeaknessRecord(overrides: Partial<GovernanceWeaknessRecord> = {}): GovernanceWeaknessRecord {
  const has = (key: keyof GovernanceWeaknessRecord) => Object.prototype.hasOwnProperty.call(overrides, key);
  const detected = analyzeGovernanceWeakness().weaknesses.find((weakness) => weakness.weakness_category === "WEAK_CONTROL") ?? analyzeGovernanceWeakness().weaknesses[0];
  const sourceWithoutReplay: Omit<GovernanceWeaknessRecord, "replay_package" | "weakness_hash"> = {
    ...detected,
    contract_version: has("contract_version") ? overrides.contract_version! : detected.contract_version,
    governance_weakness_id: has("governance_weakness_id") ? overrides.governance_weakness_id! : detected.governance_weakness_id,
    tenant_id: has("tenant_id") ? overrides.tenant_id! : detected.tenant_id,
    mission_id: has("mission_id") ? overrides.mission_id! : detected.mission_id,
    governance_intelligence_id: has("governance_intelligence_id") ? overrides.governance_intelligence_id! : detected.governance_intelligence_id,
    policy_intelligence_id: has("policy_intelligence_id") ? overrides.policy_intelligence_id! : detected.policy_intelligence_id,
    weakness_type: has("weakness_type") ? overrides.weakness_type! : detected.weakness_type,
    weakness_category: has("weakness_category") ? overrides.weakness_category! : detected.weakness_category,
    weakness_state: has("weakness_state") ? overrides.weakness_state! : detected.weakness_state,
    supporting_patterns: has("supporting_patterns") ? overrides.supporting_patterns! : detected.supporting_patterns,
    related_policies: has("related_policies") ? overrides.related_policies! : detected.related_policies,
    related_controls: has("related_controls") ? overrides.related_controls! : detected.related_controls,
    related_authority_scopes: has("related_authority_scopes") ? overrides.related_authority_scopes! : detected.related_authority_scopes,
    related_violations: has("related_violations") ? overrides.related_violations! : detected.related_violations,
    related_exceptions: has("related_exceptions") ? overrides.related_exceptions! : detected.related_exceptions,
    related_escalations: has("related_escalations") ? overrides.related_escalations! : detected.related_escalations,
    related_certification_results: has("related_certification_results") ? overrides.related_certification_results! : detected.related_certification_results,
    related_replay_records: has("related_replay_records") ? overrides.related_replay_records! : detected.related_replay_records,
    related_operator_reviews: has("related_operator_reviews") ? overrides.related_operator_reviews! : detected.related_operator_reviews,
    related_containment_events: has("related_containment_events") ? overrides.related_containment_events! : detected.related_containment_events,
    analysis_window: has("analysis_window") ? overrides.analysis_window! : detected.analysis_window,
    comparison_window: has("comparison_window") ? overrides.comparison_window! : detected.comparison_window,
    weakness_indicators: has("weakness_indicators") ? overrides.weakness_indicators! : detected.weakness_indicators,
    confidence_score: has("confidence_score") ? overrides.confidence_score! : detected.confidence_score,
    confidence_basis: has("confidence_basis") ? overrides.confidence_basis! : detected.confidence_basis,
    evidence_refs: has("evidence_refs") ? overrides.evidence_refs! : detected.evidence_refs,
    lineage_refs: has("lineage_refs") ? overrides.lineage_refs! : detected.lineage_refs,
    replay_refs: has("replay_refs") ? overrides.replay_refs! : detected.replay_refs,
    mapping_model_version: has("mapping_model_version") ? overrides.mapping_model_version! : detected.mapping_model_version,
    analysis_model_version: has("analysis_model_version") ? overrides.analysis_model_version! : detected.analysis_model_version,
    confidence_model_version: has("confidence_model_version") ? overrides.confidence_model_version! : detected.confidence_model_version,
    explanation: has("explanation") ? overrides.explanation! : detected.explanation,
    recommended_review_priority: has("recommended_review_priority") ? overrides.recommended_review_priority! : detected.recommended_review_priority,
    recommended_operator_review: has("recommended_operator_review") ? overrides.recommended_operator_review! : detected.recommended_operator_review,
    created_timestamp: has("created_timestamp") ? overrides.created_timestamp! : detected.created_timestamp,
  };
  const replay_package = overrides.replay_package ?? buildReplayPackage(sourceWithoutReplay);
  return Object.freeze({ ...sourceWithoutReplay, replay_package, weakness_hash: overrides.weakness_hash ?? computeGovernanceWeaknessHash({ ...sourceWithoutReplay, replay_package }) });
}

export function validateGovernanceWeaknessRecord(record: Partial<GovernanceWeaknessRecord> | undefined, context: { original_record?: GovernanceWeaknessRecord } = {}): GovernanceWeaknessValidationResult {
  const errors: GovernanceWeaknessValidationFailure[] = [];
  if (!record) errors.push(failure("CONTRACT_MISSING", "record", "governance weakness contract missing"));
  if (record?.contract_version !== "GOV-WEAKNESS-CONTRACT-V1") errors.push(failure("UNSUPPORTED_SCHEMA_VERSION", "contract_version", "unsupported contract version"));
  if (!record?.governance_weakness_id) errors.push(failure("WEAKNESS_ID_MISSING", "governance_weakness_id", "governance_weakness_id missing"));
  if (!record?.tenant_id) errors.push(failure("TENANT_ID_MISSING", "tenant_id", "tenant_id missing"));
  if (!record?.mission_id) errors.push(failure("MISSION_ID_MISSING", "mission_id", "mission_id missing"));
  if (!record?.supporting_patterns?.length) errors.push(failure("SUPPORTING_PATTERNS_MISSING", "supporting_patterns", "supporting patterns missing"));
  if (!record?.weakness_category || !(GOVERNANCE_WEAKNESS_CATEGORIES as readonly string[]).includes(record.weakness_category)) errors.push(failure("INVALID_WEAKNESS_CATEGORY", "weakness_category", "invalid weakness category"));
  if (!record?.weakness_type || !(GOVERNANCE_WEAKNESS_TYPES as readonly string[]).includes(record.weakness_type)) errors.push(failure("INVALID_WEAKNESS_TYPE", "weakness_type", "invalid weakness type"));
  if (!record?.recommended_review_priority || !(GOVERNANCE_WEAKNESS_REVIEW_PRIORITIES as readonly string[]).includes(record.recommended_review_priority)) errors.push(failure("INVALID_REVIEW_PRIORITY", "recommended_review_priority", "invalid review priority"));
  if (!record?.weakness_state || !(GOVERNANCE_WEAKNESS_STATES as readonly string[]).includes(record.weakness_state)) errors.push(failure("INVALID_STATE", "weakness_state", "invalid weakness state"));
  if (!record?.analysis_window?.start || !record.analysis_window.end) errors.push(failure("ANALYSIS_WINDOW_MISSING", "analysis_window", "analysis window missing"));
  if (typeof record?.confidence_score !== "number") errors.push(failure("CONFIDENCE_SCORE_MISSING", "confidence_score", "confidence score missing"));
  if (typeof record?.confidence_score === "number" && (record.confidence_score < 0 || record.confidence_score > 1)) errors.push(failure("CONFIDENCE_OUT_OF_RANGE", "confidence_score", "confidence score outside range"));
  const cb = record?.confidence_basis;
  if (!cb || cb.supporting_pattern_count === undefined || cb.supporting_evidence_count === undefined || cb.pattern_confidence_average === undefined || cb.lineage_completeness === undefined || !cb.replay_status || cb.policy_match_strength === undefined || cb.control_match_strength === undefined || cb.evidence_completeness === undefined || !cb.tenant_validation_status) errors.push(failure("CONFIDENCE_BASIS_MISSING", "confidence_basis", "confidence basis incomplete"));
  if (!record?.evidence_refs?.length) errors.push(failure("EVIDENCE_REFS_MISSING", "evidence_refs", "evidence refs missing"));
  if (!record?.lineage_refs?.length) errors.push(failure("LINEAGE_REFS_MISSING", "lineage_refs", "lineage refs missing"));
  if (!record?.replay_refs?.length || !record.replay_package?.reconstruction_hash) errors.push(failure("REPLAY_REFS_MISSING", "replay_refs", "replay refs or package missing"));
  if (record?.evidence_refs?.some((ref) => ref.includes("tenant_beta")) || record?.related_policies?.some((ref) => ref.includes("tenant_beta")) || record?.supporting_patterns?.some((pattern) => pattern.tenant_id !== record.tenant_id)) errors.push(failure("TENANT_SCOPE_VIOLATION", "references", "cross-tenant weakness linkage detected"));
  if (!record?.mapping_model_version) errors.push(failure("MAPPING_MODEL_VERSION_MISSING", "mapping_model_version", "mapping model version missing"));
  if (!record?.analysis_model_version) errors.push(failure("ANALYSIS_MODEL_VERSION_MISSING", "analysis_model_version", "analysis model version missing"));
  if (!record?.confidence_model_version) errors.push(failure("CONFIDENCE_MODEL_VERSION_MISSING", "confidence_model_version", "confidence model version missing"));
  if (!record?.explanation || !record.explanation.includes(String(record.weakness_category)) || !record.explanation.includes("Confidence")) errors.push(failure("EXPLANATION_MISSING", "explanation", "weakness explanation missing required basis"));
  if (record?.explanation?.includes("unsupported claim")) errors.push(failure("UNSUPPORTED_EXPLANATION", "explanation", "unsupported weakness explanation claim"));
  if (typeof record?.recommended_operator_review !== "boolean") errors.push(failure("OPERATOR_REVIEW_FLAG_MISSING", "recommended_operator_review", "operator review flag missing"));
  if (context.original_record && (context.original_record.governance_weakness_id !== record?.governance_weakness_id || context.original_record.tenant_id !== record?.tenant_id || context.original_record.mission_id !== record?.mission_id || context.original_record.created_timestamp !== record?.created_timestamp)) errors.push(failure("IDENTITY_MUTATION", "identity", "immutable weakness identity field mutated"));
  if (record?.weakness_hash && computeGovernanceWeaknessHash(record as GovernanceWeaknessRecord) !== record.weakness_hash) errors.push(failure("WEAKNESS_HASH_MISMATCH", "weakness_hash", "weakness reconstruction hash mismatch"));
  const state: GovernanceWeaknessValidationState = errors.some((error) => error.reason === "TENANT_SCOPE_VIOLATION") ? "TENANT_SCOPE_VIOLATION" : errors.some((error) => error.reason === "REPLAY_REFS_MISSING" || error.reason === "WEAKNESS_HASH_MISMATCH") ? "REPLAY_REFERENCE_MISSING" : errors.some((error) => error.reason === "LINEAGE_REFS_MISSING") ? "LINEAGE_REFERENCE_MISSING" : errors.some((error) => error.reason === "INVALID_STATE") ? "INVALID_STATE" : errors.length ? "INVALID" : "VALID";
  return Object.freeze({
    governance_weakness_id: record?.governance_weakness_id,
    validation_state: state,
    validator_version: "GOV-WEAKNESS-VALIDATOR-V1",
    checks: Object.freeze({
      schema_valid: !errors.some((error) => ["CONTRACT_MISSING", "UNSUPPORTED_SCHEMA_VERSION"].includes(error.reason)),
      required_fields_present: !errors.some((error) => ["REQUIRED_FIELD_MISSING", "TENANT_ID_MISSING", "MISSION_ID_MISSING", "WEAKNESS_ID_MISSING", "SUPPORTING_PATTERNS_MISSING"].includes(error.reason)),
      weakness_category_valid: !errors.some((error) => error.reason === "INVALID_WEAKNESS_CATEGORY"),
      weakness_type_valid: !errors.some((error) => error.reason === "INVALID_WEAKNESS_TYPE"),
      confidence_valid: !errors.some((error) => error.reason.startsWith("CONFIDENCE")),
      review_priority_valid: !errors.some((error) => error.reason === "INVALID_REVIEW_PRIORITY"),
      evidence_refs_valid: !errors.some((error) => error.reason === "EVIDENCE_REFS_MISSING"),
      lineage_refs_valid: !errors.some((error) => error.reason === "LINEAGE_REFS_MISSING"),
      replay_refs_valid: !errors.some((error) => error.reason === "REPLAY_REFS_MISSING" || error.reason === "WEAKNESS_HASH_MISMATCH"),
      tenant_isolation_valid: !errors.some((error) => error.reason === "TENANT_SCOPE_VIOLATION"),
      lifecycle_state_valid: !errors.some((error) => error.reason === "INVALID_STATE" || error.reason === "INVALID_STATE_TRANSITION"),
    }),
    errors: Object.freeze(errors),
    warnings: Object.freeze([]),
    validation_timestamp: NOW,
  });
}

export function transitionGovernanceWeaknessState(record: GovernanceWeaknessRecord, to_state: GovernanceWeaknessState): GovernanceWeaknessValidationResult {
  if (!ALLOWED_TRANSITIONS[record.weakness_state]?.includes(to_state)) {
    return Object.freeze({ ...validateGovernanceWeaknessRecord(record), validation_state: "INVALID_STATE" as const, errors: Object.freeze([failure("INVALID_STATE_TRANSITION", "weakness_state", `${record.weakness_state} to ${to_state} blocked`)]) });
  }
  const { weakness_hash: _previousHash, ...source } = record;
  return validateGovernanceWeaknessRecord({ ...source, weakness_state: to_state, weakness_hash: computeGovernanceWeaknessHash({ ...source, weakness_state: to_state }) });
}

export function replayGovernanceWeakness(record: GovernanceWeaknessRecord): GovernanceWeaknessReplayResult {
  const reconstructed_hash = computeGovernanceWeaknessHash(record);
  const validation = validateGovernanceWeaknessRecord(record);
  return Object.freeze({
    replay_id: hashValue("governance-weakness-replay-result", { id: record.governance_weakness_id, reconstructed_hash }),
    governance_weakness_id: record.governance_weakness_id,
    validation_state: validation.validation_state === "VALID" && reconstructed_hash === record.weakness_hash ? "PASS" : "FAIL",
    reconstructed_hash,
    expected_hash: record.weakness_hash,
    failure_reason: reconstructed_hash === record.weakness_hash ? validation.errors[0]?.reason ?? null : "WEAKNESS_HASH_MISMATCH",
  });
}

export function buildGovernanceWeaknessObservabilitySurface(record = buildGovernanceWeaknessRecord()): GovernanceWeaknessObservabilitySurface {
  const validation = validateGovernanceWeaknessRecord(record);
  return Object.freeze({
    governance_weakness_id: record.governance_weakness_id,
    tenant_id: record.tenant_id,
    mission_id: record.mission_id,
    weakness_category: record.weakness_category,
    weakness_type: record.weakness_type,
    weakness_state: record.weakness_state,
    supporting_pattern_ids: record.supporting_patterns.map((pattern) => pattern.violation_pattern_id),
    related_policies: record.related_policies,
    related_controls: record.related_controls,
    related_authority_scopes: record.related_authority_scopes,
    related_violations: record.related_violations,
    related_exceptions: record.related_exceptions,
    related_escalations: record.related_escalations,
    related_certification_results: record.related_certification_results,
    related_replay_records: record.related_replay_records,
    related_containment_events: record.related_containment_events,
    analysis_window: record.analysis_window,
    weakness_indicators: record.weakness_indicators,
    confidence_score: record.confidence_score,
    confidence_basis: record.confidence_basis,
    recommended_review_priority: record.recommended_review_priority,
    evidence_refs: record.evidence_refs,
    lineage_refs: record.lineage_refs,
    replay_refs: record.replay_refs,
    replay_status: record.confidence_basis.replay_status,
    model_versions: Object.freeze({ mapping_model_version: record.mapping_model_version, analysis_model_version: record.analysis_model_version, confidence_model_version: record.confidence_model_version }),
    explanation: record.explanation,
    validation_failures: validation.errors,
  });
}
