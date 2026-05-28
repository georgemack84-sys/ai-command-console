import { describe, expect, it } from "vitest";

import { assertCoordinationSourcesAreReadOnly, buildBoundedCoordinationFramework } from "@/services/bounded-coordination-framework";
import { buildBoundedCoordinationFixture, loadBoundedCoordinationSources } from "./helpers";

describe("bounded coordination read-only guarantees", () => {
  it("does not mutate source inputs", () => {
    const { input } = buildBoundedCoordinationFixture();
    const before = JSON.stringify(input);
    buildBoundedCoordinationFramework(input);
    expect(JSON.stringify(input)).toBe(before);
  });

  it("does not import execution or orchestration behavior", () => {
    const sources = loadBoundedCoordinationSources();
    for (const source of sources) {
      if (source.path.endsWith("coordinationContainmentGuards.ts")) {
        continue;
      }
      expect(assertCoordinationSourcesAreReadOnly(source.content)).toEqual([]);
    }
  });
});
