export function assessApiRisk(input: {
  deprecated: boolean;
  breakingChange: boolean;
  replayVerified: boolean;
}) {
  if (input.breakingChange || !input.replayVerified) {
    return "critical";
  }
  if (input.deprecated) {
    return "medium";
  }
  return "low";
}
