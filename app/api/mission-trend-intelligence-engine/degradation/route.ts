import { apiError, apiSuccess } from "@/src/server/api/response";
import { degradationRequest, requireMissionTrendUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireMissionTrendUser();
    return apiSuccess(await degradationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to load mission degradation trend.");
  }
}
