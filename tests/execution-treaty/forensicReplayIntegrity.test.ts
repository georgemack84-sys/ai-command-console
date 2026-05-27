import { describe, expect, it } from "vitest";
import { bindTreatyForensics } from "@/services/execution-treaty";
import { buildExecutionTreatyFixture } from "./helpers";

describe("forensic replay integrity", () => {
  it("reconstructs deterministic forensic replay references", () => {
    const { input } = buildExecutionTreatyFixture();
    const first = bindTreatyForensics({
      scenarioId: "forensic-treaty",
      failureInput: input.failureInput,
      failureResult: input.failureState,
      adversarialCertificationHash: input.trustCertification.resultHash,
    });
    const second = bindTreatyForensics({
      scenarioId: "forensic-treaty",
      failureInput: input.failureInput,
      failureResult: input.failureState,
      adversarialCertificationHash: input.trustCertification.resultHash,
    });

    expect(first).toEqual(second);
  });
});
