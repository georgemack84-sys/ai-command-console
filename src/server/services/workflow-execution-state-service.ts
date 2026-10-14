import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { AppError } from "@/src/server/api/errors";
import { prisma } from "@/src/server/db/prisma";
import { authorizeWorkflowStep } from "@/src/server/services/workflow-step-authorization-service";
import { validateWorkflowDefinition } from "@/src/server/services/workflow-definition-validation-service";

const beginSchema = z.object({ workflowRunId: z.string().min(1), stepKey: z.string().min(1), credential: z.string().min(1), scope: z.object({ operations: z.array(z.string().min(1)).min(1), resources: z.array(z.string().min(1)).min(1) }).strict(), input: z.record(z.string(), z.unknown()).default({}), idempotencyKey: z.string().min(8).max(200) }).strict();
const outcomeSchema = z.object({ outcome: z.enum(["COMPLETED", "RETRYABLE_FAILURE", "TERMINAL_FAILURE"]), output: z.record(z.string(), z.unknown()).optional(), failureCode: z.string().max(100).optional(), failureDetail: z.string().max(2_000).optional() }).strict();

export async function beginWorkflowStepAttempt(workspaceId: string, raw: unknown) {
  const input = beginSchema.parse(raw);
  // This call deliberately re-checks lifecycle, credential, grant, scope, and approval.
  const authorization = await authorizeWorkflowStep(workspaceId, {
    workflowRunId: input.workflowRunId,
    stepKey: input.stepKey,
    credential: input.credential,
    scope: input.scope,
  });
  return prisma.$transaction(async (tx) => {
    const existing = await tx.workflowStepRun.findUnique({ where: { workflowRunId_idempotencyKey: { workflowRunId: input.workflowRunId, idempotencyKey: input.idempotencyKey } } });
    if (existing) return { stepRunId: existing.id, attempt: existing.attempt, status: existing.status, created: false as const };
    const prior = await tx.workflowStepRun.aggregate({ where: { workflowRunId: input.workflowRunId, stepKey: input.stepKey }, _max: { attempt: true } });
    const stepRun = await tx.workflowStepRun.create({ data: { workflowRunId: input.workflowRunId, stepKey: input.stepKey, attempt: (prior._max.attempt ?? 0) + 1, status: "RUNNING", inputSnapshot: input.input as Prisma.InputJsonValue, authorizationSnapshot: authorization as Prisma.InputJsonValue, idempotencyKey: input.idempotencyKey, startedAt: new Date() } });
    await tx.workflowRun.update({ where: { id: input.workflowRunId }, data: { status: "RUNNING", startedAt: new Date() } });
    return { stepRunId: stepRun.id, attempt: stepRun.attempt, status: stepRun.status, created: true as const };
  });
}

export async function recordWorkflowStepOutcome(workspaceId: string, workflowRunId: string, stepKey: string, stepRunId: string, raw: unknown) {
  const input = outcomeSchema.parse(raw);
  const stepRun = await prisma.workflowStepRun.findFirst({ where: { id: stepRunId, workflowRunId, stepKey, workflowRun: { workspaceId } }, include: { workflowRun: { include: { workflowVersion: true } } } });
  if (!stepRun || stepRun.status !== "RUNNING") throw new AppError(409, "workflow_step_outcome_invalid", "Only a running workflow step attempt can record an outcome.");
  const validation = validateWorkflowDefinition((stepRun.workflowRun.versionSnapshot as { definitionSnapshot?: unknown }).definitionSnapshot);
  const definition = validation.definition;
  const step = definition?.steps.find((candidate) => candidate.key === stepRun.stepKey);
  if (!definition || !step) throw new AppError(409, "workflow_step_snapshot_invalid", "The persisted workflow step cannot be recovered from its immutable snapshot.");
  const retry = input.outcome === "RETRYABLE_FAILURE" && stepRun.attempt < step.failurePolicy.maxAttempts;
  const status = input.outcome === "COMPLETED" ? "COMPLETED" : retry ? "RETRY_WAIT" : "FAILED";
  return prisma.$transaction(async (tx) => {
    const updated = await tx.workflowStepRun.update({ where: { id: stepRun.id }, data: { status, outputSnapshot: input.output as Prisma.InputJsonValue | undefined, failureCode: input.failureCode, failureDetail: input.failureDetail, completedAt: new Date() } });
    const completedStepKeys = new Set((await tx.workflowStepRun.findMany({
      where: { workflowRunId: stepRun.workflowRunId, status: "COMPLETED" },
      distinct: ["stepKey"],
      select: { stepKey: true },
    })).map((completed) => completed.stepKey));
    const workflowCompleted = status === "COMPLETED" && definition.steps.every((stepDefinition) => completedStepKeys.has(stepDefinition.key));
    await tx.workflowRun.update({ where: { id: stepRun.workflowRunId }, data: { status: status === "RETRY_WAIT" ? "RETRY_WAIT" : status === "FAILED" ? "FAILED" : workflowCompleted ? "COMPLETED" : "RUNNING", completedAt: status === "FAILED" || workflowCompleted ? new Date() : undefined } });
    return { stepRunId: updated.id, status: updated.status, retryEligible: status === "RETRY_WAIT" };
  });
}

export async function recoverWorkflowStepForRetry(workspaceId: string, stepRunId: string) {
  const stepRun = await prisma.workflowStepRun.findFirst({ where: { id: stepRunId, status: "RETRY_WAIT", workflowRun: { workspaceId } } });
  if (!stepRun) throw new AppError(409, "workflow_step_not_retryable", "Workflow step is not waiting for retry.");
  await prisma.workflowRun.update({ where: { id: stepRun.workflowRunId }, data: { status: "READY" } });
  // No attempt is copied here. The caller must invoke beginWorkflowStepAttempt
  // with a fresh credential, scope check, and idempotency key before dispatch.
  return { workflowRunId: stepRun.workflowRunId, stepKey: stepRun.stepKey, previousStepRunId: stepRun.id, nextAttempt: stepRun.attempt + 1, status: "READY" as const, authorizationRequired: true as const };
}
