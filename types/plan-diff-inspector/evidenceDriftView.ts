import type { PlanDriftClass } from "./artifactDiffView";

export type EvidenceDriftView = Readonly<{
  driftClass: PlanDriftClass;
  missingEvidenceRefs: readonly string[];
  addedEvidenceRefs: readonly string[];
  changedEvidenceRefs: readonly string[];
  unverifiableEvidenceRefs: readonly string[];
  visibleEvidenceCount: number;
}>;
