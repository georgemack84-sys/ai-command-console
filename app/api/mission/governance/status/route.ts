import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { buildMissionGovernanceApiModel, readExecutionId } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    const model = buildMissionGovernanceApiModel(readExecutionId(request));
    return apiSuccess({
      state: model.state,
      constitutionalDecisionHash: model.constitutionalDecisionHash,
      policy: model.policy,
      warnings: model.warnings,
      errors: model.errors,
    });
  } catch (error) {
    return apiError(error, "Unable to load constitutional status.");
  }
}
