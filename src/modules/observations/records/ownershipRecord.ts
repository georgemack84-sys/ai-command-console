import type { ISODateTime, UUID, Version } from "../../../core";

export interface OwnershipRecord {
  ownership_hash: string;
  owner_id: UUID;
  tenant_id: UUID;
  source_id: UUID;
  market_id: UUID;
  observation_id: UUID;
  timestamp: ISODateTime;
  version: Version;
}
