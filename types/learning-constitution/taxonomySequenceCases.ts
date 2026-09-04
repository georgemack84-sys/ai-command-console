import type { CanonicalInformationCategory, TaxonomyProcessingStatus } from "./canonicalTaxonomy";

export type TaxonomySequenceTurn = Readonly<{
  turnId: string;
  input: string;
  expectedStatus: TaxonomyProcessingStatus;
  expectedCategory?: CanonicalInformationCategory;
}>;

export type TaxonomySequenceCase = Readonly<{
  caseId: string;
  turns: readonly TaxonomySequenceTurn[];
  mustNotReclassifyEarlierTurns: boolean;
}>;

export type TaxonomySequenceCaseSet = Readonly<{
  taxonomyVersion: "1.0.0";
  cases: readonly TaxonomySequenceCase[];
}>;

export type TaxonomySequenceRegressionReport = Readonly<{
  passed: boolean;
  sequenceCount: number;
  failures: readonly Readonly<{ caseId: string; detail: string }>[];
}>;
