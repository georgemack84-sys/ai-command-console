import { apiError, apiSuccess } from "@/src/server/api/response";
import { classificationRequest, requireMissionStrategyComparisonUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireMissionStrategyComparisonUser();
    return apiSuccess(await classificationRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve mission strategy classification.");
  }
}
