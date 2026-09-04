import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(process.cwd(), "services/learning-constitution/operationalPolicyEffectivenessService.ts"), "utf8");

describe("operational policy effectiveness architecture", () => {
  it("compares reports without policy, lifecycle, or authority mutation", () => {
    expect(source).toContain("policyRepository.getActive");
    expect(source).not.toMatch(/\.activate\(|\.reactivate\(|transitionLifecycle|from\s+.*authority/i);
    expect(source).not.toMatch(/execute|grantPermission|changeAuthority/i);
  });
});
