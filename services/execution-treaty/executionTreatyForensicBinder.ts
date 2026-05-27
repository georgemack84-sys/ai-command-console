import { buildForensicTimeline } from "@/services/enforcement-test-harness";
import type { FailureOrchestrationInput, FailureOrchestrationResult } from "@/services/failure-orchestration";
import { hashExecutionTreatyValue } from "./executionTreatyHasher";

export function bindTreatyForensics(input: {
  scenarioId: string;
  failureInput: FailureOrchestrationInput;
  failureResult: FailureOrchestrationResult;
  adversarialCertificationHash: string;
}): {
  forensicReplayHash: string;
  forensicTimelineHash: string;
  adversarialCertificationHash: string;
} {
  const timeline = buildForensicTimeline(input.scenarioId, input.failureInput, input.failureResult);
  return {
    forensicReplayHash: hashExecutionTreatyValue("forensic-replay", {
      scenarioId: input.scenarioId,
      timelineHash: timeline.timelineHash,
      decisionHash: input.failureResult.decisionHash,
    }),
    forensicTimelineHash: timeline.timelineHash,
    adversarialCertificationHash: input.adversarialCertificationHash,
  };
}
