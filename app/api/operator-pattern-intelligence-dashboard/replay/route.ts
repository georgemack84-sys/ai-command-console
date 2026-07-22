import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayRequest, requireOperatorPatternDashboardUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireOperatorPatternDashboardUser();
    return apiSuccess(await replayRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay operator pattern dashboard.");
  }
}
