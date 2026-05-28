import { describe, expect, it } from "vitest";
import { buildEventIntegrityChain, verifyEventIntegrityChain } from "@/services/validation-core";
import { buildValidationFixture } from "./helpers";

describe("event hash integrity", () => {
  it("detects tampered payload or metadata", () => {
    const fixture = buildValidationFixture();
    const chain = buildEventIntegrityChain(fixture.output.events);
    const tampered = fixture.output.events.map((event, index) => index === 0 ? { ...event, payloadHash: "tampered" } : event);

    expect(verifyEventIntegrityChain(tampered, chain).valid).toBe(false);
  });
});
