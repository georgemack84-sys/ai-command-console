import { describe, expect, it } from "vitest";
import { buildAntiEmergenceFixture } from "@/tests/integration/anti-emergence/helpers";

describe("anti-emergence containment unit", () => {
  it("is deterministic for identical inputs", () => {
    const first = buildAntiEmergenceFixture();
    const second = buildAntiEmergenceFixture();

    expect(first.result.deterministicHash).toBe(second.result.deterministicHash);
    expect(first.result.forensicExport.exportHash).toBe(second.result.forensicExport.exportHash);
  });

  it("tightens restrictions on hidden retry persistence", () => {
    const fixture = buildAntiEmergenceFixture({
      metadata: Object.freeze({ hiddenRetryPersistence: true }),
    });

    expect(["elevated", "frozen", "disputed", "invalid", "revoked"]).toContain(fixture.result.record.classification);
  });
});
