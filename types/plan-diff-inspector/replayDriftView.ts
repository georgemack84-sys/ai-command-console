import type { PlanDriftClass } from "./artifactDiffView";

export type ReplayDriftView = Readonly<{
  driftClass: PlanDriftClass;
  replayValid: boolean;
  changedFields: readonly string[];
  stepOrderChanged: boolean;
  dependencyChanged: boolean;
  toolBindingChanged: boolean;
  inputChanged: boolean;
  evidenceChanged: boolean;
  policySnapshotChanged: boolean;
  replayHashChanged: boolean;
  unknownReplayDrift: boolean;
}>;
