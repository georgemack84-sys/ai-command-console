import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireConfidenceDegradationUser, trendsRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireConfidenceDegradationUser();
    return apiSuccess(await trendsRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve confidence trend history.");
  }
}
