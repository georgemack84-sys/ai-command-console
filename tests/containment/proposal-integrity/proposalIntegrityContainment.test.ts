import { describe, expect, it } from "vitest";
import { buildProposalIntegrityFixture } from "@/tests/integration/proposal-integrity/helpers";

describe("proposal integrity containment", () => {
  it("uncertainty increases oversight", () => {
    const fixture = buildProposalIntegrityFixture({
      metadata: Object.freeze({ uncertaintyAmplified: true }),
    });
    expect(fixture.result.errors.length).toBeGreaterThan(0);
  });
});
