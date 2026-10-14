import { describe, expect, it } from "vitest";
import { simulateWorkflowDefinition } from "@/src/server/services/workflow-simulation-service";

const workflow = { workflowContractVersion: "1.0", inputs: {}, steps: [
  { key: "collect", capability: { applicationSlug: "nuru", capabilityKey: "knowledge.search", version: "1.0" }, dependsOn: [], inputSchema: {}, outputSchema: { evidence: { type: "object", required: true } }, inputBindings: {}, timeoutMs: 5000, failurePolicy: { mode: "RETRY", maxAttempts: 2 }, approvalPolicy: { mode: "NONE" } },
  { key: "draft", capability: { applicationSlug: "headline-flow", capabilityKey: "headline.draft", version: "1.0" }, dependsOn: ["collect"], inputSchema: { evidence: { type: "object", required: true } }, outputSchema: {}, inputBindings: { evidence: { kind: "step_output", stepKey: "collect", outputKey: "evidence" } }, timeoutMs: 5000, failurePolicy: { mode: "FAIL", maxAttempts: 1 }, approvalPolicy: { mode: "REQUIRED", reason: "Approve release." } },
] };

const catalog = (applications: unknown[]) => ({ list: async () => applications as never });

describe("workflow simulation", () => {
  it("produces a deterministic, no-dispatch dry run while deferring authority to execution", async () => {
    const result = await simulateWorkflowDefinition("workspace_1", workflow, catalog([{ applicationSlug: "nuru", lifecycleState: "ACTIVE", capabilities: [{ capabilityKey: "knowledge.search", version: "1.0" }] }, { applicationSlug: "headline-flow", lifecycleState: "ACTIVE", capabilities: [{ capabilityKey: "headline.draft", version: "1.0" }] }]));
    expect(result).toEqual(expect.objectContaining({ admissible: true, externalCallsDispatched: false, orderedStepKeys: ["collect", "draft"], authorityChecks: ["DEFERRED_TO_EXECUTION"] }));
  });

  it("reports inactive applications and missing capability declarations without dispatching", async () => {
    const result = await simulateWorkflowDefinition("workspace_1", workflow, catalog([{ applicationSlug: "nuru", lifecycleState: "SUSPENDED", capabilities: [] }, { applicationSlug: "headline-flow", lifecycleState: "ACTIVE", capabilities: [] }]));
    expect(result.admissible).toBe(false);
    expect(result.externalCallsDispatched).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toEqual(["APPLICATION_NOT_ACTIVE", "CAPABILITY_UNDECLARED"]);
  });
});
