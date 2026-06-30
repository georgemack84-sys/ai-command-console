import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireRollbackPreparationUser, validateRollbackPreparationRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRollbackPreparationUser();
    return apiSuccess(await validateRollbackPreparationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate rollback preparation.");
  }
}
