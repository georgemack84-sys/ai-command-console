import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(process.cwd(), "services/learning-constitution/knowledgeFreshnessService.ts"), "utf8");

describe("freshness architecture", () => {
  it("uses policy and review data without lifecycle, persistence, or authority mutation", () => {
    expect(source).toContain("KnowledgeReviewPolicy");
    expect(source).toContain("KnowledgeFreshnessAssessment");
    expect(source).not.toMatch(/\.create\(|transitionLifecycle|\.supersede\(|\.registerException\(|from\s+.*authority/i);
    expect(source).not.toMatch(/execute|grantPermission|changeAuthority/i);
  });
});
