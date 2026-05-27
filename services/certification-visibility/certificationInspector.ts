import type {
  CertificationInspection,
  CoordinationReadinessCertificationState,
} from "@/types/coordination-readiness-certification";
import { hashCoordinationReplayValue } from "@/services/coordination-replay/replayHashEngine";

export function inspectCertification(input: {
  certificationId: string;
  coordinationId: string;
  certificationState: CoordinationReadinessCertificationState;
  verdicts: readonly string[];
}): CertificationInspection {
  const base = Object.freeze({
    certificationId: input.certificationId,
    coordinationId: input.coordinationId,
    certificationState: input.certificationState,
    verdicts: Object.freeze([...input.verdicts]),
  });
  return Object.freeze({
    ...base,
    inspectionHash: hashCoordinationReplayValue("coordination-readiness-certification-inspection", base),
  });
}
