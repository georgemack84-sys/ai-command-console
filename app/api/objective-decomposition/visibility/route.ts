import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireObjectiveDecompositionUser, visibilityObjectiveRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireObjectiveDecompositionUser();
    return apiSuccess(await visibilityObjectiveRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve objective decomposition visibility.");
  }
}
