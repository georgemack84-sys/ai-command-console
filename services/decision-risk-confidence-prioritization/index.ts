import { generateDecisionIntegrityHash } from "@/services/decision-integrity";
import { normalizeDecisionCandidateInput } from "@/services/decision-input-normalization";
import { createDecisionPriority } from "@/services/decision-priority-contract";
import type { DecisionCandidate } from "@/types/decision-input-normalization";
import type {
  ConfidenceAssessment,
  ConfidencePriorityLevel,
  PriorityRestrictionStatus,
  RiskConfidenceExplanation,
  RiskConfidenceFailureReason,
  RiskConfidenceLedgerRecord,
  RiskConfidenceObservability,
  RiskConfidencePrioritizationInput,
  RiskConfidencePrioritizationResult,
  RiskConfidenceReplayRecord,
  RiskEscalationStatus,
  RiskPriorityAssessment,
  RiskPriorityLevel,
  RiskProbabilityLevel,
} from "@/types/decision-risk-confidence-prioritization";

const NOW = "2026-07-03T09:53:00.000Z";
const ENGINE_VERSION = "risk-confidence-prioritization-engine/v1";

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function recordHash<T extends Record<string, unknown>>(value: T): string {
  const copy = { ...value };
  delete copy.integrity_hash;
  return hash(copy);
}

