import { describe, expect, it } from "vitest";
import { bindReplayRuntime, buildReplayFixture } from "./helpers";

describe("validator binding", () => {
  it("binds replay to original validator hashes and ordering only", () => {
    const fixture = buildReplayFixture();
    const runtime = bindReplayRuntime(fixture.input.validation);

    expect(runtime.validatorBindings).toHaveLength(9);
    expect(runtime.validatorBindings[0]?.validator).toBe("schema");
    expect(runtime.validatorBindings[8]?.validator).toBe("integrity");
  });
});
