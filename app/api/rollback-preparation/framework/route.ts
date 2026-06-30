import { apiError, apiSuccess } from "@/src/server/api/response";
import { getRollbackPreparationResponse, requireRollbackPreparationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRollbackPreparationUser();
    return apiSuccess(getRollbackPreparationResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve rollback preparation framework.");
  }
}
