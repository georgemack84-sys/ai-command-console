import type { EventSeverity, ISODateTime, UUID } from "../../../core";

export type OwnershipEventType =
  | "OWNERSHIP_CREATED"
  | "OWNERSHIP_VALIDATED"
  | "OWNERSHIP_BOUND_TO_SOURCE"
  | "OWNERSHIP_BOUND_TO_MARKET"
  | "OWNERSHIP_REJECTED"
  | "OWNERSHIP_MUTATION_BLOCKED"
  | "OWNERSHIP_HASH_MISMATCH"
  | "OWNER_INVALID"
  | "TENANT_INVALID"
  | "SOURCE_OWNERSHIP_MISMATCH"
  | "MARKET_OWNERSHIP_MISMATCH";

export interface OwnershipEvent {
  event_id: UUID;
  ownership_hash: string;
  owner_id: UUID;
  tenant_id: UUID;
  source_id: UUID;
  market_id: UUID;
  event_type: OwnershipEventType;
  timestamp: ISODateTime;
  severity: EventSeverity;
  reason: string;
}

export function createOwnershipEvent(input: {
  ownership_hash: string;
  owner_id: UUID;
  tenant_id: UUID;
  source_id: UUID;
  market_id: UUID;
  event_type: OwnershipEventType;
  reason: string;
  timestamp?: ISODateTime;
  severity?: EventSeverity;
}): OwnershipEvent {
  const timestamp = input.timestamp ?? new Date(0).toISOString();

  return Object.freeze({
    event_id: `ownership_event_${input.ownership_hash}_${input.event_type}_${timestamp}`.replace(/[^a-zA-Z0-9_]/g, "_"),
    ownership_hash: input.ownership_hash,
    owner_id: input.owner_id,
    tenant_id: input.tenant_id,
    source_id: input.source_id,
    market_id: input.market_id,
    event_type: input.event_type,
    timestamp,
    severity: input.severity ?? "INFO",
    reason: input.reason,
  });
}
