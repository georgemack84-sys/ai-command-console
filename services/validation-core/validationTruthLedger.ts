import type { ValidationDebugEvent } from "@/types/validation-core";
import type { ValidationLedger } from "./validationTypes";

export function createValidationTruthLedger(): ValidationLedger {
  return Object.freeze({
    events: Object.freeze([]) as readonly ValidationDebugEvent[],
  });
}

export function appendValidationTruthEvent(
  ledger: ValidationLedger,
  event: ValidationDebugEvent,
): ValidationLedger {
  return Object.freeze({
    events: Object.freeze([...ledger.events, event]),
  });
}

export function readValidationTruthEvents(ledger: ValidationLedger): readonly ValidationDebugEvent[] {
  return [...ledger.events];
}
