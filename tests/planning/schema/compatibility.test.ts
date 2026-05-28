import { describe, expect, it } from "vitest";

import { getCurrentCanonicalSchema, getSchemaByVersion } from "@/services/planning/schema/schema-registry";
import { resolveSchemaVersion } from "@/services/planning/schema/schema-version-resolver";

describe("schema compatibility", () => {
  it("accepts current schema version", () => {
    const current = getCurrentCanonicalSchema();
    const result = resolveSchemaVersion(current.version);
    expect(result.supported).toBe(true);
    expect(result.version).toBe(current.version);
  });

  it("rejects unknown future version", () => {
    const result = resolveSchemaVersion("99.0.0");
    expect(result.supported).toBe(false);
    expect(result.reason).toBe("unsupported_version");
  });

  it("rejects incompatible major version", () => {
    const result = resolveSchemaVersion("2.0.0");
    expect(result.supported).toBe(false);
  });

  it("handles deprecated version according to registry rules", () => {
    const deprecated = getSchemaByVersion("1.0.1");
    expect(deprecated?.deprecated).toBe(true);
    const result = resolveSchemaVersion("1.0.1");
    expect(result.supported).toBe(true);
    expect(result.deprecated).toBe(true);
  });

  it("validates compatibility matrix behavior", () => {
    const result = resolveSchemaVersion("1.0.1");
    expect(result.resolvedVersion).toBe("1.0.1");
  });
});

