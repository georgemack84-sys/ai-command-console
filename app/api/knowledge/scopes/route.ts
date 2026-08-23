import { z } from "zod";
import { getSessionUser } from "@/src/lib/auth";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { AppError } from "@/src/server/api/errors";
import { approveAuthorityReview, approveKnowledgePromotion, approveSemanticKeyChange, createKnowledge, createScope, getScopeKnowledgeStore, proposeSemanticKeyChange, proposeSemanticKeyLifecycle, rejectAuthorityReview, rejectKnowledgePromotion, rejectSemanticKeyChange, requestKnowledgePromotion, resolveKnowledge } from "@/src/server/knowledge/scope-service";

const scopeKinds = ["global", "program", "project", "component", "task", "session"] as const;
const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create-scope"), name: z.string().min(1).max(120), kind: z.enum(scopeKinds), parentId: z.string().nullable() }),
  z.object({ action: z.literal("create-knowledge"), scopeId: z.string().min(1), title: z.string().min(1).max(160), content: z.string().min(1).max(8000), semanticKey: z.string().min(1).max(160).optional(), semanticValue: z.string().min(1).max(8000).optional(), inheritable: z.boolean(), overrideOfId: z.string().nullable().optional() }),
  z.object({ action: z.literal("request-promotion"), knowledgeId: z.string().min(1), targetScopeId: z.string().min(1), provenanceRecordId: z.string().min(1), confirmed: z.literal(true) }),
  z.object({ action: z.literal("approve-promotion"), promotionId: z.string().min(1), confirmed: z.literal(true) }),
  z.object({ action: z.literal("reject-promotion"), promotionId: z.string().min(1), reason: z.string().min(1).max(1000), confirmed: z.literal(true) }),
  z.object({ action: z.literal("approve-authority-review"), reviewId: z.string().min(1), resolutionAction: z.enum(["COEXIST", "SUPERSEDE"]).optional(), confirmed: z.literal(true) }),
  z.object({ action: z.literal("reject-authority-review"), reviewId: z.string().min(1), reason: z.string().min(1).max(1000), confirmed: z.literal(true) }),
  z.object({ action: z.literal("propose-semantic-key-change"), key: z.string().min(1).max(160), description: z.string().min(1).max(500), allowedScopeKinds: z.array(z.enum(scopeKinds)).min(1), valueKind: z.enum(["TEXT", "IDENTIFIER", "BOOLEAN", "URL", "VERSION", "ENUM"]), allowedValues: z.array(z.string().min(1).max(8000)).max(100).optional(), confirmed: z.literal(true) }),
  z.object({ action: z.literal("propose-semantic-key-lifecycle"), key: z.string().min(1).max(160), operation: z.enum(["DEPRECATE", "RETIRE"]), confirmed: z.literal(true) }),
  z.object({ action: z.literal("approve-semantic-key-change"), requestId: z.string().min(1), confirmed: z.literal(true) }),
  z.object({ action: z.literal("reject-semantic-key-change"), requestId: z.string().min(1), reason: z.string().min(1).max(1000), confirmed: z.literal(true) }),
]);

function workspaceIdFor(user: { workspaceId?: string | null }) {
  if (!user.workspaceId || user.workspaceId === "default") throw new AppError(403, "workspace_required", "A workspace membership is required to use governed knowledge.");
  return user.workspaceId;
}

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    const store = await getScopeKnowledgeStore(workspaceIdFor(user));
    const requestedScopeId = new URL(request.url).searchParams.get("scopeId");
    const scopeId = store.scopes.some((scope) => scope.id === requestedScopeId) ? requestedScopeId! : store.scopes.find((scope) => scope.kind === "task")?.id ?? store.scopes[0]?.id;
    if (!scopeId) throw new Error("No knowledge scopes are available.");
    return apiSuccess({ ...store, resolvedKnowledge: resolveKnowledge(store, scopeId), selectedScopeId: scopeId, canApprovePromotions: user.role === "admin" || user.role === "approver" });
  } catch (error) { return apiError(error, "Unable to load scope knowledge."); }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    const input = actionSchema.parse(await request.json());
    const workspaceId = workspaceIdFor(user);
    if (input.action === "create-scope") return apiSuccess({ scope: await createScope(workspaceId, input) }, { status: 201 });
    if (input.action === "create-knowledge") { const result = await createKnowledge(workspaceId, user.id, input); return apiSuccess(result, { status: "review" in result ? 202 : 201 }); }
    if (input.action === "request-promotion") return apiSuccess({ promotion: await requestKnowledgePromotion(workspaceId, user.id, input.knowledgeId, input.targetScopeId, input.provenanceRecordId) }, { status: 201 });
    if (input.action === "propose-semantic-key-change") return apiSuccess({ changeRequest: await proposeSemanticKeyChange(workspaceId, user.id, input) }, { status: 202 });
    if (input.action === "propose-semantic-key-lifecycle") return apiSuccess({ changeRequest: await proposeSemanticKeyLifecycle(workspaceId, user.id, input.key, input.operation) }, { status: 202 });
    if (user.role !== "admin" && user.role !== "approver") throw new AppError(403, "forbidden", "Only approvers can resolve knowledge governance requests.");
    if (input.action === "approve-promotion") return apiSuccess({ knowledge: await approveKnowledgePromotion(workspaceId, user.id, input.promotionId) }, { status: 201 });
    if (input.action === "reject-promotion") return apiSuccess({ promotion: await rejectKnowledgePromotion(workspaceId, user.id, input.promotionId, input.reason) }, { status: 201 });
    if (input.action === "approve-authority-review") return apiSuccess({ knowledge: await approveAuthorityReview(workspaceId, user.id, input.reviewId, input.resolutionAction) }, { status: 201 });
    if (input.action === "reject-authority-review") return apiSuccess({ review: await rejectAuthorityReview(workspaceId, user.id, input.reviewId, input.reason) }, { status: 201 });
    if (input.action === "approve-semantic-key-change") return apiSuccess({ semanticKey: await approveSemanticKeyChange(workspaceId, user.id, input.requestId) }, { status: 201 });
    return apiSuccess({ changeRequest: await rejectSemanticKeyChange(workspaceId, user.id, input.requestId, input.reason) }, { status: 201 });
  } catch (error) { return apiError(error, "Unable to update scope knowledge."); }
}
