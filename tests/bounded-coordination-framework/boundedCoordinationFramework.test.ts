import { describe, expect, it } from "vitest";

import { buildBoundedCoordinationFramework } from "@/services/bounded-coordination-framework";
import { buildBoundedCoordinationFixture } from "./helpers";

describe("boundedCoordinationFramework", () => {
  it("builds deterministic bounded coordination legality records", () => {
    const { input } = buildBoundedCoordinationFixture();
    const first = buildBoundedCoordinationFramework(input);
    const second = buildBoundedCoordinationFramework(input);
    expect(first.frameworkHash).toBe(second.frameworkHash);
    expect(first.derivedOnly).toBe(true);
  });
});
