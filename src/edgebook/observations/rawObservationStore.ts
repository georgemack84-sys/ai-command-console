import type { RawMarketObservation } from "./marketObservationTypes";

export interface RawObservationStore {
  record(observation: RawMarketObservation): { status: "RECORDED"; record: RawMarketObservation };
  list(): RawMarketObservation[];
}

export function createRawObservationStore(initialRecords: RawMarketObservation[] = []): RawObservationStore {
  const records = initialRecords.map((record) => structuredClone(record));

  return {
    record(observation) {
      const record = structuredClone(observation);
      records.push(record);
      return { status: "RECORDED", record: structuredClone(record) };
    },
    list() {
      return records.map((record) => structuredClone(record));
    },
  };
}
