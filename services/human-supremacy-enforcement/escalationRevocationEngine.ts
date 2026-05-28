import type {
  EscalationRevocationRecord,
  HumanSupremacyEnforcementInput,
} from "./supremacyStateTypes";
import { hashSupremacyValue } from "./supremacyHashingEngine";

export function revokeEscalation(input: HumanSupremacyEnforcementInput): EscalationRevocationRecord {
  const escalationRevoked = input.interventionType === "revoke_escalation"
    || input.interventionType === "freeze"
    || input.interventionType === "kill_switch";
  const revokedScopes = escalationRevoked ? Object.freeze(["escalation", "override-chain"]) : Object.freeze([] as string[]);
  return Object.freeze({
    escalationRevocationId: hashSupremacyValue("human-supremacy-escalation-revocation-id", {
      supremacyId: input.supremacyId,
      interventionType: input.interventionType,
    }),
    escalationRevoked,
    revokedScopes,
    escalationHash: hashSupremacyValue("human-supremacy-escalation-revocation", {
      supremacyId: input.supremacyId,
      escalationRevoked,
      revokedScopes,
    }),
  });
}
