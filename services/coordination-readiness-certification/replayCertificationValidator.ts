import type {
  CoordinationReadinessCertificationError,
  CoordinationReadinessCertificationInput,
  CoordinationReadinessViolation,
} from "@/types/coordination-readiness-certification";
import { assessReplayDeterminism } from "@/services/replay/replayDeterminism";
import { hashCoordinationReplayValue } from "@/services/coordination-replay/replayHashEngine";

function error(
  code: CoordinationReadinessCertificationError["code"],
  message: string,
  path?: string,
): CoordinationReadinessCertificationError {
  return Object.freeze({ code, message, path });
}

function violation(input: {
  certificationId: string;
  coordinationId: string;
  createdAt: string;
}): CoordinationReadinessViolation {
  return Object.freeze({
    violationId: hashCoordinationReplayValue("coordination-readiness-replay-violation-id", input),
    certificationId: input.certificationId,
    coordinationId: input.coordinationId,
    domain: "replay",
    severity: "critical",
    createdAt: input.createdAt,
    deterministicHash: hashCoordinationReplayValue("coordination-readiness-replay-violation", input),
  });
}

export function validateReplayCertification(input: CoordinationReadinessCertificationInput): {
  replayDeterministic: boolean;
  violations: readonly CoordinationReadinessViolation[];
  errors: readonly CoordinationReadinessCertificationError[];
} {
  const determinism = assessReplayDeterminism({
    ledgerEvents: input.coordinationReplay.ledger.entries.map((entry, index) => ({
      ledgerIndex: index,
      entryId: entry.entryId,
      createdAt: entry.createdAt,
    })),
    continuitySnapshots: [
      { replaySnapshotId: input.coordinationReplay.routing.replaySnapshotId },
    ],
    auditEvents: [
      { auditId: input.coordinationReplay.audit.auditId, evidenceHash: input.coordinationReplay.audit.evidenceHash },
    ],
  });
  const errors: CoordinationReadinessCertificationError[] = [];
  const violations: CoordinationReadinessViolation[] = [];
  const serialized = JSON.stringify(input.metadata ?? {}).toLowerCase();

  if (!determinism.deterministic || input.coordinationReplay.state === "fail_closed") {
    errors.push(error(
      "COORDINATION_READINESS_REPLAY_AMBIGUITY",
      "Replay determinism or replay state was not certifiable.",
      "coordinationReplay",
    ));
    violations.push(violation({
      certificationId: input.certificationId,
      coordinationId: input.coordinationRecord.coordinationId,
      createdAt: input.createdAt,
    }));
  }
  if (serialized.includes("repairreplay") || serialized.includes("replayrepair")) {
    errors.push(error(
      "COORDINATION_READINESS_REPLAY_REPAIR",
      "Replay repair markers are forbidden during readiness certification.",
      "metadata",
    ));
  }
  if (serialized.includes("replaymutation") || serialized.includes("mutatechronology")) {
    errors.push(error(
      "COORDINATION_READINESS_CHRONOLOGY_MUTATION",
      "Replay or chronology mutation markers are forbidden.",
      "metadata",
    ));
  }

  return Object.freeze({
    replayDeterministic: determinism.deterministic,
    violations: Object.freeze(violations),
    errors: Object.freeze(errors),
  });
}
