import type { InformationCategory, TaxonomyProcessingStatus } from "./canonicalTaxonomy";
import type { SemanticUnitContainment } from "./semanticUnit";

export const GOLDEN_CORPUS_CASE_KINDS = [
  "CLEAR", "NEGATIVE", "NEAR_NEIGHBOR", "AMBIGUOUS", "COMPOUND", "SEQUENCE", "ADVERSARIAL",
] as const;
export type GoldenCorpusCaseKind = (typeof GOLDEN_CORPUS_CASE_KINDS)[number];

export type GoldenCorpusExpectedUnit = Readonly<{
  unitId: string;
  content: string;
  containment: SemanticUnitContainment;
  parentUnitId?: string;
  expectedStatus: TaxonomyProcessingStatus;
  expectedCategory?: InformationCategory;
  expectedCandidates?: readonly InformationCategory[];
  prohibitedCategories: readonly InformationCategory[];
}>;

export type GoldenCorpusCase = Readonly<{
  caseId: string;
  kind: GoldenCorpusCaseKind;
  riskTier: "STANDARD" | "HIGH" | "CRITICAL";
  input: string;
  expectedUnits: readonly GoldenCorpusExpectedUnit[];
}>;

export type GoldenCorpus = Readonly<{
  taxonomyVersion: "1.0.0";
  corpusVersion: "1.0.0";
  cases: readonly GoldenCorpusCase[];
}>;
