import { describe, expect, it } from "vitest";

import { reconstructConstitutionalCoordination } from "@/services/constitutional-replay/replayCoordinationReconstructor";
import { buildConstitutionalCoordinationFixture } from "./helpers";

describe("constitutional coordination deterministic reconstruction", () => {
  it("reconstructs the same record shape deterministically", () => {
    const fixture = buildConstitutionalCoordinationFixture();
    expect(reconstructConstitutionalCoordination(fixture.record)).toBe(
      reconstructConstitutionalCoordination(fixture.record),
    );
  });
});
