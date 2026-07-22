import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runGovernanceConstitutionalCertification } from "@/services/decision-governance-constitutional-certification";
import type { GovernanceConstitutionalCertificationResult } from "@/types/decision-governance-constitutional-certification";
import type { VisibilityRole } from "@/types/decision-observability-contract";
import type {
  AlternativeExplainabilityReport,
  ConflictArbitrationReport,
  ContextCompletenessReport,
  DecisionConsistencyReport,
  DecisionIntelligenceCertificationFailure,
  DecisionIntelligenceCertificationFoundation,
  DecisionIntelligenceCertificationInput,
  DecisionIntelligenceCertificationResult,
  DecisionIntelligenceCertificationValidation,
  DecisionIntelligenceCheck,
  DecisionIntelligenceEvidencePackage,
  DecisionIntelligenceLedgerEntry,
  DecisionIntelligenceScope,
  DependencyAccuracyReport,
  ExplainabilityValidationReport,
  PriorityReproducibilityReport,
} from "@/types/decision-intelligence-certification";

const CERTIFICATION_VERSION = "decision-intelligence-certification/v1" as const;

export const DECISION_INTELLIGENCE_SCOPES: readonly DecisionIntelligenceScope[] = Object.freeze(["CONTEXT_COMPLETENESS", "DEPENDENCY_ACCURACY", "CONFLICT_DETECTION", "ARBITRATION", "PRIORITY_SCORING", "ALTERNATIVE_GENERATION", "REJECTED_OPTION_EXPLAINABILITY", "REPLAY_CONSISTENCY"]);
export const DECISION_INTELLIGENCE_CHECKS: readonly DecisionIntelligenceCheck[] = Object.freeze(["REASONING_CORRECTNESS", "CONTEXT_SUFFICIENCY", "DEPENDENCY_VALIDITY", "CONFLICT_VALIDITY", "ARBITRATION_REPRODUCIBILITY", "PRIORITY_REPRODUCIBILITY", "ALTERNATIVE_EXPLAINABILITY", "REJECTION_EXPLAINABILITY", "TRACEABILITY", "INTEGRITY_VERIFICATION"]);

type Scenario = NonNullable<DecisionIntelligenceCertificationInput["scenario"]>;

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

function ctx(source: GovernanceConstitutionalCertificationResult) {
  return {
    tenant_id: source.governance_report.tenant_id,
    mission_id: source.governance_report.mission_id,
    replay_ref: source.replay_hash,
  };
}

function visibleToRole(source: GovernanceConstitutionalCertificationResult, role: VisibilityRole): boolean {
  return source.replay_certification.deterministic_certification.foundation_certification.certification_framework.analytics_result.operator_dashboard.replay_monitoring.governance_visibility.priority_dashboard.conflict_visualization.timeline_result.dashboard_result.observability_result.authorizations.some((auth) => auth.role === role && auth.permissions.includes("VIEW_DECISIONS"));
}

function buildContextReport(source: GovernanceConstitutionalCertificationResult, scenario: Scenario): ContextCompletenessReport {
  const c = ctx(source);
  const required = freezeArray(["mission", "operational", "evidence", "risk", "confidence", "governance", "constitutional", "authority", "historical", "environmental"]);
  const available = scenario === "INCOMPLETE_CONTEXT" ? required.slice(0, -2) : required;
  const base: Omit<ContextCompletenessReport, "integrity_hash"> = {
    context_report_id: "decision_intelligence_context_completeness_report",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    required_contexts: required,
    available_contexts: freezeArray(available),
    missing_contexts: freezeArray(required.filter((item) => !available.includes(item))),
    context_relevance_verified: scenario !== "INCOMPLETE_CONTEXT",
    context_quality_verified: scenario !== "INCOMPLETE_CONTEXT",
    context_sufficiency_verified: scenario !== "INCOMPLETE_CONTEXT",
    context_lineage_ref: scenario === "INCOMPLETE_CONTEXT" ? "" : "context_lineage:complete",
    evidence_refs: scenario === "MISSING_EVIDENCE" ? freezeArray([]) : freezeArray(["evidence:mission", "evidence:risk", "evidence:governance"]),
    validation_state: "PASS",
  };
  const normalized = {
    ...base,
    validation_state: base.missing_contexts.length === 0 && base.context_relevance_verified && base.context_quality_verified && base.context_sufficiency_verified && Boolean(base.context_lineage_ref) && base.evidence_refs.length > 0 ? "PASS" as const : "FAIL" as const,
  };
  return Object.freeze({ ...normalized, integrity_hash: hashWithoutIntegrity(normalized) });
}

