import { describe, expect, it } from "vitest";
import { nuruHeadlineWorkflowTemplate, validateNuruHeadlineWorkflowTemplate } from "@/src/server/services/nuru-headline-workflow-template";
import { simulateWorkflowDefinition } from "@/src/server/services/workflow-simulation-service";

describe("Nuru Track 3 governed workflow qualification", () => {
  it("simulates the immutable Nuru-to-Headline Flow without dispatch and preserves the approval boundary", async () => {
    const validation = validateNuruHeadlineWorkflowTemplate();
    expect(validation.valid).toBe(true);
    const simulation = await simulateWorkflowDefinition("workspace-1", nuruHeadlineWorkflowTemplate.definition, {
      list: async () => [
        { applicationSlug: "nuru", lifecycleState: "ACTIVE", capabilities: [{ capabilityKey: "evidence.retrieve", version: "1.0" }] },
        { applicationSlug: "headline-flow", lifecycleState: "ACTIVE", capabilities: [{ capabilityKey: "headline.draft", version: "1.0" }] },
      ],
    });
    expect(simulation).toMatchObject({ admissible: true, externalDispatchPerformed: false });
    expect(nuruHeadlineWorkflowTemplate.definition.steps.map((step) => step.approvalPolicy.mode)).toEqual(["NONE", "REQUIRED"]);
  });
});
