import {
  RECOVERY_EVIDENCE_ERRORS,
  RECOVERY_EVIDENCE_HASH_ALGORITHM,
  RECOVERY_EVIDENCE_VERSION,
  RECOVERY_EVIDENCE_WARNINGS,
} from "../../constants/recoveryEvidence.constants";
import type { RecoveryEvidenceBundle, RecoveryEvidenceResult } from "../../types/recoveryEvidence";
import { buildRecoveryReadModel } from "./recoveryReadModel";
import { buildRecoveryTimeline } from "./recoveryTimelineBuilder";
import { hashRecoveryEvidence } from "./recoveryEvidenceHasher";

function failClosed(): RecoveryEvidenceResult {
  return {
    ok: false,
    error: RECOVERY_EVIDENCE_ERRORS.BLOCKED_UNSAFE_EVIDENCE_EXPORT,
  };
}

function success(data: RecoveryEvidenceBundle): RecoveryEvidenceResult {
  return { ok: true, data };
}

function dedupeWarnings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function eventsForSource(bundleSource: RecoveryEvidenceBundle["timeline"]["events"], source: string) {
  return bundleSource.filter((event) => event.source === source);
}

function buildSections(readModel: RecoveryEvidenceBundle["readModel"], timeline: RecoveryEvidenceBundle["timeline"]) {
  return {
    execution: {
      ...readModel.execution,
      supportingEvents: eventsForSource(timeline.events, "execution"),
    },
    recovery: {
      ...readModel.recovery,
      supportingEvents: eventsForSource(timeline.events, "recovery"),
    },
    control: {
      ...readModel.recoveryControl,
      supportingEvents: eventsForSource(timeline.events, "control"),
    },
    advisory: {
      ...readModel.advisory,
      supportingEvents: eventsForSource(timeline.events, "advisory"),
    },
    automation: {
      ...readModel.automation,
      supportingEvents: eventsForSource(timeline.events, "automation"),
    },
    autonomy: {
      ...readModel.autonomy,
      supportingEvents: eventsForSource(timeline.events, "autonomy"),
    },
    verification: {
      ...readModel.verification,
      supportingEvents: eventsForSource(timeline.events, "verification"),
    },
    learning: {
      ...readModel.learning,
      supportingEvents: eventsForSource(timeline.events, "learning"),
    },
    lock: {
      ...readModel.lock,
      supportingEvents: eventsForSource(timeline.events, "lock"),
    },
    ledger: {
      ...readModel.ledger,
      supportingEvents: eventsForSource(timeline.events, "ledger"),
    },
  };
}

export async function buildRecoveryEvidenceBundle({
  db,
  executionId,
  nowMs,
}: {
  db?: unknown;
  executionId: string;
  nowMs?: number;
}): Promise<RecoveryEvidenceResult> {
  try {
    const normalizedExecutionId = String(executionId || "").trim();
    if (!normalizedExecutionId) {
      return failClosed();
    }

    const readModelResult = await buildRecoveryReadModel({
      db,
      executionId: normalizedExecutionId,
      nowMs,
    });
    if (!readModelResult.ok) {
      return failClosed();
    }

    const timelineResult = await buildRecoveryTimeline({
      db,
      executionId: normalizedExecutionId,
      nowMs,
    });
    if (!timelineResult.ok) {
      return failClosed();
    }

    const state = timelineResult.data.meta.matchesReadModel ? "normal" : "disputed";
    const warnings = dedupeWarnings([
      ...readModelResult.data.meta.warnings,
      ...timelineResult.data.meta.warnings,
      ...(state === "disputed"
        ? [
            RECOVERY_EVIDENCE_WARNINGS.TIMELINE_STATE_MISMATCH,
            RECOVERY_EVIDENCE_WARNINGS.OPERATOR_ACTIONS_RESTRICTED,
          ]
        : []),
    ]);

    const bundle: RecoveryEvidenceBundle = {
      executionId: normalizedExecutionId,
      readModel: readModelResult.data,
      timeline: timelineResult.data,
      state,
      sections: buildSections(readModelResult.data, timelineResult.data),
      integrity: {
        hash: "",
        algorithm: RECOVERY_EVIDENCE_HASH_ALGORITHM,
        matchesReadModel: timelineResult.data.meta.matchesReadModel,
      },
      meta: {
        completeness:
          state === "disputed"
          || readModelResult.data.meta.completeness === "partial"
          || timelineResult.data.meta.completeness === "partial"
            ? "partial"
            : "complete",
        warnings,
        version: RECOVERY_EVIDENCE_VERSION,
      },
    };

    bundle.integrity.hash = hashRecoveryEvidence(bundle);
    return success(bundle);
  } catch {
    return failClosed();
  }
}

