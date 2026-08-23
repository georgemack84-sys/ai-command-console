import { describe, expect, it } from "vitest";

import { CANONICAL_GOLDEN_CORPUS, runGoldenDatasetPipelineRegression } from "@/services/learning-constitution";

describe("golden dataset pipeline regression", () => {
  it("executes every golden case through segmentation and classification", () => {
    const report = runGoldenDatasetPipelineRegression();
    expect(report).toMatchObject({ taxonomyVersion: "1.0.0", caseCount: CANONICAL_GOLDEN_CORPUS.cases.length, passed: true, failures: [] });
    expect(report.expectedUnitCount).toBeGreaterThan(report.caseCount);
  });

  it("reports pipeline drift without changing any information state", () => {
    const drifted = structuredClone(CANONICAL_GOLDEN_CORPUS) as typeof CANONICAL_GOLDEN_CORPUS;
    const firstCase = drifted.cases[0] as unknown as { expectedUnits: Array<{ expectedCategory?: string }> };
    firstCase.expectedUnits[0].expectedCategory = "FACT";
    const report = runGoldenDatasetPipelineRegression(drifted);
    expect(report).toMatchObject({ passed: false });
    expect(report.failures[0]?.caseId).toBe("clear-conversation");
  });
});
