import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireRollbackPreparationUser, visibilityRollbackPreparationRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRollbackPreparationUser();
    return apiSuccess(await visibilityRollbackPreparationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve rollback preparation visibility.");
  }
}