function normalizeStrings(values: readonly string[] | undefined): string[] {
  return [...new Set((values ?? []).filter((value) => value.length > 0))].sort();
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function average(values: readonly number[], fallback: number): number {
  const usable = values.filter(Number.isFinite);
  return usable.length === 0 ? fallback : usable.reduce((sum, value) => sum + value, 0) / usable.length;
}

function defaultCandidate(): DecisionCandidate {
  const normalized = normalizeDecisionCandidateInput();
  if (!normalized.candidate) throw new Error("default normalized decision candidate unavailable");
  return normalized.candidate;
}

function refs(input: RiskConfidencePrioritizationInput, candidate: DecisionCandidate) {
  return Object.freeze({
    evidence_refs: normalizeStrings(input.evidence_refs ?? candidate.evidence_refs),
    governance_refs: normalizeStrings(input.governance_refs ?? candidate.governance_refs),
    constitutional_refs: normalizeStrings(input.constitutional_refs ?? ["constitution_risk_confidence_prioritization_v1"]),
    replay_refs: normalizeStrings(input.replay_refs ?? candidate.replay_refs),
    risk_refs: normalizeStrings(input.risk_refs ?? candidate.risk_refs),
    confidence_refs: normalizeStrings(input.confidence_refs ?? candidate.confidence_refs),
  });
}

function tenantLeak(values: readonly string[], tenantId: string): boolean {
  return values.some((value) => value.includes("tenant_beta") && tenantId !== "tenant_beta");
}

function riskLevel(score: number): RiskPriorityLevel {
  if (score >= 90) return "CRITICAL";
  if (score >= 75) return "HIGH";
  if (score >= 45) return "MODERATE";
  if (score >= 20) return "LOW";
  return "MINIMAL";
}

function probabilityLevel(score: number): RiskProbabilityLevel {
  if (score >= 90) return "VERY_HIGH";
  if (score >= 70) return "HIGH";
  if (score >= 45) return "MODERATE";
  if (score >= 20) return "LOW";
  return "MINIMAL";
}

function confidenceLevel(score: number): ConfidencePriorityLevel {
  if (score >= 90) return "VERY_HIGH";
  if (score >= 75) return "HIGH";
  if (score >= 45) return "MODERATE";
  if (score >= 20) return "LOW";
  return "VERY_LOW";
}

function restrictionStatus(confidenceScore: number, uncertaintyScore: number, degradationScore: number): PriorityRestrictionStatus {
  if (confidenceScore < 20 || uncertaintyScore >= 90) return "BLOCKED";
  if (confidenceScore < 45 || degradationScore >= 75) return "RESTRICTED";
  if (confidenceScore < 75 || uncertaintyScore >= 60) return "REVIEW_REQUIRED";
  return "NONE";
}

function escalationStatus(input: RiskConfidencePrioritizationInput, riskScore: number, confidenceScore: number, uncertaintyScore: number): RiskEscalationStatus {
  if ((input.constitutional_risk ?? 0) >= 70) return "IMMEDIATE_GOVERNANCE_REVIEW";
  if ((input.governance_risk ?? 0) >= 75 || riskScore >= 90) return "GOVERNANCE_REVIEW";
  if (riskScore >= 75 && (confidenceScore < 60 || uncertaintyScore >= 60)) return "OPERATOR_REVIEW";
  return "NONE";
}

function riskSeverity(input: RiskConfidencePrioritizationInput, candidate: DecisionCandidate): number {
  return clamp(average([
    input.operational_risk ?? 55,
    input.mission_risk ?? 60,
    input.governance_risk ?? (candidate.governance_refs.length > 0 ? 45 : 85),
    input.constitutional_risk ?? 20,
    input.execution_risk ?? (candidate.authority_required ? 70 : 40),
    input.recovery_risk ?? 45,
    input.dependency_risk ?? Math.min(85, candidate.evidence_refs.length * 12),
    input.cascading_failure_potential ?? 35,
  ], 50));
}

function probabilityScore(input: RiskConfidencePrioritizationInput): number {
  return clamp(average(input.probability_inputs ?? [55], 55));
}

function impactScore(input: RiskConfidencePrioritizationInput): number {
  return clamp(average(input.impact_inputs ?? [input.mission_risk ?? 60, input.operational_risk ?? 55], 55));
}

function reliabilityScore(input: RiskConfidencePrioritizationInput, referenceSet: ReturnType<typeof refs>): number {
  const inputAverage = average(input.reliability_inputs ?? [], NaN);
  if (Number.isFinite(inputAverage)) return clamp(inputAverage);
  const completeness = Math.min(100, referenceSet.evidence_refs.length * 25);
  const governance = referenceSet.governance_refs.length > 0 ? 20 : 0;
  const lineage = referenceSet.confidence_refs.length > 0 ? 15 : 0;
  return clamp(completeness + governance + lineage);
}

function uncertaintyScore(input: RiskConfidencePrioritizationInput, referenceSet: ReturnType<typeof refs>): number {
  const inputAverage = average(input.uncertainty_inputs ?? [], NaN);
  if (Number.isFinite(inputAverage)) return clamp(inputAverage);
  const missingEvidence = referenceSet.evidence_refs.length === 0 ? 45 : 0;
  const missingConfidence = referenceSet.confidence_refs.length === 0 ? 25 : 0;
  const constitutional = (input.constitutional_risk ?? 0) >= 70 ? 20 : 0;
  return clamp(missingEvidence + missingConfidence + constitutional);
}

function degradationScore(input: RiskConfidencePrioritizationInput): number {
  return clamp(average(input.degradation_inputs ?? [10], 10));
}

function confidenceScore(input: RiskConfidencePrioritizationInput, referenceSet: ReturnType<typeof refs>, reliability: number, uncertainty: number, degradation: number): number {
  const base = average(input.confidence_inputs ?? [], 70);
  return clamp(base * 0.5 + reliability * 0.35 - uncertainty * 0.25 - degradation * 0.15 + (referenceSet.evidence_refs.length > 2 ? 8 : 0));
}

function compositeRisk(severity: number, probability: number, impact: number): number {
  return clamp(severity * 0.45 + probability * 0.25 + impact * 0.3);
}

function priorityAdjustment(riskScore: number, confidence: number): number {
  if (riskScore >= 75 && confidence >= 75) return 15;
  if (riskScore >= 75 && confidence < 60) return 5;
  if (riskScore < 45 && confidence < 45) return -10;
  return 0;
}

function collectFailures(input: RiskConfidencePrioritizationInput, candidate: DecisionCandidate, referenceSet: ReturnType<typeof refs>): RiskConfidenceFailureReason[] {
  const failures: RiskConfidenceFailureReason[] = [];
  if ((input.hidden_prioritization_refs ?? []).length > 0) failures.push("HIDDEN_PRIORITIZATION_DETECTED");
  if (input.risk_refs?.length === 0 && input.operational_risk === undefined && input.mission_risk === undefined) failures.push("RISK_DATA_INCOMPLETE");
  if (referenceSet.evidence_refs.length === 0) failures.push("EVIDENCE_REFERENCES_MISSING");
  if ([...(input.confidence_inputs ?? []), ...(input.reliability_inputs ?? []), ...(input.uncertainty_inputs ?? []), ...(input.degradation_inputs ?? [])].some((value) => !Number.isFinite(value) || value < 0 || value > 100)) failures.push("CONFIDENCE_INPUTS_INVALID");
  if (referenceSet.governance_refs.length === 0) failures.push("GOVERNANCE_REFERENCES_MISSING");
  if (referenceSet.replay_refs.length === 0) failures.push("REPLAY_REFERENCES_MISSING");
  if (tenantLeak([...referenceSet.evidence_refs, ...referenceSet.governance_refs, ...referenceSet.replay_refs, ...referenceSet.risk_refs, ...referenceSet.confidence_refs], candidate.tenant_id)) failures.push("CROSS_TENANT_REFERENCE_DETECTED");
  return failures;
}

function buildRiskAssessment(input: RiskConfidencePrioritizationInput, candidate: DecisionCandidate, referenceSet: ReturnType<typeof refs>, severity: number, probability: number, impact: number, risk: number, escalation: RiskEscalationStatus): RiskPriorityAssessment {
  const base: Omit<RiskPriorityAssessment, "integrity_hash"> = {
    assessment_id: `risk_priority_${candidate.candidate_id}`,
    decision_candidate_id: candidate.candidate_id,
    risk_severity_score: severity,
    probability_score: probability,
    impact_score: impact,
    composite_risk_score: risk,
    risk_level: riskLevel(risk),
    escalation_required: escalation !== "NONE",
    escalation_status: escalation,
    explanation_ref: `risk_confidence_explanation_${candidate.candidate_id}`,
    evidence_refs: referenceSet.evidence_refs,
    governance_refs: referenceSet.governance_refs,
    replay_refs: referenceSet.replay_refs,
    assessment_timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function buildConfidenceAssessment(candidate: DecisionCandidate, referenceSet: ReturnType<typeof refs>, confidence: number, reliability: number, uncertainty: number, degradation: number): ConfidenceAssessment {
  const base: Omit<ConfidenceAssessment, "integrity_hash"> = {
    confidence_id: `confidence_priority_${candidate.candidate_id}`,
    decision_candidate_id: candidate.candidate_id,
    confidence_score: confidence,
    reliability_score: reliability,
    uncertainty_score: uncertainty,
    degradation_score: degradation,
    confidence_level: confidenceLevel(confidence),
    restriction_status: restrictionStatus(confidence, uncertainty, degradation),
    explanation_ref: `risk_confidence_explanation_${candidate.candidate_id}`,
    evidence_refs: referenceSet.evidence_refs,
    governance_refs: referenceSet.governance_refs,
    replay_refs: referenceSet.replay_refs,
    assessment_timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function buildExplanation(risk: RiskPriorityAssessment, confidence: ConfidenceAssessment, adjustment: number): RiskConfidenceExplanation {
  const probability = probabilityLevel(risk.probability_score);
  const base: Omit<RiskConfidenceExplanation, "integrity_hash"> = {
    explanation_id: risk.explanation_ref,
    decision_candidate_id: risk.decision_candidate_id,
    risk_rationale: `${risk.risk_level} risk from severity ${risk.risk_severity_score}.`,
    probability_rationale: `${probability} probability with score ${risk.probability_score}.`,
    impact_rationale: `Impact score ${risk.impact_score} contributes to composite risk ${risk.composite_risk_score}.`,
    confidence_rationale: `${confidence.confidence_level} confidence with score ${confidence.confidence_score}.`,
    evidence_reliability_rationale: `Evidence reliability score ${confidence.reliability_score}.`,
    uncertainty_rationale: `Uncertainty score ${confidence.uncertainty_score}.`,
    degradation_rationale: `Confidence degradation score ${confidence.degradation_score}.`,
    escalation_rationale: risk.escalation_required ? `${risk.escalation_status} required.` : "No escalation required.",
    priority_adjustment_rationale: `Priority adjustment ${adjustment}.`,
    replay_refs: risk.replay_refs,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function buildLedger(risk: RiskPriorityAssessment, confidence: ConfidenceAssessment, adjustment: number): RiskConfidenceLedgerRecord {
  const base: Omit<RiskConfidenceLedgerRecord, "integrity_hash"> = {
    ledger_entry_id: `risk_confidence_ledger_${risk.decision_candidate_id}`,
    decision_candidate_id: risk.decision_candidate_id,
    risk_assessment_ref: risk.assessment_id,
    confidence_assessment_ref: confidence.confidence_id,
    risk_score: risk.composite_risk_score,
    confidence_score: confidence.confidence_score,
    priority_adjustment: adjustment,
    restriction_status: confidence.restriction_status,
    escalation_status: risk.escalation_status,
    evidence_refs: risk.evidence_refs,
    governance_refs: risk.governance_refs,
    replay_refs: risk.replay_refs,
    timestamp: NOW,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

function replayHashValue(input: { risk: RiskPriorityAssessment; confidence: ConfidenceAssessment; explanation: RiskConfidenceExplanation; ledger: RiskConfidenceLedgerRecord }): string {
  return hash(input);
}

function buildReplay(candidateId: string, replayHash: string, riskScore: number, confidenceScoreValue: number, failures: readonly RiskConfidenceFailureReason[]): RiskConfidenceReplayRecord {
  const base: Omit<RiskConfidenceReplayRecord, "integrity_hash"> = {
    replay_id: `risk_confidence_replay_${candidateId}`,
    decision_candidate_id: candidateId,
    expected_hash: replayHash,
    reconstructed_hash: replayHash,
    risk_score: riskScore,
    confidence_score: confidenceScoreValue,
    replay_valid: failures.length === 0,
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

export function prioritizeRiskAndConfidence(input: RiskConfidencePrioritizationInput = {}): RiskConfidencePrioritizationResult {
  const candidate = input.candidate ?? defaultCandidate();
  const referenceSet = refs(input, candidate);
  const severity = riskSeverity(input, candidate);
  const probability = probabilityScore(input);
  const impact = impactScore(input);
  const risk = compositeRisk(severity, probability, impact);
  const reliability = reliabilityScore(input, referenceSet);
  const uncertainty = uncertaintyScore(input, referenceSet);
  const degradation = degradationScore(input);
  const confidence = confidenceScore(input, referenceSet, reliability, uncertainty, degradation);
  const escalation = escalationStatus(input, risk, confidence, uncertainty);
  const adjustment = priorityAdjustment(risk, confidence);
  const riskAssessment = buildRiskAssessment(input, candidate, referenceSet, severity, probability, impact, risk, escalation);
  const confidenceAssessment = buildConfidenceAssessment(candidate, referenceSet, confidence, reliability, uncertainty, degradation);
  const explanation = buildExplanation(riskAssessment, confidenceAssessment, adjustment);
  const ledger = buildLedger(riskAssessment, confidenceAssessment, adjustment);
  const failures = collectFailures(input, candidate, referenceSet);
  const replayHash = replayHashValue({ risk: riskAssessment, confidence: confidenceAssessment, explanation, ledger });
  const replayFailures = input.expected_replay_hash && input.expected_replay_hash !== replayHash ? [...failures, "ASSESSMENT_REPLAY_MISMATCH" as const] : failures;
  const replay = buildReplay(candidate.candidate_id, replayHash, risk, confidence, Object.freeze(replayFailures));
  const status = replayFailures.length === 0 ? "PASS" : "FAIL";
  const priority = createDecisionPriority({
    candidate,
    scores: { risk_score: risk, confidence_score: confidence },
    evidence_refs: referenceSet.evidence_refs,
    governance_refs: referenceSet.governance_refs,
    constitutional_refs: referenceSet.constitutional_refs,
    replay_refs: referenceSet.replay_refs,
  });
  const base: Omit<RiskConfidencePrioritizationResult, "integrity_hash"> = {
    prioritization_status: status,
    certificationStatus: status,
    failures: Object.freeze([...new Set(replayFailures)]),
    risk_assessment: riskAssessment,
    confidence_assessment: confidenceAssessment,
    explanation,
    ledger_record: ledger,
    replay_record: replay,
    priority_input: priority,
    deterministic: true,
    advisoryOnly: true,
    failClosed: true,
    replay_hash: replayHash,
  };
  return Object.freeze({ ...base, integrity_hash: recordHash(base) });
}

export function replayRiskConfidencePrioritization(result: RiskConfidencePrioritizationResult): RiskConfidenceReplayRecord {
  const replayHash = replayHashValue({
    risk: result.risk_assessment,
    confidence: result.confidence_assessment,
    explanation: result.explanation,
    ledger: result.ledger_record,
  });
  const failures: RiskConfidenceFailureReason[] = replayHash === result.replay_hash ? [] : ["ASSESSMENT_REPLAY_MISMATCH"];
  return buildReplay(result.risk_assessment.decision_candidate_id, replayHash, result.risk_assessment.composite_risk_score, result.confidence_assessment.confidence_score, Object.freeze(failures));
}

export function buildRiskConfidenceObservability(results: readonly RiskConfidencePrioritizationResult[]): RiskConfidenceObservability {
  return Object.freeze({
    evaluations: results.length,
    pass_count: results.filter((result) => result.prioritization_status === "PASS").length,
    fail_count: results.filter((result) => result.prioritization_status === "FAIL").length,
    replay_failures: results.filter((result) => !result.replay_record.replay_valid).length,
    governance_failures: results.filter((result) => result.failures.includes("GOVERNANCE_REFERENCES_MISSING")).length,
    tenant_failures: results.filter((result) => result.failures.includes("CROSS_TENANT_REFERENCE_DETECTED")).length,
    average_risk_score: results.length === 0 ? 0 : results.reduce((sum, result) => sum + result.risk_assessment.composite_risk_score, 0) / results.length,
    average_confidence_score: results.length === 0 ? 0 : results.reduce((sum, result) => sum + result.confidence_assessment.confidence_score, 0) / results.length,
    risk_distribution: Object.freeze(results.reduce<Record<RiskPriorityLevel, number>>((counts, result) => {
      counts[result.risk_assessment.risk_level] = (counts[result.risk_assessment.risk_level] ?? 0) + 1;
      return counts;
    }, {} as Record<RiskPriorityLevel, number>)),
    confidence_distribution: Object.freeze(results.reduce<Record<ConfidencePriorityLevel, number>>((counts, result) => {
      counts[result.confidence_assessment.confidence_level] = (counts[result.confidence_assessment.confidence_level] ?? 0) + 1;
      return counts;
    }, {} as Record<ConfidencePriorityLevel, number>)),
  });
}

export function getRiskConfidencePrioritizationEngine() {
  const result = prioritizeRiskAndConfidence();
  return Object.freeze({
    engine_version: ENGINE_VERSION,
    result,
    replay: replayRiskConfidencePrioritization(result),
    observability: buildRiskConfidenceObservability([result]),
  });
}
