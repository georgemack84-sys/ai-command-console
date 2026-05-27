import { describe, expect, it } from "vitest";

import { buildReplayBindingReadiness } from "@/services/planning/replay-binding";
import { buildReplayBindingFixture } from "@/tests/planning/replay-binding/helpers";

describe("replay revocation coordinator", () => {
  it("cascades admission revocation into replay revocation", () => {
    const fixture = buildReplayBindingFixture();
    (fixture.admissionReadiness as { result: typeof fixture.admissionReadiness.result }).result = {
      ...fixture.admissionReadiness.result,
      decision: "DENIED",
    };
    const readiness = buildReplayBindingReadiness(fixture);
    expect(readiness.certification.certificationStatus).toBe("REVOKED");
    expect(readiness.revocation?.revokedBecause).toBe("ADMISSION_REVOKED");
  });
});
