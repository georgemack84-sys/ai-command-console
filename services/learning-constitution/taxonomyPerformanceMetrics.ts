import type {
  CanonicalSemanticUnitClassifier,
  TaxonomyClassifierPerformanceReport,
  TaxonomyConfusionMatrixEntry,
  TaxonomyStatusMismatch,
} from "../../types/learning-constitution";
import { evaluateCanonicalClassifier } from "./taxonomyEvaluation";

const increment = <T extends { count: number }>(map: Map<string, T>, key: string, value: Omit<T, "count">): void => {
  const existing = map.get(key);
  map.set(key, existing ? { ...existing, count: existing.count + 1 } : { ...value, count: 1 } as T);
};

export const measureCanonicalClassifierPerformance = (
  classifier: CanonicalSemanticUnitClassifier,
): TaxonomyClassifierPerformanceReport => {
  const evaluation = evaluateCanonicalClassifier(classifier);
  const matrix = new Map<string, TaxonomyConfusionMatrixEntry>();
  const statusMismatches = new Map<string, TaxonomyStatusMismatch>();
  const classifiedExpectations = evaluation.observations.filter((observation) => observation.expectedCategory !== undefined);
  for (const observation of classifiedExpectations) {
    const expectedCategory = observation.expectedCategory!;
    const observedCategory = observation.actual.category ?? "NO_CATEGORY";
    const key = `${expectedCategory}:${observedCategory}`;
    const current = matrix.get(key);
    matrix.set(key, current
      ? { ...current, count: current.count + 1, riskWeight: current.riskWeight + observation.riskWeight }
      : { expectedCategory, observedCategory, count: 1, riskWeight: observation.riskWeight });
  }
  for (const observation of evaluation.observations) {
    if (observation.expectedStatus !== observation.actual.status) {
      increment(statusMismatches, `${observation.expectedStatus}:${observation.actual.status}`, {
        expectedStatus: observation.expectedStatus, observedStatus: observation.actual.status,
      });
    }
  }
  const exactCategoryMatchCount = classifiedExpectations.filter((observation) => observation.expectedCategory === observation.actual.category).length;
  return {
    classifierId: evaluation.classifierId, classifierVersion: evaluation.classifierVersion, evaluation,
    classifiedExpectationCount: classifiedExpectations.length, exactCategoryMatchCount,
    categoryAccuracy: classifiedExpectations.length === 0 ? 0 : exactCategoryMatchCount / classifiedExpectations.length,
    confusionMatrix: [...matrix.values()].sort((left, right) => left.expectedCategory.localeCompare(right.expectedCategory) || left.observedCategory.localeCompare(right.observedCategory)),
    statusMismatches: [...statusMismatches.values()].sort((left, right) => left.expectedStatus.localeCompare(right.expectedStatus) || left.observedStatus.localeCompare(right.observedStatus)),
  };
};
