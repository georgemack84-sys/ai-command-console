import type { OwnershipRecord } from "../records/ownershipRecord";
import type { RawMarketObservation } from "../records/rawMarketObservation";
import type { SourceReference } from "../records/sourceReference";
import type { ValidationRecord } from "../records/validationRecord";

export const mockRawPayload = Object.freeze({
  provider: "mock",
  market: "spread",
  line: "-4.5",
  odds: "-110",
});

export function createMockRawMarketObservation(overrides: Partial<RawMarketObservation> = {}): RawMarketObservation {
  return {
    observation_id: "observation_1",
    market_id: "market_1",
    source_id: "source_1",
    ownership_hash: "own_123",
    raw_payload: mockRawPayload,
    received_at: "2026-06-04T12:00:00.000Z",
    schema_version: "1.2.0",
    storage_version: "1.4",
    ...overrides,
  };
}

export function createMockOwnershipRecord(overrides: Partial<OwnershipRecord> = {}): OwnershipRecord {
  return {
    ownership_hash: "own_123",
    owner_id: "owner_1",
    tenant_id: "tenant_1",
    source_id: "source_1",
    market_id: "market_1",
    observation_id: "observation_1",
    timestamp: "2026-06-04T12:00:00.000Z",
    version: "1.3",
    ...overrides,
  };
}

export function createMockSourceReference(overrides: Partial<SourceReference> = {}): SourceReference {
  return {
    source_id: "source_1",
    source_name: "Mock Source",
    source_type: "API",
    trust_level: "HIGH",
    status: "ACTIVE",
    owner_id: "owner_1",
    tenant_id: "tenant_1",
    referenced_at: "2026-06-04T12:00:00.000Z",
    version: "1.1",
    ...overrides,
  };
}

export function createMockValidationRecord(overrides: Partial<ValidationRecord> = {}): ValidationRecord {
  return {
    validation_id: "validation_1",
    observation_id: "observation_1",
    status: "VALID",
    reason: "Observation schema valid.",
    validator: "phase-1.4-test-validator",
    timestamp: "2026-06-04T12:00:00.000Z",
    version: "1.4",
    ...overrides,
  };
}
