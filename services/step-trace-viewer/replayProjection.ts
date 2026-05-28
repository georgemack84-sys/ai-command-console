import type { ReplayProjection, TraceViewerError, TraceViewerWarning } from "@/types/step-trace-viewer";
import type { ExecutionTreatyPackage } from "@/types/execution-treaty";
import type { ValidationPipelineOutput } from "@/services/validation-core";
import { hashTraceViewerValue } from "./traceViewHasher";

export function projectReplayView(input: {
  treaty: ExecutionTreatyPackage;
  validation: ValidationPipelineOutput;
}): { projection?: ReplayProjection; warnings: readonly TraceViewerWarning[]; errors: readonly TraceViewerError[] } {
  const replay = input.validation.result.validators.replay;
  const warnings: TraceViewerWarning[] = [];
  const errors: TraceViewerError[] = [];

  if (!input.treaty.manifest.replaySnapshotHash || !input.treaty.manifest.replayBindingHash) {
    errors.push({
      code: "TRACE_REPLAY_UNAVAILABLE",
      message: "replay lineage is unavailable",
      path: "manifest.replaySnapshotHash",
    });
    return { warnings: Object.freeze(warnings), errors: Object.freeze(errors) };
  }

  const replayDivergence = replay.failureCode === "VALIDATION_REPLAY_DIVERGENCE" || replay.status === "disputed";
  const lineageMismatch = replay.failureCode === "VALIDATION_REPLAY_INVALID";
  const stateMismatch = replay.status === "failed" || replay.status === "disputed";
  if (replayDivergence || lineageMismatch) {
    warnings.push({
      code: "trace-replay-warning",
      message: "replay mismatch remains visible",
      path: "validators.replay",
    });
  }

  const projection: ReplayProjection = Object.freeze({
    replaySource: input.treaty.manifest.replaySnapshotHash,
    replayHash: input.treaty.evidence.replayLineageHash,
    replayDivergence,
    stateMismatch,
    lineageMismatch,
    warnings: Object.freeze(
      warnings.map((warning) => warning.message),
    ),
    projectionHash: hashTraceViewerValue("trace-replay-projection", {
      replaySource: input.treaty.manifest.replaySnapshotHash,
      replayHash: input.treaty.evidence.replayLineageHash,
      replayDivergence,
      stateMismatch,
      lineageMismatch,
    }),
  });

  return { projection, warnings: Object.freeze(warnings), errors: Object.freeze(errors) };
}
