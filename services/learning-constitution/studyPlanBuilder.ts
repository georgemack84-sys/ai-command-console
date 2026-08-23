import type { SkillRecommendation, StudyPlan } from "../../types/learning-constitution/skillGraph";

export const buildStudyPlan = (recommendation: SkillRecommendation): StudyPlan => {
  if (recommendation.status !== "RECOMMENDATION" || !recommendation.target_skill_id) return { recommendation, steps: [{ action: "DIAGNOSTIC_EVALUATION", skill_id: recommendation.blocked_skill_id, rationale: recommendation.reason }] };
  return { recommendation, steps: [
    { action: "PRACTICE", skill_id: recommendation.target_skill_id, rationale: "Practice the supported prerequisite before repeating the composite task." },
    { action: "REASSESS", skill_id: recommendation.blocked_skill_id, rationale: "Reassess the originally blocked skill after targeted practice." },
  ] };
};
