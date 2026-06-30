export const prohibitedChangeDetectionFields = [
  "prediction",
  "recommendation",
  "pick",
  "edge_score",
  "confidence_score",
  "expected_value",
  "wager_instruction",
  "bet_advice",
  "projected_winner",
  "implied_probability",
  "sharp_action",
] as const;

export function rejectProhibitedChangeDetectionOutput(output: Record<string, unknown>):
  | { status: "VALID" }
  | { status: "REJECTED"; reason: string } {
  for (const field of prohibitedChangeDetectionFields) {
    if (Object.prototype.hasOwnProperty.call(output, field)) {
      return { status: "REJECTED", reason: `${field} is prohibited during EdgeBook Phase 1.6` };
    }
  }

  return { status: "VALID" };
}
