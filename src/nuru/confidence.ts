import { z } from "zod";

export const confidenceBands = ["LOW", "MODERATE", "HIGH", "VERY_HIGH"] as const;
export const confidenceBandSchema = z.enum(confidenceBands);
export type ConfidenceBand = z.infer<typeof confidenceBandSchema>;

/** One scale for every Nuru judgment; scores remain evidence, never authority. */
export function confidenceBand(score: number): ConfidenceBand {
  if (score < 0.4) return "LOW";
  if (score < 0.7) return "MODERATE";
  if (score < 0.9) return "HIGH";
  return "VERY_HIGH";
}
