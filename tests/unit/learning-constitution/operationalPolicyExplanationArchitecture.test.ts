import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(process.cwd(), "services/learning-constitution/operationalPolicyExplanationService.ts"), "utf8");

describe("operational policy explanation architecture", () => {
  it("assembles policy history without activation, rollback, or authority mutation", () => {
    expect(source).toContain("findAllByPolicyScope");
    expect(source).toContain("KnowledgeAuditLedger");
    expect(source).not.toMatch(/\.activate\(|\.reactivate\(|transitionLifecycle|from\s+.*authority/i);
    expect(source).not.toMatch(/execute|grantPermission|changeAuthority/i);
  });
});
