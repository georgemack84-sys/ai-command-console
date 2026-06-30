import { createMockMarketObservation, type MarketObservation } from "../../markets";

export function createChangeDetectionObservation(overrides: Partial<MarketObservation> = {}): MarketObservation {
  return createMockMarketObservation({
    ownership_hash: "own_change",
    timestamp: "2026-06-04T12:00:00.000Z",
    ...overrides,
  });
}

export function createChangeDetectionPair(
  previous: Partial<MarketObservation> = {},
  next: Partial<MarketObservation> = {},
) {
  return {
    previous: createChangeDetectionObservation(previous),
    next: createChangeDetectionObservation({
      timestamp: "2026-06-04T12:05:00.000Z",
      ...next,
    }),
  };
}
