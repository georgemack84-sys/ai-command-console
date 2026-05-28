import type {
  AuthorityRevocationRecord,
  HumanSupremacyEnforcementInput,
} from "./supremacyStateTypes";
import { hashSupremacyValue } from "./supremacyHashingEngine";

export function revokeAuthority(input: HumanSupremacyEnforcementInput): AuthorityRevocationRecord {
  const authorityRevoked = input.interventionType === "revoke_authority" || input.interventionType === "kill_switch" || input.interventionType === "freeze";
  const revokedScopes = authorityRevoked
    ? Object.freeze(["A0", "A1", "A2", "A3"])
    : Object.freeze([] as string[]);
  return Object.freeze({
    revocationId: hashSupremacyValue("human-supremacy-authority-revocation-id", {
      supremacyId: input.supremacyId,
      interventionType: input.interventionType,
    }),
    authorityRevoked,
    revokedScopes,
    revocationHash: hashSupremacyValue("human-supremacy-authority-revocation", {
      supremacyId: input.supremacyId,
      authorityRevoked,
      revokedScopes,
    }),
  });
}
