import type {
  AuthorityBoundaryCertificationRecord,
  ConstitutionalCertificationError,
  ConstitutionalCertificationInput,
} from "./certificationStateTypes";
import { hashCertificationValue } from "./certificationTraceHasher";

export function certifyAuthorityBoundary(input: ConstitutionalCertificationInput): {
  record: AuthorityBoundaryCertificationRecord;
  errors: readonly ConstitutionalCertificationError[];
} {
  const stable =
    input.constitutionalAuthorityBoundaryResult.record.certificationState === "CERTIFIED"
    || input.constitutionalAuthorityBoundaryResult.record.certificationState === "CONDITIONAL";
  const revoked = input.constitutionalAuthorityBoundaryResult.revocation.revoked;
  const score = stable && !revoked ? 1 : 0.1;
  const errors: ConstitutionalCertificationError[] = [];
  if (!stable || revoked) {
    errors.push({
      code: "CONSTITUTIONAL_CERTIFICATION_AUTHORITY_DRIFT",
      message: "Authority boundary stability could not be certified.",
      path: "constitutionalAuthorityBoundaryResult.record.certificationState",
    });
  }
  return Object.freeze({
    record: Object.freeze({
      boundaryId: input.constitutionalAuthorityBoundaryResult.record.boundaryId,
      stable,
      revoked,
      score,
      deterministicHash: hashCertificationValue("constitutional-certification-authority-boundary", {
        boundaryId: input.constitutionalAuthorityBoundaryResult.record.boundaryId,
        stable,
        revoked,
        score,
      }),
    }),
    errors: Object.freeze(errors),
  });
}
