import type { GoldenCorpus, GoldenDatasetRegressionReport } from "../../types/learning-constitution";
import { classifyCanonicalInputConservatively } from "./canonicalClassificationPipeline";
import { CANONICAL_GOLDEN_CORPUS } from "./goldenCorpus";

const source = { observationId: "golden-dataset-regression", sourceId: "golden-corpus", sourceType: "DOCUMENT" as const, originatingActorId: "taxonomy-regression", observedAt: "2026-08-21T00:00:00.000Z" };

export const runGoldenDatasetPipelineRegression = (
  corpus: GoldenCorpus = CANONICAL_GOLDEN_CORPUS,
): GoldenDatasetRegressionReport => {
  const failures: Array<{ caseId: string; detail: string }> = [];
  for (const testCase of corpus.cases) {
    const actual = classifyCanonicalInputConservatively({ source: { ...source, sourceId: testCase.caseId }, content: testCase.input });
    if (actual.classifications.length !== testCase.expectedUnits.length) {
      failures.push({ caseId: testCase.caseId, detail: "semantic-unit count differs from the golden expectation" });
      continue;
    }
    testCase.expectedUnits.forEach((expected, index) => {
      const observedUnit = actual.segmentation.units[index];
      const observed = actual.classifications[index];
      const candidatesMatch = expected.expectedCandidates === undefined ||
        expected.expectedCandidates.every((category, candidateIndex) => observed.candidates[candidateIndex]?.category === category);
      if (observedUnit?.content !== expected.content || observedUnit?.containment !== expected.containment ||
        observed.status !== expected.expectedStatus || observed.category !== expected.expectedCategory ||
        !candidatesMatch || expected.prohibitedCategories.includes(observed.category as never)) {
        failures.push({ caseId: testCase.caseId, detail: `unit ${expected.unitId} differs from the golden expectation` });
      }
    });
  }
  return { taxonomyVersion: corpus.taxonomyVersion, caseCount: corpus.cases.length,
    expectedUnitCount: corpus.cases.reduce((total, testCase) => total + testCase.expectedUnits.length, 0),
    passed: failures.length === 0, failures };
};
