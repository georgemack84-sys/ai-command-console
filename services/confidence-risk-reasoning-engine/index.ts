import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { buildExplanationGraph, getReasoningGraph } from "@/services/evidence-policy-reasoning-graph";
import { getExplanation, registerExplanation } from "@/services/explainability-contract";
import type { ExplainabilityScenario, ExplanationRecord, ExplanationType } from "@/types/explainability-contract";
import type { ReasoningGraph } from "@/types/evidence-policy-reasoning-graph";
import type {
  ConfidenceAssessment,
  ConfidenceCategory,
  ConfidenceEvolutionPoint,
  ConfidenceLevel,
  ConfidenceRiskFailure,
  ConfidenceRiskInput,
  ConfidenceRiskObservabilitySurface,
  ConfidenceRiskReasoningContract,
  ConfidenceRiskReasoningRecord,
  ConfidenceRiskReplayResult,
  ConfidenceRiskRepository,
  ConfidenceRiskScenario,
  ConfidenceRiskValidationResult,
  MitigationExplanation,
  MitigationType,
  RiskAssessment,
  RiskEvolutionPoint,
  RiskLevel,
  RiskType,
} from "@/types/confidence-risk-reasoning-engine";

const VERSION = "confidence-risk-reasoning-engine/v8ALT.5.4" as const;
const REASONING_VERSION = "confidence-risk-reasoning/v8ALT.5.4" as const;
const confidenceLevels = Object.freeze(["VERY_HIGH", "HIGH", "MEDIUM", "LOW", "VERY_LOW", "INSUFFICIENT"] as const);
const riskLevels = Object.freeze(["MINIMAL", "LOW", "MODERATE", "HIGH", "CRITICAL", "UNACCEPTABLE"] as const);
const confidenceCategories = Object.freeze(["EVIDENCE", "PLANNING", "ORCHESTRATION", "DELEGATION", "SUPERVISION", "GOVERNANCE", "AUTHORITY", "REPLAY", "INTEGRITY", "OVERALL_DECISION"] as const);
const riskTypes = Object.freeze(["OPERATIONAL", "EXECUTION", "ORCHESTRATION", "DELEGATION", "SUPERVISION", "GOVERNANCE", "POLICY", "CONSTITUTIONAL", "AUTHORITY", "INTEGRITY", "REPLAY", "DEPENDENCY", "RECOVERY"] as const);
const sourceTypes = Object.freeze(["PLANNING", "EXECUTION", "DELEGATION", "ORCHESTRATION", "SUPERVISION", "GOVERNANCE", "INTERVENTION", "REPLAY"] as const);

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }
function round(value: number): number { return Math.max(0, Math.min(1, Math.round(value * 100) / 100)); }

function confidenceLevel(score: number): ConfidenceLevel {
  if (score >= 0.93) return "VERY_HIGH";
  if (score >= 0.8) return "HIGH";
  if (score >= 0.6) return "MEDIUM";
  if (score >= 0.4) return "LOW";
  if (score > 0) return "VERY_LOW";
  return "INSUFFICIENT";
}

function riskLevel(score: number): RiskLevel {
  if (score >= 0.9) return "UNACCEPTABLE";
  if (score >= 0.7) return "CRITICAL";
  if (score >= 0.5) return "HIGH";
  if (score >= 0.3) return "MODERATE";
  if (score >= 0.12) return "LOW";
  return "MINIMAL";
}

function failuresFor(scenario: ConfidenceRiskScenario): readonly ConfidenceRiskFailure[] {
  const map: Partial<Record<ConfidenceRiskScenario, ConfidenceRiskFailure>> = {
    INCOMPLETE_EVIDENCE: "SUPPORTING_EVIDENCE_INCOMPLETE",
    MISSING_CONFIDENCE_FACTORS: "CONFIDENCE_FACTORS_MISSING",
    UNREPRODUCIBLE_RISK_CLASSIFICATION: "RISK_CLASSIFICATION_UNREPRODUCIBLE",
    MISSING_GOVERNANCE_EVALUATIONS: "GOVERNANCE_EVALUATIONS_ABSENT",
    MISSING_CONSTITUTIONAL_VALIDATION: "CONSTITUTIONAL_VALIDATION_UNAVAILABLE",
    INCOMPLETE_AUTHORITY_VALIDATION: "AUTHORITY_VALIDATION_INCOMPLETE",
    INVALID_REPLAY_REFERENCE: "REPLAY_REFERENCE_INVALID",
    CONFIDENCE_LINEAGE_GAP: "CONFIDENCE_LINEAGE_GAP_DETECTED",
    RISK_LINEAGE_GAP: "RISK_LINEAGE_GAP_DETECTED",
    UNDOCUMENTED_MITIGATION: "MITIGATION_REASONING_UNDOCUMENTED",
    NONDETERMINISTIC_CALCULATION: "DETERMINISTIC_CALCULATION_FAILED",
    CROSS_TENANT_REFERENCE: "CROSS_TENANT_REFERENCE_DETECTED",
    INTEGRITY_FAILURE: "INTEGRITY_VERIFICATION_FAILED",
    ADVISORY_ONLY_VIOLATION: "ADVISORY_ONLY_VIOLATION",
  };
  return map[scenario] ? freezeArray([map[scenario]]) : freezeArray([]);
}

