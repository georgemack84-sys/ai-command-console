import type { ExecutionTreatyPackage } from "@/types/execution-treaty";
import { buildValidationTimeline } from "./validationTimelineBuilder";
import type { ValidationDebugEvent } from "@/types/validation-core";

export function buildReplaySafeValidationTimeline(input: {
  treaty: ExecutionTreatyPackage;
  validationId: string;
  events: readonly ValidationDebugEvent[];
  generatedAt: string;
  reconstructedStateHash: string;
}): ReturnType<typeof buildValidationTimeline> {
  if (!input.treaty.manifest.replaySnapshotHash || !input.treaty.manifest.replayBindingHash) {
    return {
      failures: [{
        code: "VALIDATION_REPLAY_INVALID",
        message: "replay-safe timeline requires frozen replay lineage",
        path: "manifest.replaySnapshotHash",
      }],
    };
  }

  return buildValidationTimeline({
    validationId: input.validationId,
    events: input.events,
    generatedAt: input.generatedAt,
    reconstructedStateHash: input.reconstructedStateHash,
  });
}
