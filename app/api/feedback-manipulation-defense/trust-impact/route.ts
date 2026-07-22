import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireFeedbackManipulationUser, trustImpactRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireFeedbackManipulationUser();
    return apiSuccess(await trustImpactRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve feedback trust impact analysis.");
  }
}
