import type { AssessmentEvaluationResult, AssessmentEvaluationType, CompetencyDimension } from "@/types/learning-constitution";

type Rubric = Readonly<Record<string, unknown>>;
type EvaluationInput = Readonly<{ evaluation_type: AssessmentEvaluationType; answer: unknown; rubric: Rubric; rubric_version: string }>;
type ProfileEvidence = Readonly<{ score: number; competency_dimensions: readonly CompetencyDimension[]; self_rated_confidence: number | null }>;

const normalize = (value: unknown): string => (typeof value === "string" ? value : JSON.stringify(value)).toLowerCase().replace(/\s+/g, " ").trim();
const rubricValues = (rubric: Rubric, key: string): string[] => Array.isArray(rubric[key]) ? rubric[key].filter((value): value is string => typeof value === "string" && value.length > 0) : [];
const criteriaFor = (evaluationType: AssessmentEvaluationType, rubric: Rubric): string[] => {
  const keys: Record<AssessmentEvaluationType, readonly string[]> = {
    RECALL: ["accepted_commands", "required_concepts"], EXPLANATION: ["required_concepts"], APPLICATION: ["required_commands"], DIAGNOSIS: ["required_concepts"], SCENARIO: ["required_concepts"], PRACTICAL_TASK: ["required_directives"], ADVERSARIAL_SCENARIO: ["required_concepts"],
  };
  return keys[evaluationType].flatMap((key) => rubricValues(rubric, key));
};

export const evaluateAssessmentResponse = ({ evaluation_type, answer, rubric, rubric_version }: EvaluationInput): AssessmentEvaluationResult => {
  const criteria = criteriaFor(evaluation_type, rubric);
  if (!criteria.length) throw new Error(`No deterministic rubric criteria are defined for ${evaluation_type}.`);
  const actual = normalize(answer);
  const matched_criteria = criteria.filter((criterion) => actual.includes(normalize(criterion)));
  const missing_criteria = criteria.filter((criterion) => !matched_criteria.includes(criterion));
  const score = matched_criteria.length / criteria.length;
  const outcome = score >= 0.8 ? "PASS" : score >= 0.4 ? "PARTIAL" : "FAIL";
  return { evaluation_type, score, outcome, matched_criteria, missing_criteria, rationale: missing_criteria.length ? `Missing: ${missing_criteria.join(", ")}.` : "All deterministic rubric criteria were satisfied.", rubric_version };
};

const mean = (values: readonly number[]): number | null => values.length ? values.reduce((total, value) => total + value, 0) / values.length : null;
const clamp = (value: number): number => Math.max(0, Math.min(1, value));
const scoreFor = (evidence: readonly ProfileEvidence[], dimension: CompetencyDimension): number | null => mean(evidence.filter((entry) => entry.competency_dimensions.includes(dimension)).map((entry) => entry.score));

export const calculateCompetencyProfile = (evidence: readonly ProfileEvidence[]) => {
  const knowledge = scoreFor(evidence, "KNOWLEDGE");
  const application = scoreFor(evidence, "APPLICATION");
  const troubleshooting = scoreFor(evidence, "TROUBLESHOOTING");
  const confidencePairs = evidence.filter((entry): entry is ProfileEvidence & { self_rated_confidence: number } => entry.self_rated_confidence !== null);
  const calibration = confidencePairs.length ? 1 - mean(confidencePairs.map((entry) => Math.abs(entry.self_rated_confidence - entry.score)))! : null;
  const score = mean([knowledge, application, troubleshooting].filter((value): value is number => value !== null));
  const width = score === null ? 1 : Math.min(0.5, 1 / Math.sqrt(Math.max(evidence.length, 1)));
  return { knowledge, application, troubleshooting, retention: null, calibration, score, confidence_interval: { lower: score === null ? 0 : clamp(score - width), upper: score === null ? 1 : clamp(score + width) }, evidence_count: evidence.length };
};
