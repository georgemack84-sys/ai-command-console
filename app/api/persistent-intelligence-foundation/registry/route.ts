import { apiError, apiSuccess } from "@/src/server/api/response";
import { registryRequest, requirePersistentIntelligenceUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePersistentIntelligenceUser();
    return apiSuccess(await registryRequest());
  } catch (error) {
    return apiError(error, "Unable to retrieve persistent intelligence registry.");
  }
}

export async function POST(request: Request) {
  try {
    await requirePersistentIntelligenceUser();
    return apiSuccess(await registryRequest(request));
  } catch (error) {
    return apiError(error, "Unable to query persistent intelligence registry.");
  }
}
