import type { ISODateTime, UUID, Version } from "../../../core";

export type ObservationValidationStatus = "VALID" | "INVALID" | "BLOCKED";

export interface ValidationRecord {
  validation_id: UUID;
  observation_id: UUID;
  status: ObservationValidationStatus;
  reason: string;
  validator: string;
  timestamp: ISODateTime;
  version: Version;
}
