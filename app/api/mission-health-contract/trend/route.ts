import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireMissionHealthUser, trendRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireMissionHealthUser();
    return apiSuccess(await trendRequest(request));
  } catch (error) {
    return apiError(error, "Unable to load mission health trend.");
  }
}
