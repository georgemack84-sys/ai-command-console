import { apiError, apiSuccess } from "@/src/server/api/response";
import { registryRequest, requireStrategicOpportunityUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireStrategicOpportunityUser();
    return apiSuccess(await registryRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve strategic opportunity registry.");
  }
}
