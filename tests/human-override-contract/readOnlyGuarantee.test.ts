import { describe, expect, it } from "vitest";

import { assertOverrideSourcesAreReadOnly, buildOverrideContract } from "@/services/human-override-contract";
import { buildOverrideFixture, loadOverrideContractSources } from "./helpers";

describe("override read-only guarantees", () => {
  it("does not mutate source inputs", () => {
    const { input } = buildOverrideFixture();
    const before = JSON.stringify(input);
    buildOverrideContract(input);
    expect(JSON.stringify(input)).toBe(before);
  });

  it("does not import execution or orchestration behavior", () => {
    const sources = loadOverrideContractSources();
    for (const source of sources) {
      if (source.path.endsWith("overrideGuards.ts")) {
        continue;
      }
      expect(assertOverrideSourcesAreReadOnly(source.content)).toEqual([]);
    }
  });
});
