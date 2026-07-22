import { apiError, apiSuccess } from "@/src/server/api/response";
import { comparisonsRequest, requireMissionStrategyComparisonUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireMissionStrategyComparisonUser();
    return apiSuccess(await comparisonsRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve mission strategy comparisons.");
  }
}
