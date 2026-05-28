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

export function validateApprovalTraceability(input: CoordinationReadinessCertificationInput): {
  traceable: boolean;
  violations: readonly CoordinationReadinessViolation[];
  errors: readonly CoordinationReadinessCertificationError[];
} {
  const approval = input.coordinationReplay.approval;
  const traceable =
    approval.valid
    && approval.explicit
    && approval.status === "approved"
    && input.routingResult.allowed;
  const errors: CoordinationReadinessCertificationError[] = [];
  const violations: CoordinationReadinessViolation[] = [];

  if (!traceable) {
    errors.push(error(
      "COORDINATION_READINESS_APPROVAL_TRACEABILITY",
      "Approval ancestry or routing traceability was incomplete.",
      "coordinationReplay.approval",
    ));
    violations.push(Object.freeze({
      violationId: hashCoordinationReplayValue("coordination-readiness-approval-violation-id", {
        certificationId: input.certificationId,
        coordinationId: input.coordinationRecord.coordinationId,
        createdAt: input.createdAt,
      }),
      certificationId: input.certificationId,
      coordinationId: input.coordinationRecord.coordinationId,
      domain: "approval",
      severity: "high",
      createdAt: input.createdAt,
      deterministicHash: hashCoordinationReplayValue("coordination-readiness-approval-violation", approval.chronologyHash),
    }));
  }

  return Object.freeze({
    traceable,
    violations: Object.freeze(violations),
    errors: Object.freeze(errors),
  });
}
