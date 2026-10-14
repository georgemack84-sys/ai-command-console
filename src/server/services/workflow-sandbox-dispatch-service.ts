import { z } from "zod";
import { AppError } from "@/src/server/api/errors";
import { prisma } from "@/src/server/db/prisma";
import { beginWorkflowStepAttempt, recordWorkflowStepOutcome } from "@/src/server/services/workflow-execution-state-service";
import { getWorkflowDispatchSafety } from "@/src/server/services/workflow-dispatch-safety-service";
import { sandboxEvidenceRequestSchema, sandboxHeadlineRequestSchema } from "@/src/server/services/workflow-sandbox-contract-service";

const requestSchema = z.object({
  workflowRunId: z.string().min(1),
  stepKey: z.enum(["retrieve_evidence", "draft_headline"]),
  credential: z.string().min(1),
  scope: z.object({ operations: z.array(z.string().min(1)).min(1), resources: z.array(z.string().min(1)).min(1) }).strict(),
  input: z.record(z.string(), z.unknown()).default({}),
  idempotencyKey: z.string().min(8).max(200),
}).strict();

function messageFromUnknown(value: unknown) {
  return value instanceof Error ? value.message.slice(0, 2_000) : "The local sandbox could not complete the workflow step.";
}

async function sandboxPayload(workspaceId: string, workflowRunId: string, stepKey: "retrieve_evidence" | "draft_headline", input: Record<string, unknown>) {
  if (stepKey === "retrieve_evidence") return sandboxEvidenceRequestSchema.parse(input);
  const evidenceStep = await prisma.workflowStepRun.findFirst({
    where: { workflowRunId, stepKey: "retrieve_evidence", status: "COMPLETED", workflowRun: { workspaceId } },
    orderBy: { completedAt: "desc" },
    select: { outputSnapshot: true },
  });
  const output = evidenceStep?.outputSnapshot as { evidence?: unknown } | null;
  const evidence = output?.evidence as { query?: unknown; resource?: unknown; items?: unknown } | undefined;
  // Preserve sandbox provenance in the step audit record, but send only the
  // versioned Headline contract fields across the application boundary.
  return sandboxHeadlineRequestSchema.parse({
    evidence: {
      query: evidence?.query,
      resource: evidence?.resource,
      items: evidence?.items,
    },
  });
}

/**
 * The only egress-capable workflow path in this phase. It is intentionally
 * limited to the verified, owner-approved built-in sandbox and records the
 * result before returning. Raw credentials only exist during this request.
 */
export async function dispatchWorkflowSandboxStep(workspaceId: string, raw: unknown) {
  const input = requestSchema.parse(raw);
  const safety = await getWorkflowDispatchSafety(workspaceId);
  if (!safety.dispatchEnabled || !safety.sandboxUrl) {
    throw new AppError(409, "sandbox_dispatch_blocked", safety.reason);
  }

  const attempt = await beginWorkflowStepAttempt(workspaceId, input);
  if (!attempt.created) return { ...attempt, dispatched: false as const, replayed: true as const };

  const run = await prisma.workflowRun.findFirst({ where: { id: input.workflowRunId, workspaceId }, select: { correlationId: true } });
  if (!run) throw new AppError(404, "workflow_run_not_found", "Workflow run was not found after step authorization.");

  try {
    const payload = await sandboxPayload(workspaceId, input.workflowRunId, input.stepKey, input.input);
    const endpoint = new URL(input.stepKey === "retrieve_evidence" ? "v1/workflow/evidence/retrieve" : "v1/workflow/headlines/draft", safety.sandboxUrl);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        authorization: `Bearer ${input.credential}`,
        "content-type": "application/json",
        "x-workflow-correlation-id": run.correlationId,
        "idempotency-key": input.idempotencyKey,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    const envelope = await response.json().catch(() => null) as { ok?: unknown; data?: unknown; error?: { code?: unknown; message?: unknown } } | null;
    if (!response.ok || envelope?.ok !== true || !envelope.data || typeof envelope.data !== "object") {
      const detail = typeof envelope?.error?.message === "string" ? envelope.error.message : `Sandbox returned HTTP ${response.status}.`;
      const outcome = await recordWorkflowStepOutcome(workspaceId, input.workflowRunId, input.stepKey, attempt.stepRunId, { outcome: "RETRYABLE_FAILURE", failureCode: typeof envelope?.error?.code === "string" ? envelope.error.code : "sandbox_dispatch_failed", failureDetail: detail });
      return { ...attempt, dispatched: true as const, replayed: false as const, outcome };
    }
    const outcome = await recordWorkflowStepOutcome(workspaceId, input.workflowRunId, input.stepKey, attempt.stepRunId, { outcome: "COMPLETED", output: envelope.data as Record<string, unknown> });
    return { ...attempt, dispatched: true as const, replayed: false as const, outcome };
  } catch (error) {
    const outcome = await recordWorkflowStepOutcome(workspaceId, input.workflowRunId, input.stepKey, attempt.stepRunId, { outcome: "RETRYABLE_FAILURE", failureCode: "sandbox_dispatch_error", failureDetail: messageFromUnknown(error) });
    return { ...attempt, dispatched: true as const, replayed: false as const, outcome };
  }
}
