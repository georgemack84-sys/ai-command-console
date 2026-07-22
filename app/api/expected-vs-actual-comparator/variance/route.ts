import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireExpectedVsActualComparatorUser, varianceExpectedVsActualRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireExpectedVsActualComparatorUser();
    return apiSuccess(await varianceExpectedVsActualRequest(request));
  } catch (error) {
    return apiError(error, "Unable to calculate expected vs actual variance.");
  }
}
