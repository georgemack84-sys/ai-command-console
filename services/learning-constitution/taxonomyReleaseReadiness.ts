import release from "../../learning/taxonomy/release.v1.json";
import {
  CANONICAL_INFORMATION_CATEGORIES,
  CANONICAL_TAXONOMY_VERSION,
  type FrozenTaxonomyRelease,
  type TaxonomyExitGateInput,
  type TaxonomyExitGateReport,
} from "../../types/learning-constitution";
import { CANONICAL_GOLDEN_CORPUS, CANONICAL_GOLDEN_CORPUS_ID, validateGoldenCorpus } from "./goldenCorpus";
import { CANONICAL_TAXONOMY_REGISTRY, CANONICAL_TAXONOMY_REGISTRY_ID, validateCanonicalTaxonomyRegistry } from "./canonicalTaxonomyRegistry";
import { renderCanonicalTaxonomyReferenceMarkdown } from "./canonicalTaxonomyReference";
import { runGoldenDatasetPipelineRegression } from "./goldenDatasetRegression";
import { runTaxonomyBoundaryRegression } from "./taxonomyBoundaryRegression";
import { runTaxonomySequenceRegression } from "./taxonomySequenceRegression";
import { runTaxonomyAdversarialRegression } from "./taxonomyAdversarialRegression";
import { CANONICAL_CONFIDENCE_CALIBRATION_POLICY } from "./classificationConfidenceCalibration";

export const TAXONOMY_EXIT_GATE_ID = "canonical-taxonomy-v1-exit-gate" as const;

export const evaluateTaxonomyExitGate = (input: TaxonomyExitGateInput): TaxonomyExitGateReport => {
  const checks = [
    { checkId: "registry-valid", passed: (() => { try { return validateCanonicalTaxonomyRegistry(CANONICAL_TAXONOMY_REGISTRY).categories.length === CANONICAL_INFORMATION_CATEGORIES.length; } catch { return false; } })(), detail: "Frozen registry contains every canonical category." },
    { checkId: "corpus-valid", passed: (() => { try { return validateGoldenCorpus(input.corpus).taxonomyVersion === CANONICAL_TAXONOMY_VERSION; } catch { return false; } })(), detail: "Golden corpus is valid and version-aligned." },
    { checkId: "reference-derived", passed: input.renderedReference === renderCanonicalTaxonomyReferenceMarkdown(), detail: "Published semantic reference matches the validated registry renderer." },
    { checkId: "golden-dataset-regression", passed: runGoldenDatasetPipelineRegression(input.corpus).passed, detail: "Segmentation and classification satisfy the golden dataset." },
    { checkId: "boundary-regression", passed: runTaxonomyBoundaryRegression().passed, detail: "Every required nearest-neighbor boundary passes." },
    { checkId: "sequence-regression", passed: runTaxonomySequenceRegression().passed, detail: "Ordered conversation cases preserve prior semantic results." },
    { checkId: "adversarial-regression", passed: runTaxonomyAdversarialRegression().passed, detail: "Adversarial containment, negation, and misleading-label cases pass." },
    { checkId: "risk-weighted-evaluation", passed: input.evaluation.weightedAccuracy === 1 && input.evaluation.failedRiskWeight === 0, detail: "Evaluation has no weighted regression failures." },
    { checkId: "performance-metrics", passed: input.performance.categoryAccuracy === 1 && input.performance.statusMismatches.length === 0 && input.performance.evaluation.failedRiskWeight === 0, detail: "Performance metrics report no category or status regression." },
    { checkId: "confidence-calibration", passed: CANONICAL_CONFIDENCE_CALIBRATION_POLICY.policyVersion === "1.0.0" && Object.values(CANONICAL_CONFIDENCE_CALIBRATION_POLICY.minimumConfidenceByCategory).every((threshold) => threshold >= 0 && threshold <= 1), detail: "Versioned confidence calibration is complete and bounded." },
    { checkId: "critical-safety", passed: input.evaluation.criticalFailureCount === 0 && input.evaluation.observations.every((observation) => observation.actual.persistenceEffect === "NONE" && observation.actual.authorityEffect === "UNCHANGED" && observation.actual.executionPermissionGranted === false), detail: "Critical cases pass and classifier results have no effects." },
  ] as const;
  return { gateId: TAXONOMY_EXIT_GATE_ID, taxonomyVersion: CANONICAL_TAXONOMY_VERSION, passed: checks.every((check) => check.passed), checks };
};

export const assertTaxonomyExitGate = (input: TaxonomyExitGateInput): TaxonomyExitGateReport => {
  const report = evaluateTaxonomyExitGate(input);
  if (!report.passed) throw new Error(`taxonomy exit gate failed: ${report.checks.filter((check) => !check.passed).map((check) => check.checkId).join(", ")}`);
  return report;
};

export const validateFrozenTaxonomyRelease = (
  value: unknown,
  exitGate: TaxonomyExitGateReport,
): FrozenTaxonomyRelease => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("frozen taxonomy release is invalid");
  const candidate = value as Record<string, unknown>;
  if (candidate.releaseId !== "canonical-learning-taxonomy-v1" || candidate.taxonomyVersion !== CANONICAL_TAXONOMY_VERSION ||
    candidate.status !== "FROZEN" || candidate.registryId !== CANONICAL_TAXONOMY_REGISTRY_ID || candidate.corpusId !== CANONICAL_GOLDEN_CORPUS_ID ||
    candidate.exitGateId !== TAXONOMY_EXIT_GATE_ID || !exitGate.passed) {
    throw new Error("frozen taxonomy release requires a passing v1 exit gate");
  }
  return candidate as FrozenTaxonomyRelease;
};

export const CANONICAL_TAXONOMY_V1_RELEASE = release as FrozenTaxonomyRelease;
export const canonicalTaxonomyV1ExitGateInput = (
  evaluation: TaxonomyExitGateInput["evaluation"],
  performance: TaxonomyExitGateInput["performance"],
): TaxonomyExitGateInput => ({
  renderedReference: renderCanonicalTaxonomyReferenceMarkdown(), evaluation, performance, corpus: CANONICAL_GOLDEN_CORPUS,
});
