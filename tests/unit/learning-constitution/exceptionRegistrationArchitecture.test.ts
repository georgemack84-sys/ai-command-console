import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(
  resolve(process.cwd(), "services/learning-constitution/knowledgeExceptionRegistrationService.ts"),
  "utf8",
);

describe("exception registration architecture", () => {
  it("uses explicit lifecycle and audit boundaries without authority dependencies", () => {
    expect(source).toContain("KnowledgeLifecycleRepository");
    expect(source).toContain("KnowledgeAuditLedger");
    expect(source).toContain("KNOWLEDGE_EXCEPTION_REGISTERED");
    expect(source).not.toMatch(/from\s+.*authority/i);
    expect(source).not.toMatch(/execute|grantPermission|changeAuthority/i);
  });
});
