import { prisma } from "@/src/server/db/prisma";

function outputSummary(snapshot: unknown) {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) return null;
  const value = snapshot as Record<string, unknown>;
  const evidence = value.evidence;
  if (evidence && typeof evidence === "object" && !Array.isArray(evidence)) {
    const record = evidence as Record<string, unknown>;
    if (record.mode === "sandbox_fixture") {
      return {
        kind: "sandbox_evidence" as const,
        query: typeof record.query === "string" ? record.query.slice(0, 240) : null,
        itemCount: Array.isArray(record.items) ? record.items.length : 0,
      };
    }
  }
  if (value.mode === "sandbox_fixture" && typeof value.draft === "string") {
    return {
      kind: "sandbox_draft" as const,
      draft: value.draft.slice(0, 320),
      evidenceCount: Array.isArray(value.evidence) ? value.evidence.length : 0,
    };
  }
  return null;
}

export async function listWorkflowRuns(workspaceId: string) {
  return (await prisma.workflowRun.findMany({ where: { workspaceId }, include: { workflowVersion: { include: { workflowDefinition: true } }, steps: { orderBy: [{ stepKey: "asc" }, { attempt: "asc" }] }, approvals: { orderBy: { requestedAt: "desc" } } }, orderBy: { createdAt: "desc" }, take: 100 })).map((run) => ({
    workflowRunId: run.id, status: run.status, correlationId: run.correlationId, createdAt: run.createdAt.toISOString(), startedAt: run.startedAt?.toISOString() ?? null, completedAt: run.completedAt?.toISOString() ?? null,
    workflow: { definitionId: run.workflowVersion.workflowDefinition.id, slug: run.workflowVersion.workflowDefinition.slug, displayName: run.workflowVersion.workflowDefinition.displayName, version: run.workflowVersion.version },
    approvals: run.approvals.map((approval) => ({ approvalId: approval.id, stepKey: approval.stepKey, status: approval.status, reason: approval.reason, requestedById: approval.requestedById, requestedAt: approval.requestedAt.toISOString(), approvedAt: approval.approvedAt?.toISOString() ?? null })),
    steps: run.steps.map((step) => ({ stepRunId: step.id, stepKey: step.stepKey, attempt: step.attempt, status: step.status, failureCode: step.failureCode, failureDetail: step.failureDetail, authorizationRecorded: step.authorizationSnapshot !== null, outputSummary: outputSummary(step.outputSnapshot), startedAt: step.startedAt?.toISOString() ?? null, completedAt: step.completedAt?.toISOString() ?? null })),
  }));
}
