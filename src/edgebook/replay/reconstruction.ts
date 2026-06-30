import type { RawMarketObservation } from "../observations/marketObservationTypes";

export function reconstructMarketHistory(records: RawMarketObservation[], marketId: string) {
  return records
    .filter((record) => record.raw_market_observation.market_id === marketId)
    .map((record) => record.raw_market_observation)
    .sort((left, right) => left.collection_sequence - right.collection_sequence);
}