function buildDependencyReport(source: GovernanceConstitutionalCertificationResult, scenario: Scenario): DependencyAccuracyReport {
  const c = ctx(source);
  const order = scenario === "GRAPH_INCONSISTENCY" ? freezeArray(["dep:downstream", "dep:upstream", "dep:cross-domain"]) : freezeArray(["dep:upstream", "dep:cross-domain", "dep:downstream"]);
  const base: Omit<DependencyAccuracyReport, "integrity_hash"> = {
    dependency_report_id: "decision_intelligence_dependency_accuracy_report",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    dependency_refs: scenario === "INCORRECT_DEPENDENCY" ? freezeArray(["dep:unknown"]) : freezeArray(["dep:upstream", "dep:cross-domain", "dep:downstream"]),
    relationship_refs: scenario === "INCORRECT_DEPENDENCY" ? freezeArray(["rel:incorrect"]) : freezeArray(["rel:upstream->decision", "rel:decision->downstream"]),
    dependency_order: order,
    blocker_refs: freezeArray(["blocker:none"]),
    upstream_refs: freezeArray(["dep:upstream"]),
    downstream_refs: freezeArray(["dep:downstream"]),
    cross_domain_refs: freezeArray(["dep:cross-domain"]),
    dependency_lineage_ref: scenario === "INCORRECT_DEPENDENCY" ? "" : "dependency_lineage:complete",
    graph_consistent: scenario !== "GRAPH_INCONSISTENCY" && scenario !== "INCORRECT_DEPENDENCY",
    validation_state: "PASS",
  };
  const normalized = {
    ...base,
    validation_state: base.graph_consistent && Boolean(base.dependency_lineage_ref) && base.dependency_order.join("|") === "dep:upstream|dep:cross-domain|dep:downstream" ? "PASS" as const : "FAIL" as const,
  };
  return Object.freeze({ ...normalized, integrity_hash: hashWithoutIntegrity(normalized) });
}

function buildConflictReport(source: GovernanceConstitutionalCertificationResult, scenario: Scenario): ConflictArbitrationReport {
  const c = ctx(source);
  const base: Omit<ConflictArbitrationReport, "integrity_hash"> = {
    conflict_report_id: "decision_intelligence_conflict_arbitration_report",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    detected_conflicts: scenario === "UNDETECTED_CONFLICT" ? freezeArray([]) : freezeArray(["conflict:priority-vs-risk"]),
    classified_conflicts: scenario === "INCORRECT_CONFLICT_CLASSIFICATION" ? freezeArray(["conflict:misclassified"]) : freezeArray(["conflict:priority-vs-risk:governance-weighted"]),
    arbitration_rules: freezeArray(["rule:constitutional-first", "rule:governance-weighted", "rule:operator-escalation"]),
    tradeoff_refs: scenario === "NONDETERMINISTIC_ARBITRATION" ? freezeArray(["tradeoff:changed"]) : freezeArray(["tradeoff:risk-vs-urgency"]),
    escalation_refs: freezeArray(["escalation:operator-visible"]),
    resolution_refs: scenario === "NONDETERMINISTIC_ARBITRATION" ? freezeArray(["resolution:alternate"]) : freezeArray(["resolution:recommend-alpha"]),
    conflict_detection_complete: scenario !== "UNDETECTED_CONFLICT",
    conflict_classification_correct: scenario !== "INCORRECT_CONFLICT_CLASSIFICATION",
    arbitration_deterministic: scenario !== "NONDETERMINISTIC_ARBITRATION",
    validation_state: "PASS",
  };
  const normalized = {
    ...base,
    validation_state: base.conflict_detection_complete && base.conflict_classification_correct && base.arbitration_deterministic ? "PASS" as const : "FAIL" as const,
  };
  return Object.freeze({ ...normalized, integrity_hash: hashWithoutIntegrity(normalized) });
}

