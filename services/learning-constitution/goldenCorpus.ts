import corpus from "../../learning/taxonomy/golden-corpus.v1.json";
import {
  CANONICAL_INFORMATION_CATEGORIES,
  CANONICAL_TAXONOMY_VERSION,
  TAXONOMY_PROCESSING_STATUSES,
  type GoldenCorpus,
} from "../../types/learning-constitution";
import { GOLDEN_CORPUS_CASE_KINDS } from "../../types/learning-constitution/goldenCorpus";
import { SEMANTIC_UNIT_CONTAINMENTS } from "../../types/learning-constitution/semanticUnit";

export const CANONICAL_GOLDEN_CORPUS_ID = "canonical-learning-taxonomy-golden-corpus-v1";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;
const isCategory = (value: unknown): value is (typeof CANONICAL_INFORMATION_CATEGORIES)[number] =>
  typeof value === "string" && (CANONICAL_INFORMATION_CATEGORIES as readonly string[]).includes(value);

export const validateGoldenCorpus = (value: unknown): GoldenCorpus => {
  if (!isRecord(value) || value.taxonomyVersion !== CANONICAL_TAXONOMY_VERSION || value.corpusVersion !== "1.0.0" || !Array.isArray(value.cases)) {
    throw new Error("golden corpus root is invalid");
  }
  const caseIds = new Set<string>();
  const seenKinds = new Set<string>();
  const seenCategories = new Set<string>();
  for (const testCase of value.cases) {
    if (!isRecord(testCase) || !isNonEmptyString(testCase.caseId) || caseIds.has(testCase.caseId) ||
      !GOLDEN_CORPUS_CASE_KINDS.includes(testCase.kind as typeof GOLDEN_CORPUS_CASE_KINDS[number]) ||
      !["STANDARD", "HIGH", "CRITICAL"].includes(testCase.riskTier as string) || !isNonEmptyString(testCase.input) ||
      !Array.isArray(testCase.expectedUnits) || testCase.expectedUnits.length === 0) {
      throw new Error("golden corpus case is invalid");
    }
    caseIds.add(testCase.caseId);
    seenKinds.add(testCase.kind as string);
    const unitIds = new Set<string>();
    for (const unit of testCase.expectedUnits) {
      if (!isRecord(unit) || !isNonEmptyString(unit.unitId) || unitIds.has(unit.unitId) || !isNonEmptyString(unit.content) ||
        !testCase.input.includes(unit.content) || !SEMANTIC_UNIT_CONTAINMENTS.includes(unit.containment as typeof SEMANTIC_UNIT_CONTAINMENTS[number]) ||
        !TAXONOMY_PROCESSING_STATUSES.includes(unit.expectedStatus as typeof TAXONOMY_PROCESSING_STATUSES[number]) ||
        !Array.isArray(unit.prohibitedCategories) || !unit.prohibitedCategories.every(isCategory) ||
        (unit.containment === "ROOT" ? unit.parentUnitId !== undefined : !isNonEmptyString(unit.parentUnitId)) ||
        (unit.expectedStatus === "CLASSIFIED" ? !isCategory(unit.expectedCategory) : unit.expectedCategory !== undefined) ||
        (unit.expectedStatus === "AMBIGUOUS" ? !Array.isArray(unit.expectedCandidates) || unit.expectedCandidates.length < 2 || !unit.expectedCandidates.every(isCategory) : unit.expectedCandidates !== undefined)) {
        throw new Error("golden corpus expected unit is invalid");
      }
      if (isCategory(unit.expectedCategory) && (unit.prohibitedCategories as unknown[]).includes(unit.expectedCategory)) {
        throw new Error("golden corpus cannot prohibit its expected category");
      }
      unitIds.add(unit.unitId);
      if (isCategory(unit.expectedCategory)) seenCategories.add(unit.expectedCategory);
    }
    for (const unit of testCase.expectedUnits) {
      if (unit.parentUnitId && !unitIds.has(unit.parentUnitId)) throw new Error("golden corpus containment parent is unavailable");
    }
  }
  if (GOLDEN_CORPUS_CASE_KINDS.some((kind) => !seenKinds.has(kind)) ||
    CANONICAL_INFORMATION_CATEGORIES.some((category) => !seenCategories.has(category))) {
    throw new Error("golden corpus does not cover every required case kind and category");
  }
  return value as GoldenCorpus;
};

export const CANONICAL_GOLDEN_CORPUS = validateGoldenCorpus(corpus);
