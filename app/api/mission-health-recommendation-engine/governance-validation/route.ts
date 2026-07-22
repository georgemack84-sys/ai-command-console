import { apiError, apiSuccess } from "@/src/server/api/response";
import { governanceValidationRequest, requireMissionHealthRecommendationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireMissionHealthRecommendationUser();
    return apiSuccess(await governanceValidationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to load recommendation governance validation.");
  }
}
