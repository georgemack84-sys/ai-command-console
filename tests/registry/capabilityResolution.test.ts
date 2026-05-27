import { describe, expect, it } from "vitest";

import { resolveToolCapability } from "@/services/registry/toolCapabilityResolver";

describe("capabilityResolution", () => {
  it("matches canonical capabilities through the registry", () => {
    const resolved = resolveToolCapability("filesystem.read.file");
    expect(resolved.capabilityMatch).toBe(true);
    expect(resolved.entry?.toolId).toBe("read_file");
  });
});
