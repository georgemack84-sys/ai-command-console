import { describe, expect, it } from "vitest";

import { resolveExecutionBinding } from "@/services/resolution-engine";
import { buildResolutionFixture } from "./helpers";

describe("adversarial resolution attempts", () => {
  it("rejects fuzzy names, aliases, and stable tags", () => {
    const attempts = [
      { requestedTool: "filesystem.write ", requestedVersion: "1.0.0" },
      { requestedTool: "filesystem_write", requestedVersion: "1.0.0" },
      { requestedTool: "filesystem.write", requestedVersion: "stable" },
      { requestedTool: "filesystem.write", requestedVersion: "compatible" },
    ];

    for (const attempt of attempts) {
      const fixture = buildResolutionFixture();
      const result = resolveExecutionBinding({
        ...fixture,
        request: {
          ...fixture.request,
          ...attempt,
        },
      });
      expect(result.ok).toBe(false);
    }
  });
});
