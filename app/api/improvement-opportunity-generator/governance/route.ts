import { apiError, apiSuccess } from "@/src/server/api/response";
import { governanceImprovementOpportunityRequest, requireImprovementOpportunityUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireImprovementOpportunityUser();
    return apiSuccess(await governanceImprovementOpportunityRequest(request));
  } catch (error) {
    return apiError(error, "Unable to evaluate improvement opportunity governance readiness.");
  }
}
