import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayRequest, requireHistoricalIntelligenceUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireHistoricalIntelligenceUser();
    return apiSuccess(await replayRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay historical intelligence.");
  }
}
