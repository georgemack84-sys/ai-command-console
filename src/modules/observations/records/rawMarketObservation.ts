import type { ISODateTime, UUID, Version } from "../../../core";

export interface RawMarketObservation {
  observation_id: UUID;
  market_id: UUID;
  source_id: UUID;
  ownership_hash: string;
  raw_payload: unknown;
  received_at: ISODateTime;
  schema_version: Version;
  storage_version: Version;
}

export interface RawObservationValidationResult {
  status: "VALID" | "REJECTED";
  reasons: string[];
}
