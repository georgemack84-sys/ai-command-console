import { apiError, apiSuccess } from "@/src/server/api/response";
import { entriesRequest, requireMissionMemoryIndexUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireMissionMemoryIndexUser();
    return apiSuccess(await entriesRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve mission memory index entries.");
  }
}
