import type { CoordinationContainmentRecord, ContainmentError } from "@/types/coordination-containment";
import { hashContainmentValue } from "./containmentHasher";

export function inspectContainmentDeterminism(record: CoordinationContainmentRecord): readonly ContainmentError[] {
  const replayedHash = hashContainmentValue("coordination-containment-record", {
    coordinationId: record.coordinationId,
    authorityContract: record.authorityContract,
    validation: record.validation,
    replay: record.replay,
    ledger: record.ledger,
  });
  if (replayedHash === record.containmentHash) {
    return Object.freeze([]);
  }
  return Object.freeze([{
    code: "CONTAINMENT_UNKNOWN_COORDINATION",
    message: "Containment record was not deterministic under identical inputs.",
    path: "containmentHash",
  }]);
}
