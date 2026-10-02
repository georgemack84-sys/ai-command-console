import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceMember, requireWorkspaceViewer } from "@/src/server/auth/permissions";
import { tandemKnowledgeRequestSchema } from "@/src/tandem/nuru-knowledge-contracts";
import { nuruTandemKnowledgeGatewayService } from "@/src/server/services/nuru-tandem-knowledge-gateway-service";
import { nuruTandemMissionContextService } from "@/src/server/services/nuru-tandem-mission-context-service";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ missionId: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    await requireWorkspaceViewer({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    return apiSuccess(await nuruTandemMissionContextService.list(user.workspaceId, (await context.params).missionId));
  } catch (error) { return apiError(error, "Unable to load Tandem mission knowledge context."); }
}

export async function POST(request: Request, context: { params: Promise<{ missionId: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    const missionId = (await context.params).missionId;
    const input = tandemKnowledgeRequestSchema.parse(await request.json());
    if (input.missionId !== missionId) throw new AppError(400, "mission_mismatch", "The request missionId must match the route missionId.");
    const knowledgePackage = await nuruTandemKnowledgeGatewayService.retrieve(input, { workspaceId: user.workspaceId });
    return apiSuccess(await nuruTandemMissionContextService.attach(knowledgePackage, { workspaceId: user.workspaceId, missionId, attachedBy: `human:${user.id}` }), { status: 201 });
  } catch (error) { return apiError(error, "Unable to attach Nuru knowledge to Tandem mission context."); }
}
