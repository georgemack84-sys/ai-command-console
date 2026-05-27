import type { AdmissionBuildInput, AdmissionDecision, GovernanceSupervision } from "./admission-types";

export function buildGovernanceSupervision(input: {
  buildInput: AdmissionBuildInput;
  decision: AdmissionDecision;
}): GovernanceSupervision {
  if (input.decision === "QUARANTINED" || input.decision === "DENIED") {
    return {
      status: "REVOCATION_RECOMMENDED",
      reasons: ["Governance supervision recommends revocation-level handling for the denied admission state."],
    };
  }
  if (input.decision === "ESCALATED") {
    return {
      status: "ESCALATION_RECOMMENDED",
      reasons: [...(input.buildInput.governanceMetadata.conflicts ?? ["Governance conflict detected."])],
    };
  }
  if (input.decision === "PAUSED" || input.decision === "REVALIDATION_REQUIRED") {
    return {
      status: "PAUSE_RECOMMENDED",
      reasons: ["Governance supervision recommends holding execution readiness pending revalidation."],
    };
  }
  return {
    status: "STABLE",
    reasons: ["Governance supervision observed no new admission-side conflicts."],
  };
}
