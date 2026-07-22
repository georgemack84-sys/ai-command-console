import { apiError, apiSuccess } from "@/src/server/api/response";
import { detectRequest, requireReplayDriftUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireReplayDriftUser();
    return apiSuccess(await detectRequest(request));
  } catch (error) {
    return apiError(error, "Unable to detect replay drift.");
  }
}
