import { apiError, apiSuccess } from "@/src/server/api/response";
import { getTaskSequencingResponse, requireTaskSequencingUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireTaskSequencingUser();
    return apiSuccess(getTaskSequencingResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve task sequencing framework.");
  }
}
