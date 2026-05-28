import type { ValidatorName } from "./validatorResult";

export type DebugEventSeverity =
  | "debug"
  | "info"
  | "warn"
  | "error"
  | "critical";

export type ValidationDebugEvent = Readonly<{
  eventId: string;
  validationId: string;
  treatyId?: string;
  eventType: string;
  timestamp: string;
  monotonicSequence: number;
  parentEventId?: string;
  rootEventId?: string;
  validator?: ValidatorName;
  subsystem: string;
  deterministic: boolean;
  lineageHashes: Readonly<{
    replayHash?: string;
    governanceHash?: string;
    registryHash?: string;
    provenanceHash?: string;
    survivabilityHash?: string;
    forensicHash?: string;
  }>;
  payloadHash: string;
  metadataHash: string;
  severity: DebugEventSeverity;
}>;
