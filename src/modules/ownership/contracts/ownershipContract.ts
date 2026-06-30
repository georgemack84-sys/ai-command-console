import type { ISODateTime, UUID, Version } from "../../../core";

export interface OwnershipContract {
  ownership_hash: string;
  owner_id: UUID;
  tenant_id: UUID;
  source_id: UUID;
  market_id: UUID;
  timestamp: ISODateTime;
  version: Version;
}

export type OwnershipHashInput = Omit<OwnershipContract, "ownership_hash">;

export interface OwnershipValidationResult {
  status: "VALID" | "REJECTED";
  reasons: string[];
}
