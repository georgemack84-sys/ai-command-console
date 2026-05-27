import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceMember } from "@/src/server/auth/permissions";
import { buildRecoveryEvidenceBundle } from "@/services/recovery/recoveryEvidenceBuilder";
import { exportRecoveryEvidence } from "@/services/recovery/recoveryEvidenceExporter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ executionId: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      throw new AppError(401, "unauthorized", "Authentication required.");
    }
    await requireWorkspaceMember({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    const { executionId } = await context.params;
    const bundle = await buildRecoveryEvidenceBundle({ executionId });
    if (!bundle.ok) {
      throw new AppError(409, bundle.error, "Recovery evidence is blocked.");
    }
    const url = new URL(request.url);
    const format = url.searchParams.get("format");
    if (format === "json" || format === "markdown") {
      const exported = exportRecoveryEvidence(bundle.data, format);
      if (!exported.ok) {
        throw new AppError(409, exported.error, "Recovery evidence export is blocked.");
      }
      return apiSuccess(exported.data);
    }
    return apiSuccess(bundle.data);
  } catch (error) {
    return apiError(error, "Unable to load recovery evidence.");
  }
}

