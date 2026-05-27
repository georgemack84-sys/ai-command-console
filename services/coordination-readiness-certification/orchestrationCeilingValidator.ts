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

export function validateOrchestrationCeiling(input: CoordinationReadinessCertificationInput): {
  bounded: boolean;
  violations: readonly CoordinationReadinessViolation[];
  errors: readonly CoordinationReadinessCertificationError[];
} {
  const orchestration = input.orchestrationRecord;
  const bounded =
    orchestration.containment.ceilingLevel === orchestration.ceiling
    && orchestration.validation.valid
    && !orchestration.validation.failClosed
    && orchestration.isolation.isolated;
  const errors: CoordinationReadinessCertificationError[] = [];
  const violations: CoordinationReadinessViolation[] = [];

  if (!bounded) {
    errors.push(error(
      "COORDINATION_READINESS_ORCHESTRATION_CEILING",
      "Orchestration ceiling, isolation, or bounded validation failed readiness certification.",
      "orchestrationRecord",
    ));
    violations.push(Object.freeze({
      violationId: hashCoordinationReplayValue("coordination-readiness-orchestration-violation-id", {
        certificationId: input.certificationId,
        coordinationId: input.coordinationRecord.coordinationId,
        createdAt: input.createdAt,
      }),
      certificationId: input.certificationId,
      coordinationId: input.coordinationRecord.coordinationId,
      domain: "orchestration",
      severity: "critical",
      createdAt: input.createdAt,
      deterministicHash: hashCoordinationReplayValue("coordination-readiness-orchestration-violation", orchestration.deterministicHash),
    }));
  }

  return Object.freeze({
    bounded,
    violations: Object.freeze(violations),
    errors: Object.freeze(errors),
  });
}
