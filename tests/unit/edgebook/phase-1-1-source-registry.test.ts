import { describe, expect, it } from "vitest";
import { EdgeBookError } from "@/src/core";
import {
  assertSourceAllowedForObservation,
  createSourceOwnership,
  createSourceRegistryStore,
  registerSourceWithOwnership,
  validateSourceOwnership,
  validateSourceRegistryObject,
  type SourceRegistryObject,
} from "@/src/modules/sources";

function source(overrides: Partial<SourceRegistryObject> = {}): SourceRegistryObject {
  return {
    source_id: "source_1",
    source_name: "Mock Sportsbook Feed",
    source_type: "SPORTSBOOK",
    trust_level: "HIGH",
    status: "ACTIVE",
    owner_id: "owner_1",
    tenant_id: "tenant_1",
    created_at: "2026-06-04T12:00:00.000Z",
    version: "1.1",
    ...overrides,
  };
}

describe("EdgeBook Phase 1.1 source registry", () => {
  it("registers a valid sportsbook source", () => {
    const store = createSourceRegistryStore();

    const result = registerSourceWithOwnership(store, source());

    expect(result.status).toBe("REGISTERED");
    expect(result.ownership_hash).toMatch(/^srcown_/);
    expect(store.isSourceRegistered("source_1")).toBe(true);
  });

  it("registers a valid API source", () => {
    const store = createSourceRegistryStore();

    expect(registerSourceWithOwnership(store, source({ source_id: "source_api", source_type: "API" }))).toMatchObject({
      status: "REGISTERED",
    });
  });

  it("registers a valid manual input source", () => {
    const store = createSourceRegistryStore();

    expect(
      registerSourceWithOwnership(store, source({ source_id: "source_manual", source_type: "MANUAL_INPUT" })),
    ).toMatchObject({ status: "REGISTERED" });
  });

  it("rejects unknown source type", () => {
    expect(validateSourceRegistryObject(source({ source_type: "UNKNOWN" as SourceRegistryObject["source_type"] }))).toMatchObject({
      status: "REJECTED",
      reasons: ["source_type is invalid"],
    });
  });

  it("rejects missing source_id", () => {
    expect(validateSourceRegistryObject(source({ source_id: "" }))).toMatchObject({
      status: "REJECTED",
      reasons: expect.arrayContaining(["source_id is required"]),
    });
  });

  it("rejects missing source_name", () => {
    expect(validateSourceRegistryObject(source({ source_name: "" }))).toMatchObject({
      status: "REJECTED",
      reasons: expect.arrayContaining(["source_name is required"]),
    });
  });

  it("rejects missing owner_id", () => {
    expect(validateSourceRegistryObject(source({ owner_id: "" }))).toMatchObject({
      status: "REJECTED",
      reasons: expect.arrayContaining(["owner_id is required"]),
    });
  });

  it("rejects missing tenant_id", () => {
    expect(validateSourceRegistryObject(source({ tenant_id: "" }))).toMatchObject({
      status: "REJECTED",
      reasons: expect.arrayContaining(["tenant_id is required"]),
    });
  });

  it("rejects anonymous source", () => {
    expect(validateSourceRegistryObject(source({ source_name: "anonymous" }))).toMatchObject({
      status: "REJECTED",
      reasons: expect.arrayContaining(["anonymous sources are invalid"]),
    });
  });

  it("rejects missing ownership hash", () => {
    const ownership = createSourceOwnership(source());

    expect(validateSourceOwnership({ ...ownership, ownership_hash: "" })).toMatchObject({
      status: "REJECTED",
      reasons: expect.arrayContaining(["ownership_hash is required"]),
    });
  });

  it("blocks disabled source from observation", () => {
    const store = createSourceRegistryStore([source({ status: "DISABLED" })]);

    expect(() => assertSourceAllowedForObservation(store, "source_1")).toThrow("Disabled source is blocked");
  });

  it("blocks blocked source from observation", () => {
    const store = createSourceRegistryStore([source({ status: "BLOCKED" })]);

    expect(() => assertSourceAllowedForObservation(store, "source_1")).toThrow("Blocked source is blocked");
  });

  it("blocks unknown source from observation", () => {
    const store = createSourceRegistryStore();

    expect(() => assertSourceAllowedForObservation(store, "unknown_source")).toThrow("Unknown source is blocked");
  });

  it("rejects duplicate source_id", () => {
    const store = createSourceRegistryStore();
    registerSourceWithOwnership(store, source());

    const result = registerSourceWithOwnership(store, source());

    expect(result).toMatchObject({
      status: "REJECTED",
      reasons: expect.arrayContaining(["duplicate source_id is rejected"]),
    });
    expect(result.events[0].event_type).toBe("DUPLICATE_SOURCE_REJECTED");
  });

  it("rejects invalid trust_level", () => {
    expect(validateSourceRegistryObject(source({ trust_level: "UNKNOWN" as SourceRegistryObject["trust_level"] }))).toMatchObject({
      status: "REJECTED",
      reasons: expect.arrayContaining(["trust_level is invalid"]),
    });
  });

  it("rejects invalid status", () => {
    expect(validateSourceRegistryObject(source({ status: "UNKNOWN" as SourceRegistryObject["status"] }))).toMatchObject({
      status: "REJECTED",
      reasons: expect.arrayContaining(["status is invalid"]),
    });
  });

  it("emits registry events for successful registration", () => {
    const store = createSourceRegistryStore();

    registerSourceWithOwnership(store, source());

    expect(store.listEvents()).toEqual([
      expect.objectContaining({
        source_id: "source_1",
        event_type: "SOURCE_REGISTERED",
        reason: "Source registered.",
      }),
    ]);
  });

  it("emits registry events for blocked registration", () => {
    const store = createSourceRegistryStore();

    registerSourceWithOwnership(store, source({ source_id: "" }));

    expect(store.listEvents()).toEqual([
      expect.objectContaining({
        source_id: "unknown_source",
        event_type: "SOURCE_REJECTED",
      }),
    ]);
  });

  it("allows only registered ACTIVE owned sources for observation", () => {
    const store = createSourceRegistryStore();
    registerSourceWithOwnership(store, source());

    expect(assertSourceAllowedForObservation(store, "source_1")).toMatchObject({
      status: "ALLOWED",
      source: expect.objectContaining({ status: "ACTIVE" }),
    });
  });
});

