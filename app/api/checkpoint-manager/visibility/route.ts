import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireCheckpointManagerUser, visibilityCheckpointRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireCheckpointManagerUser();
    return apiSuccess(await visibilityCheckpointRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve checkpoint visibility.");
  }
}
