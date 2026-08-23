import type { CanonicalInformationCategory } from "./canonicalTaxonomy";

export type TaxonomyBoundaryCase = Readonly<{
  caseId: string;
  leftCategory: CanonicalInformationCategory;
  rightCategory: CanonicalInformationCategory;
  input: string;
  expectedCategory: CanonicalInformationCategory;
  prohibitedCategory: CanonicalInformationCategory;
}>;

export type TaxonomyBoundaryCaseSet = Readonly<{
  taxonomyVersion: "1.0.0";
  cases: readonly TaxonomyBoundaryCase[];
}>;

export type TaxonomyBoundaryRegressionReport = Readonly<{
  passed: boolean;
  caseCount: number;
  failures: readonly Readonly<{ caseId: string; detail: string }>[];
}>;
