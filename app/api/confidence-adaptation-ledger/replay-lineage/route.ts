import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayLineageRequest, requireConfidenceAdaptationLedgerUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireConfidenceAdaptationLedgerUser();
    return apiSuccess(await replayLineageRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve confidence replay lineage.");
  }
}
