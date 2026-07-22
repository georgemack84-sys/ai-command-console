import { apiError, apiSuccess } from "@/src/server/api/response";
import { inconsistencyRequest, requireConfidenceDegradationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireConfidenceDegradationUser();
    return apiSuccess(await inconsistencyRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve confidence inconsistency analysis.");
  }
}
