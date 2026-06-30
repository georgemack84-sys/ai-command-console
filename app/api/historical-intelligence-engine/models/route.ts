import { apiError, apiSuccess } from "@/src/server/api/response";
import { modelsRequest, requireHistoricalIntelligenceUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireHistoricalIntelligenceUser();
    return apiSuccess(await modelsRequest(request));
  } catch (error) {
    return apiError(error, "Unable to load historical prediction models.");
  }
}
