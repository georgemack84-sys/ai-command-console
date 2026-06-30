import { bindOwnership } from "../ownership/ownershipBinding";
import { verifyAndRecordObservation, type VerificationResult } from "../verification/verificationEngine";
import type { SourceRegistry } from "../sources/sourceRegistry";
import type { RawObservationStore } from "./rawObservationStore";
import type { MarketObservation } from "./marketObservationTypes";

// Mock-only ingestion helper for deterministic foundation tests and demos.
export function ingestMockObservation(
  registry: SourceRegistry,
  store: RawObservationStore,
  observation: Omit<MarketObservation, "ownership_hash">,
  owner: { owner_id: string; tenant_id: string },
): VerificationResult {
  const ownership = bindOwnership({
    owner_id: owner.owner_id,
    tenant_id: owner.tenant_id,
    source_id: observation.source_id,
    market_id: observation.market_id,
    timestamp: observation.timestamp,
    version: observation.schema_version,
  });

  if (ownership.status === "REJECTED") {
    return { status: "REJECTED", reasons: ownership.reasons };
  }

  return verifyAndRecordObservation(registry, store, {
    ...observation,
    ownership_hash: ownership.ownership.ownership_hash,
  });
}
