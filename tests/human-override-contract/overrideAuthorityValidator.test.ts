import { describe, expect, it } from "vitest";

import { validateOverrideAuthority } from "@/services/human-override-contract";
import { buildOverrideFixture } from "./helpers";

describe("overrideAuthorityValidator", () => {
  it("accepts bounded human override authority without elevation semantics", () => {
    const { input } = buildOverrideFixture();
    const result = validateOverrideAuthority({
      event: input.events[0],
      governanceView: input.governanceView,
    });
    expect(result.authority.valid).toBe(true);
    expect(result.authority.canElevateAuthority).toBe(false);
  });
});
