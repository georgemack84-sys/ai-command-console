import { validateWorkflowDefinition, type WorkflowDefinition, type WorkflowValidationIssue } from "@/src/server/services/workflow-definition-validation-service";

export type WorkflowCapabilityCatalog = Readonly<{ applicationSlug: string; lifecycleState: string; capabilities: readonly Readonly<{ capabilityKey: string; version: string }>[] }>;
export type WorkflowCatalogReader = Readonly<{ list(workspaceId: string): Promise<readonly WorkflowCapabilityCatalog[]> }>;
export type WorkflowSimulation = Readonly<{
  admissible: boolean;
  externalCallsDispatched: false;
  orderedStepKeys: readonly string[];
  issues: readonly WorkflowValidationIssue[];
  authorityChecks: readonly "DEFERRED_TO_EXECUTION"[];
}>;

function order(definition: WorkflowDefinition) {
  const remaining = new Map(definition.steps.map((step) => [step.key, step]));
  const ordered: string[] = [];
  while (remaining.size) {
    const ready = [...remaining.values()].filter((step) => step.dependsOn.every((key) => ordered.includes(key))).sort((left, right) => left.key.localeCompare(right.key));
    if (!ready.length) break;
    for (const step of ready) { ordered.push(step.key); remaining.delete(step.key); }
  }
  return ordered;
}

export async function simulateWorkflowDefinition(workspaceId: string, raw: unknown, catalog: WorkflowCatalogReader): Promise<WorkflowSimulation> {
  const validation = validateWorkflowDefinition(raw);
  if (!validation.valid || !validation.definition) return { admissible: false, externalCallsDispatched: false, orderedStepKeys: [], issues: validation.issues, authorityChecks: ["DEFERRED_TO_EXECUTION"] };
  const applications = await catalog.list(workspaceId);
  const issues: WorkflowValidationIssue[] = [];
  for (const step of validation.definition.steps) {
    const app = applications.find((candidate) => candidate.applicationSlug === step.capability.applicationSlug);
    if (!app) { issues.push({ code: "APPLICATION_UNREGISTERED", stepKey: step.key, message: `Application '${step.capability.applicationSlug}' is not registered in this workspace.` }); continue; }
    if (app.lifecycleState !== "ACTIVE") { issues.push({ code: "APPLICATION_NOT_ACTIVE", stepKey: step.key, message: `Application '${app.applicationSlug}' is ${app.lifecycleState}, not ACTIVE.` }); continue; }
    if (!app.capabilities.some((capability) => capability.capabilityKey === step.capability.capabilityKey && capability.version === step.capability.version)) issues.push({ code: "CAPABILITY_UNDECLARED", stepKey: step.key, message: `Capability '${step.capability.capabilityKey}' version '${step.capability.version}' is not declared by '${app.applicationSlug}'.` });
  }
  return { admissible: issues.length === 0, externalCallsDispatched: false, orderedStepKeys: issues.length ? [] : order(validation.definition), issues, authorityChecks: ["DEFERRED_TO_EXECUTION"] };
}
