import type { ConstitutionalEscalationEvidence, EscalationLevel } from "@/types/constitutional-escalation-layer";

export function deriveEscalationSeverity(evidence: ConstitutionalEscalationEvidence): EscalationLevel {
  if (evidence.replayUnsafe || evidence.unknownState || evidence.recursiveTopology || evidence.hiddenDelegationPath || evidence.topologyAmbiguous) {
    return "E5";
  }
  if (evidence.policyMismatch || evidence.authorityDrift) {
    return "E4";
  }
  if (evidence.branchFactorOverflow || evidence.depthOverflow || evidence.missingOverrideReachability) {
    return "E3";
  }
  if (evidence.riskTooHigh || evidence.confidenceTooLow) {
    return "E2";
  }
  return "E0";
}
