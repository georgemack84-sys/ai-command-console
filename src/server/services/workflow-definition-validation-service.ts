import { z } from "zod";

const identifier = z.string().trim().regex(/^[a-z][a-z0-9_-]{0,62}$/, "Use lowercase letters, numbers, hyphens, and underscores.");
const primitive = z.enum(["string", "number", "boolean", "object", "array", "unknown"]);
const schemaShape = z.record(identifier, z.object({ type: primitive, required: z.boolean().default(false) }).strict()).default({});
const capabilityKey = z.string().trim().toLowerCase().regex(/^[a-z][a-z0-9]*(\.[a-z0-9][a-z0-9-]*)+$/, "Use a dot-separated capability key.");
const capabilityReference = z.object({ applicationSlug: identifier, capabilityKey, version: z.string().regex(/^\d+\.\d+$/) }).strict();
const binding = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("workflow_input"), inputKey: identifier }).strict(),
  z.object({ kind: z.literal("step_output"), stepKey: identifier, outputKey: identifier }).strict(),
]);

export const workflowDefinitionSchema = z.object({
  workflowContractVersion: z.literal("1.0"),
  inputs: schemaShape,
  steps: z.array(z.object({
    key: identifier,
    capability: capabilityReference,
    dependsOn: z.array(identifier).max(50).default([]),
    inputSchema: schemaShape,
    outputSchema: schemaShape,
    inputBindings: z.record(identifier, binding).default({}),
    timeoutMs: z.number().int().min(1_000).max(300_000),
    failurePolicy: z.object({ mode: z.enum(["FAIL", "RETRY", "COMPENSATE"]), maxAttempts: z.number().int().min(1).max(10).default(1) }).strict(),
    approvalPolicy: z.object({ mode: z.enum(["NONE", "REQUIRED"]), reason: z.string().trim().min(3).max(500).optional() }).strict(),
  }).strict()).min(1).max(100),
}).strict();

export type WorkflowDefinition = z.infer<typeof workflowDefinitionSchema>;
export type WorkflowValidationIssue = Readonly<{ code: string; message: string; stepKey?: string }>;
export type WorkflowValidationResult = Readonly<{ valid: boolean; issues: readonly WorkflowValidationIssue[]; definition?: WorkflowDefinition }>;

function compatible(source: z.infer<typeof primitive>, target: z.infer<typeof primitive>) {
  return source === "unknown" || target === "unknown" || source === target;
}

export function validateWorkflowDefinition(raw: unknown): WorkflowValidationResult {
  const parsed = workflowDefinitionSchema.safeParse(raw);
  if (!parsed.success) return { valid: false, issues: parsed.error.issues.map((issue) => ({ code: "SCHEMA_INVALID", message: `${issue.path.join(".") || "definition"}: ${issue.message}` })) };

  const definition = parsed.data;
  const issues: WorkflowValidationIssue[] = [];
  const steps = new Map<string, WorkflowDefinition["steps"][number]>();
  for (const step of definition.steps) {
    if (steps.has(step.key)) issues.push({ code: "STEP_KEY_DUPLICATE", stepKey: step.key, message: `Step '${step.key}' is declared more than once.` });
    steps.set(step.key, step);
  }

  for (const step of definition.steps) {
    for (const dependency of step.dependsOn) {
      if (dependency === step.key) issues.push({ code: "DEPENDENCY_SELF_REFERENCE", stepKey: step.key, message: `Step '${step.key}' cannot depend on itself.` });
      else if (!steps.has(dependency)) issues.push({ code: "DEPENDENCY_UNKNOWN", stepKey: step.key, message: `Step '${step.key}' depends on unknown step '${dependency}'.` });
    }
    for (const [inputKey, contract] of Object.entries(step.inputSchema)) {
      const value = step.inputBindings[inputKey];
      if (contract.required && !value) issues.push({ code: "INPUT_REQUIRED_UNBOUND", stepKey: step.key, message: `Required input '${inputKey}' is not bound.` });
      if (!value) continue;
      if (value.kind === "workflow_input") {
        const source = definition.inputs[value.inputKey];
        if (!source) issues.push({ code: "WORKFLOW_INPUT_UNKNOWN", stepKey: step.key, message: `Input '${inputKey}' references unknown workflow input '${value.inputKey}'.` });
        else if (!compatible(source.type, contract.type)) issues.push({ code: "INPUT_TYPE_INCOMPATIBLE", stepKey: step.key, message: `Workflow input '${value.inputKey}' is incompatible with '${inputKey}'.` });
      } else {
        const sourceStep = steps.get(value.stepKey);
        const source = sourceStep?.outputSchema[value.outputKey];
        if (!sourceStep) issues.push({ code: "STEP_OUTPUT_SOURCE_UNKNOWN", stepKey: step.key, message: `Input '${inputKey}' references unknown step '${value.stepKey}'.` });
        else if (!step.dependsOn.includes(value.stepKey)) issues.push({ code: "STEP_OUTPUT_NOT_DEPENDENCY", stepKey: step.key, message: `Input '${inputKey}' may reference '${value.stepKey}' only when it is a declared dependency.` });
        else if (!source) issues.push({ code: "STEP_OUTPUT_UNKNOWN", stepKey: step.key, message: `Input '${inputKey}' references missing output '${value.outputKey}' on '${value.stepKey}'.` });
        else if (!compatible(source.type, contract.type)) issues.push({ code: "INPUT_TYPE_INCOMPATIBLE", stepKey: step.key, message: `Output '${value.stepKey}.${value.outputKey}' is incompatible with '${inputKey}'.` });
      }
    }
    for (const inputKey of Object.keys(step.inputBindings)) if (!step.inputSchema[inputKey]) issues.push({ code: "INPUT_BINDING_UNKNOWN", stepKey: step.key, message: `Binding '${inputKey}' is not declared by the step input contract.` });
    if (step.approvalPolicy.mode === "REQUIRED" && !step.approvalPolicy.reason) issues.push({ code: "APPROVAL_REASON_REQUIRED", stepKey: step.key, message: "Approval-required steps must state a reason." });
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();
  const walk = (key: string) => {
    if (visiting.has(key)) { issues.push({ code: "DEPENDENCY_CYCLE", stepKey: key, message: `Dependency cycle includes '${key}'.` }); return; }
    if (visited.has(key)) return;
    visiting.add(key);
    for (const next of steps.get(key)?.dependsOn ?? []) if (steps.has(next)) walk(next);
    visiting.delete(key); visited.add(key);
  };
  for (const step of definition.steps) walk(step.key);
  return issues.length ? { valid: false, issues } : { valid: true, issues: [], definition };
}
