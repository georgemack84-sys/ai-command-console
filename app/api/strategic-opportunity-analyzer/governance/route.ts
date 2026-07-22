import { apiError, apiSuccess } from "@/src/server/api/response";
import { governanceRequest, requireStrategicOpportunityUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireStrategicOpportunityUser();
    return apiSuccess(await governanceRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve strategic opportunity governance references.");
  }
}
