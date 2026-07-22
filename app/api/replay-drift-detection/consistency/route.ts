import { apiError, apiSuccess } from "@/src/server/api/response";
import { consistencyRequest, requireReplayDriftUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireReplayDriftUser();
    return apiSuccess(await consistencyRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve replay consistency report.");
  }
}