function explainabilityScenario(failures: readonly ConfidenceRiskFailure[]): ExplainabilityScenario {
  if (failures.includes("SUPPORTING_EVIDENCE_INCOMPLETE")) return "MISSING_EVIDENCE";
  if (failures.includes("CONFIDENCE_FACTORS_MISSING")) return "MISSING_CONFIDENCE_REASONING";
  if (failures.includes("GOVERNANCE_EVALUATIONS_ABSENT")) return "INCOMPLETE_POLICY_REFERENCES";
  if (failures.includes("CONSTITUTIONAL_VALIDATION_UNAVAILABLE")) return "MISSING_CONSTITUTIONAL_REFERENCES";
  if (failures.includes("AUTHORITY_VALIDATION_INCOMPLETE")) return "AUTHORITY_VALIDATION_FAILURE";
  if (failures.includes("REPLAY_REFERENCE_INVALID")) return "INVALID_REPLAY_REFERENCE";
  if (failures.includes("CROSS_TENANT_REFERENCE_DETECTED")) return "CROSS_TENANT_REFERENCE";
  if (failures.includes("INTEGRITY_VERIFICATION_FAILED")) return "INTEGRITY_HASH_FAILURE";
  if (failures.includes("ADVISORY_ONLY_VIOLATION")) return "ADVISORY_ONLY_VIOLATION";
  return "BASELINE";
}

function sourceExplanation(input: ConfidenceRiskInput, failures: readonly ConfidenceRiskFailure[]): ExplanationRecord {
  if (input.explanation) return input.explanation;
  return getExplanation(registerExplanation({ scenario: explainabilityScenario(failures), tenant_id: input.tenant_id, mission_id: input.mission_id }))!;
}

function sourceGraph(record: ExplanationRecord, input: ConfidenceRiskInput): ReasoningGraph | null {
  if (input.graph) return input.graph;
  return getReasoningGraph(buildExplanationGraph({ tenant_id: record.tenant_id, mission_id: record.mission_id, explanation: record }));
}

function confidenceScore(category: ConfidenceCategory, record: ExplanationRecord, failures: readonly ConfidenceRiskFailure[]): number {
  if (failures.includes("DETERMINISTIC_CALCULATION_FAILED") && category === "OVERALL_DECISION") return 1.01;
  if (failures.includes("CONFIDENCE_FACTORS_MISSING")) return 0;
  const c = record.confidence_reasoning;
  if (!c) return 0;
  const governance = record.policy_references.length ? c.governance_certainty : 0;
  const authority = record.authority_references.authority_result === "VALIDATED" ? 0.92 : 0.2;
  const replay = record.replay.replay_reference ? c.replay_consistency : 0;
  const integrity = record.replay.integrity_hash ? 0.97 : 0;
  const evidence = record.evidence_references.length ? c.evidence_quality : 0;
  const base: Record<ConfidenceCategory, number> = {
    EVIDENCE: evidence,
    PLANNING: (evidence + c.historical_consistency) / 2,
    ORCHESTRATION: (replay + governance) / 2,
    DELEGATION: (authority + governance) / 2,
    SUPERVISION: (replay + c.historical_consistency) / 2,
    GOVERNANCE: governance,
    AUTHORITY: authority,
    REPLAY: replay,
    INTEGRITY: integrity,
    OVERALL_DECISION: (evidence + c.historical_consistency + replay + governance + authority + integrity) / 6,
  };
  return round(base[category]);
}

