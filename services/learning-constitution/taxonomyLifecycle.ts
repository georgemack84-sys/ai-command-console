import type {
  CanonicalClassificationReplayRecord,
  CanonicalClassificationReplayResult,
  TaxonomyCategoryDeprecation,
  TaxonomyExtensionAnalysis,
} from "../../types/learning-constitution";
import { CONTEXTUAL_CLASSIFICATION_PIPELINE_ID, classifyCanonicalInputWithContextConservatively } from "./contextualClassificationPipeline";

const nonEmpty = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const stableJson = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
};

export const fingerprintCanonicalClassificationResult = (value: unknown): string => stableJson(value);

export const validateTaxonomyCategoryDeprecation = (deprecation: TaxonomyCategoryDeprecation): TaxonomyCategoryDeprecation => {
  if (!nonEmpty(deprecation.categoryId) || deprecation.deprecated !== true || !nonEmpty(deprecation.deprecatedSince) ||
    !nonEmpty(deprecation.migrationRule) || !nonEmpty(deprecation.removalVersion) || Number.isNaN(Date.parse(deprecation.deprecatedSince))) {
    throw new Error("taxonomy category deprecation is incomplete");
  }
  if (deprecation.replacementCategory === deprecation.categoryId) throw new Error("taxonomy deprecation cannot replace a category with itself");
  return deprecation;
};

export const validateTaxonomyExtensionAnalysis = (analysis: TaxonomyExtensionAnalysis): TaxonomyExtensionAnalysis => {
  const texts = [analysis.proposedCategoryId, analysis.semanticDefinition, analysis.existingCategoryGap, analysis.uniqueDownstreamBehavior,
    analysis.durabilityInteraction, analysis.authorityInteraction, analysis.promotionInteraction, analysis.migrationRequirement];
  if (!texts.every(nonEmpty) || analysis.nearestSemanticNeighbors.length === 0 || analysis.positiveExamples.length === 0 ||
    analysis.counterexamples.length === 0 || analysis.doesNotImply.length === 0 ||
    !analysis.nearestSemanticNeighbors.every(nonEmpty) || !analysis.positiveExamples.every(nonEmpty) || !analysis.counterexamples.every(nonEmpty) || !analysis.doesNotImply.every(nonEmpty)) {
    throw new Error("taxonomy extension analysis must address all required semantic and migration questions");
  }
  return analysis;
};

export const recordCanonicalClassificationForReplay = (
  recordId: string,
  recordedAt: string,
  request: CanonicalClassificationReplayRecord["request"],
): CanonicalClassificationReplayRecord => {
  if (!nonEmpty(recordId) || Number.isNaN(Date.parse(recordedAt))) throw new Error("replay record identity and timestamp are required");
  const result = classifyCanonicalInputWithContextConservatively(request);
  return {
    recordId, recordedAt, classifierVersion: CONTEXTUAL_CLASSIFICATION_PIPELINE_ID, taxonomyVersion: "1.0.0", policyVersion: "1.0.0",
    contextReferences: request.contextFrames.map((frame) => frame.frameId), configuration: { maximumContextFrames: request.maximumContextFrames }, request, result,
    resultFingerprint: fingerprintCanonicalClassificationResult(result), persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false,
  };
};

export const replayCanonicalClassification = (record: CanonicalClassificationReplayRecord): CanonicalClassificationReplayResult => {
  if (record.persistenceEffect !== "NONE" || record.authorityEffect !== "UNCHANGED" || record.executionPermissionGranted ||
    record.contextReferences.join("|") !== record.request.contextFrames.map((frame) => frame.frameId).join("|") ||
    record.configuration.maximumContextFrames !== record.request.maximumContextFrames) {
    throw new Error("replay record is invalid or effect-bearing");
  }
  const result = classifyCanonicalInputWithContextConservatively(record.request);
  const observedFingerprint = fingerprintCanonicalClassificationResult(result);
  return { reproducible: observedFingerprint === record.resultFingerprint, expectedFingerprint: record.resultFingerprint, observedFingerprint, result,
    persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
};
