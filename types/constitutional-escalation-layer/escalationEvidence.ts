import type { EscalationLevel } from "./escalationSeverity";

export type ConstitutionalEscalationEvidence = Readonly<{
  evidenceId: string;
  evidenceRefs: readonly string[];
  triggerIds: readonly string[];
  confidenceLineageHash: string;
  governanceSnapshotHash: string;
  overrideLineageHash: string;
  proposalLineageHash: string;
  snapshotLineageHash: string;
  topologyLineageHash?: string;
  topologyHash?: string;
  replayReconstructionHash: string;
  riskTooHigh: boolean;
  confidenceTooLow: boolean;
  policyMismatch: boolean;
  replayUnsafe: boolean;
  recursiveTopology: boolean;
  hiddenDelegationPath: boolean;
  branchFactorOverflow: boolean;
  depthOverflow: boolean;
  authorityDrift: boolean;
  topologyAmbiguous: boolean;
  missingOverrideReachability: boolean;
  unknownState: boolean;
  suggestedMinimumSeverity: EscalationLevel;
  createdAt: string;
}>;
