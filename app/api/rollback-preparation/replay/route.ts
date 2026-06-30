import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayRollbackPreparationRequest, requireRollbackPreparationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRollbackPreparationUser();
    return apiSuccess(await replayRollbackPreparationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay rollback preparation.");
  }
}
