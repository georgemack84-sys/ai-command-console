import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireMissionStrategyComparisonUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireMissionStrategyComparisonUser();
    return apiSuccess(await inspectRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect mission strategy comparison engine.");
  }
}

export async function POST(request: Request) {
  try {
    await requireMissionStrategyComparisonUser();
    return apiSuccess(await inspectRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect mission strategy comparison engine.");
  }
}
