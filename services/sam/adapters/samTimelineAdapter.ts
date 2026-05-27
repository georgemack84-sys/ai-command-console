import { buildRecoveryTimeline } from "../../recovery/recoveryTimelineBuilder";

export async function loadSamTimelineState({
  db,
  executionId,
  nowMs,
}: {
  db?: unknown;
  executionId: string;
  nowMs?: number;
}) {
  try {
    const result = await buildRecoveryTimeline({ db, executionId, nowMs });
    if (!result.ok) {
      return {
        timelineConsistent: false,
        disputedState: true,
        source: "3.5B",
        reason: "SAM_ADAPTER_FAILED",
      };
    }

    return {
      timelineConsistent: result.data.meta.matchesReadModel === true,
      disputedState: result.data.meta.matchesReadModel !== true,
      timeline: result.data,
      source: "3.5B",
      reason: result.data.meta.matchesReadModel === true ? undefined : "SAM_TIMELINE_DISPUTED",
    };
  } catch {
    return {
      timelineConsistent: false,
      disputedState: true,
      source: "3.5B",
      reason: "SAM_ADAPTER_FAILED",
    };
  }
}
