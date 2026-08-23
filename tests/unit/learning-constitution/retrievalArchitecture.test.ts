import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(process.cwd(), "services/learning-constitution/knowledgeRetrievalService.ts"), "utf8");

describe("retrieval architecture", () => {
  it("uses the retrieval boundary and cannot change authority or durable state", () => {
    expect(source).toContain("KnowledgeRetrievalRepository");
    expect(source).toContain("findActiveByScope");
    expect(source).not.toMatch(/from\s+.*authority/i);
    expect(source).not.toMatch(/\.create\(|\.supersede\(|\.registerException\(/);
    expect(source).not.toMatch(/execute|grantPermission|changeAuthority/i);
  });
});
