import { describe, expect, it } from "vitest";
import { buildConstitutionalReadinessGateFixture } from "./helpers";

describe("buildConstitutionalAutonomyReadinessGate", () => {
  it("builds a deterministic derived-only readiness certification", () => {
    const first = buildConstitutionalReadinessGateFixture();
    const second = buildConstitutionalReadinessGateFixture();

    expect(first.gate.derivedOnly).toBe(true);
    expect(first.gate.certification.derivedOnly).toBe(true);
    expect(first.gate.readinessHash).toBe(second.gate.readinessHash);
  });
});
