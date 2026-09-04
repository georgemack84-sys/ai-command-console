import type { DerivedSkillState, SkillEvidence, SkillReadinessState, SkillStateCalculation } from "../../types/learning-constitution/skillGraph";

export const SKILL_STATE_CALCULATION_V1: SkillStateCalculation = {
  calculationVersion: "skill-state-v1", asOf: "", practicalTaskWeight: 1, assessmentWeight: 0.85,
  instructorReviewWeight: 0.9, selfReportWeight: 0.2, evidenceHalfLifeDays: 90, retentionHalfLifeDays: 60,
  minimumMasteryEvidence: 1, readyMasteryThreshold: 0.75, atRiskRetentionThreshold: 0.55,
};

const DAY_MS = 24 * 60 * 60 * 1000;
const clamp = (value: number): number => Math.max(0, Math.min(1, value));
const outcomeScore = (evidence: SkillEvidence): number => evidence.score ?? ({ PASS: 1, PARTIAL: 0.5, FAIL: 0, OBSERVED: 0.5 }[evidence.outcome]);
const baseWeight = (evidence: SkillEvidence, policy: SkillStateCalculation): number => ({ PRACTICAL_TASK: policy.practicalTaskWeight, ASSESSMENT: policy.assessmentWeight, INSTRUCTOR_REVIEW: policy.instructorReviewWeight, SELF_REPORT: policy.selfReportWeight }[evidence.kind]);
const ageDays = (occurredAt: string, asOf: string): number => Math.max(0, (Date.parse(asOf) - Date.parse(occurredAt)) / DAY_MS);
const decay = (days: number, halfLifeDays: number): number => 2 ** (-days / halfLifeDays);

/** Pure calculation: it never writes or mutates the append-only evidence ledger. */
export const calculateDerivedSkillState = (learnerId: string, skillId: string, evidence: readonly SkillEvidence[], policy: SkillStateCalculation): DerivedSkillState => {
  if (!policy.asOf || Number.isNaN(Date.parse(policy.asOf)) || policy.evidenceHalfLifeDays <= 0 || policy.retentionHalfLifeDays <= 0) throw new Error("skill state calculation policy is invalid");
  const relevant = evidence.filter((item) => item.learner_id === learnerId && item.skill_id === skillId && Date.parse(item.occurred_at) <= Date.parse(policy.asOf)).sort((a, b) => a.id.localeCompare(b.id));
  const evaluated = relevant.filter((item) => item.kind !== "SELF_REPORT");
  const weighted = evaluated.map((item) => ({ item, weight: baseWeight(item, policy) * decay(ageDays(item.occurred_at, policy.asOf), policy.evidenceHalfLifeDays) }));
  const totalWeight = weighted.reduce((sum, item) => sum + item.weight, 0);
  const mastery = evaluated.length >= policy.minimumMasteryEvidence && totalWeight > 0 ? clamp(weighted.reduce((sum, item) => sum + outcomeScore(item.item) * item.weight, 0) / totalWeight) : null;
  const latestEvaluation = evaluated.slice().sort((a, b) => b.occurred_at.localeCompare(a.occurred_at) || b.id.localeCompare(a.id))[0];
  const latestSuccess = evaluated.filter((item) => outcomeScore(item) >= 0.5).sort((a, b) => b.occurred_at.localeCompare(a.occurred_at) || b.id.localeCompare(a.id))[0];
  const retention = latestSuccess ? clamp(outcomeScore(latestSuccess) * decay(ageDays(latestSuccess.occurred_at, policy.asOf), policy.retentionHalfLifeDays)) : null;
  const confidence = clamp((1 - Math.exp(-totalWeight)) * (evaluated.length / (evaluated.length + 1)) + (relevant.length > evaluated.length ? 0.03 : 0));
  let display: SkillReadinessState = "NOT_EVALUATED";
  if (relevant.length > 0 && evaluated.length === 0) display = "INSUFFICIENT_EVIDENCE";
  else if (mastery !== null && (mastery < policy.readyMasteryThreshold || retention === null || retention < policy.atRiskRetentionThreshold)) display = "AT_RISK";
  else if (mastery !== null && confidence >= 0.5 && retention !== null && retention >= policy.atRiskRetentionThreshold) display = "READY";
  else if (mastery !== null) display = "INSUFFICIENT_EVIDENCE";
  return { learner_id: learnerId, skill_id: skillId, mastery, confidence, retention_score: retention, last_evaluated: latestEvaluation?.occurred_at ?? null, display_state: display, calculation_version: policy.calculationVersion, calculated_at: policy.asOf, evidence_ids: relevant.map((item) => item.id) };
};