function confidenceAssessment(category: ConfidenceCategory, record: ExplanationRecord, failures: readonly ConfidenceRiskFailure[]): ConfidenceAssessment {
  const score = confidenceScore(category, record, failures);
  const base = {
    confidence_id: id("CRA", "confidence-assessment", { category, decision: record.decision_id }),
    category,
    confidence_score: score,
    confidence_level: confidenceLevel(score),
    contributing_factors: failures.includes("CONFIDENCE_FACTORS_MISSING") ? freezeArray<string>([]) : freezeArray(record.confidence_reasoning?.contributing_factors ?? []),
    positive_evidence: failures.includes("SUPPORTING_EVIDENCE_INCOMPLETE") ? freezeArray<string>([]) : record.evidence_references,
    negative_evidence: freezeArray(record.unsupported_claims),
    historical_consistency: record.confidence_reasoning?.historical_consistency ?? 0,
    replay_consistency: record.confidence_reasoning?.replay_consistency ?? 0,
    integrity_status: record.replay.integrity_hash ? "VERIFIED" as const : "FAILED" as const,
    truth_reference: record.replay.truth_reference,
    lineage_reference: record.replay.lineage_reference,
    replay_reference: record.replay.replay_reference,
  };
  return Object.freeze({ ...base, assessment_hash: hashValue("confidence-assessment", base) });
}

function riskScore(type: RiskType, record: ExplanationRecord, failures: readonly ConfidenceRiskFailure[]): number {
  const r = record.risk_reasoning;
  if (!r) return 1;
  const source: Record<RiskType, number> = {
    OPERATIONAL: r.operational_risk,
    EXECUTION: r.execution_risk,
    ORCHESTRATION: (r.execution_risk + r.operational_risk) / 2,
    DELEGATION: record.authority_references.authority_result === "VALIDATED" ? 0.1 : 0.75,
    SUPERVISION: r.operational_risk / 2,
    GOVERNANCE: r.governance_risk,
    POLICY: r.policy_risk,
    CONSTITUTIONAL: r.constitutional_risk,
    AUTHORITY: record.authority_references.authority_result === "VALIDATED" ? 0.08 : 0.8,
    INTEGRITY: r.integrity_risk,
    REPLAY: record.replay.replay_reference ? 0.05 : 0.82,
    DEPENDENCY: record.evidence_references.length ? 0.16 : 0.84,
    RECOVERY: 0.18,
  };
  const score = source[type] + (failures.includes("RISK_CLASSIFICATION_UNREPRODUCIBLE") && type === "OPERATIONAL" ? 0.5 : 0);
  return round(score);
}

function riskAssessment(type: RiskType, record: ExplanationRecord, failures: readonly ConfidenceRiskFailure[]): RiskAssessment {
  const score = riskScore(type, record, failures);
  const mitigations = failures.includes("MITIGATION_REASONING_UNDOCUMENTED") ? freezeArray<MitigationType>([]) : freezeArray<MitigationType>(["operator review", "pause"]);
  const base = {
    risk_id: id("CRR", "risk-assessment", { type, decision: record.decision_id }),
    risk_type: type,
    risk_score: score,
    risk_level: failures.includes("RISK_CLASSIFICATION_UNREPRODUCIBLE") && type === "OPERATIONAL" ? "MINIMAL" as const : riskLevel(score),
    likelihood: score,
    impact: round(score * 0.8 + 0.1),
    supporting_evidence: failures.includes("SUPPORTING_EVIDENCE_INCOMPLETE") ? freezeArray<string>([]) : record.evidence_references,
    governance_impacts: failures.includes("GOVERNANCE_EVALUATIONS_ABSENT") ? freezeArray<string>([]) : record.policy_references,
    constitutional_impacts: failures.includes("CONSTITUTIONAL_VALIDATION_UNAVAILABLE") ? freezeArray<string>([]) : record.constitutional_references,
    recommended_mitigations: mitigations,
    truth_reference: record.replay.truth_reference,
    lineage_reference: record.replay.lineage_reference,
    replay_reference: record.replay.replay_reference,
  };
  return Object.freeze({ ...base, assessment_hash: hashValue("risk-assessment", base) });
}

function confidencePoint(state: ConfidenceEvolutionPoint["state"], score: number, record: ExplanationRecord, order: number): ConfidenceEvolutionPoint {
  const base = { state, score: round(score), explanation: `${state.toLowerCase().replaceAll("_", " ")} confidence derived from certified lineage`, deterministic_order: order, lineage_reference: record.replay.lineage_reference };
  return Object.freeze({ ...base, point_hash: hashValue("confidence-evolution-point", base) });
}

