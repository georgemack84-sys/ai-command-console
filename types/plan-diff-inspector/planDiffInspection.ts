import type { ArtifactDiffView, PlanDriftClass } from "./artifactDiffView";
import type { DependencyDriftView } from "./dependencyDriftView";
import type { EvidenceDriftView } from "./evidenceDriftView";
import type { GovernanceDriftView } from "./governanceDriftView";
import type { HashIntegrityView } from "./hashIntegrityView";
import type { ReplayDriftView } from "./replayDriftView";

export type PlanDiffComparisonMode =
  | "PLAN_TO_PLAN"
  | "PLAN_TO_REPLAY"
  | "PLAN_TO_HANDOFF"
  | "POLICY_BINDING"
  | "REGISTRY_BINDING"
  | "EVIDENCE_BUNDLE";

export type PlanDiffInspectionInput = Readonly<{
  baseArtifact: unknown;
  targetArtifact: unknown;
  comparisonMode: PlanDiffComparisonMode;
  sourceRefs?: readonly string[];
}>;

export type PlanDiffInspectionResultState =
  | "MATCH"
  | "DIFF_DETECTED"
  | "HASH_MISMATCH"
  | "UNSAFE_DRIFT"
  | "UNINSPECTABLE";

export type PlanDiffInspectionResult = Readonly<{
  inspectionId: string;
  result: PlanDiffInspectionResultState;
  artifactDiff: ArtifactDiffView;
  hashIntegrity: HashIntegrityView;
  governanceDrift: GovernanceDriftView;
  replayDrift: ReplayDriftView;
  dependencyDrift: DependencyDriftView;
  evidenceDrift: EvidenceDriftView;
  warnings: readonly string[];
  errors: readonly string[];
  deterministicHash: string;
}>;

export type DriftProjectionResult = Readonly<{
  driftClass: PlanDriftClass;
  warnings: readonly string[];
  errors: readonly string[];
}>;
