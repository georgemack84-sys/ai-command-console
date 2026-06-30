import type { MarketObservation, RawMarketObservation } from "../observations/marketObservationTypes";
import { validateMarketObservation } from "../observations/observationValidation";
import type { RawObservationStore } from "../observations/rawObservationStore";
import { createOwnershipHash } from "../ownership/ownershipHash";
import type { SourceRegistry } from "../sources/sourceRegistry";
import { validateSource } from "../sources/sourceValidation";
import { createValidationRecord } from "./validationRecords";

export type VerificationResult =
  | { status: "RECORDED"; record: RawMarketObservation }
  | { status: "REJECTED"; reasons: string[] };

export function verifyAndRecordObservation(
  registry: SourceRegistry,
  store: RawObservationStore,
  observation: MarketObservation,
): VerificationResult {
  const sourceResult = validateSource(registry, observation.source_id);
  if (sourceResult.status === "REJECTED" || !sourceResult.source) {
    return { status: "REJECTED", reasons: [sourceResult.reason] };
  }

  const schemaResult = validateMarketObservation(observation);
  if (schemaResult.status !== "VALID") {
    return { status: "REJECTED", reasons: schemaResult.reasons };
  }

  const expectedOwnershipFields = {
    owner_id: sourceResult.source.owner_id,
    tenant_id: sourceResult.source.tenant_id,
    source_id: observation.source_id,
    market_id: observation.market_id,
    timestamp: observation.timestamp,
    version: observation.schema_version,
  };
  const expectedOwnershipHash = createOwnershipHash(expectedOwnershipFields);

  if (observation.ownership_hash !== expectedOwnershipHash) {
    return { status: "REJECTED", reasons: ["ownership_hash does not match the ownership contract"] };
  }

  if (store.list().some((record) => record.raw_market_observation.observation_id === observation.observation_id)) {
    return { status: "REJECTED", reasons: ["duplicate observation_id rejected"] };
  }

  const rawRecord: RawMarketObservation = {
    raw_market_observation: { ...observation },
    source_reference: {
      source_id: observation.source_id,
      observed_at: observation.timestamp,
    },
    validation_record: createValidationRecord("VALID", [], observation.timestamp),
    ownership_record: {
      ...expectedOwnershipFields,
      ownership_hash: expectedOwnershipHash,
    },
  };

  return store.record(rawRecord);
}
