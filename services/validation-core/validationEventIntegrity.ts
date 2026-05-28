import type { EventIntegrityRecord, ValidationDebugEvent } from "@/types/validation-core";
import { hashValidationCoreValue } from "./validationCoreHasher";

export function buildEventIntegrityChain(
  events: readonly ValidationDebugEvent[],
): readonly EventIntegrityRecord[] {
  let previousEventHash: string | undefined;
  return events.map((event) => {
    const eventHash = hashValidationCoreValue("validation-event", event);
    const chainHash = hashValidationCoreValue("validation-event-chain", {
      previousEventHash,
      eventHash,
    });
    const record: EventIntegrityRecord = Object.freeze({
      eventId: event.eventId,
      eventHash,
      previousEventHash,
      chainHash,
      verified: true,
    });
    previousEventHash = eventHash;
    return record;
  });
}

export function verifyEventIntegrityChain(
  events: readonly ValidationDebugEvent[],
  records: readonly EventIntegrityRecord[],
): { valid: boolean; failureCode?: "VALIDATION_EVENT_CORRUPTION" } {
  const rebuilt = buildEventIntegrityChain(events);
  if (rebuilt.length !== records.length) {
    return { valid: false, failureCode: "VALIDATION_EVENT_CORRUPTION" };
  }
  for (let index = 0; index < rebuilt.length; index += 1) {
    if (
      rebuilt[index].eventHash !== records[index].eventHash
      || rebuilt[index].chainHash !== records[index].chainHash
      || rebuilt[index].previousEventHash !== records[index].previousEventHash
    ) {
      return { valid: false, failureCode: "VALIDATION_EVENT_CORRUPTION" };
    }
  }
  return { valid: true };
}
