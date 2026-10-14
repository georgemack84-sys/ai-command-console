import { z } from "zod";
import { AppError } from "@/src/server/api/errors";
import { prisma } from "@/src/server/db/prisma";
import { authenticateApplicationCredential } from "@/src/server/services/application-identity-service";
import { validateWorkflowDefinition } from "@/src/server/services/workflow-definition-validation-service";

const requestSchema = z.object({
  workflowRunId: z.string().min(1),
  stepKey: z.string().min(1),
  credential: z.string().min(1),
  scope: z.object({ operations: z.array(z.string().min(1)).min(1).max(20), resources: z.array(z.string().min(1)).min(1).max(20) }).strict(),
}).strict();

type GrantScope = { operations?: string[]; resources?: string[] };

/**
 * Produces admission evidence only. It does not dispatch an application call;
 * Phase 6.5 will persist attempts and consume this evidence at dispatch time.
 */
export async function authorizeWorkflowStep(workspaceId: string, raw: unknown) {
  const input = requestSchema.parse(raw);
  const run = await prisma.workflowRun.findFirst({ where: { id: input.workflowRunId, workspaceId, status: { in: ["READY", "RUNNING"] } }, include: { workflowVersion: true } });
  if (!run) throw new AppError(404, "workflow_run_not_authorizable", "Workflow run was not found or is not eligible for step authorization.");
  const storedSnapshot = run.versionSnapshot as { definitionSnapshot?: unknown };
  const definition = validateWorkflowDefinition(storedSnapshot.definitionSnapshot);
  if (!definition.valid || !definition.definition) throw new AppError(409, "workflow_snapshot_invalid", "Stored workflow snapshot no longer meets the workflow contract.");
  const step = definition.definition.steps.find((candidate) => candidate.key === input.stepKey);
  if (!step) throw new AppError(404, "workflow_step_not_found", "Workflow step was not found in this immutable run snapshot.");
  if (step.dependsOn.length) {
    const completedDependencies = await prisma.workflowStepRun.findMany({
      where: { workflowRunId: run.id, stepKey: { in: step.dependsOn }, status: "COMPLETED" },
      distinct: ["stepKey"],
      select: { stepKey: true },
    });
    const completedKeys = new Set(completedDependencies.map((dependency) => dependency.stepKey));
    const missingDependencies = step.dependsOn.filter((dependency) => !completedKeys.has(dependency));
    if (missingDependencies.length) {
      throw new AppError(409, "workflow_step_dependencies_incomplete", "All declared workflow dependencies must complete before this step can be authorized.", { missingDependencies });
    }
  }
  const approval = step.approvalPolicy.mode === "REQUIRED"
    ? await prisma.workflowStepApproval.findFirst({ where: { workflowRunId: run.id, stepKey: step.key, status: "APPROVED" }, orderBy: { approvedAt: "desc" } })
    : null;
  if (step.approvalPolicy.mode === "REQUIRED" && !approval) throw new AppError(409, "workflow_step_approval_required", "This step requires durable approval before it can be authorized.", { reason: step.approvalPolicy.reason });

  const identity = await authenticateApplicationCredential(input.credential);
  if (!identity || identity.workspaceId !== workspaceId) throw new AppError(401, "application_credential_invalid", "Application credential is invalid or inactive.");
  const application = await prisma.registeredApplication.findFirst({ where: { id: identity.applicationId, workspaceId, slug: step.capability.applicationSlug, lifecycleState: "ACTIVE" } });
  if (!application) throw new AppError(403, "workflow_step_application_ineligible", "The target application is not active or does not match this workflow step.");
  const capability = await prisma.applicationCapability.findFirst({ where: { applicationId: application.id, capabilityKey: step.capability.capabilityKey, version: step.capability.version } });
  if (!capability) throw new AppError(403, "workflow_step_capability_undeclared", "The workflow step capability is not declared by the target application.");
  const grant = await prisma.applicationCapabilityGrant.findFirst({ where: { capabilityId: capability.id, principalId: identity.principalId, status: "ACTIVE" } });
  const grantScope = grant?.scope as GrantScope | undefined;
  if (!grant || !grantScope?.operations?.every((operation) => typeof operation === "string") || !grantScope?.resources?.every((resource) => typeof resource === "string") || !input.scope.operations.every((operation) => grantScope.operations!.includes(operation)) || !input.scope.resources.every((resource) => grantScope.resources!.includes(resource))) throw new AppError(403, "workflow_step_scope_denied", "The requested step scope is outside the active capability grant.");

  return Object.freeze({ authorized: true as const, dispatched: false as const, workflowRunId: run.id, stepKey: step.key, applicationId: application.id, principalId: identity.principalId, capabilityId: capability.id, grantId: grant.id, approvalId: approval?.id ?? null, scope: input.scope, authorizationCheckedAt: new Date().toISOString() });
}
