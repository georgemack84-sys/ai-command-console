import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireRollbackPreparationUser, rollbackBoundaryRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRollbackPreparationUser();
    return apiSuccess(await rollbackBoundaryRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve rollback boundary.");
  }
}
