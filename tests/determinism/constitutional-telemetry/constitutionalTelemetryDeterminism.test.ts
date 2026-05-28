import { describe, expect, it } from "vitest";
import { buildConstitutionalTelemetryFixture } from "@/tests/integration/constitutional-telemetry/helpers";

describe("constitutional telemetry determinism", () => {
  it("keeps evidence and lineage hashes stable for identical inputs", () => {
    const first = buildConstitutionalTelemetryFixture();
    const second = buildConstitutionalTelemetryFixture();

    expect(first.result.evidence.evidenceHash).toBe(second.result.evidence.evidenceHash);
    expect(first.result.lineage.lineageHash).toBe(second.result.lineage.lineageHash);
  });
});
