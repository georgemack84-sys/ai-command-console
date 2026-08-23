import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(process.cwd(), "services/learning-constitution/knowledgeRevalidationService.ts"), "utf8");

describe("revalidation architecture", () => {
  it("records review evidence without lifecycle or authority mutation", () => {
    expect(source).toContain("KnowledgeReviewRepository");
    expect(source).toContain("KnowledgeAuditLedger");
    expect(source).not.toMatch(/transitionLifecycle|\.supersede\(|\.registerException\(|from\s+.*authority/i);
    expect(source).not.toMatch(/execute|grantPermission|changeAuthority/i);
  });
});
