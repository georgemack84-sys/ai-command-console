import type { ExpandedConstitutionalAuditRecord } from "../../types/audit";
import { validateConstitutionalReplay } from "./replayValidation";

export function replayConstitutionalAuditRecord(input: {
  record: ExpandedConstitutionalAuditRecord;
}) {
  const validation = validateConstitutionalReplay({ record: input.record });
  return {
    replayState: validation.valid ? "REPLAY_OK" : validation.blockedReasons.includes("replay_hash_mismatch") ? "FROZEN" : "BLOCKED",
    replayable: validation.valid && input.record.replayable,
    blockedReasons: validation.blockedReasons,
    reconstructedOrdering: [...input.record.escalationChain, ...input.record.coordinationChain],
  };
}
