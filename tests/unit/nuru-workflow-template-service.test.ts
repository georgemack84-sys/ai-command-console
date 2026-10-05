import { describe, expect, it } from "vitest";
import { NuruWorkflowTemplateService } from "@/src/server/services/nuru-workflow-template-service";

describe("Nuru workflow templates", () => {
  it("selects conflict before authority and preserves human review", () => {
    const template = NuruWorkflowTemplateService.select({ sourceAuthority: "OWNER", content: "This supersedes a conflicting architecture decision.", contentLength: 55 });
    expect(template).toMatchObject({ id: "CONFLICT_PATH", requiresHumanReview: true });
    expect(template.stages).toContain("CONFLICT_ANALYSIS");
  });
  it("selects high-authority, standard, and fast templates deterministically", () => {
    expect(NuruWorkflowTemplateService.select({ sourceAuthority: "OWNER", content: "Owner decision.", contentLength: 15 }).id).toBe("HIGH_AUTHORITY_PATH");
    expect(NuruWorkflowTemplateService.select({ sourceAuthority: "HIGH", content: "Governance requirement.", contentLength: 23 }).id).toBe("STANDARD_PATH");
    expect(NuruWorkflowTemplateService.select({ sourceAuthority: "MODERATE", content: "A short sourced note.", contentLength: 20 }).id).toBe("FAST_PATH");
  });
});
