export type MarketObservationSchemaVersion = "1.2.0";

export const CURRENT_MARKET_OBSERVATION_SCHEMA_VERSION: MarketObservationSchemaVersion = "1.2.0";

export const supportedMarketObservationSchemaVersions: ReadonlySet<string> = new Set([
  CURRENT_MARKET_OBSERVATION_SCHEMA_VERSION,
]);

export function isSupportedMarketObservationSchemaVersion(value: unknown): value is MarketObservationSchemaVersion {
  return typeof value === "string" && supportedMarketObservationSchemaVersions.has(value);
}
