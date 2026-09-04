import type { AssessmentBlueprint, AssessmentEvaluationType, CompetencyDimension, SkillEdge, SkillNode } from "@/types/learning-constitution";
import { assessmentBlueprintSchema } from "./assessmentContracts";
import { buildSkillGraphReadModel } from "./skillGraph";

export const ASSESSMENT_BLUEPRINT_VERSION = "assessment-blueprint-v1";

const evaluationPlan: readonly Readonly<{ evaluation_type: AssessmentEvaluationType; difficulty: number; competency_dimensions: readonly CompetencyDimension[] }> [] = [
  { evaluation_type: "RECALL", difficulty: 1, competency_dimensions: ["KNOWLEDGE"] },
  { evaluation_type: "EXPLANATION", difficulty: 2, competency_dimensions: ["KNOWLEDGE", "CALIBRATION"] },
  { evaluation_type: "APPLICATION", difficulty: 3, competency_dimensions: ["APPLICATION"] },
  { evaluation_type: "DIAGNOSIS", difficulty: 4, competency_dimensions: ["TROUBLESHOOTING", "APPLICATION"] },
  { evaluation_type: "SCENARIO", difficulty: 4, competency_dimensions: ["KNOWLEDGE", "APPLICATION"] },
  { evaluation_type: "PRACTICAL_TASK", difficulty: 5, competency_dimensions: ["APPLICATION", "TROUBLESHOOTING"] },
  { evaluation_type: "ADVERSARIAL_SCENARIO", difficulty: 5, competency_dimensions: ["TROUBLESHOOTING", "CALIBRATION"] },
];

const distinct = <T>(values: readonly T[]): T[] => [...new Set(values)];

/** Creates a stable baseline diagnostic blueprint; selection and adaptive follow-ups remain separate concerns. */
export const generateAssessmentBlueprint = (skillId: string, nodes: readonly SkillNode[], edges: readonly SkillEdge[], version = ASSESSMENT_BLUEPRINT_VERSION): AssessmentBlueprint => {
  const graph = buildSkillGraphReadModel(nodes, edges);
  const target = graph.nodes.find((node) => node.id === skillId);
  if (!target || target.status !== "ACTIVE") throw new Error("Assessment blueprints require an active, known skill.");
  const prerequisites = graph.prerequisites[skillId] ?? [];
  const assessedSkillIds = distinct([skillId, ...prerequisites]);
  const item_plan = evaluationPlan.map((plan, index) => ({ ...plan, skill_id: index < prerequisites.length ? prerequisites[index] : skillId, required: true }));
  const item_mix = Object.fromEntries(evaluationPlan.map(({ evaluation_type }) => [evaluation_type, 1])) as AssessmentBlueprint["item_mix"];
  const blueprint: AssessmentBlueprint = {
    id: `assessment-blueprint-${skillId}-${version}`,
    skill_id: skillId,
    version,
    objectives: [target.description, ...(prerequisites.map((id) => `Verify prerequisite: ${graph.nodes.find((node) => node.id === id)!.name}.`))],
    assessed_skill_ids: assessedSkillIds,
    target_competencies: ["KNOWLEDGE", "APPLICATION", "TROUBLESHOOTING", "CALIBRATION"],
    item_mix,
    item_plan,
    rules: {
      early_stop: { enabled: true, minimum_items: 4, required_competencies: ["KNOWLEDGE", "APPLICATION", "TROUBLESHOOTING"] },
      escalation: { enabled: true, include_prerequisites: true, trigger_evaluation_types: ["DIAGNOSIS", "ADVERSARIAL_SCENARIO"] },
      required_evaluation_types: evaluationPlan.map(({ evaluation_type }) => evaluation_type),
    },
  };
  return assessmentBlueprintSchema.parse(blueprint) as AssessmentBlueprint;
};
