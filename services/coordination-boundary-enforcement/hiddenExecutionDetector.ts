import type {
  BoundaryViolation,
  CoordinationBoundaryError,
  CoordinationBoundaryInput,
} from "@/types/coordination-boundary-enforcement";
import { hashCoordinationReplayValue } from "@/services/coordination-replay/replayHashEngine";

function error(
  code: CoordinationBoundaryError["code"],
  message: string,
  path?: string,
): CoordinationBoundaryError {
  return Object.freeze({ code, message, path });
}

const EXECUTION_MARKERS = Object.freeze([
  "execute",
  "dispatch",
  "invokecmd",
  "command",
  "remediate",
  "sideeffect",
  "continueworkflow",
  "spawnworkflow",
  "mutateruntime",
]);

const SCHEDULING_MARKERS = Object.freeze([
  "schedule",
  "scheduler",
  "cron",
  "retry",
  "hiddenretry",
  "retryloop",
]);

export function detectHiddenExecution(input: CoordinationBoundaryInput): {
  violations: readonly BoundaryViolation[];
  errors: readonly CoordinationBoundaryError[];
} {
  const serialized = JSON.stringify(input.metadata ?? {}).toLowerCase();
  const violations: BoundaryViolation[] = [];
  const errors: CoordinationBoundaryError[] = [];

  if (EXECUTION_MARKERS.some((marker) => serialized.includes(marker))) {
    errors.push(error(
      "COORDINATION_BOUNDARY_EXECUTION_SEMANTICS",
      "Coordination metadata contained execution-like or continuation semantics.",
      "metadata",
    ));
    violations.push(Object.freeze({
      violationId: hashCoordinationReplayValue("boundary-execution-violation", {
        coordinationId: input.coordinationRecord.coordinationId,
        createdAt: input.createdAt,
      }),
      coordinationId: input.coordinationRecord.coordinationId,
      violationType: "COORDINATION_BECAME_EXECUTION",
      severity: "critical",
      governanceLinked: true,
      replaySafe: true,
      createdAt: input.createdAt,
      deterministicHash: hashCoordinationReplayValue("boundary-execution-violation-hash", serialized),
    }));
  }

  if (SCHEDULING_MARKERS.some((marker) => serialized.includes(marker))) {
    errors.push(error(
      "COORDINATION_BOUNDARY_HIDDEN_SCHEDULING",
      "Coordination metadata contained hidden scheduling or retry semantics.",
      "metadata",
    ));
    violations.push(Object.freeze({
      violationId: hashCoordinationReplayValue("boundary-scheduling-violation", {
        coordinationId: input.coordinationRecord.coordinationId,
        createdAt: input.createdAt,
      }),
      coordinationId: input.coordinationRecord.coordinationId,
      violationType: "HIDDEN_SCHEDULING",
      severity: "critical",
      governanceLinked: true,
      replaySafe: true,
      createdAt: input.createdAt,
      deterministicHash: hashCoordinationReplayValue("boundary-scheduling-violation-hash", serialized),
    }));
  }

  return Object.freeze({
    violations: Object.freeze(violations),
    errors: Object.freeze(errors),
  });
}
