import type { SourceMarketValueSnapshot } from "./types";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toSnapshot(value: unknown): SourceMarketValueSnapshot | null {
  if (!isObject(value)) {
    return null;
  }
  const snapshot: SourceMarketValueSnapshot = {
    snapshot_id: String(value.snapshot_id ?? ""),
    market_id: String(value.market_id ?? ""),
    source_id: String(value.source_id ?? ""),
    market_type: value.market_type as SourceMarketValueSnapshot["market_type"],
    value: value.value as number | string,
    timestamp: String(value.timestamp ?? ""),
    verification_status: value.verification_status as SourceMarketValueSnapshot["verification_status"],
    freshness_status: value.freshness_status as SourceMarketValueSnapshot["freshness_status"],
    schema_version: String(value.schema_version ?? ""),
  };

  if (
    !snapshot.snapshot_id
    || !snapshot.market_id
    || !snapshot.source_id
    || !snapshot.timestamp
    || !snapshot.schema_version
    || (typeof snapshot.value !== "number" && typeof snapshot.value !== "string")
  ) {
    return null;
  }
  if (!["SPREAD", "TOTAL", "MONEYLINE", "PROP", "UNKNOWN"].includes(snapshot.market_type)) {
    return null;
  }
  if (!["VERIFIED", "LIMITED", "INVALID"].includes(snapshot.verification_status)) {
    return null;
  }
  if (!["CURRENT", "STALE", "UNKNOWN"].includes(snapshot.freshness_status)) {
    return null;
  }
  return Object.freeze(snapshot);
}

export function parseSourceMarketValueSnapshots(value: unknown): SourceMarketValueSnapshot[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  const snapshots = value.map(toSnapshot);
  if (snapshots.some((snapshot) => snapshot === null)) {
    return null;
  }
  return (snapshots as SourceMarketValueSnapshot[]).sort((left, right) => {
    if (left.source_id !== right.source_id) {
      return left.source_id.localeCompare(right.source_id);
    }
    return left.timestamp.localeCompare(right.timestamp);
  });
}
