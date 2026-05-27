import type { PlanDiffInspectionInput, PlanDiffInspectionResult } from "@/types/plan-diff-inspector";
import { projectArtifactDiff } from "./artifactDiffProjection";
import { projectDependencyDrift } from "./dependencyDriftProjection";
import { projectEvidenceDrift } from "./evidenceDriftProjection";
import { projectGovernanceDrift } from "./governanceDriftProjection";
import { projectHashIntegrity } from "./hashIntegrityProjection";
import { guardHashIntegrity, guardInspectableInput, guardUnknownDrift } from "./inspectionGuards";
import { PLAN_DIFF_ENGINE_VERSION, hashPlanDiffInspectionValue } from "./inspectionHasher";
import { projectReplayDrift } from "./replayDriftProjection";

function determineInspectionResult(input: {
  warnings: readonly string[];
  errors: readonly string[];
  artifactDiffCount: number;
  hashMismatch: boolean;
  governanceDrift: string;
  replayValid: boolean;
}): PlanDiffInspectionResult["result"] {
  if (input.errors.includes("PLAN_DIFF_ARTIFACT_MISSING")
    || input.errors.includes("PLAN_DIFF_ARTIFACT_UNINSPECTABLE")
    || input.errors.includes("PLAN_DIFF_UNSUPPORTED_SOURCE_ARTIFACT")) {
    return "UNINSPECTABLE";
  }
  if (input.errors.includes("PLAN_DIFF_UNKNOWN_DRIFT")
    || input.errors.includes("PLAN_DIFF_GOVERNANCE_DRIFT")
    || input.errors.includes("PLAN_DIFF_REPLAY_DRIFT")
    || input.errors.includes("PLAN_DIFF_EVIDENCE_DIVERGENCE")
    || !input.replayValid) {
    return "UNSAFE_DRIFT";
  }
  if (input.hashMismatch) {
    return "HASH_MISMATCH";
  }
  if (input.artifactDiffCount > 0 || input.warnings.length > 0) {
    return "DIFF_DETECTED";
  }
  return "MATCH";
}

export function assemblePlanDiffInspection(
  input: PlanDiffInspectionInput,
): PlanDiffInspectionResult {
  const artifactDiff = projectArtifactDiff(input);
  const hashIntegrity = projectHashIntegrity(input);
  const governanceDrift = projectGovernanceDrift(input);
  const replayDrift = projectReplayDrift({
    artifactDiff,
  });
  const dependencyDrift = projectDependencyDrift(input);
  const evidenceDrift = projectEvidenceDrift(input);

  const warnings = Object.freeze([
    governanceDrift.unknownGovernanceDrift ? "unknown governance drift remains visible" : undefined,
    replayDrift.unknownReplayDrift ? "unknown replay drift remains visible" : undefined,
    dependencyDrift.cycleDetected ? "dependency cycle remains visible" : undefined,
    evidenceDrift.unverifiableEvidenceRefs.length > 0 ? "unverifiable evidence remains visible" : undefined,
  ].filter((value): value is string => Boolean(value)).sort((left, right) => left.localeCompare(right)));

  const errors = Object.freeze([
    ...guardInspectableInput(input),
    ...guardHashIntegrity(hashIntegrity),
    ...(governanceDrift.driftClass === "GOVERNANCE_DRIFT" ? ["PLAN_DIFF_GOVERNANCE_DRIFT"] : []),
    ...(replayDrift.driftClass === "REPLAY_DRIFT" || !replayDrift.replayValid ? ["PLAN_DIFF_REPLAY_DRIFT"] : []),
    ...(dependencyDrift.cycleDetected ? ["PLAN_DIFF_DEPENDENCY_CYCLE"] : []),
    ...(evidenceDrift.driftClass === "EVIDENCE_DRIFT" ? ["PLAN_DIFF_EVIDENCE_DIVERGENCE"] : []),
    ...guardUnknownDrift({
      artifactDiff,
      governanceDrift,
      replayDrift,
      dependencyDrift,
      evidenceDrift,
    }),
  ].sort((left, right) => left.localeCompare(right)));

  const deterministicHash = hashPlanDiffInspectionValue("plan-diff-inspection", {
    comparisonMode: input.comparisonMode,
    baseArtifactHash: artifactDiff.baseArtifactHash,
    targetArtifactHash: artifactDiff.targetArtifactHash,
    changedPaths: artifactDiff.changedPaths,
    driftClass: artifactDiff.driftClass,
    hashIntegrity,
    governanceDrift,
    replayDrift,
    dependencyDrift,
    evidenceDrift,
    warnings,
    errors,
    sourceRefs: input.sourceRefs,
    engineVersion: PLAN_DIFF_ENGINE_VERSION,
  });

  return Object.freeze({
    inspectionId: hashPlanDiffInspectionValue("plan-diff-inspection-id", {
      comparisonMode: input.comparisonMode,
      baseArtifactHash: artifactDiff.baseArtifactHash,
      targetArtifactHash: artifactDiff.targetArtifactHash,
      sourceRefs: input.sourceRefs,
    }),
    result: determineInspectionResult({
      warnings,
      errors,
      artifactDiffCount: artifactDiff.visibleDiffCount,
      hashMismatch: hashIntegrity.hashMismatch,
      governanceDrift: governanceDrift.driftClass,
      replayValid: replayDrift.replayValid,
    }),
    artifactDiff,
    hashIntegrity,
    governanceDrift,
    replayDrift,
    dependencyDrift,
    evidenceDrift,
    warnings,
    errors,
    deterministicHash,
  });
}
