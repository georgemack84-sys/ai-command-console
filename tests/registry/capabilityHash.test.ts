import { describe, expect, it } from "vitest";

import { deriveCapabilityHash } from "@/services/registry/capabilityHash";
import { cloneFixture } from "./helpers";

describe("capabilityHash", () => {
  it("is deterministic for identical capability contracts", () => {
    const fixture = cloneFixture();
    const entry = fixture.document.tools.find((candidate) => candidate.toolId === "filesystem.write");
    if (!entry) throw new Error("filesystem.write fixture missing");
    const clone = JSON.parse(JSON.stringify(entry));

    expect(deriveCapabilityHash(entry)).toBe(deriveCapabilityHash(clone));
  });

  it("ignores runtime capability ordering", () => {
    const fixture = cloneFixture();
    const entry = fixture.document.tools.find((candidate) => candidate.toolId === "restart_service");
    if (!entry) throw new Error("restart_service fixture missing");
    const clone = JSON.parse(JSON.stringify(entry));
    clone.runtimeCapabilities = [...clone.runtimeCapabilities].reverse();

    expect(deriveCapabilityHash(entry)).toBe(deriveCapabilityHash(clone));
  });

  it("changes when authoritative capability metadata changes", () => {
    const fixture = cloneFixture();
    const entry = fixture.document.tools.find((candidate) => candidate.toolId === "filesystem.write");
    if (!entry) throw new Error("filesystem.write fixture missing");
    const clone = JSON.parse(JSON.stringify(entry));
    clone.capabilityMetadata.write.scope = ["filesystem", "workspace"];

    expect(deriveCapabilityHash(entry)).not.toBe(deriveCapabilityHash(clone));
  });
});
