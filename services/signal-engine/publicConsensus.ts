import type { PublicConsensusSnapshot } from "./types";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parsePublicConsensusSnapshot(value: unknown): PublicConsensusSnapshot | null {
  if (!isObject(value)) {
    return null;
  }

  const snapshot: PublicConsensusSnapshot = {
    consensus_id: String(value.consensus_id ?? ""),
    market_id: String(value.market_id ?? ""),
    public_side: String(value.public_side ?? ""),
    public_percentage: Number(value.public_percentage),
    opposing_side: String(value.opposing_side ?? ""),
    opposing_percentage: Number(value.opposing_percentage),
    consensus_type: value.consensus_type as PublicConsensusSnapshot["consensus_type"],
    source_id: String(value.source_id ?? ""),
    captured_at: String(value.captured_at ?? ""),
    verification_status: value.verification_status as PublicConsensusSnapshot["verification_status"],
    schema_version: String(value.schema_version ?? ""),
  };

  if (
    !snapshot.consensus_id
    || !snapshot.market_id
    || !snapshot.public_side
    || !snapshot.opposing_side
    || !snapshot.source_id
    || !snapshot.captured_at
    || !snapshot.schema_version
    || !Number.isFinite(snapshot.public_percentage)
    || !Number.isFinite(snapshot.opposing_percentage)
  ) {
    return null;
  }

  if (!["BET_PERCENTAGE", "HANDLE_PERCENTAGE", "TICKET_PERCENTAGE"].includes(snapshot.consensus_type)) {
    return null;
  }
  if (!["VERIFIED", "LIMITED", "INVALID"].includes(snapshot.verification_status)) {
    return null;
  }

  return Object.freeze(snapshot);
}

export function getConsensusAgeSeconds(snapshot: PublicConsensusSnapshot, eventTimestamp: string): number | null {
  const capturedAt = Date.parse(snapshot.captured_at);
  const eventTime = Date.parse(eventTimestamp);
  if (Number.isNaN(capturedAt) || Number.isNaN(eventTime)) {
    return null;
  }
  return Math.max(0, Math.round((eventTime - capturedAt) / 1000));
}
