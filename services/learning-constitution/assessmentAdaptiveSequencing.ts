import type { AdaptiveAssessmentDecision, AdaptiveAssessmentItem, AdaptiveAssessmentResponse, AssessmentEvaluationType, CompetencyDimension } from "@/types/learning-constitution";

export const ADAPTIVE_ASSESSMENT_V1 = Object.freeze({ applicationStrongScore: 0.8, applicationGapScore: 0.6, robustnessScore: 0.8, requiredCompetencies: ["KNOWLEDGE", "APPLICATION", "TROUBLESHOOTING"] as const });

const ordered = (items: readonly AdaptiveAssessmentItem[], type: AssessmentEvaluationType) => items.filter((item) => item.evaluation_type === type).sort((left, right) => left.position - right.position);
const unique = <T>(values: readonly T[]): T[] => [...new Set(values)];

/** Deterministic first-release diagnostic routing; it never reports a competency without an answered item for that dimension. */
export const determineAdaptiveAssessmentNext = (items: readonly AdaptiveAssessmentItem[], responses: readonly AdaptiveAssessmentResponse[]): AdaptiveAssessmentDecision => {
  const responseByItemId = new Map(responses.map((response) => [response.item_id, response]));
  const answered = items.filter((item) => responseByItemId.has(item.id));
  const pending = (type: AssessmentEvaluationType) => ordered(items, type).find((item) => !responseByItemId.has(item.id));
  const covered = unique(answered.flatMap((item) => item.competency_dimensions)) as CompetencyDimension[];
  const insufficient = ADAPTIVE_ASSESSMENT_V1.requiredCompetencies.filter((dimension) => !covered.includes(dimension));
  const complete = (reason: string): AdaptiveAssessmentDecision => ({ state: "READY_TO_COMPLETE", reason, covered_competencies: covered, insufficient_competencies: insufficient, skipped_item_ids: items.filter((item) => !responseByItemId.has(item.id)).map((item) => item.id) });
  const continueWith = (item: AdaptiveAssessmentItem, reason: string): AdaptiveAssessmentDecision => ({ state: "CONTINUE", next_item_id: item.id, reason, covered_competencies: covered, insufficient_competencies: insufficient, skipped_item_ids: [] });

  const application = ordered(items, "APPLICATION").map((item) => ({ item, response: responseByItemId.get(item.id) })).find(({ response }) => response)?.response;
  const applicationItem = pending("APPLICATION");
  if (!application && applicationItem) return continueWith(applicationItem, "Start with direct application evidence because it is high-information for the learner's current skill.");

  const applicationScore = application?.score ?? 0;
  if (applicationScore < ADAPTIVE_ASSESSMENT_V1.applicationGapScore) {
    const prerequisiteProbe = pending("RECALL") ?? pending("EXPLANATION");
    if (prerequisiteProbe) return continueWith(prerequisiteProbe, "Direct application indicated a gap, so probe prerequisite understanding before escalating.");
  }

  if (!covered.includes("TROUBLESHOOTING")) {
    const diagnosis = pending("DIAGNOSIS");
    if (diagnosis) return continueWith(diagnosis, "Add diagnosis evidence to distinguish direct use from troubleshooting capability.");
  }
  if (!covered.includes("KNOWLEDGE")) {
    const knowledgeProbe = pending("SCENARIO") ?? pending("EXPLANATION") ?? pending("RECALL");
    if (knowledgeProbe) return continueWith(knowledgeProbe, "Add conceptual evidence because no knowledge dimension has been exercised yet.");
  }

  const diagnosis = ordered(items, "DIAGNOSIS").map((item) => responseByItemId.get(item.id)).find(Boolean);
  if (applicationScore >= ADAPTIVE_ASSESSMENT_V1.applicationStrongScore && (diagnosis?.score ?? 0) < ADAPTIVE_ASSESSMENT_V1.robustnessScore) {
    const adversarial = pending("ADVERSARIAL_SCENARIO");
    if (adversarial) return continueWith(adversarial, "Basic application is strong but robustness remains uncertain, so test boundary handling.");
  }

  if (!insufficient.length) return complete("Every required competency has direct assessment evidence; remaining items are not needed for this baseline.");
  const remaining = items.find((item) => !responseByItemId.has(item.id));
  return remaining ? continueWith(remaining, "Additional evidence is required before this diagnostic can complete.") : complete("No additional authored items are available; incomplete dimensions remain explicitly marked as insufficient evidence.");
};
