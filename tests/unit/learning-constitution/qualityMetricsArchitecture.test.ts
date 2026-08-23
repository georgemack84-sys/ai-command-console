import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(process.cwd(), "services/learning-constitution/knowledgeQualityMetricsService.ts"), "utf8");

describe("quality metrics architecture", () => {
  it("aggregates read-only sources without learning, lifecycle, or authority operations", () => {
    expect(source).toContain("KnowledgeQualityMetricsDependencies");
    expect(source).toContain("findAll");
    expect(source).not.toMatch(/\.create\(|transitionLifecycle|\.supersede\(|\.registerException\(|from\s+.*authority/i);
    expect(source).not.toMatch(/execute|grantPermission|changeAuthority/i);
  });
});
