import { apiError, apiSuccess } from "@/src/server/api/response";
import { compareExpectedVsActualRequest, requireExpectedVsActualComparatorUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireExpectedVsActualComparatorUser();
    return apiSuccess(await compareExpectedVsActualRequest(request));
  } catch (error) {
    return apiError(error, "Unable to compare expected and actual outcomes.");
  }
}
