import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { ConservativeExampleValidator, ExampleCandidateService, PrismaExampleArtifactRepository, PrismaLearningAuditLedger } from "@/services/learning-constitution";
import type { LearningExample } from "@/types/learning-constitution";

export const dynamic = "force-dynamic";

function candidateFromBody(value: unknown, userId: string): LearningExample {
  if (typeof value !== "object" || value === null) throw new AppError(400, "example_invalid", "Example candidate is required.");
  const raw = value as Record<string, unknown>; const parent = raw.parent as Record<string, unknown> | undefined; const scope = raw.scope as Record<string, unknown> | undefined;
  if (typeof raw.exampleId !== "string" || !raw.exampleId.trim() || !parent || !scope || !Array.isArray(raw.provenanceIds)) throw new AppError(400, "example_invalid", "Example ID, parent, scope, and provenance are required.");
  const strings = ["scenario", "context", "expectedReasoning", "expectedBehavior", "expectedOutput", "explanation"] as const;
  if (strings.some((key) => typeof raw[key] !== "string" || !(raw[key] as string).trim())) throw new AppError(400, "example_content_required", "Example scenario, reasoning, behavior, output, and explanation are required.");
  if (!["POSITIVE", "NEGATIVE", "EDGE_CASE", "COUNTEREXAMPLE"].includes(raw.exampleType as string) || !["PRINCIPLE", "PROCEDURE", "SKILL"].includes(parent.parentType as string) || !["ILLUSTRATIVE", "QUOTED"].includes(raw.contentRole as string)) throw new AppError(400, "example_invalid", "Example type, parent type, and content role are invalid.");
  return { ...(raw as LearningExample), parent: { ...(parent as LearningExample["parent"]), exists: Boolean(parent.exists) }, scope: scope as LearningExample["scope"], inputs: typeof raw.inputs === "object" && raw.inputs ? raw.inputs as Record<string, unknown> : {}, provenanceIds: raw.provenanceIds.filter((id): id is string => typeof id === "string" && Boolean(id.trim())), authority: raw.authority === "HUMAN_CREATED" ? "HUMAN_CREATED" : "AGENT_DERIVED", status: "CANDIDATE", createdBy: { actorId: `user:${userId}`, actorType: "HUMAN" }, createdAt: new Date().toISOString(), immutable: true, executionPermissionGranted: false };
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser(); if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    if (!user.workspaceId || user.workspaceId === "default") throw new AppError(403, "workspace_required", "A workspace membership is required to submit examples.");
    await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    const candidate = candidateFromBody(await request.json(), user.id); const correlationId = `example-submit:${crypto.randomUUID()}`;
    const result = await new ExampleCandidateService(new ConservativeExampleValidator(), new PrismaExampleArtifactRepository(user.workspaceId), new PrismaLearningAuditLedger(user.workspaceId)).submit(candidate, user.workspaceId, correlationId);
    return apiSuccess(result, { status: 201 });
  } catch (error) { return apiError(error, "Unable to submit example candidate."); }
}
