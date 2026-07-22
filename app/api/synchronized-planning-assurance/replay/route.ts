import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayRequest, requireSynchronizedPlanningUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireSynchronizedPlanningUser();
    return apiSuccess(await replayRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay synchronized planning assurance.");
  }
}
