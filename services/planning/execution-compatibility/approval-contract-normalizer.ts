import type { ApprovalContract, CompatibilityScope } from "./execution-compatibility-types";

function fallbackScope(stepId: string): CompatibilityScope {
  return {
    actionScope: [stepId],
    resourceScope: [stepId],
    environmentScope: ["local"],
    tenantScope: ["single-tenant"],
    toolScope: ["planner"],
  };
}

function readRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function readStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  return value.filter((entry): entry is string => typeof entry === "string");
}

export function normalizeApprovalContract(step: {
  id: string;
  approvalMode: string;
  inputs: Record<string, unknown>;
}): ApprovalContract | null {
  const compatibility = readRecord(step.inputs.compatibility);
  const approval = readRecord(compatibility.approval);
  const scopeInput = readRecord(approval.scope);
  const hasMetadata = Object.keys(approval).length > 0;
  if (!hasMetadata) {
    return null;
  }

  return {
    stepId: step.id,
    required: approval.required === true || step.approvalMode === "REQUIRED",
    requiredRole: typeof approval.requiredRole === "string" ? approval.requiredRole : undefined,
    expiresAt: typeof approval.expiresAt === "string" ? approval.expiresAt : undefined,
    scope: {
      actionScope: readStringArray(scopeInput.actionScope) ?? fallbackScope(step.id).actionScope,
      resourceScope: readStringArray(scopeInput.resourceScope) ?? fallbackScope(step.id).resourceScope,
      environmentScope: readStringArray(scopeInput.environmentScope) ?? fallbackScope(step.id).environmentScope,
      tenantScope: readStringArray(scopeInput.tenantScope) ?? fallbackScope(step.id).tenantScope,
      toolScope: readStringArray(scopeInput.toolScope) ?? fallbackScope(step.id).toolScope,
    },
  };
}
