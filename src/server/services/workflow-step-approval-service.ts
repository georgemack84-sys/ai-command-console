import { z } from "zod";
import { AppError } from "@/src/server/api/errors";
import { prisma } from "@/src/server/db/prisma";
import { validateWorkflowDefinition } from "@/src/server/services/workflow-definition-validation-service";

const requestSchema = z.object({ workflowRunId: z.string().min(1), stepKey: z.string().min(1) }).strict();

export type WorkflowStepApprovalView = Readonly<{
  approvalId: string;
  workflowRunId: string;
  stepKey: string;
  status: "REQUESTED" | "APPROVED" | "REJECTED" | "CANCELLED";
  reason: string;
  requestedById: string;
  requestedAt: string;
  approvedById: string | null;
  approvedAt: string | null;
}>;

function view(value: { id: string; workflowRunId: string; stepKey: string; status: WorkflowStepApprovalView["status"]; reason: string; requestedById: string; requestedAt: Date; approvedById: string | null; approvedAt: Date | null }): WorkflowStepApprovalView {
  return { approvalId: value.id, workflowRunId: value.workflowRunId, stepKey: value.stepKey, status: value.status, reason: value.reason, requestedById: value.requestedById, requestedAt: value.requestedAt.toISOString(), approvedById: value.approvedById, approvedAt: value.approvedAt?.toISOString() ?? null };
}

async function approvalRequiredStep(workspaceId: string, raw: unknown) {
  const input = requestSchema.parse(raw);
  const run = await prisma.workflowRun.findFirst({ where: { id: input.workflowRunId, workspaceId, status: { in: ["READY", "RUNNING", "WAITING_APPROVAL"] } } });
  if (!run) throw new AppError(404, "workflow_run_not_approvable", "Workflow run was not found or is not eligible for step approval.");
  const validation = validateWorkflowDefinition((run.versionSnapshot as { definitionSnapshot?: unknown }).definitionSnapshot);
  const step = validation.definition?.steps.find((candidate) => candidate.key === input.stepKey);
  if (!step) throw new AppError(404, "workflow_step_not_found", "Workflow step was not found in this immutable run snapshot.");
  if (step.approvalPolicy.mode !== "REQUIRED") throw new AppError(409, "workflow_step_approval_not_required", "This workflow step does not require approval.");
  const completedDependencies = await prisma.workflowStepRun.findMany({ where: { workflowRunId: run.id, stepKey: { in: step.dependsOn }, status: "COMPLETED" }, select: { stepKey: true } });
  const missingDependencies = step.dependsOn.filter((dependency) => !completedDependencies.some((item) => item.stepKey === dependency));
  if (missingDependencies.length) throw new AppError(409, "workflow_step_dependencies_incomplete", "Workflow step dependencies must complete before approval can be requested.", { missingDependencies });
  return { input, run, step };
}

export async function requestWorkflowStepApproval(workspaceId: string, actorId: string, raw: unknown) {
  const { input, run, step } = await approvalRequiredStep(workspaceId, raw);
  const existing = await prisma.workflowStepApproval.findFirst({ where: { workflowRunId: run.id, stepKey: input.stepKey, status: "REQUESTED" }, orderBy: { requestedAt: "desc" } });
  if (existing) return { approval: view(existing), created: false as const };
  return prisma.$transaction(async (tx) => {
    const approval = await tx.workflowStepApproval.create({ data: { workflowRunId: run.id, stepKey: input.stepKey, reason: step.approvalPolicy.reason ?? "Workflow step requires approval.", requestedById: actorId } });
    await tx.workflowRun.update({ where: { id: run.id }, data: { status: "WAITING_APPROVAL" } });
    await tx.activityEvent.create({ data: { workspaceId, userId: actorId, type: "workflow.step_approval_requested", title: "Workflow step approval requested", description: `${input.stepKey} is awaiting independent approval. No application call has been dispatched.`, metadata: { workflowRunId: run.id, stepKey: input.stepKey, approvalId: approval.id, executionAuthorized: "false" } } });
    return { approval: view(approval), created: true as const };
  });
}

export async function approveWorkflowStepApproval(workspaceId: string, approvalId: string, actorId: string) {
  const approval = await prisma.workflowStepApproval.findFirst({ where: { id: approvalId, workflowRun: { workspaceId } } });
  if (!approval) throw new AppError(404, "workflow_step_approval_not_found", "Workflow step approval was not found.");
  if (approval.status !== "REQUESTED") throw new AppError(409, "workflow_step_approval_not_pending", "Only requested workflow step approvals can be approved.");
  if (approval.requestedById === actorId) throw new AppError(403, "workflow_step_approval_self_approval", "A different workspace authority must approve this workflow step.");
  return prisma.$transaction(async (tx) => {
    const updated = await tx.workflowStepApproval.update({ where: { id: approval.id }, data: { status: "APPROVED", approvedById: actorId, approvedAt: new Date() } });
    await tx.workflowRun.update({ where: { id: approval.workflowRunId }, data: { status: "READY" } });
    await tx.activityEvent.create({ data: { workspaceId, userId: actorId, type: "workflow.step_approval_approved", title: "Workflow step approval approved", description: `${approval.stepKey} is approved for a later, freshly-authorized execution attempt.`, metadata: { workflowRunId: approval.workflowRunId, stepKey: approval.stepKey, approvalId: approval.id, executionAuthorized: "false" } } });
    return view(updated);
  });
}
