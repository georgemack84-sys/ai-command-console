import type { OwnershipContract, OwnershipHashInput } from "../contracts/ownershipContract";
import { generateOwnershipHash } from "../hashing/ownershipHashGenerator";

export function createMockOwnershipInput(overrides: Partial<OwnershipHashInput> = {}): OwnershipHashInput {
  return {
    owner_id: "owner_1",
    tenant_id: "tenant_1",
    source_id: "source_1",
    market_id: "market_1",
    timestamp: "2026-06-04T12:00:00.000Z",
    version: "1.3",
    ...overrides,
  };
}

export function createMockOwnershipContract(overrides: Partial<OwnershipContract> = {}): OwnershipContract {
  const input = createMockOwnershipInput(overrides);

  return {
    ...input,
    ownership_hash: overrides.ownership_hash ?? generateOwnershipHash(input),
  };
}
