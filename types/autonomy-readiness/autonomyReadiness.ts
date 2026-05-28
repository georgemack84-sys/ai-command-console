import type { ConstitutionalGovernanceInput, ConstitutionalGovernanceView } from "@/types/constitutional-governance";
import type { AuthorityCeiling } from "./authorityCeiling";
import type { AutonomyReadinessError } from "./autonomyErrors";
import type { GovernanceBinding } from "./governanceBinding";
import type { ReplayBinding, EscalationBinding } from "./replayBinding";
import type { AutonomyLevel, AutonomyState } from "./autonomyStates";

export type AutonomyDispute = Readonly<{
  code: AutonomyReadinessError["code"];
  reason: string;
  path?: string;
}>;

export type AutonomySimulationClassification = Readonly<{
  level: AutonomyLevel;
  classification: "visibility_only" | "future_bound_concept" | "forbidden";
  readOnly: true;
  executing: false;
  orchestrationAllowed: false;
}>;

export type AutonomyReadinessProfile = Readonly<{
  profileId: string;
  missionId: string;
  executionId: string;
  generatedAt: string;
  autonomyLevel: AutonomyLevel;
  derivedState: AutonomyState;
  authorityCeiling: AuthorityCeiling;
  governanceBinding: GovernanceBinding;
  replayBinding: ReplayBinding;
  escalationBinding: EscalationBinding;
  snapshotLineageHashes: readonly string[];
  simulationClassification: AutonomySimulationClassification;
  capabilityDriftDetected: boolean;
  disputes: readonly AutonomyDispute[];
  warnings: readonly string[];
  errors: readonly AutonomyReadinessError[];
  readinessHash: string;
}>;

export type AutonomyReadinessInput = Readonly<{
  missionId: string;
  executionId: string;
  generatedAt: string;
  governanceView: ConstitutionalGovernanceView;
  source: ConstitutionalGovernanceInput;
}>;
