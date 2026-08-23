import sequenceCases from "../../learning/taxonomy/sequence-cases.v1.json";
import type { TaxonomySequenceCaseSet, TaxonomySequenceRegressionReport } from "../../types/learning-constitution";
import { classifyCanonicalInputConservatively } from "./canonicalClassificationPipeline";

export const validateTaxonomySequenceCaseSet = (value: unknown): TaxonomySequenceCaseSet => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("taxonomy sequence case set is invalid");
  const candidate = value as Record<string, unknown>;
  if (candidate.taxonomyVersion !== "1.0.0" || !Array.isArray(candidate.cases) || candidate.cases.length === 0) throw new Error("taxonomy sequence case set root is invalid");
  const caseIds = new Set<string>();
  for (const sequence of candidate.cases) {
    if (typeof sequence !== "object" || sequence === null || Array.isArray(sequence)) throw new Error("taxonomy sequence case is invalid");
    const item = sequence as Record<string, unknown>;
    if (typeof item.caseId !== "string" || caseIds.has(item.caseId) || item.mustNotReclassifyEarlierTurns !== true ||
      !Array.isArray(item.turns) || item.turns.length < 2 || !item.turns.every((turn) => typeof turn === "object" && turn !== null && typeof (turn as Record<string, unknown>).turnId === "string" && typeof (turn as Record<string, unknown>).input === "string" && typeof (turn as Record<string, unknown>).expectedStatus === "string")) {
      throw new Error("taxonomy sequence case is malformed");
    }
    caseIds.add(item.caseId);
  }
  return candidate as TaxonomySequenceCaseSet;
};

export const CANONICAL_TAXONOMY_SEQUENCE_CASES = validateTaxonomySequenceCaseSet(sequenceCases);

export const runTaxonomySequenceRegression = (
  cases: TaxonomySequenceCaseSet = CANONICAL_TAXONOMY_SEQUENCE_CASES,
): TaxonomySequenceRegressionReport => {
  const failures: Array<{ caseId: string; detail: string }> = [];
  for (const sequence of cases.cases) {
    const observed = sequence.turns.map((turn) => classifyCanonicalInputConservatively({
      source: { observationId: "sequence-regression", sourceId: `${sequence.caseId}:${turn.turnId}`, sourceType: "CONVERSATION", originatingActorId: "taxonomy-regression", observedAt: "2026-08-21T00:00:00.000Z" }, content: turn.input,
    }).classifications[0]);
    sequence.turns.forEach((turn, index) => {
      if (observed[index]?.status !== turn.expectedStatus || observed[index]?.category !== turn.expectedCategory) {
        failures.push({ caseId: sequence.caseId, detail: `turn ${turn.turnId} differs from its expected semantic result` });
      }
    });
  }
  return { passed: failures.length === 0, sequenceCount: cases.cases.length, failures };
};
