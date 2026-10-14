import type { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { AppError } from "@/src/server/api/errors";
import { prisma } from "@/src/server/db/prisma";
import { immutableWorkflowSnapshot, workflowIdentitySchema, workflowRunSnapshot } from "@/src/server/services/workflow-identity-service";
import { validateWorkflowDefinition } from "@/src/server/services/workflow-definition-validation-service";
import { simulateWorkflowDefinition, type WorkflowCatalogReader } from "@/src/server/services/workflow-simulation-service";

const publishSchema = z.object({ identity: workflowIdentitySchema, definition: z.unknown() }).strict();
const runSchema = z.object({ workflowVersionId: z.string().min(1), input: z.record(z.string().min(1), z.unknown()).default({}), correlationId: z.string().trim().min(1).max(200).default(() => randomUUID()), idempotencyKey: z.string().trim().min(8).max(200) }).strict();

const catalog: WorkflowCatalogReader = { list: async (workspaceId) => (await prisma.registeredApplication.findMany({ where: { workspaceId }, include: { capabilities: true } })).map((application) => ({ applicationSlug: application.slug, lifecycleState: application.lifecycleState, capabilities: application.capabilities.map((capability) => ({ capabilityKey: capability.capabilityKey, version: capability.version })) })) };

export async function publishWorkflowDefinition(workspaceId: string, actorId: string, raw: unknown) {
  const input = publishSchema.parse(raw);
  const validation = validateWorkflowDefinition(input.definition);
  if (!validation.valid || !validation.definition) throw new AppError(422, "workflow_definition_invalid", "Workflow definition is invalid.", { issues: validation.issues });
  const snapshot = immutableWorkflowSnapshot({ contractVersion: validation.definition.workflowContractVersion, definition: validation.definition });
  return prisma.$transaction(async (tx) => {
    let definition = await tx.workflowDefinition.findUnique({ where: { workspaceId_slug: { workspaceId, slug: input.identity.slug } } });
    if (!definition) definition = await tx.workflowDefinition.create({ data: { workspaceId, ...input.identity, createdById: actorId } });
    else if (definition.displayName !== input.identity.displayName || definition.description !== input.identity.description) throw new AppError(409, "workflow_identity_conflict", "The existing workflow identity does not match this publication.");
    const existing = await tx.workflowVersion.findUnique({ where: { workflowDefinitionId_definitionHash: { workflowDefinitionId: definition.id, definitionHash: snapshot.definitionHash } } });
    if (existing) return { workflowDefinitionId: definition.id, workflowVersionId: existing.id, version: existing.version, created: false as const, executionAuthorized: false as const };
    const latest = await tx.workflowVersion.aggregate({ where: { workflowDefinitionId: definition.id }, _max: { version: true } });
    const version = await tx.workflowVersion.create({ data: { workflowDefinitionId: definition.id, version: (latest._max.version ?? 0) + 1, definitionSnapshot: snapshot.definitionSnapshot as Prisma.InputJsonValue, definitionHash: snapshot.definitionHash, contractVersion: snapshot.contractVersion, publishedById: actorId } });
    await tx.workflowDefinition.update({ where: { id: definition.id }, data: { status: "PUBLISHED" } });
    await tx.activityEvent.create({ data: { workspaceId, userId: actorId, type: "workflow.version_published", title: "Workflow version published", description: `${input.identity.displayName} v${version.version} was published. Publication grants no execution authority.`, metadata: { workflowDefinitionId: definition.id, workflowVersionId: version.id, definitionHash: snapshot.definitionHash, executionAuthorized: "false" } } });
    return { workflowDefinitionId: definition.id, workflowVersionId: version.id, version: version.version, created: true as const, executionAuthorized: false as const };
  });
}

export async function admitWorkflowRun(workspaceId: string, actorId: string, raw: unknown) {
  const input = runSchema.parse(raw);
  const version = await prisma.workflowVersion.findFirst({ where: { id: input.workflowVersionId, workflowDefinition: { workspaceId, status: "PUBLISHED" } }, include: { workflowDefinition: true } });
  if (!version) throw new AppError(404, "workflow_version_not_found", "Published workflow version was not found in this workspace.");
  const simulation = await simulateWorkflowDefinition(workspaceId, version.definitionSnapshot, catalog);
  if (!simulation.admissible) throw new AppError(409, "workflow_run_prerequisites_unsatisfied", "Workflow prerequisites are not currently satisfied.", { issues: simulation.issues });
  const existing = await prisma.workflowRun.findUnique({ where: { workspaceId_idempotencyKey: { workspaceId, idempotencyKey: input.idempotencyKey } } });
  if (existing) return { workflowRunId: existing.id, status: existing.status, created: false as const, dispatched: false as const };
  const versionSnapshot = workflowRunSnapshot({ versionId: version.id, contractVersion: version.contractVersion, definitionSnapshot: version.definitionSnapshot, definitionHash: version.definitionHash });
  const run = await prisma.$transaction(async (tx) => {
    const created = await tx.workflowRun.create({ data: { workspaceId, workflowVersionId: version.id, status: "READY", correlationId: input.correlationId, idempotencyKey: input.idempotencyKey, inputSnapshot: input.input as Prisma.InputJsonValue, versionSnapshot: versionSnapshot as Prisma.InputJsonValue, createdById: actorId } });
    await tx.activityEvent.create({ data: { workspaceId, userId: actorId, type: "workflow.run_admitted", title: "Workflow run admitted", description: `Workflow run ${created.id} is ready. No application step has been dispatched.`, metadata: { workflowRunId: created.id, workflowVersionId: version.id, correlationId: input.correlationId, executionAuthorized: "false", dispatchPerformed: "false" } } });
    return created;
  });
  return { workflowRunId: run.id, status: run.status, created: true as const, dispatched: false as const };
}
