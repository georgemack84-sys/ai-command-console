import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireImprovementOpportunityUser, validateImprovementOpportunityRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireImprovementOpportunityUser();
    return apiSuccess(await validateImprovementOpportunityRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate improvement opportunity generation.");
  }
}