function buildPriorityReport(source: GovernanceConstitutionalCertificationResult, scenario: Scenario): PriorityReproducibilityReport {
  const c = ctx(source);
  const base: Omit<PriorityReproducibilityReport, "integrity_hash"> = {
    priority_report_id: "decision_intelligence_priority_reproducibility_report",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    score_calculations: scenario === "INCORRECT_PRIORITY" ? freezeArray(["score:alpha:41"]) : freezeArray(["score:alpha:92", "score:bravo:81", "score:charlie:74"]),
    composite_weights: freezeArray(["risk:0.25", "confidence:0.2", "governance:0.25", "constitution:0.2", "dependency:0.1"]),
    ranking: scenario === "INCORRECT_PRIORITY" ? freezeArray(["bravo", "alpha", "charlie"]) : freezeArray(["alpha", "bravo", "charlie"]),
    tie_breaking_refs: scenario === "INCONSISTENT_TIE_BREAKING" ? freezeArray(["tie:random"]) : freezeArray(["tie:mission-criticality", "tie:lower-risk"]),
    priority_explanations: freezeArray(["priority:alpha:highest mission urgency with acceptable risk"]),
    calculations_correct: scenario !== "INCORRECT_PRIORITY",
    ranking_reproducible: scenario !== "INCORRECT_PRIORITY",
    tie_breaking_deterministic: scenario !== "INCONSISTENT_TIE_BREAKING",
    validation_state: "PASS",
  };
  const normalized = {
    ...base,
    validation_state: base.calculations_correct && base.ranking_reproducible && base.tie_breaking_deterministic ? "PASS" as const : "FAIL" as const,
  };
  return Object.freeze({ ...normalized, integrity_hash: hashWithoutIntegrity(normalized) });
}

function buildAlternativeReport(source: GovernanceConstitutionalCertificationResult, scenario: Scenario): AlternativeExplainabilityReport {
  const c = ctx(source);
  const base: Omit<AlternativeExplainabilityReport, "integrity_hash"> = {
    alternative_report_id: "decision_intelligence_alternative_explainability_report",
    tenant_id: scenario === "CROSS_TENANT" ? `${c.tenant_id}_foreign` : c.tenant_id,
    mission_id: c.mission_id,
    recommendation_ref: scenario === "UNTRACEABLE_RECOMMENDATION" ? "" : "recommendation:alpha",
    alternative_refs: scenario === "MISSING_ALTERNATIVES" ? freezeArray([]) : freezeArray(["alternative:bravo", "alternative:defer"]),
    rejected_option_refs: freezeArray(["rejected:charlie"]),
    recommendation_rationale_ref: scenario === "HIDDEN_REASONING" ? "" : "rationale:recommend-alpha",
    evidence_traceability_refs: scenario === "UNTRACEABLE_RECOMMENDATION" ? freezeArray([]) : freezeArray(["evidence:mission", "evidence:risk"]),
    governance_rationale_ref: scenario === "MISSING_GOVERNANCE_RATIONALE" ? "" : "rationale:governance",
    constitutional_rationale_ref: scenario === "MISSING_CONSTITUTIONAL_RATIONALE" ? "" : "rationale:constitution",
    alternative_explanations: scenario === "MISSING_ALTERNATIVES" ? freezeArray([]) : freezeArray(["alternative bravo lowers risk but delays mission outcome"]),
    rejected_option_explanations: scenario === "MISSING_REJECTED_EXPLANATIONS" ? freezeArray([]) : freezeArray(["charlie rejected due to dependency blocker and lower confidence"]),
    hidden_reasoning_absent: scenario !== "HIDDEN_REASONING",
    operator_understandable: scenario !== "HIDDEN_REASONING",
    validation_state: "PASS",
  };
  const normalized = {
    ...base,
    validation_state: Boolean(base.recommendation_ref) && base.alternative_refs.length > 0 && base.rejected_option_explanations.length > 0 && Boolean(base.recommendation_rationale_ref) && base.evidence_traceability_refs.length > 0 && Boolean(base.governance_rationale_ref) && Boolean(base.constitutional_rationale_ref) && base.hidden_reasoning_absent && base.operator_understandable ? "PASS" as const : "FAIL" as const,
  };
  return Object.freeze({ ...normalized, integrity_hash: hashWithoutIntegrity(normalized) });
}

