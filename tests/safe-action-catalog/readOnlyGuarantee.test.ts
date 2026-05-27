import { describe, expect, it } from "vitest";

import { assertSafeActionSourceIsReadOnly, deriveSafeActionProfile } from "@/services/safe-action-catalog";
import { loadSafeActionCatalogSources, buildSafeActionFixture } from "./helpers";

describe("safeAction read-only guarantees", () => {
  it("does not mutate input readiness profiles", () => {
    const { readinessProfile } = buildSafeActionFixture();
    const before = JSON.stringify(readinessProfile);
    deriveSafeActionProfile({
      readinessProfile,
      actionId: "safe-action:observe",
    });
    expect(JSON.stringify(readinessProfile)).toBe(before);
  });

  it("does not import execution or orchestration behavior", () => {
    const sources = loadSafeActionCatalogSources();
    for (const source of sources) {
      if (source.path.endsWith("safeActionGuards.ts")) {
        continue;
      }
      expect(assertSafeActionSourceIsReadOnly(source.content)).toEqual([]);
    }
  });
});
