import type { OwnershipRecord } from "../records/ownershipRecord";
import type { RawMarketObservation } from "../records/rawMarketObservation";
import type { SourceReference } from "../records/sourceReference";
import type { ValidationRecord } from "../records/validationRecord";

export interface ObservationReplayState {
  raw_market_observation: RawMarketObservation;
  ownership_record: OwnershipRecord;
  source_reference: SourceReference;
  validation_record: ValidationRecord;
  timestamp: string;
  schema_version: string;
  storage_version: string;
}

export function createObservationReplayState(input: {
  rawObservation: RawMarketObservation;
  ownershipRecord: OwnershipRecord;
  sourceReference: SourceReference;
  validationRecord: ValidationRecord;
}): ObservationReplayState {
  return structuredClone({
    raw_market_observation: input.rawObservation,
    ownership_record: input.ownershipRecord,
    source_reference: input.sourceReference,
    validation_record: input.validationRecord,
    timestamp: input.rawObservation.received_at,
    schema_version: input.rawObservation.schema_version,
    storage_version: input.rawObservation.storage_version,
  });
}
