import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(process.cwd(), "services/learning-constitution/operationalPolicyActivationService.ts"), "utf8");

describe("operational policy activation architecture", () => {
  it("requires separate activation authorization and explicitly prohibits constitutional mutation", () => {
    expect(source).toContain("PolicyActivatorAuthorizer");
    expect(source).toContain("CONSTITUTION_MUTATION_PROHIBITED");
    expect(source).toContain("APPROVED_FOR_POLICY_CHANGE");
    expect(source).not.toMatch(/learningDecision|knowledgeAdmission|from\s+.*authority/i);
  });
});
