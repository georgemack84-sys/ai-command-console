import { describe, expect, it } from "vitest";
import { createSourceRegistryStore } from "@/src/modules/sources";
import {
  authorizeVerifiedObservationForStore,
  createDuplicateController,
  createObservationVerificationEngine,
  createVerificationEvent,
  createVerificationFixture,
  createVerificationSource,
  verifyMarketSchema,
  verifyObservationOwnership,
  verifyObservationTimestamps,
  verifySourceRegistration,
} from "@/src/modules/verification";

function engineWithSource(source = createVerificationSource()) {
  return createObservationVerificationEngine({
    sourceRegistry: createSourceRegistryStore([source]),
  });
}

describe("EdgeBook Phase 1.5 verification engine", () => {
  it("verifies a valid observation successfully", () => {
    const { observation, ownership } = createVerificationFixture();

    expect(engineWithSource().verifyObservation({ observation, ownership }).result).toMatchObject({
      status: "VERIFIED",
      observation_id: "unknown",
      market_id: "market_1",
      source_id: "source_1",
      ownership_hash: ownership.ownership_hash,
    });
  });

  it("passes registered active source verification", () => {
    expect(verifySourceRegistration(createSourceRegistryStore([createVerificationSource()]), "source_1")).toMatchObject({
      status: "PASSED",
    });
  });

  it("fails unknown source", () => {
    expect(verifySourceRegistration(createSourceRegistryStore(), "source_1")).toMatchObject({
      status: "FAILED",
      failure_reason: "SOURCE_UNKNOWN",
    });
  });

  it("fails disabled source", () => {
    expect(verifySourceRegistration(createSourceRegistryStore([createVerificationSource({ status: "DISABLED" })]), "source_1")).toMatchObject({
      status: "FAILED",
      failure_reason: "SOURCE_DISABLED",
    });
  });

  it("fails blocked source", () => {
    expect(verifySourceRegistration(createSourceRegistryStore([createVerificationSource({ status: "BLOCKED" })]), "source_1")).toMatchObject({
      status: "FAILED",
      failure_reason: "SOURCE_BLOCKED",
    });
  });

  it("fails ownerless source", () => {
    expect(verifySourceRegistration(createSourceRegistryStore([createVerificationSource({ owner_id: "" })]), "source_1")).toMatchObject({
      status: "FAILED",
      failure_reason: "SOURCE_OWNERLESS",
    });
  });

  it("passes valid schema", () => {
    expect(verifyMarketSchema(createVerificationFixture().observation)).toMatchObject({ status: "PASSED" });
  });

  it("fails invalid schema", () => {
    expect(verifyMarketSchema({ ...createVerificationFixture().observation, sport: "" })).toMatchObject({
      status: "FAILED",
      failure_reason: "SCHEMA_INVALID",
    });
  });

  it("fails unknown market type", () => {
    expect(verifyMarketSchema({ ...createVerificationFixture().observation, market_type: "UNKNOWN" })).toMatchObject({
      status: "FAILED",
      failure_reason: "MARKET_TYPE_UNKNOWN",
    });
  });

  it("fails missing schema version", () => {
    expect(verifyMarketSchema({ ...createVerificationFixture().observation, schema_version: "" })).toMatchObject({
      status: "FAILED",
      failure_reason: "SCHEMA_VERSION_MISSING",
    });
  });

  it("fails unsupported schema version", () => {
    expect(verifyMarketSchema({ ...createVerificationFixture().observation, schema_version: "1.0.0" })).toMatchObject({
      status: "FAILED",
      failure_reason: "SCHEMA_VERSION_UNSUPPORTED",
    });
  });

  it("fails missing raw values", () => {
    expect(verifyMarketSchema({ ...createVerificationFixture().observation, raw_values: undefined })).toMatchObject({
      status: "FAILED",
      failure_reason: "RAW_VALUES_MISSING",
    });
  });

  it("fails missing timestamp", () => {
    expect(verifyObservationTimestamps({ ...createVerificationFixture().observation, timestamp: "" })).toMatchObject({
      status: "FAILED",
      failure_reason: "TIMESTAMP_MISSING",
    });
  });

  it("fails invalid timestamp", () => {
    expect(verifyObservationTimestamps({ ...createVerificationFixture().observation, timestamp: "nope" })).toMatchObject({
      status: "FAILED",
      failure_reason: "TIMESTAMP_INVALID",
    });
  });

  it("fails missing received_at", () => {
    expect(verifyObservationTimestamps({ ...createVerificationFixture().observation, raw_values: {} })).toMatchObject({
      status: "FAILED",
      failure_reason: "RECEIVED_AT_MISSING",
    });
  });

  it("fails invalid received_at", () => {
    expect(
      verifyObservationTimestamps({
        ...createVerificationFixture().observation,
        raw_values: { ...createVerificationFixture().observation.raw_values, received_at: "nope" },
      }),
    ).toMatchObject({ status: "FAILED", failure_reason: "RECEIVED_AT_INVALID" });
  });

  it("passes valid ownership", () => {
    const { observation, ownership } = createVerificationFixture();

    expect(verifyObservationOwnership(observation, ownership)).toMatchObject({ status: "PASSED" });
  });

  it("fails missing ownership", () => {
    expect(verifyObservationOwnership(createVerificationFixture().observation)).toMatchObject({
      status: "FAILED",
      failure_reason: "OWNERSHIP_MISSING",
    });
  });

  it("fails missing ownership hash", () => {
    const { observation, ownership } = createVerificationFixture();

    expect(verifyObservationOwnership({ ...observation, ownership_hash: "" }, ownership)).toMatchObject({
      status: "FAILED",
      failure_reason: "OWNERSHIP_HASH_MISSING",
    });
  });

  it("fails ownership hash mismatch", () => {
    const { observation, ownership } = createVerificationFixture();

    expect(verifyObservationOwnership(observation, { ...ownership, ownership_hash: "manual" })).toMatchObject({
      status: "FAILED",
      failure_reason: "OWNERSHIP_HASH_MISMATCH",
    });
  });

  it("fails nullable ownership", () => {
    const { observation, ownership } = createVerificationFixture();

    expect(verifyObservationOwnership(observation, { ...ownership, owner_id: null })).toMatchObject({
      status: "FAILED",
      failure_reason: "OWNERSHIP_NULLABLE",
    });
  });

  it("fails inherited ownership", () => {
    const { observation, ownership } = createVerificationFixture();

    expect(verifyObservationOwnership(observation, { ...ownership, inherited_from: "other" })).toMatchObject({
      status: "FAILED",
      failure_reason: "OWNERSHIP_INHERITED",
    });
  });

  it("fails missing required field through engine", () => {
    const { observation, ownership } = createVerificationFixture();

    expect(engineWithSource().verifyObservation({ observation: { ...observation, participant: "" }, ownership }).result).toMatchObject({
      status: "BLOCKED",
      failed_stage: "SCHEMA_VALIDATION",
    });
  });

  it("controls exact duplicates", () => {
    const { observation, ownership } = createVerificationFixture();
    const engine = engineWithSource();

    expect(engine.verifyObservation({ observation, ownership }).result.status).toBe("VERIFIED");
    expect(engine.verifyObservation({ observation, ownership }).result).toMatchObject({
      status: "BLOCKED",
      failed_stage: "DUPLICATE_CONTROL",
      failure_reason: "DUPLICATE_ALREADY_SEEN",
    });
  });

  it("duplicate behavior is deterministic", () => {
    const { observation } = createVerificationFixture();
    const left = createDuplicateController();
    const right = createDuplicateController();

    left.record(observation);
    right.record(observation);

    expect(left.check(observation)).toEqual(right.check(observation));
  });

  it("verification result is reproducible", () => {
    const { observation, ownership } = createVerificationFixture();

    expect(engineWithSource().verifyObservation({ observation, ownership }).result).toEqual(
      engineWithSource().verifyObservation({ observation, ownership }).result,
    );
  });

  it("creates failure record when verification fails", () => {
    const { observation, ownership } = createVerificationFixture();
    const result = engineWithSource(createVerificationSource({ status: "DISABLED" })).verifyObservation({ observation, ownership });

    expect(result.failureRecord).toMatchObject({
      failed_stage: "SOURCE_VALIDATION",
      failure_reason: "SOURCE_DISABLED",
    });
  });

  it("grants store authorization only for VERIFIED observations", () => {
    const { observation, ownership } = createVerificationFixture();

    expect(engineWithSource().authorizeForStore(engineWithSource().verifyObservation({ observation, ownership }).result)).toEqual({
      status: "AUTHORIZED",
    });
  });

  it("denies store authorization for BLOCKED observations", () => {
    expect(authorizeVerifiedObservationForStore({ ...engineWithSource().verifyObservation(createVerificationFixture()).result, status: "BLOCKED" })).toMatchObject({
      status: "DENIED",
    });
  });

  it("denies store authorization for FAILED observations", () => {
    expect(authorizeVerifiedObservationForStore({ ...engineWithSource().verifyObservation(createVerificationFixture()).result, status: "FAILED" })).toMatchObject({
      status: "DENIED",
    });
  });
});

