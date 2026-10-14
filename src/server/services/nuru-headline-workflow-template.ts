import { validateWorkflowDefinition } from "@/src/server/services/workflow-definition-validation-service";

/** Reference only: Nuru owns evidence retrieval; Headline Flow owns drafting. */
export const nuruHeadlineWorkflowTemplate = {
  identity: { slug: "nuru-headline-flow", displayName: "Nuru to Headline Flow", description: "Governed evidence-to-headline drafting handoff." },
  definition: {
    workflowContractVersion: "1.0",
    inputs: { query: { type: "string", required: true }, evidence_resource: { type: "string", required: true } },
    steps: [
      { key: "retrieve_evidence", capability: { applicationSlug: "nuru", capabilityKey: "evidence.retrieve", version: "1.0" }, dependsOn: [], inputSchema: { query: { type: "string", required: true }, resource: { type: "string", required: true } }, outputSchema: { evidence: { type: "object", required: true } }, inputBindings: { query: { kind: "workflow_input", inputKey: "query" }, resource: { kind: "workflow_input", inputKey: "evidence_resource" } }, timeoutMs: 30_000, failurePolicy: { mode: "RETRY", maxAttempts: 2 }, approvalPolicy: { mode: "NONE" } },
      { key: "draft_headline", capability: { applicationSlug: "headline-flow", capabilityKey: "headline.draft", version: "1.0" }, dependsOn: ["retrieve_evidence"], inputSchema: { evidence: { type: "object", required: true } }, outputSchema: { draft: { type: "string", required: true } }, inputBindings: { evidence: { kind: "step_output", stepKey: "retrieve_evidence", outputKey: "evidence" } }, timeoutMs: 30_000, failurePolicy: { mode: "FAIL", maxAttempts: 1 }, approvalPolicy: { mode: "REQUIRED", reason: "A human must approve the cross-application headline drafting handoff." } },
    ],
  },
} as const;

export function validateNuruHeadlineWorkflowTemplate() { return validateWorkflowDefinition(nuruHeadlineWorkflowTemplate.definition); }
