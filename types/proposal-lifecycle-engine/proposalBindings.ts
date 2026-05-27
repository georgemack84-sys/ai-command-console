import type { SafeActionCategory, SafeActionRiskClass } from "@/types/safe-action-catalog";

export type ProposalGovernanceBinding = Readonly<{
  governanceDecisionHash: string;
  policySnapshotHash: string;
  governanceLineageHash: string;
  approvalLineageHash: string;
  authorityLineageHash: string;
  sourceState: "ALLOW" | "DENY" | "ESCALATE";
  valid: boolean;
  disputed: boolean;
}>;

export type ProposalReplayBinding = Readonly<{
  reconstructionHash: string;
  replaySnapshotHash: string;
  replayLineageHash: string;
  readinessHash: string;
  snapshotLineageHash: string;
  deterministic: boolean;
  valid: boolean;
  disputed: boolean;
}>;

export type ProposalSnapshotBinding = Readonly<{
  snapshotLineageHashes: readonly string[];
  snapshotLineageHash: string;
  valid: boolean;
  disputed: boolean;
}>;

export type ProposalSafeActionBinding = Readonly<{
  safeActionId: string;
  safeActionHash: string;
  category: SafeActionCategory;
  riskClass: SafeActionRiskClass;
  valid: boolean;
  futureBound: boolean;
  forbidden: boolean;
}>;