function riskPoint(state: RiskEvolutionPoint["state"], level: RiskLevel, record: ExplanationRecord, order: number): RiskEvolutionPoint {
  const base = { state, risk_level: level, explanation: `${state.toLowerCase().replaceAll("_", " ")} risk derived from certified lineage`, deterministic_order: order, lineage_reference: record.replay.lineage_reference };
  return Object.freeze({ ...base, point_hash: hashValue("risk-evolution-point", base) });
}

function mitigation(record: ExplanationRecord, failures: readonly ConfidenceRiskFailure[]): MitigationExplanation {
  const selected = !failures.includes("MITIGATION_REASONING_UNDOCUMENTED");
  const base = {
    mitigation_id: id("CRM", "mitigation-explanation", record.decision_id),
    mitigation_type: "operator review" as const,
    selected,
    rationale: selected ? record.risk_reasoning?.mitigation_rationale ?? "operator review preserves advisory-only operation" : "",
    rejected_mitigations: selected ? freezeArray<MitigationType>(["rollback", "safe termination"]) : freezeArray<MitigationType>([]),
    governance_approval: record.policy_references[0] ?? "",
    authority_approval: record.authority_references.validated_authority,
    expected_effectiveness: selected ? 0.82 : 0,
    residual_risk: selected ? "LOW" as const : "UNACCEPTABLE" as const,
  };
  return Object.freeze({ ...base, mitigation_hash: hashValue("mitigation-explanation", base) });
}

function computeReasoningHash(record: Omit<ConfidenceRiskReasoningRecord, "reasoning_hash"> | ConfidenceRiskReasoningRecord): string {
  const { reasoning_hash: _hash, ...source } = record as ConfidenceRiskReasoningRecord;
  return hashValue("confidence-risk-reasoning-record", source);
}

