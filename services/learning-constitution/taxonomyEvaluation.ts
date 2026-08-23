import {
  TAXONOMY_RISK_WEIGHTS,
  type CanonicalClassificationResult,
  type CanonicalSemanticUnitClassifier,
  type CrossClassifierConsistencyReport,
  type GoldenCorpus,
  type TaxonomyEvaluationObservation,
  type TaxonomyEvaluationReport,
  type SemanticUnit,
} from "../../types/learning-constitution";
import { CANONICAL_GOLDEN_CORPUS } from "./goldenCorpus";

const source = { observationId: "taxonomy-evaluation", sourceId: "golden-corpus", sourceType: "DOCUMENT" as const, originatingActorId: "taxonomy-evaluator", observedAt: "2026-08-20T00:00:00.000Z" };

const toUnit = (input: string, unitId: string, content: string, containment: SemanticUnit["containment"], sourceOrder: number, parentUnitId?: string): SemanticUnit => {
  const start = input.indexOf(content);
  return {
    semanticUnitId: unitId, source, sourceOrder, textSpan: { start, end: start + content.length }, content, containment,
    ...(parentUnitId ? { parentSemanticUnitId: parentUnitId } : {}),
  };
};

const assertNoEffects = (classification: CanonicalClassificationResult): void => {
  if (classification.persistenceEffect !== "NONE" || classification.authorityEffect !== "UNCHANGED" || classification.executionPermissionGranted !== false) {
    throw new Error("taxonomy evaluation refuses effect-bearing classifier results");
  }
};

const expectedMatch = (expected: GoldenCorpus["cases"][number]["expectedUnits"][number], actual: CanonicalClassificationResult): boolean =>
  actual.status === expected.expectedStatus && actual.category === expected.expectedCategory &&
  !expected.prohibitedCategories.includes(actual.category as never) &&
  (expected.expectedCandidates === undefined || expected.expectedCandidates.every((category, index) => actual.candidates[index]?.category === category));

const evaluate = (classifier: CanonicalSemanticUnitClassifier, corpus: GoldenCorpus): TaxonomyEvaluationObservation[] =>
  corpus.cases.flatMap((testCase) => testCase.expectedUnits.map((expected, sourceOrder) => {
    const actual = classifier.classify(toUnit(testCase.input, expected.unitId, expected.content, expected.containment, sourceOrder, expected.parentUnitId));
    assertNoEffects(actual);
    return {
      caseId: testCase.caseId, unitId: expected.unitId, kind: testCase.kind, riskTier: testCase.riskTier,
      riskWeight: TAXONOMY_RISK_WEIGHTS[testCase.riskTier], passed: expectedMatch(expected, actual),
      expectedStatus: expected.expectedStatus, ...(expected.expectedCategory ? { expectedCategory: expected.expectedCategory } : {}), actual,
    };
  }));

export const evaluateCanonicalClassifier = (
  classifier: CanonicalSemanticUnitClassifier,
  corpus: GoldenCorpus = CANONICAL_GOLDEN_CORPUS,
): TaxonomyEvaluationReport => {
  const observations = evaluate(classifier, corpus);
  const first = observations[0]?.actual;
  if (!first) throw new Error("taxonomy evaluation corpus cannot be empty");
  const totalRiskWeight = observations.reduce((total, observation) => total + observation.riskWeight, 0);
  const passedRiskWeight = observations.filter((observation) => observation.passed).reduce((total, observation) => total + observation.riskWeight, 0);
  const failedRiskWeight = totalRiskWeight - passedRiskWeight;
  return {
    classifierId: first.classifierId, classifierVersion: first.classifierVersion, totalRiskWeight, passedRiskWeight, failedRiskWeight,
    weightedAccuracy: passedRiskWeight / totalRiskWeight,
    criticalFailureCount: observations.filter((observation) => !observation.passed && observation.riskTier === "CRITICAL").length,
    observations,
  };
};

export const compareCanonicalClassifiers = (
  classifiers: readonly CanonicalSemanticUnitClassifier[],
  corpus: GoldenCorpus = CANONICAL_GOLDEN_CORPUS,
): CrossClassifierConsistencyReport => {
  if (classifiers.length < 2) throw new Error("cross-classifier comparison requires at least two classifiers");
  const evaluations = classifiers.map((classifier) => evaluate(classifier, corpus));
  const classifierIds = evaluations.map((observations) => observations[0]?.actual.classifierId ?? "unknown");
  const disagreements = [] as CrossClassifierConsistencyReport["disagreements"] extends readonly (infer T)[] ? T[] : never[];
  for (let classifierIndex = 0; classifierIndex < evaluations.length; classifierIndex += 1) {
    for (let comparedIndex = classifierIndex + 1; comparedIndex < evaluations.length; comparedIndex += 1) {
      evaluations[classifierIndex].forEach((left, observationIndex) => {
        const right = evaluations[comparedIndex][observationIndex];
        if (left.actual.status !== right.actual.status || left.actual.category !== right.actual.category) {
          disagreements.push({ caseId: left.caseId, unitId: left.unitId, riskTier: left.riskTier,
            classifierIds: [classifierIds[classifierIndex], classifierIds[comparedIndex]], results: [left.actual, right.actual] });
        }
      });
    }
  }
  return { comparedClassifierIds: classifierIds, comparedUnitCount: evaluations[0].length, disagreementCount: disagreements.length,
    criticalDisagreementCount: disagreements.filter((disagreement) => disagreement.riskTier === "CRITICAL").length, disagreements };
};
