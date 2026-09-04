import type { CurriculumPlannerInput, LearningPlan, LessonActivityType, PlannedLesson, PlannerTargetLevel } from "@/types/learning-constitution/curriculumPlanner";

const weak = (value: number | null | undefined) => value === null || value === undefined || value < .7;
const staleAt = (value: string | null | undefined, now: string) => Boolean(value && Date.parse(now) - Date.parse(value) > 1000 * 60 * 60 * 24 * 90);
const template = (skillId: string, competency: PlannerTargetLevel) => {
  const entries: Record<string, { objective: string; activity: LessonActivityType; minutes: number }> = {
    "linux.systemd.journald": { objective: "Filter and interpret service journal entries to locate a failure signal.", activity: "GUIDED_PRACTICE", minutes: 25 },
    "linux.systemd.dependencies": { objective: "Explain Requires, Wants, After, and Before in a service-startup scenario.", activity: "GUIDED_PRACTICE", minutes: 30 },
    "linux.systemd.units": { objective: "Inspect a unit lifecycle and connect process state to service behavior.", activity: "GUIDED_PRACTICE", minutes: 25 },
    "linux.systemd.troubleshooting": competency === "TROUBLESHOOTING" ? { objective: "Diagnose a realistic systemd service failure from unit and journal evidence.", activity: "SCENARIO_PRACTICE", minutes: 35 } : { objective: "Complete a focused systemd diagnostic to establish the next learning step.", activity: "DIAGNOSTIC", minutes: 15 },
  };
  return entries[skillId] ?? { objective: `Practice ${skillId} with an evidence-backed scenario.`, activity: "GUIDED_PRACTICE" as const, minutes: 25 };
};

const target = (input: CurriculumPlannerInput) => {
  if (input.goal.skill_id) return input.goal.skill_id;
  const needle = input.goal.free_text.toLowerCase();
  return input.skill_graph.nodes.find((node) => needle.includes(node.slug) || needle.includes(node.name.toLowerCase()))?.id ?? "linux.systemd.troubleshooting";
};
const ancestors = (id: string, prerequisites: Readonly<Record<string, readonly string[]>>, seen = new Set<string>()): string[] => {
  if (seen.has(id)) return []; seen.add(id);
  return (prerequisites[id] ?? []).flatMap((item) => [...ancestors(item, prerequisites, seen), item]);
};
const competency = (input: CurriculumPlannerInput, skillId: string): PlannerTargetLevel => input.goal.target_level ?? (skillId.endsWith("troubleshooting") ? "TROUBLESHOOTING" : "PRACTICAL");

