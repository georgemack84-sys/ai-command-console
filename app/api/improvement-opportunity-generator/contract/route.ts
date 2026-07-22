import { apiError, apiSuccess } from "@/src/server/api/response";
import { getImprovementOpportunityContractResponse, requireImprovementOpportunityUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireImprovementOpportunityUser();
    return apiSuccess(getImprovementOpportunityContractResponse());
  } catch (error) {
    return apiError(error, "Unable to load improvement opportunity generator contract.");
  }
}
