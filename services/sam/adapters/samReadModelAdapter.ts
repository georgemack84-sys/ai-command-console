import { buildRecoveryReadModel } from "../../recovery/recoveryReadModel";

export async function loadSamReadModelState({
  db,
  executionId,
  nowMs,
}: {
  db?: unknown;
  executionId: string;
  nowMs?: number;
}) {
  try {
    const result = await buildRecoveryReadModel({ db, executionId, nowMs });
    if (!result.ok) {
      return {
        readModelAvailable: false,
        source: "3.5A",
        reason: "SAM_READ_MODEL_UNAVAILABLE",
      };
    }

    return {
      readModelAvailable: true,
      readModel: result.data,
      source: "3.5A",
    };
  } catch {
    return {
      readModelAvailable: false,
      source: "3.5A",
      reason: "SAM_ADAPTER_FAILED",
    };
  }
}
