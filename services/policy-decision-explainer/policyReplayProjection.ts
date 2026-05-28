import type { StepTraceView } from "@/types/step-trace-viewer";
import type { PolicyDecisionExplainerError, PolicyReplayView } from "@/types/policy-decision-explainer";

export function projectPolicyReplayReasoning(input: {
  traceView: StepTraceView;
}): { reasoning: PolicyReplayView; warnings: readonly string[]; errors: readonly PolicyDecisionExplainerError[] } {
  const warnings: string[] = [];
  const errors: PolicyDecisionExplainerError[] = [];
  const replay = input.traceView.replayView;

  if (!replay) {
    errors.push({
      code: "POLICY_REPLAY_REASONING_UNAVAILABLE",
      message: "policy replay reasoning is unavailable",
      path: "traceView.replayView",
    });
    return {
      reasoning: Object.freeze({
        replayMismatch: false,
        governanceReplayWarnings: Object.freeze([]),
        divergenceFlags: Object.freeze([]),
        unavailable: true,
      }),
      warnings: Object.freeze(warnings),
      errors: Object.freeze(errors),
    };
  }

  const divergenceFlags = [
    replay.replayDivergence ? "replay-divergence" : undefined,
    replay.stateMismatch ? "state-mismatch" : undefined,
    replay.lineageMismatch ? "lineage-mismatch" : undefined,
  ].filter((value): value is string => Boolean(value));

  return {
    reasoning: Object.freeze({
      replaySource: replay.replaySource,
      replayHash: replay.replayHash,
      replayMismatch: replay.replayDivergence || replay.stateMismatch || replay.lineageMismatch,
      governanceReplayWarnings: Object.freeze([...replay.warnings]),
      divergenceFlags: Object.freeze(divergenceFlags),
      unavailable: false,
    }),
    warnings: Object.freeze(warnings),
    errors: Object.freeze(errors),
  };
}
