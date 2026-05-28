import { describe, expect, it } from "vitest";

import { buildCoordinationReadinessFixture } from "@/tests/integration/coordination-readiness-certification/helpers";

describe("coordination readiness fail-closed behavior", () => {
  it("fails closed when upstream boundary enforcement is already fail-closed", () => {
    const fixture = buildCoordinationReadinessFixture({
      metadata: Object.freeze({ repairReplay: true, execute: true }),
    });
    expect(fixture.result.record.certificationState).toBe("FAIL_CLOSED");
    expect(fixture.result.record.failClosed).toBe(true);
  });
});
