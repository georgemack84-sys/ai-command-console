import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(process.cwd(), "services/learning-constitution/knowledgeReviewWorkQueueService.ts"), "utf8");

describe("review work queue architecture", () => {
  it("tracks review work without executing reviews or changing knowledge lifecycle", () => {
    expect(source).toContain("KnowledgeReviewWorkQueueRepository");
    expect(source).toContain("KnowledgeReviewRepository");
    expect(source).not.toMatch(/transitionLifecycle|\.supersede\(|\.registerException\(|from\s+.*authority/i);
    expect(source).not.toMatch(/execute|grantPermission|changeAuthority/i);
  });
});
