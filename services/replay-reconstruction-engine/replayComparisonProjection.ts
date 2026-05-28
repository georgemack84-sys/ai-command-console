import { buildPlanDiffInspection } from "@/services/plan-diff-inspector";
import type { PolicyDecisionExplanation } from "@/types/policy-decision-explainer";
import type { StepTraceView } from "@/types/step-trace-viewer";
import type { ExecutionTreatyPackage } from "@/types/execution-treaty";
import type { ValidationPipelineOutput } from "@/services/validation-core";
import type { ReplayComparisonView } from "@/types/replay-reconstruction-engine";
import { hashReplayValue } from "./replayHasher";

export function projectReplayComparison(input: {
  treaty: ExecutionTreatyPackage;
  validation: ValidationPipelineOutput;
  traceView?: StepTraceView;
  policyExplanation?: PolicyDecisionExplanation;
  comparisonArtifact?: unknown;
}): ReplayComparisonView {
  const historicalArtifact = Object.freeze({
    treatyId: input.treaty.manifest.treatyId,
    replaySnapshotHash: input.treaty.manifest.replaySnapshotHash,
    replayBindingHash: input.treaty.manifest.replayBindingHash,
    registrySnapshotHash: input.treaty.manifest.registrySnapshotHash,
    governanceSnapshotHash: input.treaty.manifest.governanceSnapshotHash,
    approvalChainHash: input.treaty.manifest.approvalChainHash,
    validationStatus: input.validation.result.status,
    validatorHashes: Object.freeze(
      Object.values(input.validation.result.validators).map((validator) => ({
        validator: validator.validator,
        hash: validator.hash,
      })),
    ),
    traceViewSummary: input.traceView
      ? Object.freeze({
          traceProjectionHash: input.traceView.traceProjectionHash,
          replayView: input.traceView.replayView,
          dependencyGraph: input.traceView.dependencyGraph,
        })
      : undefined,
    policyReplay: input.policyExplanation?.replayExplanation,
  });

  const diff = buildPlanDiffInspection({
    baseArtifact: historicalArtifact,
    targetArtifact: input.comparisonArtifact ?? historicalArtifact,
    comparisonMode: input.comparisonArtifact ? "PLAN_TO_REPLAY" : "PLAN_TO_PLAN",
    sourceRefs: Object.freeze([
      "execution-treaty",
      "validation-core",
      "step-trace-viewer",
      "policy-decision-explainer",
    ]),
  });

  return Object.freeze({
    comparisonMode: input.comparisonArtifact ? "PLAN_TO_REPLAY" : "REPLAY_TO_REPLAY",
    comparisonHash: hashReplayValue("replay-comparison", {
      inspectionId: diff.inspectionId,
      deterministicHash: diff.deterministicHash,
      result: diff.result,
    }),
    comparisonResult: diff.result,
    changedPaths: Object.freeze([...diff.artifactDiff.changedPaths]),
    warnings: Object.freeze([...diff.warnings]),
    errors: Object.freeze([...diff.errors]),
  });
}
