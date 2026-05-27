import type { RuntimeValidationErrorCode } from "./runtimeValidationErrors";
import type { RuntimeValidationLedgerEvent } from "./runtimeValidationTypes";
import { hashRuntimeValidationLedgerEvent } from "./runtimeValidationHasher";

export function buildRuntimeValidationLedgerEvent(input: Omit<RuntimeValidationLedgerEvent, "eventHash">): RuntimeValidationLedgerEvent {
  return {
    ...input,
    eventHash: hashRuntimeValidationLedgerEvent({
      eventType: input.eventType,
      toolId: input.toolId,
      toolVersion: input.toolVersion,
      bindingHash: input.bindingHash,
      result: input.result,
      failureCode: input.failureCode,
      validationHash: input.validationHash,
    }),
  };
}

export function buildRuntimeValidationFailureEvent(input: {
  eventType: RuntimeValidationLedgerEvent["eventType"];
  toolId: string;
  toolVersion: string;
  bindingHash: string;
  failureCode: RuntimeValidationErrorCode;
  validationHash?: string;
  occurredAt?: string;
}): RuntimeValidationLedgerEvent {
  return buildRuntimeValidationLedgerEvent({
    eventType: input.eventType,
    toolId: input.toolId,
    toolVersion: input.toolVersion,
    bindingHash: input.bindingHash,
    result: "failure",
    failureCode: input.failureCode,
    validationHash: input.validationHash,
    occurredAt: input.occurredAt,
  });
}