/** Deterministic and advisory-only: it derives recommendations without changing learner state. */
export function buildCurriculumPlan(input: CurriculumPlannerInput, now = new Date().toISOString()): LearningPlan {
  const targetSkill = target(input); const nodeById = new Map(input.skill_graph.nodes.map((node) => [node.id, node]));
  const related = [...new Set([...ancestors(targetSkill, input.skill_graph.prerequisites), targetSkill])];
  const states = new Map((input.skill_states ?? []).map((state) => [state.skill_id, state]));
  const assessments = new Map(input.assessment_results.map((result) => [result.skill_id, result]));
  const setbacks = new Map<string, number>();
  for (const entry of input.learning_history) {
    if (entry.event === "FAILED" || entry.event === "SKIPPED") setbacks.set(entry.skill_id, (setbacks.get(entry.skill_id) ?? 0) + 1);
  }
  const excluded = new Set((input.constraints.excluded_topics ?? []).map((item) => item.toLowerCase()));
  const candidates = related.filter((id) => !excluded.has(id.toLowerCase()) && !excluded.has((nodeById.get(id)?.slug ?? "").toLowerCase()));
  const hasAnyEvidence = candidates.some((skillId) => (assessments.get(skillId)?.evidence_ids.length ?? states.get(skillId)?.evidence_ids.length ?? 0) > 0);
  const rawGaps = candidates.flatMap((skillId) => {
    const state = states.get(skillId); const assessment = assessments.get(skillId); const evidence = [...new Set([...(assessment?.evidence_ids ?? []), ...(state?.evidence_ids ?? [])])];
    const profileValue = assessment?.score;
    const stale = staleAt(state?.last_evaluated, now) || staleAt(assessment?.completed_at, now);
    const conflicting = assessment?.score !== null && assessment?.score !== undefined && state?.mastery !== null && state?.mastery !== undefined && Math.abs(assessment.score - state.mastery) >= .4;
    if (!evidence.length) {
      if (!hasAnyEvidence && skillId === targetSkill) return [{ skill_id: skillId, competency: competency(input, skillId), reason: `There is no assessment or approved evidence for ${nodeById.get(skillId)?.name ?? skillId}; start with a focused diagnostic.`, evidence_ids: [], diagnostic: true }];
      return [];
    }
    if (conflicting) return [{ skill_id: skillId, competency: competency(input, skillId), reason: `Assessment and learner-state evidence conflict for ${nodeById.get(skillId)?.name ?? skillId}; start with a focused diagnostic before remediation.`, evidence_ids: evidence, diagnostic: true }];
    if (weak(profileValue ?? state?.mastery) || weak(state?.retention_score) || weak(state?.confidence) || stale || (setbacks.get(skillId) ?? 0) >= 2) return [{ skill_id: skillId, competency: competency(input, skillId), reason: `Assessment and learner-state evidence indicate that ${nodeById.get(skillId)?.name ?? skillId} is a current bottleneck.`, evidence_ids: evidence, diagnostic: false }];
    return [];
  });
  const noEvidenceAtAll = input.assessment_results.every((result) => result.evidence_ids.length === 0) && (input.skill_states ?? []).every((state) => state.evidence_ids.length === 0);
  const gaps = noEvidenceAtAll ? [{ skill_id: targetSkill, competency: competency(input, targetSkill), reason: `There is no assessment or approved evidence for ${nodeById.get(targetSkill)?.name ?? targetSkill}; start with a focused diagnostic.`, evidence_ids: [], diagnostic: true }] : rawGaps;
  const orderedGaps = gaps.sort((left, right) => related.indexOf(left.skill_id) - related.indexOf(right.skill_id) || left.skill_id.localeCompare(right.skill_id));
  const sessionLimit = input.constraints.preferred_session_minutes;
  const withinSession = sessionLimit ? orderedGaps.filter((gap) => template(gap.skill_id, gap.competency).minutes <= sessionLimit) : orderedGaps;
  let plannedMinutes = 0;
  const selected = input.constraints.available_minutes_per_week ? withinSession.filter((gap) => { const minutes = template(gap.skill_id, gap.competency).minutes; if (plannedMinutes + minutes > input.constraints.available_minutes_per_week!) return false; plannedMinutes += minutes; return true; }) : withinSession;
  const lessons: PlannedLesson[] = selected.map((gap, index) => {
    const details = template(gap.skill_id, gap.competency); const activity = gap.diagnostic ? "DIAGNOSTIC" : details.activity; const path = [...ancestors(gap.skill_id, input.skill_graph.prerequisites), gap.skill_id];
    return { id: `curriculum-plan-v1:${gap.skill_id}:${gap.competency.toLowerCase()}`, position: index + 1, target_skill_id: gap.skill_id, target_competency: gap.competency, objective: details.objective, activity_type: activity, estimated_minutes: details.minutes, prerequisite_path: path, evidence_references: gap.evidence_ids, why_this_lesson: gap.diagnostic ? gap.reason : `${gap.reason} It is ${gap.skill_id === targetSkill ? "directly relevant to your goal" : "a prerequisite for the stated goal"}.`, completion_criterion: activity === "DIAGNOSTIC" ? "Complete the focused diagnostic; use its completed assessment as the next planning signal." : "Complete the activity, then complete the targeted reassessment.", next_step: index + 1 < selected.length ? selected[index + 1].skill_id : `Reassess ${targetSkill}` };
  });
  if (!lessons.length && candidates.includes(targetSkill)) lessons.push({ id: `curriculum-plan-v1:${targetSkill}:reassessment`, position: 1, target_skill_id: targetSkill, target_competency: competency(input, targetSkill), objective: "Verify the goal skill with a practical reassessment.", activity_type: "REASSESSMENT", estimated_minutes: 20, prerequisite_path: [...ancestors(targetSkill, input.skill_graph.prerequisites), targetSkill], evidence_references: assessments.get(targetSkill)?.evidence_ids ?? [], why_this_lesson: "The available evidence does not support a remediation lesson; reassessment confirms current readiness.", completion_criterion: "Complete the targeted assessment.", next_step: `Review ${targetSkill} results` });
  else if (lessons.length && lessons[lessons.length - 1].activity_type !== "REASSESSMENT") lessons.push({ id: `curriculum-plan-v1:${targetSkill}:reassessment`, position: lessons.length + 1, target_skill_id: targetSkill, target_competency: competency(input, targetSkill), objective: "Verify that the prerequisite bottleneck has been resolved.", activity_type: "REASSESSMENT", estimated_minutes: 20, prerequisite_path: [...ancestors(targetSkill, input.skill_graph.prerequisites), targetSkill], evidence_references: orderedGaps.flatMap((gap) => gap.evidence_ids), why_this_lesson: "Reassessment is the evidence-producing next step after the targeted lessons.", completion_criterion: "Complete the targeted assessment.", next_step: `Review ${targetSkill} results` });
  const total = lessons.reduce((sum, lesson) => sum + lesson.estimated_minutes, 0); const budget = input.constraints.available_minutes_per_week;
  const constrained = (budget !== undefined && total > budget) || selected.length < orderedGaps.length || candidates.length < related.length;
  return { version: "curriculum-plan-v1", goal_summary: `Plan for ${nodeById.get(targetSkill)?.name ?? targetSkill}: ${input.goal.free_text}`, status: constrained ? "CONSTRAINED" : lessons.some((lesson) => lesson.activity_type === "DIAGNOSTIC") ? "INSUFFICIENT_EVIDENCE" : "READY", detected_gaps: orderedGaps, lessons, rationale: "Lessons are ranked deterministically by goal relevance, prerequisite order, and evidence-backed weakness. Assessment recommendations are signals, not the curriculum itself.", assumptions: ["Self-reports alone were not used to infer a gap.", ...(constrained ? ["Some lessons were deferred to honor the stated time or topic constraints."] : [])], generated_at: now };
}