describe("EdgeBook Phase 1.5 verification boundaries", () => {
  it("denies unverified observation store authorization", () => {
    expect(authorizeVerifiedObservationForStore(undefined)).toMatchObject({ status: "DENIED" });
  });

  it("blocks invalid observation", () => {
    const { observation, ownership } = createVerificationFixture();

    expect(engineWithSource().verifyObservation({ observation: { ...observation, market_type: "UNKNOWN" }, ownership }).result).toMatchObject({
      status: "BLOCKED",
    });
  });

  it("makes failed validation observable", () => {
    const { observation, ownership } = createVerificationFixture();
    const engine = engineWithSource(createVerificationSource({ status: "BLOCKED" }));

    engine.verifyObservation({ observation, ownership });

    expect(engine.listFailures()).toHaveLength(1);
    expect(engine.listEvents().map((event) => event.event_type)).toEqual(
      expect.arrayContaining(["SOURCE_VERIFICATION_FAILED", "VERIFICATION_FAILURE_RECORDED", "OBSERVATION_BLOCKED"]),
    );
  });

  it("does not expose recommendation, prediction, edge scoring, or wager logic", async () => {
    const moduleExports = await import("@/src/modules/verification");
    const exportedNames = Object.keys(moduleExports).join(" ").toLowerCase();

    expect(exportedNames).not.toContain("recommendation");
    expect(exportedNames).not.toContain("prediction");
    expect(exportedNames).not.toContain("edgescore");
    expect(exportedNames).not.toContain("wager");
  });

  it("verification events do not trigger betting or recommendation action", () => {
    const event = createVerificationEvent({
      verification_id: "verification_1",
      observation_id: "observation_1",
      event_type: "OBSERVATION_VERIFIED",
      reason: "Observation verified.",
      version: "1.5",
    });

    expect(Object.keys(event).join(" ").toLowerCase()).not.toContain("bet");
    expect(Object.keys(event).join(" ").toLowerCase()).not.toContain("recommendation");
  });
});
