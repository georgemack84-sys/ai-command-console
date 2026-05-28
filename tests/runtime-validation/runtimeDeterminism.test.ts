import { describe, expect, it } from "vitest";

import { validateRuntimeEnvironment } from "@/services/runtime-validation";
import { buildRuntimeValidationFixture } from "./helpers";

describe("runtime validation determinism", () => {
  it("produces identical outputs for identical inputs", () => {
    const first = validateRuntimeEnvironment(buildRuntimeValidationFixture());
    const second = validateRuntimeEnvironment(buildRuntimeValidationFixture());

    expect(first).toEqual(second);
  });

  it("keeps validation hash stable when timestamps change", () => {
    const fixture = buildRuntimeValidationFixture();
    const changed = {
      ...fixture,
      activeRuntime: {
        ...fixture.activeRuntime,
        runtime: {
          ...fixture.activeRuntime.runtime,
          authorityLock: {
            ...fixture.activeRuntime.runtime.authorityLock,
            lockedAt: "2030-01-01T00:00:00.000Z",
          },
        },
      },
    };

    const first = validateRuntimeEnvironment(fixture);
    const second = validateRuntimeEnvironment(changed);

    expect(first.validationHash).toBe(second.validationHash);
  });
});
