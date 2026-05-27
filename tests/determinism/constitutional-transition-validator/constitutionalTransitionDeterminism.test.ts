import { describe, expect, it } from "vitest";
import { buildConstitutionalTransitionFixture } from "@/tests/integration/constitutional-transition-validator/helpers";
import { validateConstitutionalTransition } from "@/services/constitutional-transition-validator/constitutionalTransitionValidator";

describe("constitutional transition determinism", () => {
  it("produces identical replay hashes for identical inputs", () => {
    const fixture = buildConstitutionalTransitionFixture();
    const second = validateConstitutionalTransition(fixture.input);

    expect(second.replayRecord.replayHash).toBe(fixture.result.replayRecord.replayHash);
    expect(second.lineage.lineageHash).toBe(fixture.result.lineage.lineageHash);
  });
});
