import type { ValidationDebugEvent } from "@/types/validation-core";
import { hashValidationCoreValue } from "./validationCoreHasher";

export type ValidationCausalityResult = Readonly<{
  valid: boolean;
  failureCode?: "VALIDATION_CAUSALITY_BROKEN";
  causalityHash: string;
  roots: readonly string[];
  parents: Readonly<Record<string, string | undefined>>;
}>;

export function resolveValidationCausality(
  events: readonly ValidationDebugEvent[],
): ValidationCausalityResult {
  const eventIds = new Set(events.map((event) => event.eventId));
  const roots: string[] = [];
  const parents: Record<string, string | undefined> = {};
  let valid = true;

  for (const event of events) {
    if (event.parentEventId && !eventIds.has(event.parentEventId)) {
      valid = false;
    }
    if (event.rootEventId && !eventIds.has(event.rootEventId)) {
      valid = false;
    }
    if (!event.parentEventId) {
      roots.push(event.eventId);
    }
    parents[event.eventId] = event.parentEventId;
  }

  return Object.freeze({
    valid,
    failureCode: valid ? undefined : "VALIDATION_CAUSALITY_BROKEN",
    causalityHash: hashValidationCoreValue("validation-causality", { roots, parents, valid }),
    roots: Object.freeze([...roots]),
    parents: Object.freeze({ ...parents }),
  });
}
