import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireReplayDivergenceUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireReplayDivergenceUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve replay divergence contract.");
  }
}
