import type {
  BoundaryViolation,
  CoordinationBoundaryError,
  CoordinationBoundaryInput,
  OrchestrationDriftType,
} from "@/types/coordination-boundary-enforcement";
import { hashCoordinationReplayValue } from "@/services/coordination-replay/replayHashEngine";

function error(
  code: CoordinationBoundaryError["code"],
  message: string,
  path?: string,
): CoordinationBoundaryError {
  return Object.freeze({ code, message, path });
}

function driftViolation(input: {
  boundaryInput: CoordinationBoundaryInput;
  driftType: OrchestrationDriftType;
}): BoundaryViolation {
  return Object.freeze({
    violationId: hashCoordinationReplayValue("boundary-drift-violation-id", {
      coordinationId: input.boundaryInput.coordinationRecord.coordinationId,
      driftType: input.driftType,
      createdAt: input.boundaryInput.createdAt,
    }),
    coordinationId: input.boundaryInput.coordinationRecord.coordinationId,
    violationType: "ORCHESTRATION_BOUNDARY_DRIFT",
    driftType: input.driftType,
    severity: "high",
    governanceLinked: true,
    replaySafe: true,
    createdAt: input.boundaryInput.createdAt,
    deterministicHash: hashCoordinationReplayValue("boundary-drift-violation", input.driftType),
  });
}

export function detectOrchestrationDrift(input: CoordinationBoundaryInput): {
  driftTypes: readonly OrchestrationDriftType[];
  violations: readonly BoundaryViolation[];
  errors: readonly CoordinationBoundaryError[];
} {
  const driftTypes: OrchestrationDriftType[] = [];
  const violations: BoundaryViolation[] = [];
  const errors: CoordinationBoundaryError[] = [];

  if (input.coordinationRecord.governanceSnapshotId !== input.orchestrationRecord.governanceSnapshotId) {
    driftTypes.push("GOVERNANCE_DRIFT");
  }
  if (input.coordinationRecord.replaySnapshotId !== input.orchestrationRecord.replaySnapshotId) {
    driftTypes.push("REPLAY_DRIFT");
  }
  if (input.routingResult.target === "coordination_hold" && input.orchestrationRecord.containment.inheritedState === "safe") {
    driftTypes.push("ROUTE_DRIFT");
  }
  if (input.orchestrationRecord.containment.ceilingLevel !== input.orchestrationRecord.ceiling) {
    driftTypes.push("CEILING_DRIFT");
  }
  if (input.orchestrationRecord.isolation.leakage.length > 0) {
    driftTypes.push("SCOPE_DRIFT");
  }
  const serialized = JSON.stringify(input.metadata ?? {}).toLowerCase();
  if (serialized.includes("topologydrift") || serialized.includes("drifttopology")) {
    driftTypes.push("TOPOLOGY_DRIFT");
  }
  if (serialized.includes("approvaldrift")) {
    driftTypes.push("APPROVAL_DRIFT");
  }

  const uniqueDriftTypes = Object.freeze([...new Set(driftTypes)]);
  if (uniqueDriftTypes.length > 0) {
    errors.push(error(
      "COORDINATION_BOUNDARY_ORCHESTRATION_DRIFT",
      "Orchestration boundary drift was detected across coordination lineage.",
      "orchestrationRecord",
    ));
    for (const driftType of uniqueDriftTypes) {
      violations.push(driftViolation({
        boundaryInput: input,
        driftType,
      }));
    }
  }

  return Object.freeze({
    driftTypes: uniqueDriftTypes,
    violations: Object.freeze(violations),
    errors: Object.freeze(errors),
  });
}
