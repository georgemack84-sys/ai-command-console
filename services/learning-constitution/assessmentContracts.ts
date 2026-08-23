import { z } from "zod";
import { ASSESSMENT_EVALUATION_TYPES, ASSESSMENT_SESSION_STATES, COMPETENCY_DIMENSIONS } from "@/types/learning-constitution/assessment";

const score = z.number().min(0).max(1);
const identifier = z.string().min(1);
const timestamp = z.string().datetime();
const evaluationType = z.enum(ASSESSMENT_EVALUATION_TYPES);
const competencyDimension = z.enum(COMPETENCY_DIMENSIONS);

export const assessmentBlueprintSchema = z.object({
  id: identifier, skill_id: identifier, version: identifier, objectives: z.array(z.string().min(1)).min(1),
  assessed_skill_ids: z.array(identifier).min(1),
  target_competencies: z.array(competencyDimension).min(1),
  item_mix: z.record(evaluationType, z.number().int().nonnegative()),
  item_plan: z.array(z.object({ evaluation_type: evaluationType, skill_id: identifier, difficulty: z.number().int().min(1).max(5), competency_dimensions: z.array(competencyDimension).min(1), required: z.boolean() })).min(1),
  rules: z.object({
    early_stop: z.object({ enabled: z.boolean(), minimum_items: z.number().int().nonnegative(), required_competencies: z.array(competencyDimension) }),
    escalation: z.object({ enabled: z.boolean(), include_prerequisites: z.boolean(), trigger_evaluation_types: z.array(evaluationType) }),
    required_evaluation_types: z.array(evaluationType),
  }),
}).superRefine((blueprint, context) => {
  for (const type of blueprint.rules.required_evaluation_types) {
    if ((blueprint.item_mix[type] ?? 0) < 1) context.addIssue({ code: "custom", path: ["item_mix", type], message: "Required evaluation types need at least one item." });
  }
  const planned = new Map<string, number>();
  for (const item of blueprint.item_plan) {
    if (!blueprint.assessed_skill_ids.includes(item.skill_id)) context.addIssue({ code: "custom", path: ["item_plan"], message: "Every planned item must target an assessed skill." });
    planned.set(item.evaluation_type, (planned.get(item.evaluation_type) ?? 0) + 1);
  }
  for (const [type, count] of Object.entries(blueprint.item_mix)) if ((planned.get(type) ?? 0) !== count) context.addIssue({ code: "custom", path: ["item_plan"], message: "Item plan must match the declared item mix." });
});

export const assessmentItemSchema = z.object({
  id: identifier, skill_id: identifier, blueprint_id: identifier.optional(), evaluation_type: evaluationType,
  prompt: z.string().min(1), expected_response_format: z.string().min(1), rubric: z.record(z.string(), z.unknown()),
  difficulty: z.number().int().min(1).max(5), version: identifier,
  competency_dimensions: z.array(competencyDimension).min(1), content: z.record(z.string(), z.unknown()).optional(),
});

export const assessmentSessionSchema = z.object({
  id: identifier, learner_id: identifier, blueprint_id: identifier, target_skill_ids: z.array(identifier).min(1),
  state: z.enum(ASSESSMENT_SESSION_STATES), blueprint_version: identifier, started_at: timestamp, completed_at: timestamp.optional(),
}).superRefine((session, context) => {
  if (session.state === "COMPLETED" && !session.completed_at) context.addIssue({ code: "custom", path: ["completed_at"], message: "Completed sessions require a completion timestamp." });
});

export const assessmentResponseSchema = z.object({
  id: identifier, session_id: identifier, item_id: identifier, answer: z.unknown(), self_rated_confidence: score.optional(),
  evaluation_result: z.record(z.string(), z.unknown()).optional(), feedback: z.string().optional(), submitted_at: timestamp,
});

export const assessmentEvaluationResultSchema = z.object({
  evaluation_type: evaluationType, score, outcome: z.enum(["PASS", "PARTIAL", "FAIL"]),
  matched_criteria: z.array(z.string()), missing_criteria: z.array(z.string()), rationale: z.string(), rubric_version: identifier,
});

export const competencyProfileSchema = z.object({
  id: identifier, session_id: identifier, learner_id: identifier, skill_id: identifier,
  knowledge: score.nullable(), application: score.nullable(), troubleshooting: score.nullable(), retention: score.nullable(), calibration: score.nullable(), score: score.nullable(),
  confidence_interval: z.object({ lower: score, upper: score }).refine(({ lower, upper }) => lower <= upper, "Confidence interval lower bound must not exceed upper bound."),
  evidence_count: z.number().int().nonnegative(), calculation_version: identifier, calculated_at: timestamp,
});

export const assessmentRecommendationSchema = z.object({
  id: identifier, session_id: identifier, learner_id: identifier, instructional_starting_point: identifier,
  priority_gaps: z.array(z.object({ competency: competencyDimension, reason: z.string().min(1) })), retest_at: timestamp.optional(),
});

export const assessmentEvidenceMetadataSchema = z.object({ assessment_session_id: identifier.optional(), assessment_item_id: identifier.optional(), evaluation_type: evaluationType.optional(), competency_dimensions: z.array(competencyDimension).optional() });
