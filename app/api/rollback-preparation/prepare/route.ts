import { apiError, apiSuccess } from "@/src/server/api/response";
import { prepareRollbackRequest, requireRollbackPreparationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRollbackPreparationUser();
    return apiSuccess(await prepareRollbackRequest(request));
  } catch (error) {
    return apiError(error, "Unable to prepare rollback plan.");
  }
}
