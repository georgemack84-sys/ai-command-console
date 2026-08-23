import type { CanonicalClassificationResult, CanonicalSemanticUnitClassifier } from "./canonicalClassification";
import type { GoldenCorpus, GoldenCorpusCaseKind } from "./goldenCorpus";

export const TAXONOMY_RISK_WEIGHTS = { STANDARD: 1, HIGH: 5, CRITICAL: 20 } as const;

export type TaxonomyEvaluationObservation = Readonly<{
  caseId: string;
  unitId: string;
  kind: GoldenCorpusCaseKind;
  riskTier: keyof typeof TAXONOMY_RISK_WEIGHTS;
  riskWeight: number;
  passed: boolean;
  expectedStatus: CanonicalClassificationResult["status"];
  expectedCategory?: CanonicalClassificationResult["category"];
  actual: CanonicalClassificationResult;
}>;

export type TaxonomyEvaluationReport = Readonly<{
  classifierId: string;
  classifierVersion: string;
  totalRiskWeight: number;
  passedRiskWeight: number;
  failedRiskWeight: number;
  weightedAccuracy: number;
  criticalFailureCount: number;
  observations: readonly TaxonomyEvaluationObservation[];
}>;

export type CrossClassifierDisagreement = Readonly<{
  caseId: string;
  unitId: string;
  riskTier: keyof typeof TAXONOMY_RISK_WEIGHTS;
  classifierIds: readonly [string, string];
  results: readonly [CanonicalClassificationResult, CanonicalClassificationResult];
}>;

export type CrossClassifierConsistencyReport = Readonly<{
  comparedClassifierIds: readonly string[];
  comparedUnitCount: number;
  disagreementCount: number;
  criticalDisagreementCount: number;
  disagreements: readonly CrossClassifierDisagreement[];
}>;

export type TaxonomyEvaluatorInput = Readonly<{
  classifier: CanonicalSemanticUnitClassifier;
  corpus: GoldenCorpus;
}>;
