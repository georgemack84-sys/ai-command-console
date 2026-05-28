import { validateDeterministicReplaySchema } from "./schemas";
import { loadReplaySnapshots } from "./replaySnapshotLoader";
import { resolveReplayDependencies } from "./replayDependencyResolver";
import { buildReplayDependencyGraph } from "./replayDependencyGraph";
import { validateReplayGovernance } from "./replayGovernanceValidator";
import { bindReplayPolicies } from "./replayPolicyBindingEngine";
import { resolveReplayValidatorVersions } from "./replayValidatorVersionResolver";
import { reconstructReplayScoring } from "./replayScoringReconstructor";
import { reconstructReplayConfidence } from "./replayConfidenceEngine";
import { detectReplayDrift } from "./replayDriftDetector";
import { detectHiddenReplayMutation } from "./hiddenReplayMutationDetector";
import { detectRuntimeDependency } from "./runtimeDependencyDetector";
import { detectLiveRegistryResolution } from "./liveRegistryResolutionDetector";
import { detectAuthorityRestoration } from "./authorityRestorationDetector";
import { detectSuppressionBypass } from "./suppressionBypassDetector";
import { detectRecursiveReplayLoop } from "./recursiveReplayLoopDetector";
import { detectReplayApproximation } from "./replayApproximationDetector";
import { detectDynamicDependencySubstitution } from "./dynamicDependencySubstitutionDetector";
import { detectReplayRepair } from "./replayRepairDetector";
import { detectHistoricalDrift } from "./historicalDriftDetector";
import { reconstructRecommendationHash } from "./replayReplayEngine";
import { validateReplayIntegrity } from "./replayIntegrityValidator";
import { certifyReplay } from "./replayCertificationEngine";
import { buildReplayEvidenceBundle } from "./replayEvidenceBundleGenerator";
import { buildDeterministicReplaySnapshot } from "./replaySnapshotEngine";
import { appendDeterministicReplayLedger, appendDeterministicReplayLineage } from "./immutableReplayLineageLog";
import { buildReplayForensics } from "./replayForensicsEngine";
import { buildReplayMetrics } from "./replayMetrics";
import { hashReplayValue } from "./replayHashEngine";
import type {
  DeterministicReplayError,
  DeterministicReplayInput,
  DeterministicReplayLineageEntry,
  DeterministicReplayOutput,
  ReplayResult,
  ReplaySuppressionRecord,
  ReplayIntegrityRecord,
} from "./types/deterministicReplayTypes";

function freezeErrors(items: readonly DeterministicReplayError[]): readonly DeterministicReplayError[] {
  return Object.freeze([...items]);
}

