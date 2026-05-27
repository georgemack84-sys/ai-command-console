import type { EscalationLevel } from "./escalationSeverity";

export type ConstitutionalEscalationRecommendationType =
  | "increase_oversight"
  | "human_review"
  | "freeze_recommended"
  | "governance_intervention"
  | "constitutional_lockdown_recommended";

export type ConstitutionalEscalationRecommendation = Readonly<{
  escalationId: string;
  severity: EscalationLevel;
  recommendationType: ConstitutionalEscalationRecommendationType;
  reasoningHash: string;
  evidenceRefs: readonly string[];
  governanceSnapshotHash: string;
  replayBindingHash: string;
  confidenceLineageHash: string;
  coordinationTopologyHash?: string;
  derivedOnly: true;
  executable: false;
  createdAt: string;
}>;
