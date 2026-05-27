import type { ReplayReconstructionInput, ReplayReconstructionResult } from "@/types/replay-reconstruction-engine";
import { classifyReplayDrift } from "./replayDriftClassifier";
import { verifyReplayDeterminism } from "./replayDeterminismVerifier";
import { projectReplayIntegrity } from "./replayIntegrityProjection";
import { projectReplayLineage } from "./replayLineageProjection";
import { projectReplayComparison } from "./replayComparisonProjection";
import { assembleReplayVisualization } from "./replayVisualizationAssembler";
import { guardReplayInput, mapReplayStatus } from "./replayGuards";
import { hashReplayValue } from "./replayHasher";

export function buildReplayReconstruction(
  input: ReplayReconstructionInput,
): ReplayReconstructionResult {
  const guardErrors = [...guardReplayInput(input)];
  const lineage = projectReplayLineage(input);
  const integrity = projectReplayIntegrity({
    treaty: input.treaty,
    validation: input.validation,
    lineage,
  });
  const comparison = projectReplayComparison(input);
  const drift = classifyReplayDrift({
    lineage,
    integrity,
    comparison,
  });
  const visualization = assembleReplayVisualization({
    validation: input.validation,
    traceView: input.traceView,
    policyExplanation: input.policyExplanation,
    lineage,
    comparison,
  });
  const determinism = verifyReplayDeterminism({
    lineage,
    integrity,
    comparison,
    drift,
    visualization,
  });

  const warnings = Object.freeze([
    ...(comparison.warnings ?? []),
    ...(drift.failClosed ? ["unknown or unsafe replay drift remains visible"] : []),
  ].sort((left, right) => left.localeCompare(right)));

  const errors = Object.freeze([
    ...guardErrors,
    ...(lineage.valid ? [] : ["REPLAY_LINEAGE_INVALID"]),
    ...(integrity.valid ? [] : [
      !integrity.treatyIntegrityValid ? "REPLAY_HASH_INVALID" : undefined,
      !integrity.lineageIntegrityValid ? "REPLAY_LINEAGE_INVALID" : undefined,
      !integrity.replayHashValid ? "REPLAY_HASH_INVALID" : undefined,
    ].filter((value): value is string => Boolean(value))),
    ...comparison.errors.map((error) => {
      if (error === "PLAN_DIFF_GOVERNANCE_DRIFT") return "REPLAY_GOVERNANCE_DRIFT";
      if (error === "PLAN_DIFF_REPLAY_DRIFT") return "REPLAY_POLICY_DRIFT";
      if (error === "PLAN_DIFF_EVIDENCE_DIVERGENCE") return "REPLAY_EVIDENCE_INCOMPLETE";
      if (error === "PLAN_DIFF_UNKNOWN_DRIFT") return "REPLAY_UNKNOWN_DRIFT";
      if (error === "PLAN_DIFF_HASH_MISMATCH") return "REPLAY_HASH_INVALID";
      return "REPLAY_COMPARISON_FAILED";
    }),
    ...drift.driftTypes.map((driftType) => {
      switch (driftType) {
        case "VALIDATOR_DRIFT":
          return "REPLAY_VALIDATOR_MISMATCH";
        case "POLICY_DRIFT":
          return "REPLAY_POLICY_DRIFT";
        case "REGISTRY_DRIFT":
          return "REPLAY_REGISTRY_DRIFT";
        case "CONTRACT_DRIFT":
          return "REPLAY_CONTRACT_DRIFT";
        case "GOVERNANCE_DRIFT":
          return "REPLAY_GOVERNANCE_DRIFT";
        case "DEPENDENCY_DRIFT":
          return "REPLAY_DEPENDENCY_DRIFT";
        case "ORDERING_DRIFT":
          return "REPLAY_ORDERING_INVALID";
        case "RUNTIME_DRIFT":
          return "REPLAY_RUNTIME_CONTAMINATED";
        case "INTEGRITY_DRIFT":
          return "REPLAY_HASH_INVALID";
        case "UNKNOWN_DRIFT":
        default:
          return "REPLAY_UNKNOWN_DRIFT";
      }
    }),
    ...(determinism.deterministic ? [] : ["REPLAY_NONDETERMINISTIC"]),
  ].filter((value, index, array): value is string => Boolean(value) && array.indexOf(value) === index).sort((left, right) => left.localeCompare(right)));

  const result: ReplayReconstructionResult = Object.freeze({
    replayId: hashReplayValue("replay-id", {
      treatyId: input.treaty.manifest.treatyId,
      validationId: input.validation.result.validationId,
      comparisonArtifact: Boolean(input.comparisonArtifact),
    }),
    status: "RECONSTRUCTED",
    lineage,
    integrity,
    comparison,
    drift,
    visualization,
    reconstructionHash: determinism.reconstructionHash,
    warnings,
    errors,
  });

  return Object.freeze({
    ...result,
    status: mapReplayStatus(result),
  });
}
