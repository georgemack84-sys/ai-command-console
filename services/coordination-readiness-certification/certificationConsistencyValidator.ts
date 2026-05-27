import type {
  CoordinationReadinessCertificationError,
  CoordinationReadinessCertificationInput,
} from "@/types/coordination-readiness-certification";

function error(
  code: CoordinationReadinessCertificationError["code"],
  message: string,
  path?: string,
): CoordinationReadinessCertificationError {
  return Object.freeze({ code, message, path });
}

export function validateCertificationConsistency(
  input: CoordinationReadinessCertificationInput,
): readonly CoordinationReadinessCertificationError[] {
  const errors: CoordinationReadinessCertificationError[] = [];
  const serialized = JSON.stringify(input.metadata ?? {}).toLowerCase();

  if (input.boundaryResult.record.failClosed) {
    errors.push(error(
      "COORDINATION_READINESS_BOUNDARY_VIOLATION",
      "Boundary enforcement fail-closed state cascades into readiness certification.",
      "boundaryResult.record.failClosed",
    ));
  }
  if (input.overrideResult.record.failClosed) {
    errors.push(error(
      "COORDINATION_READINESS_FAIL_CLOSED",
      "Human override fail-closed state cascades into readiness certification.",
      "overrideResult.record.failClosed",
    ));
  }
  if (serialized.includes("restorerouting") || serialized.includes("routingrestoration")) {
    errors.push(error(
      "COORDINATION_READINESS_ROUTING_RESTORATION",
      "Routing restoration markers are forbidden during readiness certification.",
      "metadata",
    ));
  }
  if (serialized.includes("mutatechronology")) {
    errors.push(error(
      "COORDINATION_READINESS_CHRONOLOGY_MUTATION",
      "Chronology mutation markers are forbidden during readiness certification.",
      "metadata",
    ));
  }

  return Object.freeze(errors);
}
