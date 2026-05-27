import type { ConstitutionalEscalationEvidence, ConstitutionalEscalationError, EscalationLevel } from "@/types/constitutional-escalation-layer";
import { createEscalationError } from "./escalationErrors";

function maxSeverity(left: EscalationLevel, right: EscalationLevel): EscalationLevel {
  const order: readonly EscalationLevel[] = ["E0", "E1", "E2", "E3", "E4", "E5"];
  return order[Math.max(order.indexOf(left), order.indexOf(right))]!;
}

export function evaluateEscalationContainment(
  evidence: ConstitutionalEscalationEvidence,
): Readonly<{
  severity: EscalationLevel;
  errors: readonly ConstitutionalEscalationError[];
}> {
  let severity: EscalationLevel = evidence.suggestedMinimumSeverity;

  if (evidence.replayUnsafe || evidence.unknownState || evidence.recursiveTopology || evidence.hiddenDelegationPath || evidence.topologyAmbiguous) {
    severity = maxSeverity(severity, "E5");
  } else if (evidence.policyMismatch || evidence.authorityDrift) {
    severity = maxSeverity(severity, "E4");
  } else if (evidence.branchFactorOverflow || evidence.depthOverflow || evidence.missingOverrideReachability) {
    severity = maxSeverity(severity, "E3");
  } else if (evidence.riskTooHigh || evidence.confidenceTooLow) {
    severity = maxSeverity(severity, evidence.riskTooHigh ? "E2" : "E1");
  }

  const errors: ConstitutionalEscalationError[] = [];
  if (evidence.unknownState) {
    errors.push(createEscalationError("ESCALATION_STATE_INVALID", "Unknown escalation states must fail closed.", "evidence"));
  }
  if (evidence.replayUnsafe) {
    errors.push(createEscalationError("ESCALATION_REPLAY_MISMATCH", "Replay instability requires constitutional escalation.", "replay"));
  }
  return Object.freeze({ severity, errors: Object.freeze(errors) });
}
