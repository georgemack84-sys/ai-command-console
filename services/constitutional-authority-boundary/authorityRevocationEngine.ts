import type {
  AuthorityBoundaryError,
  AuthorityRevocationRecord,
  ConstitutionalAuthorityBoundaryInput,
} from "./authorityBoundaryTypes";
import { hashAuthorityValue } from "./authorityHashingEngine";

export function buildAuthorityRevocation(input: {
  authorityInput: ConstitutionalAuthorityBoundaryInput;
  errors: readonly AuthorityBoundaryError[];
}): AuthorityRevocationRecord {
  const revoked = input.errors.length > 0;
  const reason = revoked ? input.errors[0]?.code ?? "CONSTITUTIONAL_AUTHORITY_REVOCATION_REQUIRED" : null;
  return Object.freeze({
    revocationId: hashAuthorityValue("constitutional-authority-revocation-id", input.authorityInput.boundaryId),
    revoked,
    reason,
    downstreamInvalidated: revoked,
    deterministicHash: hashAuthorityValue("constitutional-authority-revocation", {
      boundaryId: input.authorityInput.boundaryId,
      revoked,
      reason,
    }),
  });
}
