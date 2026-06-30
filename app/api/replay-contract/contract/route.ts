import { apiError, apiSuccess } from "@/src/server/api/response";
import { getReplayContractResponse, requireReplayContractUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireReplayContractUser();
    return apiSuccess(getReplayContractResponse());
  } catch (error) {
    return apiError(error, "Unable to load Replay Contract.");
  }
}
