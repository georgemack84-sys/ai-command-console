import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceViewer } from "@/src/server/auth/permissions";
import { tandemKnowledgeRequestSchema } from "@/src/tandem/nuru-knowledge-contracts";
import { nuruTandemKnowledgeGatewayService } from "@/src/server/services/nuru-tandem-knowledge-gateway-service";

export const dynamic = "force-dynamic";

/** Authenticated human gateway while Tandem participant credentials are introduced. */
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    await requireWorkspaceViewer({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    const input = tandemKnowledgeRequestSchema.parse(await request.json());
    return apiSuccess(await nuruTandemKnowledgeGatewayService.retrieve(input, { workspaceId: user.workspaceId }));
  } catch (error) {
    return apiError(error, "Unable to retrieve governed Nuru knowledge for Tandem.");
  }
}