function record(input: ConfidenceRiskInput = {}): ConfidenceRiskReasoningRecord {
  const failures = failuresFor(input.scenario ?? "BASELINE");
  const explanation = sourceExplanation(input, failures);
  const graph = sourceGraph(explanation, input);
  const confidence = confidenceCategories.map((category) => confidenceAssessment(category, explanation, failures));
  const risks = riskTypes.map((type) => riskAssessment(type, explanation, failures));
  const overall = confidence.find((item) => item.category === "OVERALL_DECISION")!;
  const operationalRisk = risks.find((item) => item.risk_type === "OPERATIONAL")!;
  const confidenceEvolution = freezeArray([
    confidencePoint("INITIAL_ESTIMATE", overall.confidence_score - 0.08, explanation, 1),
    confidencePoint("PLANNING_VALIDATED", overall.confidence_score - 0.05, explanation, 2),
    confidencePoint("GOVERNANCE_VALIDATED", overall.confidence_score - 0.03, explanation, 3),
    confidencePoint("AUTHORITY_VALIDATED", overall.confidence_score - 0.02, explanation, 4),
    confidencePoint("EXECUTION_VALIDATED", overall.confidence_score - 0.01, explanation, 5),
    confidencePoint("SUPERVISION_VALIDATED", overall.confidence_score, explanation, 6),
    confidencePoint("REPLAY_VERIFIED", overall.confidence_score, explanation, 7),
    confidencePoint("FINAL_CONFIDENCE", overall.confidence_score, explanation, 8),
  ]).filter((_, index) => !(failures.includes("CONFIDENCE_LINEAGE_GAP_DETECTED") && index === 3));
  const riskEvolution = freezeArray([
    riskPoint("IDENTIFIED", operationalRisk.risk_level, explanation, 1),
    riskPoint("ANALYZED", operationalRisk.risk_level, explanation, 2),
    riskPoint("CLASSIFIED", operationalRisk.risk_level, explanation, 3),
    riskPoint("MITIGATION_PLANNED", "LOW", explanation, 4),
    riskPoint("MITIGATED", "LOW", explanation, 5),
    riskPoint("MONITORED", "LOW", explanation, 6),
    riskPoint("RESOLVED", "LOW", explanation, 7),
    riskPoint("ARCHIVED", "LOW", explanation, 8),
  ]).filter((_, index) => !(failures.includes("RISK_LINEAGE_GAP_DETECTED") && index === 4));
  const reasoning_id = id("CRRE", "confidence-risk-reasoning", { decision: explanation.decision_id, scenario: input.scenario ?? "BASELINE" });
  const base = {
    reasoning_id,
    reasoning_version: REASONING_VERSION,
    engine_version: VERSION,
    tenant_id: failures.includes("CROSS_TENANT_REFERENCE_DETECTED") ? "external-tenant" : explanation.tenant_id,
    mission_id: explanation.mission_id,
    execution_id: explanation.execution_id,
    plan_id: explanation.plan_id,
    decision_id: explanation.decision_id,
    explanation_id: explanation.explanation_id,
    graph_id: graph?.graph_id ?? null,
    source_explanation: explanation,
    source_graph: graph,
    confidence_assessments: freezeArray(confidence),
    risk_assessments: freezeArray(risks),
    confidence_evolution: freezeArray(confidenceEvolution),
    risk_evolution: freezeArray(riskEvolution),
    mitigation_explanations: freezeArray([mitigation(explanation, failures)]),
    confidence_narrative: `Confidence: ${Math.round(overall.confidence_score * 100)}% (${overall.confidence_level}). The assessment is supported by certified evidence, governance validation, authority verification, replay consistency, and integrity verification.`,
    risk_narrative: `Risk: ${operationalRisk.risk_level}. The assessment traces operational, governance, constitutional, authority, replay, and integrity risk with documented mitigation reasoning.`,
    truth_reference: `truth:confidence-risk:${reasoning_id}`,
    lineage_reference: `lineage:confidence-risk:${reasoning_id}`,
    replay_reference: failures.includes("REPLAY_REFERENCE_INVALID") ? "" : `replay:confidence-risk:${reasoning_id}`,
    advisory_only: true as const,
    plan_modified: failures.includes("ADVISORY_ONLY_VIOLATION"),
    execution_modified: failures.includes("ADVISORY_ONLY_VIOLATION"),
    evidence_modified: failures.includes("ADVISORY_ONLY_VIOLATION"),
    governance_modified: failures.includes("ADVISORY_ONLY_VIOLATION"),
    authority_escalated: failures.includes("ADVISORY_ONLY_VIOLATION"),
  };
  return Object.freeze({ ...base, reasoning_hash: failures.includes("INTEGRITY_VERIFICATION_FAILED") ? "" : computeReasoningHash(base as Omit<ConfidenceRiskReasoningRecord, "reasoning_hash">) });
}

function computeRepositoryHash(repository: Omit<ConfidenceRiskRepository, "repository_hash"> | ConfidenceRiskRepository): string {
  const { repository_hash: _hash, ...source } = repository as ConfidenceRiskRepository;
  return hashValue("confidence-risk-reasoning-repository", source);
}

export function buildConfidenceRiskReasoning(input: ConfidenceRiskInput = {}): ConfidenceRiskRepository {
  const reasoning = record(input);
  const base = { repository_id: id("CRRR", "confidence-risk-reasoning-repository", reasoning.reasoning_id), tenant_id: reasoning.tenant_id, mission_id: reasoning.mission_id, records: freezeArray([reasoning]), append_only: true as const, read_only: true as const };
  return Object.freeze({ ...base, repository_hash: computeRepositoryHash(base as Omit<ConfidenceRiskRepository, "repository_hash">) });
}

export function getConfidenceRiskRecord(repository = buildConfidenceRiskReasoning(), reasoning_id?: string): ConfidenceRiskReasoningRecord | null {
  return repository.records.find((item) => item.reasoning_id === (reasoning_id ?? repository.records[0]?.reasoning_id)) ?? null;
}

export function calculateConfidence(input: ConfidenceRiskInput = {}): readonly ConfidenceAssessment[] { return getConfidenceRiskRecord(buildConfidenceRiskReasoning(input))?.confidence_assessments ?? freezeArray([]); }
export function analyzeRisk(input: ConfidenceRiskInput = {}): readonly RiskAssessment[] { return getConfidenceRiskRecord(buildConfidenceRiskReasoning(input))?.risk_assessments ?? freezeArray([]); }
export function generateConfidenceNarrative(input: ConfidenceRiskInput = {}): string { return getConfidenceRiskRecord(buildConfidenceRiskReasoning(input))?.confidence_narrative ?? ""; }
export function generateRiskNarrative(input: ConfidenceRiskInput = {}): string { return getConfidenceRiskRecord(buildConfidenceRiskReasoning(input))?.risk_narrative ?? ""; }

