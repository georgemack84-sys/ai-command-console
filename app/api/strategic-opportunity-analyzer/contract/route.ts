import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireStrategicOpportunityUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireStrategicOpportunityUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve strategic opportunity analyzer contract.");
  }
}
