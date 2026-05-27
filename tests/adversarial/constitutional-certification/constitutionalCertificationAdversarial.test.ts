import { describe, expect, it } from "vitest";
import { buildConstitutionalCertificationFixture } from "@/tests/integration/constitutional-certification/helpers";

describe("constitutional certification adversarial", () => {
  it("rejects hidden execution and authority crossover markers", () => {
    const fixture = buildConstitutionalCertificationFixture({
      metadata: Object.freeze({
        toolInvocation: true,
        selfCertification: true,
      }),
    });

    expect(fixture.result.errors.some((error) => error.code === "CONSTITUTIONAL_CERTIFICATION_HIDDEN_EXECUTION")).toBe(true);
    expect(fixture.result.errors.some((error) => error.code === "CONSTITUTIONAL_CERTIFICATION_AUTHORITY_CROSSOVER")).toBe(true);
  });
});
