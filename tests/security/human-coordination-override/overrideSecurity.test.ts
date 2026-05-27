import { describe, expect, it } from "vitest";

import { buildHumanCoordinationOverrideFixture } from "@/tests/integration/human-coordination-override/helpers";

describe("human override security", () => {
  it("rejects unauthorized operators and authority inheritance", () => {
    const fixture = buildHumanCoordinationOverrideFixture({
      authenticated: false,
      governanceAuthorized: false,
      roles: [],
      metadata: Object.freeze({ authorityInheritance: true }),
    });
    expect(fixture.result.errors.map((error) => error.code)).toEqual(expect.arrayContaining([
      "HUMAN_COORDINATION_OVERRIDE_UNAUTHORIZED",
      "HUMAN_COORDINATION_OVERRIDE_AUTHORITY_INHERITANCE",
    ]));
  });
});
