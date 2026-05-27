import { describe, expect, it } from "vitest";
import { buildGovernanceDriftFixture } from "@/tests/integration/governance-drift/helpers";

describe("governance drift fail-closed inheritance", () => {
  it("inherits upstream fail-closed state", () => {
    const upstream = buildGovernanceDriftFixture().input.replayAttackResult;
    const forced = Object.freeze({
      ...upstream,
      record: Object.freeze({
        ...upstream.record,
        failClosed: true,
      }),
    });
    const result = buildGovernanceDriftFixture({
      replayAttackResult: forced,
    }).result;

    expect(result.record.failClosed).toBe(true);
    expect(result.record.driftState).toBe("FAIL_CLOSED");
  });
});
