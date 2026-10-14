import { describe, expect, it } from "vitest";
import { validateWorkflowDefinition } from "@/src/server/services/workflow-definition-validation-service";

const valid = {
  workflowContractVersion: "1.0",
  inputs: { query: { type: "string", required: true } },
  steps: [
    { key: "collect", capability: { applicationSlug: "nuru", capabilityKey: "knowledge.search", version: "1.0" }, dependsOn: [], inputSchema: { query: { type: "string", required: true } }, outputSchema: { evidence: { type: "object", required: true } }, inputBindings: { query: { kind: "workflow_input", inputKey: "query" } }, timeoutMs: 5000, failurePolicy: { mode: "RETRY", maxAttempts: 2 }, approvalPolicy: { mode: "NONE" } },
    { key: "publish", capability: { applicationSlug: "headline-flow", capabilityKey: "headline.draft", version: "1.0" }, dependsOn: ["collect"], inputSchema: { evidence: { type: "object", required: true } }, outputSchema: {}, inputBindings: { evidence: { kind: "step_output", stepKey: "collect", outputKey: "evidence" } }, timeoutMs: 5000, failurePolicy: { mode: "FAIL", maxAttempts: 1 }, approvalPolicy: { mode: "REQUIRED", reason: "A human approves the external publication." } },
  ],
};

describe("workflow definition validation", () => {
  it("accepts a typed, dependency-ordered cross-application definition without granting authority", () => {
    const result = validateWorkflowDefinition(valid);
    expect(result).toMatchObject({ valid: true, issues: [] });
    expect(result.definition?.steps).toHaveLength(2);
  });

  it("rejects dependency cycles", () => {
    const result = validateWorkflowDefinition({ ...valid, steps: [{ ...valid.steps[0], dependsOn: ["publish"] }, valid.steps[1]] });
    expect(result.issues.some((issue) => issue.code === "DEPENDENCY_CYCLE")).toBe(true);
  });

  it("rejects an output binding that is not a declared dependency", () => {
    const result = validateWorkflowDefinition({ ...valid, steps: [valid.steps[0], { ...valid.steps[1], dependsOn: [] }] });
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "STEP_OUTPUT_NOT_DEPENDENCY", stepKey: "publish" }));
  });

  it("rejects incompatible I/O contracts and unbound required inputs", () => {
    const result = validateWorkflowDefinition({ ...valid, steps: [valid.steps[0], { ...valid.steps[1], inputSchema: { headline: { type: "string", required: true } }, inputBindings: { headline: { kind: "step_output", stepKey: "collect", outputKey: "evidence" } } }] });
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "INPUT_TYPE_INCOMPATIBLE" }));
    const missing = validateWorkflowDefinition({ ...valid, steps: [{ ...valid.steps[0], inputBindings: {} }, valid.steps[1]] });
    expect(missing.issues).toContainEqual(expect.objectContaining({ code: "INPUT_REQUIRED_UNBOUND", stepKey: "collect" }));
  });
});
