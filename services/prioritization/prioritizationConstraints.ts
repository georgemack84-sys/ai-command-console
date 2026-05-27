import type { RecoveryPrioritizationInput } from "./prioritizationTypes";

export function validatePrioritizationEvidence(input: RecoveryPrioritizationInput) {
  const issues: string[] = [];

  if (!input.candidates.length) {
    issues.push("no_recovery_candidates");
  }
  if (!input.evidence.length) {
    issues.push("prioritization_evidence_missing");
  }
  if (!input.convergence) {
    issues.push("convergence_evidence_missing");
  }
  if (!input.stability) {
    issues.push("stability_evidence_missing");
  }
  if (input.convergence?.state === "DISPUTED" || input.convergence?.state === "FAILED") {
    issues.push("convergence_disputed");
  }
  if (input.stewardship?.governanceBlocked || input.stewardship?.verificationBlocked) {
    issues.push("stewardship_blocked");
  }

  return {
    ok: issues.length === 0,
    issues,
  };
}
