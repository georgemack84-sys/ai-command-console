import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(process.cwd(), "services/learning-constitution/knowledgeRetirementService.ts"), "utf8");

describe("retirement architecture", () => {
  it("uses lifecycle and audit boundaries without deletion or authority dependencies", () => {
    expect(source).toContain("KnowledgeLifecycleRepository");
    expect(source).toContain("KnowledgeAuditLedger");
    expect(source).not.toMatch(/repository\.delete|from\s+.*authority/i);
    expect(source).not.toMatch(/execute|grantPermission|changeAuthority/i);
  });
});
