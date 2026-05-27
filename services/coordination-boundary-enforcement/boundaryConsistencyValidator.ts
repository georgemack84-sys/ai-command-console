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

export function validateBoundaryConsistency(input: CoordinationBoundaryInput): {
  violations: readonly BoundaryViolation[];
  errors: readonly CoordinationBoundaryError[];
} {
  const errors: CoordinationBoundaryError[] = [];
  const violations: BoundaryViolation[] = [];
  const serialized = JSON.stringify(input.metadata ?? {}).toLowerCase();

  if (input.coordinationReplay.state === "fail_closed" || input.coordinationReplay.errors.some((item) => item.code.includes("LINEAGE") || item.code.includes("AMBIGUITY"))) {
    errors.push(error(
      "COORDINATION_BOUNDARY_REPLAY_LINEAGE_BREAK",
      "Replay lineage was ambiguous or corrupted for boundary enforcement.",
      "coordinationReplay",
    ));
    violations.push(Object.freeze({
      violationId: hashCoordinationReplayValue("boundary-replay-break-violation-id", {
        coordinationId: input.coordinationRecord.coordinationId,
        createdAt: input.createdAt,
      }),
      coordinationId: input.coordinationRecord.coordinationId,
      violationType: "REPLAY_LINEAGE_BREAK",
      severity: "critical",
      governanceLinked: true,
      replaySafe: false,
      createdAt: input.createdAt,
      deterministicHash: hashCoordinationReplayValue("boundary-replay-break-violation", input.coordinationReplay.state),
    }));
  }

  if (input.overrideResult.lineage.entries.length === 0) {
    errors.push(error(
      "COORDINATION_BOUNDARY_ROUTING_RESTORATION",
      "Boundary enforcement requires immutable override lineage and cannot restore routing implicitly.",
      "overrideResult.lineage.entries",
    ));
  }

  if (serialized.includes("mutatechronology") || serialized.includes("replaymutation")) {
    errors.push(error(
      "COORDINATION_BOUNDARY_CHRONOLOGY_MUTATION",
      "Chronology or replay mutation markers were detected.",
      "metadata",
    ));
  }

  if (serialized.includes("restorerouting") || serialized.includes("resume")) {
    errors.push(error(
      "COORDINATION_BOUNDARY_ROUTING_RESTORATION",
      "Routing restoration or resume markers are forbidden.",
      "metadata",
    ));
  }

  if (serialized.includes("synthesizetopology")) {
    errors.push(error(
      "COORDINATION_BOUNDARY_TOPOLOGY_SYNTHESIS",
      "Topology synthesis markers are forbidden.",
      "metadata",
    ));
  }

  if (input.overrideResult.record.failClosed || input.escalationResult.record.failClosed) {
    errors.push(error(
      "COORDINATION_BOUNDARY_FAIL_CLOSED",
      "Upstream fail-closed state cascades into boundary enforcement.",
      "upstream.failClosed",
    ));
  }

  return Object.freeze({
    violations: Object.freeze(violations),
    errors: Object.freeze(errors),
  });
}
