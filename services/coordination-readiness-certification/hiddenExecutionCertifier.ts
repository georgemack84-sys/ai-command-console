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

const EXECUTION_MARKERS = Object.freeze([
  "execute",
  "dispatch",
  "continueworkflow",
  "spawnworkflow",
  "sideeffect",
]);

const SCHEDULING_MARKERS = Object.freeze([
  "schedule",
  "scheduler",
  "retry",
  "hiddenretry",
  "silentretry",
]);

export function certifyHiddenExecutionAbsence(input: CoordinationReadinessCertificationInput): {
  clean: boolean;
  violations: readonly CoordinationReadinessViolation[];
  errors: readonly CoordinationReadinessCertificationError[];
} {
  const serialized = JSON.stringify(input.metadata ?? {}).toLowerCase();
  const errors: CoordinationReadinessCertificationError[] = [];
  const violations: CoordinationReadinessViolation[] = [];

  if (EXECUTION_MARKERS.some((marker) => serialized.includes(marker))) {
    errors.push(error(
      "COORDINATION_READINESS_HIDDEN_EXECUTION",
      "Hidden execution or workflow continuation semantics were detected.",
      "metadata",
    ));
    violations.push(Object.freeze({
      violationId: hashCoordinationReplayValue("coordination-readiness-execution-violation-id", {
        certificationId: input.certificationId,
        coordinationId: input.coordinationRecord.coordinationId,
        createdAt: input.createdAt,
      }),
      certificationId: input.certificationId,
      coordinationId: input.coordinationRecord.coordinationId,
      domain: "execution",
      severity: "critical",
      createdAt: input.createdAt,
      deterministicHash: hashCoordinationReplayValue("coordination-readiness-execution-violation", serialized),
    }));
  }
  if (SCHEDULING_MARKERS.some((marker) => serialized.includes(marker))) {
    errors.push(error(
      "COORDINATION_READINESS_HIDDEN_SCHEDULING",
      "Hidden scheduling or retry semantics were detected.",
      "metadata",
    ));
  }
  if (serialized.includes("mutateruntime")) {
    errors.push(error(
      "COORDINATION_READINESS_RUNTIME_MUTATION",
      "Runtime mutation markers are forbidden during readiness certification.",
      "metadata",
    ));
  }

  return Object.freeze({
    clean: errors.length === 0,
    violations: Object.freeze(violations),
    errors: Object.freeze(errors),
  });
}
