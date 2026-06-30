import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayRequest, requireRuntimeHealthUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRuntimeHealthUser();
    return apiSuccess(await replayRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay runtime health.");
  }
}
