import { z } from "zod";

import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { CandidateKnowledgeService, EvidenceSetService, ExtractionService, HumanApprovalService, PrismaProvenanceLedger, ProvenanceSupersessionService } from "@/services/learning-constitution";

const scope = z.union([
  z.object({ type: z.enum(["CONVERSATION", "SESSION", "USER", "AGENT", "PROJECT", "WORKSPACE", "ORGANIZATION", "DOMAIN", "COMPONENT", "TASK"]), id: z.string().min(1).max(256), displayName: z.string().min(1).max(256).optional() }).strict(),
  z.object({ type: z.enum(["SYSTEM", "GLOBAL"]), displayName: z.string().min(1).max(256).optional() }).strict(),
]);
const classification = z.enum(["CONVERSATION", "BRAINSTORMING", "SUGGESTION", "FACT", "PREFERENCE", "INSTRUCTION", "PROJECT_DECISION", "PRINCIPLE", "PROCEDURE", "CORRECTION", "EXCEPTION", "AUTHORITATIVE_RULE"]);
const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create-extraction"), sourceRefs: z.array(z.string().min(1)).min(1).max(100), classification, scope, interpretation: z.string().min(1).max(100_000), confidence: z.number().min(0).max(1) }).strict(),
  z.object({ action: z.literal("create-candidate"), statement: z.string().min(1).max(100_000), classification, scope, authority: z.string().min(1).max(256), extractionRefs: z.array(z.string().min(1)).min(1).max(100), evidenceRefs: z.array(z.string().min(1)).max(100).optional() }).strict(),
  z.object({ action: z.literal("create-evidence-set"), evidenceRefs: z.array(z.string().min(1)).min(1).max(100) }).strict(),
  z.object({ action: z.literal("decide-candidate"), candidateId: z.string().min(1), decision: z.enum(["APPROVED", "REJECTED"]), approvedStatement: z.string().min(1).max(100_000) }).strict(),
  z.object({ action: z.literal("supersede-knowledge"), priorKnowledgeId: z.string().min(1), successorKnowledgeId: z.string().min(1), reason: z.string().min(1).max(10_000) }).strict(),
]);

const requireWorkspace = (user: { workspaceId?: string | null }) => {
  if (!user.workspaceId || user.workspaceId === "default") throw new AppError(403, "workspace_required", "A workspace membership is required to manage provenance.");
  return user.workspaceId;
};
const requireApprover = (user: { role: string }) => {
  if (user.role !== "admin" && user.role !== "approver") throw new AppError(403, "forbidden", "Only approvers can approve candidates or supersede knowledge.");
};
const reject = (result: { status: string; reasonCode: string }) => {
  throw new AppError(result.status === "PERSISTENCE_FAILED" ? 503 : 400, "provenance_operation_rejected", "Noesis could not complete the provenance operation.", { reasonCode: result.reasonCode });
};

/** Authenticated workflow endpoint for all non-source provenance records. */
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    const workspaceId = requireWorkspace(user);
    const input = actionSchema.parse(await request.json());
    const ledger = new PrismaProvenanceLedger(workspaceId);
    const human = { actorId: `user:${user.id}`, actorType: "HUMAN" as const };
    const noesis = { actorId: "agent:noesis", actorType: "AGENT" as const };
    if (input.action === "create-extraction") {
      const result = await new ExtractionService({ ledger }).extract({ ...input, interpretedBy: noesis });
      if (result.status !== "EXTRACTED") reject(result);
      return apiSuccess({ extraction: result.extraction, relationships: result.relationships }, { status: 201 });
    }
    if (input.action === "create-candidate") {
      const result = await new CandidateKnowledgeService({ ledger }).propose(input);
      if (result.status !== "CREATED") reject(result);
      return apiSuccess({ candidate: result.candidate, relationships: result.relationships }, { status: 201 });
    }
    if (input.action === "create-evidence-set") {
      const result = await new EvidenceSetService({ ledger }).create({ ...input, collectedBy: human });
      if (result.status !== "CREATED") reject(result);
      return apiSuccess({ evidenceSet: result.evidenceSet }, { status: 201 });
    }
    requireApprover(user);
    if (input.action === "decide-candidate") {
      const result = await new HumanApprovalService({ ledger }).decide({ ...input, actor: human });
      if (result.status !== "RECORDED") reject(result);
      return apiSuccess({ approval: result.approval, relationship: result.relationship }, { status: 201 });
    }
    const result = await new ProvenanceSupersessionService({ ledger }).supersede({ ...input, actor: human });
    if (result.status !== "SUPERSEDED") reject(result);
    return apiSuccess({ predecessor: result.predecessor, successor: result.successor, relationships: result.relationships }, { status: 201 });
  } catch (error) {
    return apiError(error, "Unable to update Noesis provenance.");
  }
}
