import type { ConfidenceClassification } from "./types/confidenceTypes";

export function classifyDeterministicConfidence(score: number): ConfidenceClassification {
  if (score <= 0.24) {
    return "very_low";
  }
  if (score <= 0.44) {
    return "low";
  }
  if (score <= 0.69) {
    return "moderate";
  }
  if (score <= 0.89) {
    return "high";
  }
  return "very_high";
}
