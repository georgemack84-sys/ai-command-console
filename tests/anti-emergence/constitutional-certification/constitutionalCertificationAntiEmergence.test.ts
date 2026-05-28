import { describe, expect, it } from "vitest";
import { buildConstitutionalCertificationFixture } from "@/tests/integration/constitutional-certification/helpers";

describe("constitutional certification anti-emergence", () => {
  it("rejects recursive coordination and hidden execution emergence", () => {
    const base = buildConstitutionalCertificationFixture();
    const fixture = buildConstitutionalCertificationFixture({
      antiEmergenceResult: {
        ...base.input.antiEmergenceResult,
        signals: Object.freeze([
          ...base.input.antiEmergenceResult.signals,
          {
            domain: "recursive_coordination",
            triggered: true,
            severity: "critical",
            reason: "Recursive coordination loop detected.",
            deterministicHash: "forced-recursive-hash",
          },
        ]),
      },
    });

    expect(fixture.result.report.decision).toBe("EMERGENCE_RISK");
  });
});
