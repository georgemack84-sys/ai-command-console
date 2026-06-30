export interface OwnershipContract {
  ownership_hash: string;
  owner_id: string;
  tenant_id: string;
  source_id: string;
  market_id: string;
  timestamp: string;
  version: string;
}

export interface OwnershipInput {
  owner_id: string;
  tenant_id: string;
  source_id: string;
  market_id: string;
  timestamp: string;
  version: string;
}
