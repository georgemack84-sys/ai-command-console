import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(process.cwd(), "services/learning-constitution/auditIntegrityVerifier.ts"), "utf8");

describe("audit integrity architecture", () => {
  it("verifies audit state without repair, deletion, or authority dependencies", () => {
    expect(source).toContain("findIntegrityEntries");
    expect(source).toContain("hashAuditEvent");
    expect(source).not.toMatch(/\.append\(|repair|delete|from\s+.*authority/i);
    expect(source).not.toMatch(/execute|grantPermission|changeAuthority/i);
  });
});
