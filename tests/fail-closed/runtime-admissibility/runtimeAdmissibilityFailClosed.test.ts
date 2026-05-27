import { describe, expect, it } from "vitest";
import { buildRuntimeAdmissibilityFixture } from "@/tests/integration/runtime-admissibility/helpers";

describe("runtime admissibility fail-closed", () => {
  it("freezes on rollback ambiguity", () => {
    const fixture = buildRuntimeAdmissibilityFixture({
      rollbackSnapshot: Object.freeze({
        checkpointId: "checkpoint-2",
        checkpointState: "checkpoint:stable",
        ledgerEvents: Object.freeze([
          Object.freeze({
            eventPayload: Object.freeze({
              checkpointState: "checkpoint:diverged",
            }),
          }),
        ]),
        rollbackHash: "rollback-hash-diverged",
      }),
    });

    expect(fixture.result.errors.some((error) => error.code === "RUNTIME_ADMISSIBILITY_ROLLBACK_AMBIGUOUS")).toBe(true);
    expect(fixture.result.record.failClosed).toBe(true);
  });
});
