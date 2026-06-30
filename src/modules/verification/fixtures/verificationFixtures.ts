import { createMockMarketObservation } from "../../markets";
import { createMockOwnershipContract } from "../../ownership";
import type { SourceRegistryObject } from "../../sources";

export function createVerificationSource(overrides: Partial<SourceRegistryObject> = {}): SourceRegistryObject {
  return {
    source_id: "source_1",
    source_name: "Mock Source",
    source_type: "API",
    trust_level: "HIGH",
    status: "ACTIVE",
    owner_id: "owner_1",
    tenant_id: "tenant_1",
    created_at: "2026-06-04T12:00:00.000Z",
    version: "1.1",
    ...overrides,
  };
}

export function createVerificationFixture() {
  const ownership = createMockOwnershipContract();
  const observation = createMockMarketObservation({
    source_id: ownership.source_id,
    market_id: ownership.market_id,
    ownership_hash: ownership.ownership_hash,
    timestamp: ownership.timestamp,
  });

  return { observation, ownership, source: createVerificationSource() };
}
