import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(process.cwd(), "services/learning-constitution/operationalPolicyRollbackService.ts"), "utf8");

describe("operational policy rollback architecture", () => {
  it("requires independent rollback authorization and cannot mutate constitutional rules", () => {
    expect(source).toContain("PolicyRollbackAuthorizer");
    expect(source).toContain("CONSTITUTION_MUTATION_PROHIBITED");
    expect(source).not.toMatch(/knowledgeAdmission|learningDecision|from\s+.*authority/i);
  });
});
