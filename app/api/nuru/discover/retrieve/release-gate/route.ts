import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { apiError, apiSuccess } from "@/src/server/api/response";
import { getNuruAutonomousPoolReleaseGate } from "@/src/server/services/nuru-discovery-source-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!(await getSessionUser())) throw new AppError(401, "unauthorized", "Sign in to view Nuru's autonomous-pool release gate.");
    return apiSuccess(await getNuruAutonomousPoolReleaseGate());
  } catch (error) {
    return apiError(error, "Nuru's autonomous-pool release gate is unavailable.");
  }
}
