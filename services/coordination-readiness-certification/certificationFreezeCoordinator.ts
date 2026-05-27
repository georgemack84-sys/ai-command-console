import type { CoordinationReadinessCertificationState } from "@/types/coordination-readiness-certification";

export function shouldFreezeCertification(input: {
  certificationState: CoordinationReadinessCertificationState;
  inheritedBoundaryFailClosed: boolean;
  inheritedContainmentState: string;
}): boolean {
  return input.certificationState === "FAIL_CLOSED"
    || input.inheritedBoundaryFailClosed
    || input.inheritedContainmentState === "frozen"
    || input.inheritedContainmentState === "blocked"
    || input.inheritedContainmentState === "disputed";
}
