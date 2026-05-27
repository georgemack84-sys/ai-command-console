import { describe, expect, it } from "vitest";
import { buildAdversarialTelemetryFixture } from "@/tests/integration/adversarial-telemetry/helpers";

describe("adversarial telemetry forensics", () => {
  it("produces deterministic forensic hashes for identical evidence", () => {
    const first = buildAdversarialTelemetryFixture();
    const second = buildAdversarialTelemetryFixture();

    expect(first.result.evidence.evidenceHash).toBe(second.result.evidence.evidenceHash);
    expect(first.result.deterministicHash).toBe(second.result.deterministicHash);
  });
});
