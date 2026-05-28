import type { EscalationError } from "@/types/escalation";
import { createEscalationError } from "./escalationBoundaryEnforcer";

export function validateEscalationGovernance(input: {
  freshnessStatus: string;
  governanceCompatibility: "compatible" | "review_required" | "invalid";
  replayIntegrity: "verified" | "mismatch" | "quarantined";
  readinessCertified: boolean;
}): readonly EscalationError[] {
  const errors: EscalationError[] = [];
  if (!input.readinessCertified) {
    errors.push(createEscalationError(
      "ESCALATION_GOVERNANCE_MISMATCH",
      "Escalation coordination requires valid readiness certification evidence.",
      "readinessCertified",
    ));
  }
  if (input.governanceCompatibility === "invalid") {
    errors.push(createEscalationError(
      "ESCALATION_GOVERNANCE_MISMATCH",
      "Governance incompatibility requires fail-closed escalation handling.",
      "governanceCompatibility",
    ));
  }
  if (input.replayIntegrity === "mismatch") {
    errors.push(createEscalationError(
      "ESCALATION_REPLAY_AMBIGUITY",
      "Replay mismatch requires escalation containment.",
      "replayIntegrity",
    ));
  }
  return Object.freeze(errors);
}
