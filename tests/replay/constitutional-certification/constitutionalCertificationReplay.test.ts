import { describe, expect, it } from "vitest";
import { buildConstitutionalCertificationFixture } from "@/tests/integration/constitutional-certification/helpers";

describe("constitutional certification replay", () => {
  it("fails closed when replay determinism degrades", () => {
    const base = buildConstitutionalCertificationFixture();
    const fixture = buildConstitutionalCertificationFixture({
      constitutionalReplayResult: {
        ...base.input.constitutionalReplayResult,
        record: {
          ...base.input.constitutionalReplayResult.record,
          replayDeterministic: false,
        },
        integrityReport: {
          ...base.input.constitutionalReplayResult.integrityReport,
          replayDeterministic: false,
        },
      },
    });

    expect(fixture.result.report.decision).toBe("REPLAY_FAILURE");
    expect(fixture.result.errors.some((error) => error.code === "CONSTITUTIONAL_CERTIFICATION_REPLAY_NONDETERMINISM")).toBe(true);
  });
});
