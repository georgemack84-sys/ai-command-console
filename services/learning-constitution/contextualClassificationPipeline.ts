import type {
  CanonicalClassificationResult,
  ContextualCanonicalInputClassificationResult,
  ContextualClassificationInputRequest,
} from "../../types/learning-constitution";
import { calibrateCanonicalClassificationConfidence } from "./classificationConfidenceCalibration";
import { buildConservativeClassificationContextWindow } from "./classificationContext";
import { classifyCanonicalInputConservatively } from "./canonicalClassificationPipeline";
import { resolveClassificationAttribution } from "./classificationAttribution";
import { resolveClassificationControlsConservatively } from "./classificationControls";

export const CONTEXTUAL_CLASSIFICATION_PIPELINE_ID = "bounded-contextual-classification-pipeline-v1";

const applyBrainstormContext = (
  result: CanonicalClassificationResult,
  activeModes: readonly string[],
): CanonicalClassificationResult => {
  if (result.status !== "REQUIRES_REVIEW" || !activeModes.includes("BRAINSTORM_CONTEXT")) return result;
  return calibrateCanonicalClassificationConfidence({
    ...result, status: "CLASSIFIED", category: "IDEA", candidates: [], confidence: 0.91,
    classificationBasis: "INFERRED",
    reasonCodes: [...result.reasonCodes, "INHERITED_BRAINSTORM_CONTEXT"],
    evidence: [...result.evidence, { code: "INHERITED_BRAINSTORM_CONTEXT", matchedText: "BRAINSTORM_CONTEXT" }],
  }).result;
};

/** Applies only declared, bounded contextual modifiers after the non-contextual baseline. */
export const classifyCanonicalInputWithContextConservatively = (
  request: ContextualClassificationInputRequest,
): ContextualCanonicalInputClassificationResult => {
  const context = buildConservativeClassificationContextWindow({
    currentContent: request.content, frames: request.contextFrames, maximumFrames: request.maximumContextFrames,
  });
  const baseline = classifyCanonicalInputConservatively({ source: request.source, content: request.content });
  const classifications = baseline.classifications.map((result) => applyBrainstormContext(result, context.activeModes));
  return {
    context, classification: { ...baseline, classifications }, attribution: resolveClassificationAttribution(request.source),
    controls: resolveClassificationControlsConservatively({ provenance: request.source, content: request.content,
      ...(request.explicitUserCategory ? { explicitUserCategory: request.explicitUserCategory } : {}),
      ...(request.explicitLearningIntent ? { explicitLearningIntent: request.explicitLearningIntent } : {}),
    }, classifications),
    persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false,
  };
};
