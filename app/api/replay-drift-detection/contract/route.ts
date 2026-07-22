import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireReplayDriftUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireReplayDriftUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve replay drift detection contract.");
  }
}
