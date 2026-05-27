export function detectConstitutionalViolations(input: {
  constitutionalViolations?: string[];
  validationBlockedReasons?: string[];
  disputedTruth?: boolean;
  containmentFailed?: boolean;
}) {
  const violations = new Set<string>();

  for (const violation of input.constitutionalViolations || []) {
    violations.add(String(violation));
  }
  for (const reason of input.validationBlockedReasons || []) {
    violations.add(String(reason));
  }
  if (input.disputedTruth) violations.add("disputed_truth_detected");
  if (input.containmentFailed) violations.add("containment_verification_failed");

  return Array.from(violations).sort();
}
