import type {
  AutonomyDispute,
  AutonomyReadinessProfile,
  GovernanceBinding,
  ReplayBinding,
} from "@/types/autonomy-readiness";

export type SafeActionGovernanceEvidence = GovernanceBinding &
  Readonly<{
    required: true;
    valid: boolean;
  }>;

export type SafeActionReplayEvidence = ReplayBinding &
  Readonly<{
    required: true;
    valid: boolean;
    actionSchemaHash: string;
    readinessHash: string;
    snapshotLineageHash: string;
  }>;

export type SafeActionEvidenceLinks = Readonly<{
  readinessProfileId: AutonomyReadinessProfile["profileId"];
  readinessHash: string;
  governanceHash: string;
  replayHash: string;
  snapshotLineageHash: string;
  disputes: readonly AutonomyDispute[];
}>;
