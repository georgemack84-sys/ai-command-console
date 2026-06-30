import { EdgeBookError, isNonEmptyString } from "../../../core";
import type { OwnershipContract } from "../contracts/ownershipContract";
import { generateOwnershipHash } from "../hashing/ownershipHashGenerator";

export function bindOwnershipToMarket(
  ownership: OwnershipContract,
  observationMarketId: string,
): { status: "BOUND"; ownership: OwnershipContract } {
  if (!isNonEmptyString(observationMarketId)) {
    throw new EdgeBookError("VALIDATION_FAILED", "market_id is required.", "market_id");
  }

  if (ownership.market_id !== observationMarketId) {
    throw new EdgeBookError("PHASE_BOUNDARY_VIOLATION", "Market ownership does not match observation market_id.", "market_id");
  }

  const expectedHash = generateOwnershipHash({
    owner_id: ownership.owner_id,
    tenant_id: ownership.tenant_id,
    source_id: ownership.source_id,
    market_id: ownership.market_id,
    timestamp: ownership.timestamp,
    version: ownership.version,
  });

  if (ownership.ownership_hash !== expectedHash) {
    throw new EdgeBookError("PHASE_BOUNDARY_VIOLATION", "Ownership hash is not tied to market_id.", "ownership_hash");
  }

  return { status: "BOUND", ownership: { ...ownership } };
}
