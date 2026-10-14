import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { applicationRegistrationSchema } from "@/src/server/services/application-registry-service";

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) throw new AppError(401, "unauthorized", "Authentication required.");
    await requireWorkspaceManager({ userId: user.id, userRole: user.role, workspaceId: user.workspaceId });
    const application = applicationRegistrationSchema.parse(await request.json());
    return apiSuccess({
      application,
      checks: [
        { id: "identity", status: "ready", label: "Stable application slug is valid." },
        { id: "contract", status: "ready", label: "Supported contract versions are valid and unique." },
        { id: "authority", status: "ready", label: "Registration will create a draft only; no credential or execution authority is granted." },
      ],
    });
  } catch (error) {
    return apiError(error, "Unable to validate application configuration.");
  }
}
