import type { ConfidenceCautionLevel, ConfidenceClassification } from "./types/confidenceTypes";

export function resolveConfidenceCautionLevel(
  classification: ConfidenceClassification,
): ConfidenceCautionLevel {
  switch (classification) {
    case "very_low":
      return "maximum";
    case "low":
      return "strict";
    case "moderate":
      return "elevated";
    case "high":
    case "very_high":
      return "normal";
  }
}
