import { randomUUID } from "node:crypto";
import { z } from "zod";

import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { createPhase9DurableLearningRuntime } from "@/src/server/learning/phase9-durable-learning-runtime";
import { HumanApprovalService, PrismaProvenanceLedger } from "@/services/learning-constitution";

const bodySchema = z.object({
  event_id: z.string().min(1).max(160).optional(),
  kind: z.enum(["APPROVAL", "CLARIFICATION", "EVIDENCE"]),
  summary: z.string().min(1).max(4_000),
  evidence_refs: z.array(z.string().min(1).max(240)).max(100).default([]),
});

export const dynamic = "force-dynamic";

/** Resolution creates provenance and forces re-evaluation; it is never a direct durable write endpoint. */
export async function POST(request: Request, context: { params: Promise<{ deferredCandidateId: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    if (!user.workspaceId || user.workspaceId === "default") throw new AppError(403, "workspace_required", "A workspace membership is required to resolve deferred learning candidates.");
    await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    const { deferredCandidateId } = await context.params;
    const body = bodySchema.parse(await request.json());
    const runtime = createPhase9DurableLearningRuntime(user.workspaceId);
    const candidate = await runtime.deferredCandidates.get(deferredCandidateId);
    if (!candidate) throw new AppError(404, "not_found", "Deferred learning candidate was not found.");

    if (body.kind === "APPROVAL") {
      const approval = await new HumanApprovalService({ ledger: new PrismaProvenanceLedger(user.workspaceId) }).decide({
        candidateId: candidate.candidateId,
        decision: "APPROVED",
        actor: { actorId: user.id, actorType: "HUMAN" },
        approvedStatement: body.summary,
      });
      if (approval.status !== "RECORDED") throw new AppError(409, "approval_not_recorded", `Approval could not be recorded: ${approval.reasonCode}.`);
    }

    const result = await runtime.resolution.resolve(deferredCandidateId, {
      eventId: body.event_id ?? `resolution:${randomUUID()}`,
      candidateId: candidate.candidateId,
      kind: body.kind,
      actorId: user.id,
      summary: body.summary,
      evidenceRefs: body.evidence_refs,
      occurredAt: new Date().toISOString(),
    });
    if (!result) throw new AppError(409, "resolution_not_accepted", "Candidate is no longer pending resolution.");
    return apiSuccess({ resolution: result.resolution, reevaluation: result.reevaluation });
  } catch (error) {
    return apiError(error, "Unable to resolve deferred learning candidate.");
  }
}
