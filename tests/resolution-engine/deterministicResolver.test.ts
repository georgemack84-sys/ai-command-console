import { describe, expect, it } from "vitest";

import { resolveExecutionBinding } from "@/services/resolution-engine";
import { buildResolutionFixture } from "./helpers";

describe("deterministic resolver", () => {
  it("resolves an exact tool id and exact version successfully", () => {
    const result = resolveExecutionBinding(buildResolutionFixture());

    expect(result.ok).toBe(true);
    expect(result.binding?.toolId).toBe("filesystem.write");
    expect(result.binding?.toolVersion).toBe("1.0.0");
  });

  it("fails closed when the tool is missing", () => {
    const fixture = buildResolutionFixture();

    const result = resolveExecutionBinding({
      ...fixture,
      request: {
        ...fixture.request,
        requestedTool: "filesystem.writ",
      },
    });
    expect(result.ok).toBe(false);
    expect(result.failures[0]?.code).toBe("TOOL_NOT_FOUND");
  });

  it("fails closed when the version is wrong", () => {
    const fixture = buildResolutionFixture();

    const result = resolveExecutionBinding({
      ...fixture,
      request: {
        ...fixture.request,
        requestedVersion: "latest",
      },
    });
    expect(result.ok).toBe(false);
    expect(result.failures[0]?.code).toBe("TOOL_VERSION_MISMATCH");
  });

  it("fails closed on semantic alias attempts", () => {
    const fixture = buildResolutionFixture();

    const result = resolveExecutionBinding({
      ...fixture,
      request: {
        ...fixture.request,
        requestedTool: "filesystem_write",
      },
    });
    expect(result.ok).toBe(false);
    expect(result.failures[0]?.code).toBe("TOOL_NOT_FOUND");
  });
});
