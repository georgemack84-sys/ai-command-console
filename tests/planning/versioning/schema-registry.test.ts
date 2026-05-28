import { describe, expect, it } from "vitest";

import { getSchemaRegistry, getSchemaRegistryEntry } from "@/services/planning/versioning";

describe("schema registry", () => {
  it("supports schema version lookup", () => {
    expect(getSchemaRegistryEntry("4.2I")?.version).toBe("4.2I");
    expect(getSchemaRegistry().length).toBeGreaterThan(0);
  });
});
