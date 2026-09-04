import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(process.cwd(), "services/learning-constitution/knowledgeExplanationService.ts"), "utf8");

describe("knowledge explanation architecture", () => {
  it("assembles read-only trace data without lifecycle, policy, or authority mutation", () => {
    expect(source).toContain("KnowledgeAuditLedger");
    expect(source).toContain("findLatestReviewByKnowledgeId");
    expect(source).not.toMatch(/\.create\(|transitionLifecycle|\.activate\(|\.reactivate\(|from\s+.*authority/i);
    expect(source).not.toMatch(/execute|grantPermission|changeAuthority/i);
  });
});
