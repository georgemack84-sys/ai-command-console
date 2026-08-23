import type { GoldenCorpus } from "./goldenCorpus";

export type GoldenDatasetRegressionFailure = Readonly<{
  caseId: string;
  detail: string;
}>;

export type GoldenDatasetRegressionReport = Readonly<{
  taxonomyVersion: GoldenCorpus["taxonomyVersion"];
  caseCount: number;
  expectedUnitCount: number;
  passed: boolean;
  failures: readonly GoldenDatasetRegressionFailure[];
}>;
