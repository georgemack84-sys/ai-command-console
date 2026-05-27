import type { PlanDiffInspectionInput, PlanDiffInspectionResult } from "@/types/plan-diff-inspector";
import { assemblePlanDiffInspection } from "./inspectionAssembler";
import { hashPlanDiffInspectionValue } from "./inspectionHasher";

function buildUnsupportedInspection(input: PlanDiffInspectionInput, errorCode: string): PlanDiffInspectionResult {
  const emptyHash = hashPlanDiffInspectionValue("plan-diff-empty", {
    comparisonMode: input.comparisonMode,
    sourceRefs: input.sourceRefs,
    errorCode,
  });
  return Object.freeze({
    inspectionId: hashPlanDiffInspectionValue("plan-diff-empty-id", {
      comparisonMode: input.comparisonMode,
      errorCode,
    }),
    result: "UNINSPECTABLE",
    artifactDiff: Object.freeze({
      baseArtifactHash: emptyHash,
      targetArtifactHash: emptyHash,
      changedPaths: Object.freeze([]),
      diffs: Object.freeze([]),
      visibleDiffCount: 0,
      driftClass: "UNKNOWN_DRIFT",
    }),
    hashIntegrity: Object.freeze({
      baseArtifactHash: emptyHash,
      targetArtifactHash: emptyHash,
      declaredHashes: Object.freeze([]),
      changedHashPaths: Object.freeze([]),
      invalidHashPaths: Object.freeze([]),
      hashMismatch: false,
    }),
    governanceDrift: Object.freeze({
      driftClass: "UNKNOWN_DRIFT",
      changedFields: Object.freeze([]),
      riskTierChanged: false,
      trustZoneChanged: false,
      approvalRequirementsChanged: false,
      rollbackContractChanged: false,
      policySnapshotHashChanged: false,
      capabilityClassificationChanged: false,
      sideEffectClassificationChanged: false,
      isolationRequirementsChanged: false,
      unknownGovernanceDrift: true,
    }),
    replayDrift: Object.freeze({
      driftClass: "UNKNOWN_DRIFT",
      replayValid: false,
      changedFields: Object.freeze([]),
      stepOrderChanged: false,
      dependencyChanged: false,
      toolBindingChanged: false,
      inputChanged: false,
      evidenceChanged: false,
      policySnapshotChanged: false,
      replayHashChanged: false,
      unknownReplayDrift: true,
    }),
    dependencyDrift: Object.freeze({
      driftClass: "UNKNOWN_DRIFT",
      addedEdges: Object.freeze([]),
      removedEdges: Object.freeze([]),
      reorderedDependencies: false,
      cycleDetected: false,
      duplicateEdges: false,
      visibleEdgeCount: 0,
    }),
    evidenceDrift: Object.freeze({
      driftClass: "UNKNOWN_DRIFT",
      missingEvidenceRefs: Object.freeze([]),
      addedEvidenceRefs: Object.freeze([]),
      changedEvidenceRefs: Object.freeze([]),
      unverifiableEvidenceRefs: Object.freeze([]),
      visibleEvidenceCount: 0,
    }),
    warnings: Object.freeze([]),
    errors: Object.freeze([errorCode]),
    deterministicHash: emptyHash,
  });
}

export function buildPlanDiffInspection(
  input: PlanDiffInspectionInput,
): PlanDiffInspectionResult {
  if (!input?.comparisonMode) {
    return buildUnsupportedInspection(input, "PLAN_DIFF_UNSUPPORTED_SOURCE_ARTIFACT");
  }

  try {
    return assemblePlanDiffInspection(input);
  } catch {
    return buildUnsupportedInspection(input, "PLAN_DIFF_ARTIFACT_UNINSPECTABLE");
  }
}
