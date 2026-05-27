import { describe, expect, it } from "vitest";

import { buildConstitutionalCoordinationFixture } from "@/tests/integration/constitutional-coordination/helpers";
import { buildContainmentFixture } from "@/tests/coordination-containment/helpers";
import { buildCoordinationContainmentRecord } from "@/services/coordination-containment";

describe("constitutional coordination replay ambiguity rejection", () => {
  it("fails closed on replay ambiguity inherited from containment", () => {
    const containmentFixture = buildContainmentFixture();
    const ambiguousContainment = buildCoordinationContainmentRecord({
      ...containmentFixture.input,
      missionGraph: {
        ...containmentFixture.input.missionGraph,
        replayPaths: Object.freeze([]),
      },
    });
    const fixture = buildConstitutionalCoordinationFixture({
      containmentRecord: ambiguousContainment,
    });
    expect(fixture.record.validation.failClosed).toBe(true);
  });
});
