export function evaluateApiGovernancePolicy(input: {
  approved: boolean;
  compatibilityVerified: boolean;
  replayVerified: boolean;
}) {
  return input.approved && input.compatibilityVerified && input.replayVerified;
}
