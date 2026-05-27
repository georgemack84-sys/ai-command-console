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

export function detectRecursiveWorkflow(input: CoordinationBoundaryInput): {
  recursive: boolean;
  indicators: readonly string[];
  violations: readonly BoundaryViolation[];
  errors: readonly CoordinationBoundaryError[];
} {
  const indicators: string[] = [];
  const errors: CoordinationBoundaryError[] = [];
  const violations: BoundaryViolation[] = [];
  const serialized = JSON.stringify(input.metadata ?? {}).toLowerCase();

  if (serialized.includes("recursiveworkflow") || serialized.includes("recursiveescalation") || serialized.includes("recursiveapproval")) {
    indicators.push("metadata:recursive");
  }
  if (serialized.includes("circular") || serialized.includes("selfexpand")) {
    indicators.push("metadata:circular");
  }
  if (input.orchestrationRecord.validation.recursiveDelegation.recursive) {
    indicators.push("orchestration:recursive-delegation");
  }
  if (input.routingResult.errors.includes("routing:recursive-lineage")) {
    indicators.push("routing:recursive-lineage");
  }

  const recursive = indicators.length > 0;
  if (recursive) {
    errors.push(error(
      "COORDINATION_BOUNDARY_RECURSIVE_ORCHESTRATION",
      "Recursive workflow or orchestration ancestry was detected.",
      "metadata",
    ));
    violations.push(Object.freeze({
      violationId: hashCoordinationReplayValue("boundary-recursive-violation-id", {
        coordinationId: input.coordinationRecord.coordinationId,
        createdAt: input.createdAt,
      }),
      coordinationId: input.coordinationRecord.coordinationId,
      violationType: "RECURSIVE_ORCHESTRATION",
      severity: "critical",
      governanceLinked: true,
      replaySafe: true,
      createdAt: input.createdAt,
      deterministicHash: hashCoordinationReplayValue("boundary-recursive-violation", indicators),
    }));
  }

  return Object.freeze({
    recursive,
    indicators: Object.freeze(indicators),
    violations: Object.freeze(violations),
    errors: Object.freeze(errors),
  });
}