export function validateConfidenceRiskReasoning(reasoning?: ConfidenceRiskReasoningRecord | null): ConfidenceRiskValidationResult {
  if (!reasoning) {
    const failures = freezeArray<ConfidenceRiskFailure>(["SUPPORTING_EVIDENCE_INCOMPLETE"]);
    const source = { reasoning_id: null, valid: false, evidence_complete: false, confidence_factors_complete: false, risk_reproducible: false, governance_valid: false, constitutional_valid: false, authority_valid: false, replay_valid: false, confidence_lineage_complete: false, risk_lineage_complete: false, mitigation_documented: false, deterministic_calculation_valid: false, tenant_isolated: false, integrity_valid: false, advisory_only_enforced: false, failures };
    return Object.freeze({ ...source, validation_hash: hashValue("confidence-risk-validation", source) });
  }
  const expectedRisk = riskLevel(reasoning.risk_assessments.find((item) => item.risk_type === "OPERATIONAL")?.risk_score ?? 1);
  const evidence_complete = reasoning.confidence_assessments.every((item) => item.positive_evidence.length > 0) && reasoning.risk_assessments.every((item) => item.supporting_evidence.length > 0);
  const confidence_factors_complete = reasoning.confidence_assessments.every((item) => item.contributing_factors.length > 0);
  const risk_reproducible = reasoning.risk_assessments.find((item) => item.risk_type === "OPERATIONAL")?.risk_level === expectedRisk;
  const governance_valid = reasoning.source_explanation.policy_references.length > 0 && reasoning.risk_assessments.every((item) => item.governance_impacts.length > 0) && !reasoning.governance_modified;
  const constitutional_valid = reasoning.source_explanation.constitutional_references.length > 0 && reasoning.risk_assessments.every((item) => item.constitutional_impacts.length > 0);
  const authority_valid = reasoning.source_explanation.authority_references.authority_result === "VALIDATED" && !reasoning.authority_escalated;
  const replay_valid = Boolean(reasoning.replay_reference) && reasoning.confidence_assessments.every((item) => item.replay_reference) && reasoning.risk_assessments.every((item) => item.replay_reference);
  const confidence_lineage_complete = reasoning.confidence_evolution.length === 8 && reasoning.confidence_evolution.map((item) => item.deterministic_order).join("|") === "1|2|3|4|5|6|7|8";
  const risk_lineage_complete = reasoning.risk_evolution.length === 8 && reasoning.risk_evolution.map((item) => item.deterministic_order).join("|") === "1|2|3|4|5|6|7|8";
  const mitigation_documented = reasoning.mitigation_explanations.every((item) => item.selected && Boolean(item.rationale)) && reasoning.risk_assessments.every((item) => item.recommended_mitigations.length > 0);
  const deterministic_calculation_valid = reasoning.confidence_assessments.every((item) => item.confidence_score <= 1 && item.confidence_score >= 0);
  const tenant_isolated = reasoning.tenant_id.startsWith("tenant:") && reasoning.tenant_id === reasoning.source_explanation.tenant_id;
  const integrity_valid = Boolean(reasoning.reasoning_hash) && computeReasoningHash(reasoning) === reasoning.reasoning_hash;
  const advisory_only_enforced = reasoning.advisory_only && !reasoning.plan_modified && !reasoning.execution_modified && !reasoning.evidence_modified && !reasoning.governance_modified && !reasoning.authority_escalated;
  const failures = unique([
    ...(!evidence_complete ? ["SUPPORTING_EVIDENCE_INCOMPLETE" as const] : []),
    ...(!confidence_factors_complete ? ["CONFIDENCE_FACTORS_MISSING" as const] : []),
    ...(!risk_reproducible ? ["RISK_CLASSIFICATION_UNREPRODUCIBLE" as const] : []),
    ...(!governance_valid ? ["GOVERNANCE_EVALUATIONS_ABSENT" as const] : []),
    ...(!constitutional_valid ? ["CONSTITUTIONAL_VALIDATION_UNAVAILABLE" as const] : []),
    ...(!authority_valid ? ["AUTHORITY_VALIDATION_INCOMPLETE" as const] : []),
    ...(!replay_valid ? ["REPLAY_REFERENCE_INVALID" as const] : []),
    ...(!confidence_lineage_complete ? ["CONFIDENCE_LINEAGE_GAP_DETECTED" as const] : []),
    ...(!risk_lineage_complete ? ["RISK_LINEAGE_GAP_DETECTED" as const] : []),
    ...(!mitigation_documented ? ["MITIGATION_REASONING_UNDOCUMENTED" as const] : []),
    ...(!deterministic_calculation_valid ? ["DETERMINISTIC_CALCULATION_FAILED" as const] : []),
    ...(!tenant_isolated ? ["CROSS_TENANT_REFERENCE_DETECTED" as const] : []),
    ...(!integrity_valid ? ["INTEGRITY_VERIFICATION_FAILED" as const] : []),
    ...(!advisory_only_enforced ? ["ADVISORY_ONLY_VIOLATION" as const] : []),
  ]);
  const valid = failures.length === 0;
  const source = { reasoning_id: reasoning.reasoning_id, valid, evidence_complete, confidence_factors_complete, risk_reproducible, governance_valid, constitutional_valid, authority_valid, replay_valid, confidence_lineage_complete, risk_lineage_complete, mitigation_documented, deterministic_calculation_valid, tenant_isolated, integrity_valid, advisory_only_enforced, failures };
  return Object.freeze({ ...source, validation_hash: hashValue("confidence-risk-validation", source) });
}

