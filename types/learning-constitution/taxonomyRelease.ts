import type { GoldenCorpus } from "./goldenCorpus";
import type { TaxonomyEvaluationReport } from "./taxonomyEvaluation";
import type { TaxonomyClassifierPerformanceReport } from "./taxonomyPerformanceMetrics";

export type TaxonomyExitGateCheck = Readonly<{
  checkId: string;
  passed: boolean;
  detail: string;
}>;

export type TaxonomyExitGateInput = Readonly<{
  renderedReference: string;
  evaluation: TaxonomyEvaluationReport;
  performance: TaxonomyClassifierPerformanceReport;
  corpus: GoldenCorpus;
}>;

export type TaxonomyExitGateReport = Readonly<{
  gateId: "canonical-taxonomy-v1-exit-gate";
  taxonomyVersion: "1.0.0";
  passed: boolean;
  checks: readonly TaxonomyExitGateCheck[];
}>;

export type FrozenTaxonomyRelease = Readonly<{
  releaseId: "canonical-learning-taxonomy-v1";
  taxonomyVersion: "1.0.0";
  status: "FROZEN";
  registryId: "canonical-learning-taxonomy-v1";
  corpusId: "canonical-learning-taxonomy-golden-corpus-v1";
  exitGateId: "canonical-taxonomy-v1-exit-gate";
}>;
