import { apiError, apiSuccess } from "@/src/server/api/response";
import { getObjectiveDecompositionResponse, requireObjectiveDecompositionUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireObjectiveDecompositionUser();
    return apiSuccess(getObjectiveDecompositionResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve objective decomposition framework.");
  }
}
