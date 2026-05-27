import { INTENT_CONFIDENCE } from "./normalizationPolicies";

export function evaluateIntentConfidence(input: {
  source: "deterministic" | "ai" | "fallback";
  ambiguities: string[];
  warnings: string[];
  supported: boolean;
  dangerous: boolean;
}) {
  const base =
    input.source === "deterministic" ? 0.96
    : input.source === "ai" ? 0.82
    : 0.45;
  const ambiguityPenalty = input.ambiguities.length * 0.14;
  const warningPenalty = input.warnings.length * 0.06;
  const supportPenalty = input.supported ? 0 : 0.22;
  const dangerPenalty = input.dangerous ? 0.35 : 0;
  const confidence = Math.max(0, Math.min(1, base - ambiguityPenalty - warningPenalty - supportPenalty - dangerPenalty));

  return {
    confidence,
    accepted: confidence >= INTENT_CONFIDENCE.minimumAccepted && input.ambiguities.length === 0 && !input.dangerous,
    clarificationRequired: confidence < INTENT_CONFIDENCE.clarificationThreshold || input.ambiguities.length > 0,
  };
}
