import type { DerivedSkillState, EvaluationRubric, SkillEdge, SkillEvidence, SkillGraphReadModel, SkillRecommendation } from "../../types/learning-constitution/skillGraph";

export const DIAGNOSIS_POLICY_V1 = { maxDepth: 2, minimumScore: 0.6, minimumConfidence: 0.2 } as const;
type Candidate = Readonly<{ skillId: string; path: readonly string[]; pathStrength: number }>;

const traversePrerequisites = (graph: SkillGraphReadModel, blockedSkillId: string, maxDepth: number): readonly Candidate[] => {
  const edgesByTarget = new Map<string, readonly SkillEdge[]>();
  for (const edge of graph.edges.filter((edge) => edge.type === "PREREQUISITE")) edgesByTarget.set(edge.to_skill_id, [...(edgesByTarget.get(edge.to_skill_id) ?? []), edge]);
  const candidates: Candidate[] = [];
  const visit = (skillId: string, path: readonly string[], strength: number, depth: number): void => {
    if (depth === maxDepth) return;
    for (const edge of edgesByTarget.get(skillId) ?? []) {
      const nextPath = [edge.from_skill_id, ...path];
      candidates.push({ skillId: edge.from_skill_id, path: nextPath, pathStrength: strength * (edge.strength ?? 0) });
      if (!path.includes(edge.from_skill_id)) visit(edge.from_skill_id, nextPath, strength * (edge.strength ?? 0), depth + 1);
    }
  };
  visit(blockedSkillId, [blockedSkillId], 1, 0);
  return candidates;
};

const stateScore = (state: DerivedSkillState, pathStrength: number): number => {
  if (state.mastery === null || state.confidence < DIAGNOSIS_POLICY_V1.minimumConfidence) return 0;
  return (0.4 * (1 - state.mastery) + 0.2 * (1 - state.confidence) + 0.2 * (1 - (state.retention_score ?? 0)) + 0.2 * pathStrength);
};

export const diagnoseBottleneck = (input: Readonly<{ learnerId: string; failedEvidence: SkillEvidence; rubric: EvaluationRubric; graph: SkillGraphReadModel; states: readonly DerivedSkillState[] }>): SkillRecommendation => {
  const { failedEvidence, rubric, graph } = input;
  if (!graph.nodes.some((node) => node.id === failedEvidence.skill_id) || rubric.evaluated_skill_id !== failedEvidence.skill_id) throw new Error("failure and rubric must refer to an existing evaluated skill");
  if (!["FAIL", "PARTIAL"].includes(failedEvidence.outcome)) throw new Error("bottleneck diagnosis requires failed or partial evidence");
  if (!rubric.exercised_skill_ids.length) return { status: "NOT_LOCALIZED", blocked_skill_id: failedEvidence.skill_id, reason: "The evaluation did not identify exercised subcompetencies.", graph_path: [failedEvidence.skill_id], evidence_ids: [failedEvidence.id], next_action: "DIAGNOSTIC_EVALUATION" };
  const stateBySkill = new Map(input.states.filter((state) => state.learner_id === input.learnerId).map((state) => [state.skill_id, state]));
  const candidates = traversePrerequisites(graph, failedEvidence.skill_id, DIAGNOSIS_POLICY_V1.maxDepth)
    .filter((candidate) => rubric.exercised_skill_ids.includes(candidate.skillId))
    .map((candidate) => ({ ...candidate, state: stateBySkill.get(candidate.skillId) }))
    .filter((candidate): candidate is Candidate & { state: DerivedSkillState } => candidate.state !== undefined)
    .map((candidate) => ({ ...candidate, score: stateScore(candidate.state, candidate.pathStrength) }))
    .filter((candidate) => candidate.score >= DIAGNOSIS_POLICY_V1.minimumScore)
    .sort((left, right) => right.score - left.score || left.skillId.localeCompare(right.skillId));
  const best = candidates[0];
  if (!best) return { status: "INSUFFICIENT_EVIDENCE", blocked_skill_id: failedEvidence.skill_id, reason: "No exercised prerequisite has enough weak, reliable evidence to support a diagnosis.", graph_path: [failedEvidence.skill_id], evidence_ids: [failedEvidence.id], next_action: "DIAGNOSTIC_EVALUATION" };
  return { status: "RECOMMENDATION", target_skill_id: best.skillId, blocked_skill_id: failedEvidence.skill_id, reason: "The failed evaluation exercised this prerequisite, whose mastery, confidence, and retention indicate it is the strongest supported bottleneck.", graph_path: best.path, evidence_ids: [failedEvidence.id, ...best.state.evidence_ids], next_action: "PRACTICE", score: best.score };
};
