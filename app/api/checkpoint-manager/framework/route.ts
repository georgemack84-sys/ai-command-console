import { apiError, apiSuccess } from "@/src/server/api/response";
import { getCheckpointManagerResponse, requireCheckpointManagerUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireCheckpointManagerUser();
    return apiSuccess(getCheckpointManagerResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve checkpoint manager framework.");
  }
}
