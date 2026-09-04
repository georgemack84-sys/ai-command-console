import type { CanonicalInformationCategory, TaxonomyProcessingStatus } from "./canonicalTaxonomy";
import type { TaxonomyEvaluationReport } from "./taxonomyEvaluation";

export type TaxonomyConfusionMatrixEntry = Readonly<{
  expectedCategory: CanonicalInformationCategory;
  observedCategory: CanonicalInformationCategory | "NO_CATEGORY";
  count: number;
  riskWeight: number;
}>;

export type TaxonomyStatusMismatch = Readonly<{
  expectedStatus: TaxonomyProcessingStatus;
  observedStatus: TaxonomyProcessingStatus;
  count: number;
}>;

export type TaxonomyClassifierPerformanceReport = Readonly<{
  classifierId: string;
  classifierVersion: string;
  evaluation: TaxonomyEvaluationReport;
  classifiedExpectationCount: number;
  exactCategoryMatchCount: number;
  categoryAccuracy: number;
  confusionMatrix: readonly TaxonomyConfusionMatrixEntry[];
  statusMismatches: readonly TaxonomyStatusMismatch[];
}>;
