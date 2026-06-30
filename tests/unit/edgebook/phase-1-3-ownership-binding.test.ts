import { describe, expect, it } from "vitest";
import {
  bindOwnershipToMarket,
  bindOwnershipToSource,
  createMockOwnershipContract,
  createMockOwnershipInput,
  createOwnershipEvent,
  generateOwnershipHash,
  assertOwnershipImmutable,
  assertOwnershipReplacementBlocked,
  validateOwnershipContract,
} from "@/src/modules/ownership";
import { createSourceRegistryStore, type SourceRegistryObject } from "@/src/modules/sources";

function source(overrides: Partial<SourceRegistryObject> = {}): SourceRegistryObject {
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

function expectOwnershipRejected(overrides: Record<string, unknown>, reason: string) {
  expect(validateOwnershipContract({ ...createMockOwnershipContract(), ...overrides })).toMatchObject({
    status: "REJECTED",
    reasons: expect.arrayContaining([reason]),
  });
}

describe("EdgeBook Phase 1.3 ownership binding", () => {
  it("accepts a valid ownership contract", () => {
    expect(validateOwnershipContract(createMockOwnershipContract())).toEqual({ status: "VALID", reasons: [] });
  });

  for (const field of ["ownership_hash", "owner_id", "tenant_id", "source_id", "market_id", "timestamp", "version"]) {
    it(`rejects missing ${field}`, () => {
      expectOwnershipRejected({ [field]: undefined }, `${field} is required`);
    });

    it(`rejects null ${field}`, () => {
      expectOwnershipRejected({ [field]: null }, `${field} cannot be null`);
    });
  }

  it("rejects empty owner_id", () => {
    expectOwnershipRejected({ owner_id: "" }, "owner_id cannot be empty");
  });

  it("rejects empty tenant_id", () => {
    expectOwnershipRejected({ tenant_id: "" }, "tenant_id cannot be empty");
  });

  it("rejects anonymous owner_id", () => {
    expectOwnershipRejected({ owner_id: "anonymous" }, "owner_id must be explicit");
  });

  it("rejects unknown owner_id", () => {
    expectOwnershipRejected({ owner_id: "unknown" }, "owner_id must be explicit");
  });

  it("rejects system-inherited owner_id", () => {
    expectOwnershipRejected({ owner_id: "system-inherited" }, "owner_id must be explicit");
  });

  it("rejects shared tenant_id", () => {
    expectOwnershipRejected({ tenant_id: "shared" }, "tenant_id must be explicit");
  });

  it("rejects global tenant_id", () => {
    expectOwnershipRejected({ tenant_id: "global" }, "tenant_id must be explicit");
  });

  it("creates deterministic ownership hashes", () => {
    const input = createMockOwnershipInput();

    expect(generateOwnershipHash(input)).toBe(generateOwnershipHash(input));
    expect(generateOwnershipHash({ ...input, market_id: "market_2" })).not.toBe(generateOwnershipHash(input));
  });

  it("rejects manual hash mismatch", () => {
    expectOwnershipRejected({ ownership_hash: "manual_hash" }, "ownership_hash does not match reproducible ownership hash");
  });

  it("passes source ownership match", () => {
    const store = createSourceRegistryStore([source()]);

    expect(bindOwnershipToSource(store, createMockOwnershipContract())).toMatchObject({ status: "BOUND" });
  });

  it("rejects source ownership mismatch", () => {
    const store = createSourceRegistryStore([source({ owner_id: "owner_2" })]);

    expect(() => bindOwnershipToSource(store, createMockOwnershipContract())).toThrow("Source owner_id does not match");
  });

  it("rejects tenant mismatch", () => {
    const store = createSourceRegistryStore([source({ tenant_id: "tenant_2" })]);

    expect(() => bindOwnershipToSource(store, createMockOwnershipContract())).toThrow("Source tenant_id does not match");
  });

  it("passes market ownership binding", () => {
    expect(bindOwnershipToMarket(createMockOwnershipContract(), "market_1")).toMatchObject({ status: "BOUND" });
  });

  it("rejects market ownership mismatch", () => {
    expect(() => bindOwnershipToMarket(createMockOwnershipContract(), "market_2")).toThrow("Market ownership does not match");
  });

  it("creates informational ownership events", () => {
    const ownership = createMockOwnershipContract();

    expect(createOwnershipEvent({ ...ownership, event_type: "OWNERSHIP_VALIDATED", reason: "Owner validated." })).toMatchObject({
      event_type: "OWNERSHIP_VALIDATED",
      severity: "INFO",
    });
  });
});

describe("EdgeBook Phase 1.3 ownership boundaries", () => {
  it("blocks ownership changes", () => {
    expect(() => assertOwnershipImmutable(createMockOwnershipContract(), { owner_id: "owner_2" })).toThrow(
      "owner_id cannot be changed",
    );
  });

  it("blocks silent ownership inheritance", () => {
    expect(() =>
      assertOwnershipImmutable(createMockOwnershipContract(), { inherited_from: "other_observation" }),
    ).toThrow("Ownership cannot be inherited silently");
  });

  it("blocks ownership replacement", () => {
    expect(() =>
      assertOwnershipReplacementBlocked(createMockOwnershipContract(), createMockOwnershipContract({ market_id: "market_2" })),
    ).toThrow("Ownership replacement is prohibited");
  });

  it("rejects nullable ownership", () => {
    expectOwnershipRejected({ ownership_hash: null }, "ownership_hash cannot be null");
  });

  it("blocks unknown source binding", () => {
    expect(() => bindOwnershipToSource(createSourceRegistryStore(), createMockOwnershipContract())).toThrow("Unknown source is blocked");
  });

  it("blocks disabled source binding", () => {
    expect(() =>
      bindOwnershipToSource(createSourceRegistryStore([source({ status: "DISABLED" })]), createMockOwnershipContract()),
    ).toThrow("Disabled source is blocked");
  });

  it("blocks blocked source binding", () => {
    expect(() =>
      bindOwnershipToSource(createSourceRegistryStore([source({ status: "BLOCKED" })]), createMockOwnershipContract()),
    ).toThrow("Blocked source is blocked");
  });

  it("blocks cross-tenant ownership", () => {
    expect(() =>
      bindOwnershipToSource(createSourceRegistryStore([source({ tenant_id: "tenant_2" })]), createMockOwnershipContract()),
    ).toThrow("Source tenant_id does not match");
  });

  it("does not expose recommendation, prediction, edge scoring, or wager logic", async () => {
    const moduleExports = await import("@/src/modules/ownership");
    const exportedNames = Object.keys(moduleExports).join(" ").toLowerCase();

    expect(exportedNames).not.toContain("recommendation");
    expect(exportedNames).not.toContain("prediction");
    expect(exportedNames).not.toContain("edgescore");
    expect(exportedNames).not.toContain("wager");
  });
});
