import type { CanonicalInformationCategory, TaxonomyProcessingStatus } from "./canonicalTaxonomy";
import type { SemanticUnitContainment } from "./semanticUnit";

export type TaxonomyAdversarialExpectedUnit = Readonly<{
  content: string;
  containment: SemanticUnitContainment;
  expectedStatus: TaxonomyProcessingStatus;
  expectedCategory?: CanonicalInformationCategory;
  prohibitedCategories: readonly CanonicalInformationCategory[];
}>;

export type TaxonomyAdversarialCase = Readonly<{
  caseId: string;
  input: string;
  expectedUnits: readonly TaxonomyAdversarialExpectedUnit[];
}>;

export type TaxonomyAdversarialCaseSet = Readonly<{
  taxonomyVersion: "1.0.0";
  cases: readonly TaxonomyAdversarialCase[];
}>;

export type TaxonomyAdversarialRegressionReport = Readonly<{
  passed: boolean;
  caseCount: number;
  failures: readonly Readonly<{ caseId: string; detail: string }>[];
}>;