describe("EdgeBook Phase 1.1 source registry boundaries", () => {
  it("prevents unregistered source observation collection", () => {
    const store = createSourceRegistryStore();

    expect(() => assertSourceAllowedForObservation(store, "missing")).toThrow(EdgeBookError);
  });

  it("prevents disabled source observation collection", () => {
    const store = createSourceRegistryStore([source({ status: "DISABLED" })]);

    expect(() => assertSourceAllowedForObservation(store, "source_1")).toThrow(EdgeBookError);
  });

  it("prevents blocked source observation collection", () => {
    const store = createSourceRegistryStore([source({ status: "BLOCKED" })]);

    expect(() => assertSourceAllowedForObservation(store, "source_1")).toThrow(EdgeBookError);
  });

  it("prevents ownerless source observation collection", () => {
    const store = createSourceRegistryStore([source({ owner_id: "" })]);

    expect(() => assertSourceAllowedForObservation(store, "source_1")).toThrow(EdgeBookError);
  });

  it("does not expose recommendation, prediction, edge scoring, or wager logic", async () => {
    const moduleExports = await import("@/src/modules/sources");
    const exportedNames = Object.keys(moduleExports).join(" ").toLowerCase();

    expect(exportedNames).not.toContain("recommendation");
    expect(exportedNames).not.toContain("prediction");
    expect(exportedNames).not.toContain("edgescore");
    expect(exportedNames).not.toContain("wager");
    expect(exportedNames).not.toContain("pick");
  });
});