export function buildDeterministicDecisionReplay(
  input: DeterministicReplayInput,
): DeterministicReplayOutput {
  const schemaErrors = validateDeterministicReplaySchema(input);
  const loadedSnapshots = loadReplaySnapshots(input);
  const dependencyResolution = resolveReplayDependencies(input);
  const dependencyGraph = buildReplayDependencyGraph(input);
  const governance = validateReplayGovernance(input);
  const policy = bindReplayPolicies(input);
  const validators = resolveReplayValidatorVersions(input);
  const scoring = reconstructReplayScoring(input);
  const confidence = reconstructReplayConfidence(input);

  const suppression: ReplaySuppressionRecord = Object.freeze({
    suppressionSnapshotIds: Object.freeze([...input.request.suppressionSnapshotIds]),
    suppressionValidated:
      input.operatorAuthorityResult.suppression.suppressed
      && input.operatorAuthorityResult.suppression.continuityInvalidated,
    continuityInvalidated: input.operatorAuthorityResult.suppression.continuityInvalidated,
    suppressionHash: hashReplayValue("replay-suppression", {
      suppressionSnapshotIds: input.request.suppressionSnapshotIds,
      suppressionReplayHash: input.operatorAuthorityResult.action.replayHash,
      continuityInvalidated: input.operatorAuthorityResult.suppression.continuityInvalidated,
    }),
  });

  const replayDriftErrors = detectReplayDrift(input);
  const hiddenMutationErrors = detectHiddenReplayMutation(input);
  const runtimeDependencyErrors = detectRuntimeDependency(input);
  const liveRegistryErrors = detectLiveRegistryResolution(input);
  const authorityRestorationErrors = detectAuthorityRestoration(input);
  const suppressionBypassErrors = detectSuppressionBypass(input);
  const recursiveReplayErrors = detectRecursiveReplayLoop(input);
  const approximationErrors = detectReplayApproximation(input);
  const dynamicSubstitutionErrors = detectDynamicDependencySubstitution(input);
  const repairErrors = detectReplayRepair(input);
  const historicalDriftErrors = detectHistoricalDrift(input);

  const { reconstructedRecommendationHash, originalRecommendationHash } = reconstructRecommendationHash(input);
  const integrityErrors = validateReplayIntegrity({
    governanceBinding: governance.binding,
    policyBinding: policy.binding,
    scoring: scoring.scoring,
    confidence: confidence.confidence,
    suppression,
    reconstructedRecommendationHash,
    originalRecommendationHash,
  });

  const errors = freezeErrors([
    ...schemaErrors,
    ...loadedSnapshots.errors,
    ...dependencyResolution.errors,
    ...governance.errors,
    ...policy.errors,
    ...validators.errors,
    ...scoring.errors,
    ...confidence.errors,
    ...replayDriftErrors,
    ...hiddenMutationErrors,
    ...runtimeDependencyErrors,
    ...liveRegistryErrors,
    ...authorityRestorationErrors,
    ...suppressionBypassErrors,
    ...recursiveReplayErrors,
    ...approximationErrors,
    ...dynamicSubstitutionErrors,
    ...repairErrors,
    ...historicalDriftErrors,
    ...integrityErrors,
  ]);

  const deterministic = errors.length === 0;
  const driftDetected = errors.some((error) => error.code.includes("MISMATCH") || error.code.includes("DRIFT"));
  const integrity: ReplayIntegrityRecord = Object.freeze({
    deterministic,
    driftDetected,
    governanceValidated: governance.binding.governanceValidated,
    suppressionValidated: suppression.suppressionValidated,
    integrityHash: hashReplayValue("replay-integrity", {
      deterministic,
      driftDetected,
      governanceValidated: governance.binding.governanceValidated,
      suppressionValidated: suppression.suppressionValidated,
      errorCodes: errors.map((error) => error.code),
    }),
  });
  const certification = certifyReplay({
    errors,
    deterministic,
    governanceValidated: governance.binding.governanceValidated,
    suppressionValidated: suppression.suppressionValidated,
  });

  const replayHash = hashReplayValue("deterministic-replay-result-hash", {
    request: input.request,
    dependencyGraphHash: dependencyGraph.graphHash,
    governanceHash: governance.binding.governanceHash,
    policyHash: policy.binding.policyHash,
    validatorHash: validators.binding.validatorHash,
    scoringHash: scoring.scoring.scoringHash,
    confidenceHash: confidence.confidence.confidenceHash,
    suppressionHash: suppression.suppressionHash,
    reconstructedRecommendationHash,
    originalRecommendationHash,
    certificationHash: certification.certificationHash,
  });

  const result: ReplayResult = Object.freeze({
    replayId: input.request.replayId,
    recommendationId: input.request.recommendationId,
    deterministic,
    replayHash,
    reconstructedRecommendationHash,
    originalRecommendationHash,
    governanceValidated: governance.binding.governanceValidated,
    suppressionValidated: suppression.suppressionValidated,
    driftDetected,
    replayCertified: certification.certified,
    certificationReason: certification.reason,
    generatedAt: input.generatedAt,
  });

  const evidenceBundle = buildReplayEvidenceBundle(input);
  const snapshot = buildDeterministicReplaySnapshot({
    replayInput: input,
    result,
    graphHash: dependencyGraph.graphHash,
  });
  const lineageEntry: DeterministicReplayLineageEntry = Object.freeze({
    entryId: hashReplayValue("deterministic-replay-lineage-entry-id", {
      replayId: input.request.replayId,
      generatedAt: input.generatedAt,
    }),
    replayId: input.request.replayId,
    recommendationId: input.request.recommendationId,
    replayCertified: certification.certified,
    generatedAt: input.generatedAt,
    deterministicHash: hashReplayValue("deterministic-replay-lineage-entry", {
      replayId: input.request.replayId,
      replayCertified: certification.certified,
      replayHash,
    }),
  });
  const lineage = appendDeterministicReplayLineage({
    existing: input.existingLineage,
    entry: lineageEntry,
  });
  const auditLedger = appendDeterministicReplayLedger({
    existing: appendDeterministicReplayLedger({
      existing: input.existingAuditLedger,
      payload: Object.freeze({
        event: "deterministic.replay.reconstructed",
        replayId: input.request.replayId,
        recommendationId: input.request.recommendationId,
        replayHash,
      }),
      scope: "deterministic-replay",
    }),
    payload: Object.freeze({
      event: certification.certified ? "deterministic.replay.certified" : "deterministic.replay.failed_closed",
      replayId: input.request.replayId,
      lineageHash: lineage.lineageHash,
      evidenceHash: evidenceBundle.evidenceHash,
      certificationHash: certification.certificationHash,
    }),
    scope: "deterministic-replay-audit",
  });
  const forensics = buildReplayForensics({
    replayId: input.request.replayId,
    replayHash,
    evidenceHash: evidenceBundle.evidenceHash,
    lineageHash: lineage.lineageHash,
  });
  const metrics = buildReplayMetrics({
    errors,
    certified: certification.certified,
    deterministic,
    governanceValidated: governance.binding.governanceValidated,
    suppressionValidated: suppression.suppressionValidated,
  });

  return Object.freeze({
    result,
    immutableSnapshots: loadedSnapshots.snapshots,
    dependencyGraph,
    governanceBinding: governance.binding,
    policyBinding: policy.binding,
    validatorBinding: validators.binding,
    scoring: scoring.scoring,
    confidence: confidence.confidence,
    suppression,
    integrity,
    certification,
    evidenceBundle,
    snapshot,
    lineage,
    auditLedger,
    forensics,
    metrics,
    errors,
    warnings: Object.freeze(certification.certified
      ? ["Replay reconstructed historical recommendation state exactly from immutable snapshots."]
      : ["Replay failed closed rather than approximate historical constitutional truth."]),
    deterministicHash: hashReplayValue("deterministic-replay-output", {
      replayHash,
      graphHash: dependencyGraph.graphHash,
      lineageHash: lineage.lineageHash,
      metricsHash: metrics.metricsHash,
      certificationHash: certification.certificationHash,
      errorCodes: errors.map((error) => error.code),
    }),
    derivedOnly: true as const,
  });
}

export const buildDeterministicReplayEngine = buildDeterministicDecisionReplay;
