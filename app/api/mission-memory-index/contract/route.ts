import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireMissionMemoryIndexUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireMissionMemoryIndexUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve mission memory index contract.");
  }
}
