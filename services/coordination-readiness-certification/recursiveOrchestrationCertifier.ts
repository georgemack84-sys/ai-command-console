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

export function certifyRecursiveOrchestrationAbsence(input: CoordinationReadinessCertificationInput): {
  recursive: boolean;
  violations: readonly CoordinationReadinessViolation[];
  errors: readonly CoordinationReadinessCertificationError[];
} {
  const serialized = JSON.stringify(input.metadata ?? {}).toLowerCase();
  const recursive =
    serialized.includes("recursiveworkflow")
    || serialized.includes("recursiveorchestration")
    || input.orchestrationRecord.validation.recursiveDelegation.recursive
    || input.boundaryResult.violations.some((item) => item.violationType === "RECURSIVE_ORCHESTRATION");
  const errors: CoordinationReadinessCertificationError[] = [];
  const violations: CoordinationReadinessViolation[] = [];

  if (recursive) {
    errors.push(error(
      "COORDINATION_READINESS_RECURSIVE_ORCHESTRATION",
      "Recursive orchestration or workflow ancestry was detected.",
      "metadata",
    ));
    violations.push(Object.freeze({
      violationId: hashCoordinationReplayValue("coordination-readiness-recursive-violation-id", {
        certificationId: input.certificationId,
        coordinationId: input.coordinationRecord.coordinationId,
        createdAt: input.createdAt,
      }),
      certificationId: input.certificationId,
      coordinationId: input.coordinationRecord.coordinationId,
      domain: "orchestration",
      severity: "critical",
      createdAt: input.createdAt,
      deterministicHash: hashCoordinationReplayValue("coordination-readiness-recursive-violation", serialized),
    }));
  }
  if (serialized.includes("synthesizetopology")) {
    errors.push(error(
      "COORDINATION_READINESS_TOPOLOGY_SYNTHESIS",
      "Topology synthesis markers are forbidden during readiness certification.",
      "metadata",
    ));
  }

  return Object.freeze({
    recursive,
    violations: Object.freeze(violations),
    errors: Object.freeze(errors),
  });
}
