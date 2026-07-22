import { apiError, apiSuccess } from "@/src/server/api/response";
import { establishRequest, requireMissionMemoryIndexUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireMissionMemoryIndexUser();
    return apiSuccess(await establishRequest(request));
  } catch (error) {
    return apiError(error, "Unable to establish mission memory index.");
  }
}
