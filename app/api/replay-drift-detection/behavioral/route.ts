import { apiError, apiSuccess } from "@/src/server/api/response";
import { behavioralRequest, requireReplayDriftUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireReplayDriftUser();
    return apiSuccess(await behavioralRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve behavioral consistency report.");
  }
}
