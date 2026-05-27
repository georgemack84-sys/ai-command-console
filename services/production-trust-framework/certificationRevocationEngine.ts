import { hashFailurePayload } from "@/services/failure-orchestration";
import type { CertificationRevocationReason, CertificationRevocationRecord } from "./productionTrustTypes";

export function appendCertificationRevocation(
  existing: readonly CertificationRevocationRecord[],
  input: {
    certificationId: string;
    reason: CertificationRevocationReason;
    revokedAt: string;
    revokedBy: string;
  },
): readonly CertificationRevocationRecord[] {
  const record: CertificationRevocationRecord = {
    certificationId: input.certificationId,
    reason: input.reason,
    revokedAt: input.revokedAt,
    revokedBy: input.revokedBy,
    revocationHash: hashFailurePayload("EVIDENCE_BUNDLE", input),
  };
  return [...existing, record];
}