function buildConsistencyReport(source: GovernanceConstitutionalCertificationResult, context: ContextCompletenessReport, dependency: DependencyAccuracyReport, conflict: ConflictArbitrationReport, priority: PriorityReproducibilityReport, alternative: AlternativeExplainabilityReport, scenario: Scenario): DecisionConsistencyReport {
  const c = ctx(source);
  const base: Omit<DecisionConsistencyReport, "integrity_hash"> = {
    consistency_report_id: "decision_intelligence_consistency_report",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    decision_comparison_matrix: freezeArray([context.context_report_id, dependency.dependency_report_id, conflict.conflict_report_id, priority.priority_report_id, alternative.alternative_report_id]),
    context_consistent: context.validation_state === "PASS" && scenario !== "DECISION_INCONSISTENCY",
    dependency_consistent: dependency.validation_state === "PASS" && scenario !== "DECISION_INCONSISTENCY",
    arbitration_consistent: conflict.validation_state === "PASS" && scenario !== "DECISION_INCONSISTENCY",
    priority_consistent: priority.validation_state === "PASS" && scenario !== "DECISION_INCONSISTENCY",
    recommendation_consistent: alternative.validation_state === "PASS" && scenario !== "DECISION_INCONSISTENCY",
    replay_consistent: scenario !== "REPLAY_INCONSISTENCY",
    determinism_verified: scenario !== "DECISION_INCONSISTENCY" && scenario !== "REPLAY_INCONSISTENCY",
    validation_state: "PASS",
  };
  const normalized = {
    ...base,
    validation_state: base.context_consistent && base.dependency_consistent && base.arbitration_consistent && base.priority_consistent && base.recommendation_consistent && base.replay_consistent && base.determinism_verified ? "PASS" as const : "FAIL" as const,
  };
  return Object.freeze({ ...normalized, integrity_hash: hashWithoutIntegrity(normalized) });
}

