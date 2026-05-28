import { describe, expect, it } from "vitest";
import { buildConstitutionalReadinessScoringFixture } from "@/tests/integration/constitutional-readiness-scoring/helpers";

describe("constitutional readiness scoring adversarial", () => {
  it("rejects certification spoofing and hidden authority crossover", () => {
    const fixture = buildConstitutionalReadinessScoringFixture({
      metadata: Object.freeze({
        certificationAuthority: true,
        implicitApproval: true,
      }),
    });

    expect(fixture.result.errors.some((error) => error.code === "CONSTITUTIONAL_READINESS_AUTHORITY_CROSSOVER")).toBe(true);
  });
});