export function replayConfidenceAnalysis(reasoning = getConfidenceRiskRecord()): ConfidenceRiskReplayResult {
  const reconstructed_hash = reasoning ? computeReasoningHash(reasoning) : "";
  const source = { replay_reference: reasoning?.replay_reference ?? "", reasoning_id: reasoning?.reasoning_id ?? "", replay_type: "CONFIDENCE" as const, deterministic: Boolean(reasoning?.replay_reference) && reconstructed_hash === reasoning?.reasoning_hash, reconstructed_hash, original_hash: reasoning?.reasoning_hash ?? "" };
  return Object.freeze({ ...source, replay_result_hash: hashValue("confidence-risk-replay", source) });
}

export function replayRiskAnalysis(reasoning = getConfidenceRiskRecord()): ConfidenceRiskReplayResult {
  const reconstructed_hash = reasoning ? computeReasoningHash(reasoning) : "";
  const source = { replay_reference: reasoning?.replay_reference ?? "", reasoning_id: reasoning?.reasoning_id ?? "", replay_type: "RISK" as const, deterministic: Boolean(reasoning?.replay_reference) && reconstructed_hash === reasoning?.reasoning_hash, reconstructed_hash, original_hash: reasoning?.reasoning_hash ?? "" };
  return Object.freeze({ ...source, replay_result_hash: hashValue("confidence-risk-replay", source) });
}

export function buildConfidenceRiskObservabilitySurface(repository = buildConfidenceRiskReasoning()): ConfidenceRiskObservabilitySurface {
  const records = repository.records;
  return Object.freeze({ repository_id: repository.repository_id, tenant_id: repository.tenant_id, mission_id: repository.mission_id, record_count: records.length, confidence_categories: freezeArray(records.flatMap((item) => item.confidence_assessments.map((assessment) => assessment.category))), risk_types: freezeArray(records.flatMap((item) => item.risk_assessments.map((assessment) => assessment.risk_type))), advisory_only: true, repository_hash: repository.repository_hash });
}

export function getConfidenceRiskReasoningContract(): ConfidenceRiskReasoningContract {
  const repository = buildConfidenceRiskReasoning();
  const reasoning = getConfidenceRiskRecord(repository);
  return Object.freeze({
    doctrine: Object.freeze({
      engine_version: VERSION,
      principles: freezeArray(["deterministic-scoring", "explainable-reasoning", "evidence-backed-confidence", "evidence-backed-risk", "immutable-lineage", "replay-identical-reconstruction", "governance-awareness", "constitutional-accountability", "authority-traceability", "advisory-only-operation"]),
      confidence_levels: confidenceLevels,
      risk_levels: riskLevels,
      confidence_categories: confidenceCategories,
      risk_types: riskTypes,
      source_explanation_types: sourceTypes as readonly ExplanationType[],
      advisory_only: true,
    }),
    repository,
    validation: validateConfidenceRiskReasoning(reasoning),
    confidence_replay: replayConfidenceAnalysis(reasoning),
    risk_replay: replayRiskAnalysis(reasoning),
    observability: buildConfidenceRiskObservabilitySurface(repository),
  });
}
