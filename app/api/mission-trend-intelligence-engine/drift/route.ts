import { apiError, apiSuccess } from "@/src/server/api/response";
import { driftRequest, requireMissionTrendUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireMissionTrendUser();
    return apiSuccess(await driftRequest(request));
  } catch (error) {
    return apiError(error, "Unable to load mission drift analysis.");
  }
}
