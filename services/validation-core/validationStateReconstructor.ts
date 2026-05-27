import type { ValidationDebugEvent, ValidationStatus } from "@/types/validation-core";
import type { ValidationFailure, ValidationState } from "./validationTypes";
import { hashValidationCoreValue } from "./validationCoreHasher";

function statusFromEventType(eventType: string): ValidationStatus | undefined {
  if (eventType === "validation.completed") {
    return "approved";
  }
  if (eventType.includes(".failed") || eventType === "validation.failed") {
    return "denied";
  }
  return undefined;
}

export function reconstructValidationState(input: {
  events: readonly ValidationDebugEvent[];
  failures: readonly ValidationFailure[];
}): ValidationState & { stateHash: string } {
  let status: ValidationStatus = "approved";

  for (const event of input.events) {
    const nextStatus = statusFromEventType(event.eventType);
    if (nextStatus) {
      status = nextStatus;
    }
  }
  if (input.failures.some((failure) => failure.code === "VALIDATION_EVENT_CORRUPTION")) {
    status = "invalid";
  }
  if (input.failures.some((failure) => failure.code === "VALIDATION_TIMELINE_GAP" || failure.code === "VALIDATION_EVENT_AMBIGUITY")) {
    status = "disputed";
  }
  if (input.failures.some((failure) => failure.code === "VALIDATION_UNKNOWN_UNSAFE")) {
    status = "denied";
  }

  const state = {
    status,
    validators: {},
    failures: Object.freeze([...input.failures]),
    eventCount: input.events.length,
  } as const;

  return Object.freeze({
    ...state,
    stateHash: hashValidationCoreValue("validation-state", state),
  });
}
