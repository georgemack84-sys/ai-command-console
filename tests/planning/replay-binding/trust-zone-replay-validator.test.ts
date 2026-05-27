import { describe, expect, it } from "vitest";

import { validateTrustZoneReplay } from "@/services/planning/replay-binding";
import { buildReplayBindingFixture } from "@/tests/planning/replay-binding/helpers";

describe("trust-zone replay validator", () => {
  it("fails closed on trust-zone mismatch", () => {
    const fixture = buildReplayBindingFixture({
      trustZoneId: "CRITICAL",
    });
    const result = validateTrustZoneReplay(fixture);
    expect(result.valid).toBe(false);
    expect(result.failures.some((failure) => failure.code === "TRUST_ZONE_REPLAY_MISMATCH")).toBe(true);
  });
});
