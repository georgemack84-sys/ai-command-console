import type { DebugEventSeverity, ValidationDebugEvent, ValidatorName } from "@/types/validation-core";
import type { ValidationContext } from "./validationTypes";
import { hashValidationCoreValue } from "./validationCoreHasher";

export type ValidationEventDefinition = Readonly<{
  eventType: string;
  timestamp: string;
  monotonicSequence: number;
  parentEventId?: string;
  rootEventId?: string;
  validator?: ValidatorName;
  subsystem: string;
  severity: DebugEventSeverity;
  payload?: unknown;
}>;

export function emitValidationEvent(
  context: ValidationContext,
  input: ValidationEventDefinition,
): ValidationDebugEvent {
  const payloadHash = hashValidationCoreValue("validation-event-payload", input.payload ?? {});
  const metadata = {
    eventType: input.eventType,
    monotonicSequence: input.monotonicSequence,
    parentEventId: input.parentEventId,
    rootEventId: input.rootEventId,
    validator: input.validator,
    subsystem: input.subsystem,
    severity: input.severity,
    timestamp: input.timestamp,
  };
  const metadataHash = hashValidationCoreValue("validation-event-metadata", metadata);

  return Object.freeze({
    eventId: hashValidationCoreValue("validation-event-id", {
      validationId: context.request.validationId,
      metadataHash,
      payloadHash,
    }),
    validationId: context.request.validationId,
    treatyId: context.request.treatyId,
    eventType: input.eventType,
    timestamp: input.timestamp,
    monotonicSequence: input.monotonicSequence,
    parentEventId: input.parentEventId,
    rootEventId: input.rootEventId,
    validator: input.validator,
    subsystem: input.subsystem,
    deterministic: true,
    lineageHashes: Object.freeze({
      replayHash: context.treaty.manifest.replayBindingHash,
      governanceHash: context.treaty.manifest.governanceSnapshotHash,
      registryHash: context.treaty.manifest.registrySnapshotHash,
      provenanceHash: context.treaty.manifest.provenanceHash,
      survivabilityHash: context.treaty.manifest.survivabilityHash,
      forensicHash: context.treaty.manifest.forensicReplayHash,
    }),
    payloadHash,
    metadataHash,
    severity: input.severity,
  });
}
