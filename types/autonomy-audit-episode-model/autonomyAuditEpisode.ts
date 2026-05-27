import type { ApprovalRequirement } from "./approvalRequirement";
import type { AuditOutcome } from "./auditOutcome";
import type { AuditReplayBinding } from "./auditReplay";
import type { AuditEpisodeLineageLedger } from "./auditEpisodeLineage";
import type { OperatorInteraction } from "./operatorInteraction";
import type { RecommendationLineage } from "./recommendationLineage";
import type { RiskAnalysis } from "./riskAnalysis";

export type AuditObservation = Readonly<{
  observationId: string;
  triggerIds: readonly string[];
  evidenceHashes: readonly string[];
  confidenceScore: number;
  cautionState: "observe" | "restricted" | "escalated" | "frozen-recommended";
  createdAt: string;
}>;

export type AuditInterpretation = Readonly<{
  interpretationId: string;
  summary: string;
  derivedFromObservationId: string;
  governanceHash: string;
  confidenceScore: number;
  createdAt: string;
}>;

export type AutonomyAuditEpisode = Readonly<{
  episodeId: string;
  missionId: string;
  executionId: string;
  proposalId: string;
  observation: AuditObservation;
  interpretation: AuditInterpretation;
  recommendations: readonly RecommendationLineage[];
  riskAnalysis: RiskAnalysis;
  approvalRequirements: readonly ApprovalRequirement[];
  operatorInteractions: readonly OperatorInteraction[];
  outcome: AuditOutcome;
  replayBinding: AuditReplayBinding;
  lineage: AuditEpisodeLineageLedger;
  warnings: readonly string[];
  errors: readonly import("./auditEpisodeErrors").AutonomyAuditEpisodeError[];
  episodeHash: string;
  immutable: true;
}>;