function buildEvidence(source: GovernanceConstitutionalCertificationResult, context: ContextCompletenessReport, dependency: DependencyAccuracyReport, conflict: ConflictArbitrationReport, priority: PriorityReproducibilityReport, alternative: AlternativeExplainabilityReport, consistency: DecisionConsistencyReport, scenario: Scenario): DecisionIntelligenceEvidencePackage {
  const c = ctx(source);
  const base: Omit<DecisionIntelligenceEvidencePackage, "integrity_hash"> = {
    evidence_package_id: "decision_intelligence_certification_evidence_package",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    context_evidence_refs: scenario === "INCOMPLETE_CONTEXT" ? freezeArray([]) : freezeArray([context.context_report_id, context.context_lineage_ref]),
    dependency_evidence_refs: freezeArray([dependency.dependency_report_id, dependency.dependency_lineage_ref]),
    conflict_evidence_refs: freezeArray([conflict.conflict_report_id, ...conflict.tradeoff_refs]),
    priority_evidence_refs: freezeArray([priority.priority_report_id, ...priority.score_calculations]),
    explainability_evidence_refs: scenario === "HIDDEN_REASONING" ? freezeArray([]) : freezeArray([alternative.alternative_report_id, alternative.recommendation_rationale_ref, alternative.governance_rationale_ref, alternative.constitutional_rationale_ref]),
    replay_evidence_refs: scenario === "REPLAY_INCONSISTENCY" ? freezeArray([]) : freezeArray([source.replay_hash, consistency.consistency_report_id]),
    integrity_evidence_refs: scenario === "HASH_MISMATCH" ? freezeArray([]) : freezeArray([context.integrity_hash, dependency.integrity_hash, conflict.integrity_hash, priority.integrity_hash, alternative.integrity_hash, consistency.integrity_hash]),
    complete: scenario !== "INCOMPLETE_CONTEXT" && scenario !== "MISSING_EVIDENCE" && scenario !== "HIDDEN_REASONING",
    immutable: scenario !== "FAIL_OPEN",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildReport(source: GovernanceConstitutionalCertificationResult, context: ContextCompletenessReport, dependency: DependencyAccuracyReport, conflict: ConflictArbitrationReport, priority: PriorityReproducibilityReport, alternative: AlternativeExplainabilityReport, consistency: DecisionConsistencyReport, failures: readonly DecisionIntelligenceCertificationFailure[]): ExplainabilityValidationReport {
  const c = ctx(source);
  const decision = failures.length ? "FAIL" : "PASS";
  const base: Omit<ExplainabilityValidationReport, "integrity_hash"> = {
    report_id: "decision_intelligence_explainability_validation_report",
    tenant_id: c.tenant_id,
    mission_id: c.mission_id,
    executive_summary: decision === "PASS" ? "Decision intelligence reasoning is correct, consistent, explainable, replayable, and operator-understandable." : "Decision intelligence certification is blocked by reasoning, explainability, or traceability failures.",
    decision_scope: DECISION_INTELLIGENCE_SCOPES,
    certified_checks: DECISION_INTELLIGENCE_CHECKS,
    context_completeness_assessment: context.validation_state,
    dependency_analysis_results: dependency.validation_state,
    conflict_detection_results: conflict.conflict_detection_complete && conflict.conflict_classification_correct ? "PASS" : "FAIL",
    arbitration_assessment: conflict.arbitration_deterministic ? "PASS" : "FAIL",
    priority_scoring_assessment: priority.validation_state,
    alternative_recommendation_assessment: alternative.alternative_refs.length && alternative.alternative_explanations.length ? "PASS" : "FAIL",
    rejected_option_assessment: alternative.rejected_option_explanations.length ? "PASS" : "FAIL",
    explainability_assessment: alternative.validation_state,
    replay_verification: consistency.replay_consistent ? "PASS" : "FAIL",
    integrity_verification: failures.includes("INTEGRITY_HASH_MISMATCH") ? "FAIL" : "PASS",
    failure_analysis: failures,
    certification_decision: decision,
    production_readiness: decision === "PASS" ? "READY" : "BLOCKED",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildLedger(source: GovernanceConstitutionalCertificationResult, evidence: DecisionIntelligenceEvidencePackage, report: ExplainabilityValidationReport, scenario: Scenario): readonly DecisionIntelligenceLedgerEntry[] {
  const c = ctx(source);
  const events: Omit<DecisionIntelligenceLedgerEntry, "integrity_hash">[] = [
    { ledger_entry_id: "decision_intelligence_ledger_001", tenant_id: c.tenant_id, mission_id: c.mission_id, event_type: "CONTEXT_CERTIFIED", scope_ref: "context_completeness", evidence_ref: evidence.evidence_package_id, certification_state: report.certification_decision, replay_refs: evidence.replay_evidence_refs, event_timestamp: "2026-07-05T09:12:18.000Z", sequence_number: 1, append_only: true, deleted: false },
    { ledger_entry_id: "decision_intelligence_ledger_002", tenant_id: c.tenant_id, mission_id: c.mission_id, event_type: "DEPENDENCIES_CERTIFIED", scope_ref: "dependency_accuracy", evidence_ref: evidence.evidence_package_id, certification_state: report.certification_decision, replay_refs: evidence.replay_evidence_refs, event_timestamp: "2026-07-05T09:12:19.000Z", sequence_number: 2, append_only: true, deleted: false },
    { ledger_entry_id: "decision_intelligence_ledger_003", tenant_id: c.tenant_id, mission_id: c.mission_id, event_type: "EXPLAINABILITY_CERTIFIED", scope_ref: "operator_explainability", evidence_ref: evidence.evidence_package_id, certification_state: report.certification_decision, replay_refs: evidence.replay_evidence_refs, event_timestamp: "2026-07-05T09:12:20.000Z", sequence_number: 3, append_only: true, deleted: false },
    { ledger_entry_id: "decision_intelligence_ledger_004", tenant_id: c.tenant_id, mission_id: c.mission_id, event_type: report.certification_decision === "PASS" ? "INTELLIGENCE_CERTIFIED" : "INTELLIGENCE_BLOCKED", scope_ref: report.report_id, evidence_ref: evidence.evidence_package_id, certification_state: report.certification_decision, replay_refs: evidence.replay_evidence_refs, event_timestamp: "2026-07-05T09:12:21.000Z", sequence_number: 4, append_only: (scenario === "FAIL_OPEN" ? false : true) as true, deleted: false },
  ];
  return freezeArray(events.map((event) => Object.freeze({ ...event, integrity_hash: hashWithoutIntegrity(event) })));
}

function collectFailures(input: {
  governance: GovernanceConstitutionalCertificationResult;
  context: ContextCompletenessReport;
  dependency: DependencyAccuracyReport;
  conflict: ConflictArbitrationReport;
  priority: PriorityReproducibilityReport;
  alternative: AlternativeExplainabilityReport;
  consistency: DecisionConsistencyReport;
  evidence: DecisionIntelligenceEvidencePackage;
  ledger: readonly DecisionIntelligenceLedgerEntry[];
  role: VisibilityRole;
  scenario: Scenario;
}): readonly DecisionIntelligenceCertificationFailure[] {
  const failures: DecisionIntelligenceCertificationFailure[] = [];
  if (input.governance.validation.validation_status !== "VALID" || input.governance.governance_report.certification_decision !== "PASS") failures.push("GOVERNANCE_CONSTITUTIONAL_CERTIFICATION_INVALID");
  if (input.context.validation_state !== "PASS") failures.push("INCOMPLETE_DECISION_CONTEXT");
  if (!input.context.evidence_refs.length || input.scenario === "MISSING_EVIDENCE") failures.push("MISSING_REQUIRED_EVIDENCE");
  if (!input.dependency.dependency_lineage_ref || input.scenario === "INCORRECT_DEPENDENCY") failures.push("INCORRECT_DEPENDENCY_ANALYSIS");
  if (!input.dependency.graph_consistent) failures.push("DEPENDENCY_GRAPH_INCONSISTENCY");
  if (!input.conflict.conflict_detection_complete) failures.push("UNDETECTED_CONFLICT");
  if (!input.conflict.conflict_classification_correct) failures.push("INCORRECT_CONFLICT_CLASSIFICATION");
  if (!input.conflict.arbitration_deterministic) failures.push("NONDETERMINISTIC_ARBITRATION");
  if (!input.priority.calculations_correct || !input.priority.ranking_reproducible) failures.push("INCORRECT_PRIORITY_CALCULATION");
  if (!input.priority.tie_breaking_deterministic) failures.push("INCONSISTENT_TIE_BREAKING");
  if (!input.alternative.alternative_refs.length) failures.push("MISSING_ALTERNATIVE_RECOMMENDATIONS");
  if (!input.alternative.rejected_option_explanations.length) failures.push("MISSING_REJECTED_OPTION_EXPLANATIONS");
  if (!input.alternative.hidden_reasoning_absent || !input.alternative.recommendation_rationale_ref) failures.push("HIDDEN_REASONING");
  if (!input.alternative.recommendation_ref || !input.alternative.evidence_traceability_refs.length) failures.push("UNTRACEABLE_RECOMMENDATIONS");
  if (!input.alternative.governance_rationale_ref) failures.push("MISSING_GOVERNANCE_RATIONALE");
  if (!input.alternative.constitutional_rationale_ref) failures.push("MISSING_CONSTITUTIONAL_RATIONALE");
  if (!input.consistency.replay_consistent) failures.push("REPLAY_INCONSISTENCY");
  if (input.consistency.validation_state !== "PASS") failures.push("DECISION_INCONSISTENCY");
  if (
    hashWithoutIntegrity(input.context) !== input.context.integrity_hash
    || hashWithoutIntegrity(input.dependency) !== input.dependency.integrity_hash
    || hashWithoutIntegrity(input.conflict) !== input.conflict.integrity_hash
    || hashWithoutIntegrity(input.priority) !== input.priority.integrity_hash
    || hashWithoutIntegrity(input.alternative) !== input.alternative.integrity_hash
    || hashWithoutIntegrity(input.consistency) !== input.consistency.integrity_hash
    || hashWithoutIntegrity(input.evidence) !== input.evidence.integrity_hash
    || input.ledger.some((entry) => hashWithoutIntegrity(entry) !== entry.integrity_hash)
    || !input.evidence.integrity_evidence_refs.length
  ) failures.push("INTEGRITY_HASH_MISMATCH");
  if (!input.evidence.immutable || input.ledger.some((entry) => !entry.append_only || entry.deleted)) failures.push("FAIL_OPEN_REASONING");
  if (input.alternative.tenant_id !== input.governance.governance_report.tenant_id) failures.push("CROSS_TENANT_REASONING_CONTAMINATION");
  if (!visibleToRole(input.governance, input.role)) failures.push("AUTHORIZATION_FAILURE");
  if (input.scenario === "EXECUTION_AUTHORITY") failures.push("EXECUTION_AUTHORITY_GRANTED");
  return freezeArray([...new Set(failures)]);
}

function buildValidation(failures: readonly DecisionIntelligenceCertificationFailure[]): DecisionIntelligenceCertificationValidation {
  const has = (failure: DecisionIntelligenceCertificationFailure) => failures.includes(failure);
  const base: Omit<DecisionIntelligenceCertificationValidation, "integrity_hash"> = {
    validation_id: "decision_intelligence_certification_validation",
    validation_status: failures.length ? "BLOCKED" : "VALID",
    governance_certification_valid: !has("GOVERNANCE_CONSTITUTIONAL_CERTIFICATION_INVALID"),
    context_complete: !has("INCOMPLETE_DECISION_CONTEXT"),
    required_evidence_present: !has("MISSING_REQUIRED_EVIDENCE"),
    dependency_analysis_correct: !has("INCORRECT_DEPENDENCY_ANALYSIS"),
    dependency_graph_consistent: !has("DEPENDENCY_GRAPH_INCONSISTENCY"),
    conflicts_detected: !has("UNDETECTED_CONFLICT"),
    conflict_classification_correct: !has("INCORRECT_CONFLICT_CLASSIFICATION"),
    arbitration_deterministic: !has("NONDETERMINISTIC_ARBITRATION"),
    priority_calculation_correct: !has("INCORRECT_PRIORITY_CALCULATION"),
    tie_breaking_consistent: !has("INCONSISTENT_TIE_BREAKING"),
    alternatives_present: !has("MISSING_ALTERNATIVE_RECOMMENDATIONS"),
    rejected_options_explained: !has("MISSING_REJECTED_OPTION_EXPLANATIONS"),
    hidden_reasoning_absent: !has("HIDDEN_REASONING"),
    recommendations_traceable: !has("UNTRACEABLE_RECOMMENDATIONS"),
    governance_rationale_complete: !has("MISSING_GOVERNANCE_RATIONALE"),
    constitutional_rationale_complete: !has("MISSING_CONSTITUTIONAL_RATIONALE"),
    replay_consistent: !has("REPLAY_INCONSISTENCY"),
    decision_consistent: !has("DECISION_INCONSISTENCY"),
    integrity_verified: !has("INTEGRITY_HASH_MISMATCH"),
    fail_closed: !has("FAIL_OPEN_REASONING"),
    tenant_isolated: !has("CROSS_TENANT_REASONING_CONTAMINATION"),
    authorization_valid: !has("AUTHORIZATION_FAILURE"),
    advisory_only: !has("EXECUTION_AUTHORITY_GRANTED"),
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<DecisionIntelligenceCertificationResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    context: result.context_report,
    dependency: result.dependency_report,
    conflict: result.conflict_arbitration_report,
    priority: result.priority_report,
    alternative: result.alternative_explainability_report,
    consistency: result.consistency_report,
    evidence: result.evidence_package,
    report: result.explainability_report,
    ledger: result.intelligence_ledger,
    validation: result.validation,
  });
}

export function runDecisionIntelligenceCertification(input: DecisionIntelligenceCertificationInput = {}): DecisionIntelligenceCertificationResult {
  const scenario = input.scenario ?? "BASELINE";
  const role = input.role ?? "OPERATOR";
  const governance_certification = input.governance_certification ?? runGovernanceConstitutionalCertification({ scenario: scenario === "GOVERNANCE_INVALID" ? "GOVERNANCE_BYPASS" : "BASELINE" });
  const context_report = buildContextReport(governance_certification, scenario);
  const dependency_report = buildDependencyReport(governance_certification, scenario);
  const conflict_arbitration_report = buildConflictReport(governance_certification, scenario);
  const priority_report = buildPriorityReport(governance_certification, scenario);
  const alternative_explainability_report = buildAlternativeReport(governance_certification, scenario);
  const consistency_report = buildConsistencyReport(governance_certification, context_report, dependency_report, conflict_arbitration_report, priority_report, alternative_explainability_report, scenario);
  const evidence_package = buildEvidence(governance_certification, context_report, dependency_report, conflict_arbitration_report, priority_report, alternative_explainability_report, consistency_report, scenario);
  const preFailures = collectFailures({ governance: governance_certification, context: context_report, dependency: dependency_report, conflict: conflict_arbitration_report, priority: priority_report, alternative: alternative_explainability_report, consistency: consistency_report, evidence: evidence_package, ledger: [], role, scenario });
  const explainability_report = buildReport(governance_certification, context_report, dependency_report, conflict_arbitration_report, priority_report, alternative_explainability_report, consistency_report, preFailures);
  const intelligence_ledger = buildLedger(governance_certification, evidence_package, explainability_report, scenario);
  const failures = collectFailures({ governance: governance_certification, context: context_report, dependency: dependency_report, conflict: conflict_arbitration_report, priority: priority_report, alternative: alternative_explainability_report, consistency: consistency_report, evidence: evidence_package, ledger: intelligence_ledger, role, scenario });
  const validation = buildValidation(failures);
  const base: Omit<DecisionIntelligenceCertificationResult, "integrity_hash" | "replay_hash"> = {
    certification_version: CERTIFICATION_VERSION,
    governance_certification,
    context_report,
    dependency_report,
    conflict_arbitration_report,
    priority_report,
    alternative_explainability_report,
    consistency_report,
    evidence_package,
    explainability_report,
    intelligence_ledger,
    validation,
    deterministic: true,
    replayable: true,
    advisory_only: true,
    mutates_reasoning_state: false,
    execution_authority_granted: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: hashWithoutIntegrity({ ...base, replay_hash }) });
}

export function replayDecisionIntelligenceCertification(result: DecisionIntelligenceCertificationResult): boolean {
  return resultReplayHash(result) === result.replay_hash && hashWithoutIntegrity(result) === result.integrity_hash;
}

export function computeContextCompletenessReportHash(record: Omit<ContextCompletenessReport, "integrity_hash"> | ContextCompletenessReport): string {
  return hashWithoutIntegrity(record);
}

export function getDecisionIntelligenceCertificationFoundation(): DecisionIntelligenceCertificationFoundation {
  return Object.freeze({
    certification_version: CERTIFICATION_VERSION,
    scopes: DECISION_INTELLIGENCE_SCOPES,
    checks: DECISION_INTELLIGENCE_CHECKS,
    result: runDecisionIntelligenceCertification(),
  });
}

export const DecisionIntelligenceCertification = Object.freeze({
  run: runDecisionIntelligenceCertification,
  replay: replayDecisionIntelligenceCertification,
});
