import { apiError, apiSuccess } from "@/src/server/api/response";
import { getExpectedVsActualComparatorContractResponse, requireExpectedVsActualComparatorUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireExpectedVsActualComparatorUser();
    return apiSuccess(getExpectedVsActualComparatorContractResponse());
  } catch (error) {
    return apiError(error, "Unable to load expected vs actual comparator contract.");
  }
}
