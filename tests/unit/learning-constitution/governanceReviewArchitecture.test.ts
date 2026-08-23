import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(process.cwd(), "services/learning-constitution/governanceReviewService.ts"), "utf8");

describe("governance review architecture", () => {
  it("requires an external authorizer and cannot mutate policy, constitution, or authority", () => {
    expect(source).toContain("GovernanceReviewerAuthorizer");
    expect(source).toContain("isAuthorized");
    expect(source).not.toMatch(/\bpolicyRepository\b|\bconstitutionRepository\b|transitionLifecycle|from\s+.*authority/i);
    expect(source).not.toMatch(/execute|grantPermission|changeAuthority/i);
  });
});
