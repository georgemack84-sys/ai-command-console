import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireHistoricalIntelligenceUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireHistoricalIntelligenceUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to load historical intelligence engine contract.");
  }
}
