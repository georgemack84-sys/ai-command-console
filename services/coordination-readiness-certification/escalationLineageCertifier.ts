import type {
  CoordinationReadinessCertificationError,
  CoordinationReadinessCertificationInput,
  CoordinationReadinessViolation,
} from "@/types/coordination-readiness-certification";
import { hashCoordinationReplayValue } from "@/services/coordination-replay/replayHashEngine";

function error(
  code: CoordinationReadinessCertificationError["code"],
  message: string,
  path?: string,
): CoordinationReadinessCertificationError {
  return Object.freeze({ code, message, path });
}

export function certifyEscalationLineage(input: CoordinationReadinessCertificationInput): {
  escalationLinked: boolean;
  violations: readonly CoordinationReadinessViolation[];
  errors: readonly CoordinationReadinessCertificationError[];
} {
  const errors: CoordinationReadinessCertificationError[] = [];
  const violations: CoordinationReadinessViolation[] = [];
  const escalationLinked =
    input.escalationResult.lineage.entries.length > 0
    && input.escalationResult.record.replaySafe
    && Boolean(input.escalationResult.record.lineageHash);

  if (!escalationLinked) {
    errors.push(error(
      "COORDINATION_READINESS_ESCALATION_LINEAGE",
      "Escalation lineage was incomplete or not replay-safe.",
      "escalationResult.lineage",
    ));
    violations.push(Object.freeze({
      violationId: hashCoordinationReplayValue("coordination-readiness-escalation-violation-id", {
        certificationId: input.certificationId,
        coordinationId: input.coordinationRecord.coordinationId,
        createdAt: input.createdAt,
      }),
      certificationId: input.certificationId,
      coordinationId: input.coordinationRecord.coordinationId,
      domain: "escalation",
      severity: "high",
      createdAt: input.createdAt,
      deterministicHash: hashCoordinationReplayValue("coordination-readiness-escalation-violation", input.escalationResult.record.lineageHash),
    }));
  }

  return Object.freeze({
    escalationLinked,
    violations: Object.freeze(violations),
    errors: Object.freeze(errors),
  });
}
