import type { PlanDriftClass } from "./artifactDiffView";

export type GovernanceDriftView = Readonly<{
  driftClass: PlanDriftClass;
  changedFields: readonly string[];
  riskTierChanged: boolean;
  trustZoneChanged: boolean;
  approvalRequirementsChanged: boolean;
  rollbackContractChanged: boolean;
  policySnapshotHashChanged: boolean;
  capabilityClassificationChanged: boolean;
  sideEffectClassificationChanged: boolean;
  isolationRequirementsChanged: boolean;
  unknownGovernanceDrift: boolean;
}>;
