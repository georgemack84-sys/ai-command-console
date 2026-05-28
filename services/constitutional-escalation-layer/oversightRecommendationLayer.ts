import type {
  ConstitutionalEscalationEvidence,
  ConstitutionalEscalationRecommendation,
  ConstitutionalEscalationRecommendationType,
  EscalationLevel,
} from "@/types/constitutional-escalation-layer";
import { hashEscalationValue } from "./escalationHasher";

function recommendationTypeForSeverity(severity: EscalationLevel): ConstitutionalEscalationRecommendationType {
  switch (severity) {
    case "E0":
    case "E1":
      return "increase_oversight";
    case "E2":
      return "human_review";
    case "E3":
      return "freeze_recommended";
    case "E4":
      return "governance_intervention";
    case "E5":
      return "constitutional_lockdown_recommended";
  }
}

export function deriveOversightRecommendation(input: {
  severity: EscalationLevel;
  evidence: ConstitutionalEscalationEvidence;
  replayBindingHash: string;
  createdAt: string;
}): ConstitutionalEscalationRecommendation {
  const reasoningHash = hashEscalationValue("constitutional-escalation-reasoning", {
    severity: input.severity,
    evidenceRefs: input.evidence.evidenceRefs,
    suggestedMinimumSeverity: input.evidence.suggestedMinimumSeverity,
    flags: {
      riskTooHigh: input.evidence.riskTooHigh,
      confidenceTooLow: input.evidence.confidenceTooLow,
      policyMismatch: input.evidence.policyMismatch,
      replayUnsafe: input.evidence.replayUnsafe,
      recursiveTopology: input.evidence.recursiveTopology,
      hiddenDelegationPath: input.evidence.hiddenDelegationPath,
      branchFactorOverflow: input.evidence.branchFactorOverflow,
      depthOverflow: input.evidence.depthOverflow,
      authorityDrift: input.evidence.authorityDrift,
      topologyAmbiguous: input.evidence.topologyAmbiguous,
      missingOverrideReachability: input.evidence.missingOverrideReachability,
      unknownState: input.evidence.unknownState,
    },
  });

  return Object.freeze({
    escalationId: hashEscalationValue("constitutional-escalation-id", {
      reasoningHash,
      createdAt: input.createdAt,
    }),
    severity: input.severity,
    recommendationType: recommendationTypeForSeverity(input.severity),
    reasoningHash,
    evidenceRefs: input.evidence.evidenceRefs,
    governanceSnapshotHash: input.evidence.governanceSnapshotHash,
    replayBindingHash: input.replayBindingHash,
    confidenceLineageHash: input.evidence.confidenceLineageHash,
    coordinationTopologyHash: input.evidence.topologyHash,
    derivedOnly: true,
    executable: false,
    createdAt: input.createdAt,
  });
}
