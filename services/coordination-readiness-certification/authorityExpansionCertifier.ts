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

export function certifyAuthorityExpansionAbsence(input: CoordinationReadinessCertificationInput): {
  expanded: boolean;
  violations: readonly CoordinationReadinessViolation[];
  errors: readonly CoordinationReadinessCertificationError[];
} {
  const serialized = JSON.stringify(input.metadata ?? {}).toLowerCase();
  const expanded =
    serialized.includes("authorityinheritance")
    || serialized.includes("approvalinheritance")
    || serialized.includes("dynamiccapability")
    || input.boundaryResult.violations.some((item) => item.violationType === "AUTHORITY_EXPANSION");
  const errors: CoordinationReadinessCertificationError[] = [];
  const violations: CoordinationReadinessViolation[] = [];

  if (expanded) {
    errors.push(error(
      "COORDINATION_READINESS_AUTHORITY_EXPANSION",
      "Authority expansion or inheritance markers were detected.",
      "metadata",
    ));
    violations.push(Object.freeze({
      violationId: hashCoordinationReplayValue("coordination-readiness-authority-violation-id", {
        certificationId: input.certificationId,
        coordinationId: input.coordinationRecord.coordinationId,
        createdAt: input.createdAt,
      }),
      certificationId: input.certificationId,
      coordinationId: input.coordinationRecord.coordinationId,
      domain: "authority",
      severity: "critical",
      createdAt: input.createdAt,
      deterministicHash: hashCoordinationReplayValue("coordination-readiness-authority-violation", serialized),
    }));
  }

  return Object.freeze({
    expanded,
    violations: Object.freeze(violations),
    errors: Object.freeze(errors),
  });
}
