import { apiError, apiSuccess } from "@/src/server/api/response";
import { publishRequest, recommendRequest, requireAssuranceRecommendationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAssuranceRecommendationUser();
    return apiSuccess(await publishRequest());
  } catch (error) {
    return apiError(error, "Unable to publish assurance recommendation.");
  }
}

export async function POST(request: Request) {
  try {
    await requireAssuranceRecommendationUser();
    return apiSuccess(await recommendRequest(request));
  } catch (error) {
    return apiError(error, "Unable to generate assurance recommendation.");
  }
}
