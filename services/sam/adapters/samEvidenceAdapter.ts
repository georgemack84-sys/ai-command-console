import { buildRecoveryEvidenceBundle } from "../../recovery/recoveryEvidenceBuilder";

export async function loadSamEvidenceState({
  db,
  executionId,
  nowMs,
}: {
  db?: unknown;
  executionId: string;
  nowMs?: number;
}) {
  try {
    const result = await buildRecoveryEvidenceBundle({ db, executionId, nowMs });
    if (!result.ok) {
      return {
        evidenceValid: false,
        disputedState: true,
        source: "3.5D",
        reason: "SAM_EVIDENCE_INVALID",
      };
    }

    const disputed = result.data.state === "disputed" || result.data.integrity.matchesReadModel !== true;
    return {
      evidenceValid: !disputed,
      disputedState: disputed,
      evidence: result.data,
      source: "3.5D",
      reason: disputed ? "SAM_EVIDENCE_INVALID" : undefined,
    };
  } catch {
    return {
      evidenceValid: false,
      disputedState: true,
      source: "3.5D",
      reason: "SAM_ADAPTER_FAILED",
    };
  }
}
