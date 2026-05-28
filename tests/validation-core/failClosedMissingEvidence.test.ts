import { describe, expect, it } from "vitest";
import { buildExecutionTreatyFixture } from "@/tests/execution-treaty/helpers";
import { buildValidationFixture } from "./helpers";

describe("fail closed missing evidence", () => {
  it("denies when treaty, replay, governance, or integrity evidence is missing", () => {
    const treaty = buildExecutionTreatyFixture().treaty;
    const fixture = buildValidationFixture({
      treaty: {
        ...treaty,
        manifest: {
          ...treaty.manifest,
          governanceSnapshotHash: "",
          replaySnapshotHash: "",
        },
        evidence: {
          ...treaty.evidence,
          productionCertification: {
            ...treaty.evidence.productionCertification,
            certificationHash: "",
          },
        },
      },
    });

    expect(fixture.output.result.status).not.toBe("approved");
    expect(fixture.output.result.status === "denied" || fixture.output.result.status === "invalid" || fixture.output.result.status === "disputed" || fixture.output.result.status === "revalidation-required").toBe(true);
  });
});
