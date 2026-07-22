import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectExpectedVsActualRequest, requireExpectedVsActualComparatorUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireExpectedVsActualComparatorUser();
    return apiSuccess(await inspectExpectedVsActualRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect expected vs actual comparator.");
  }
}

export async function POST(request: Request) {
  try {
    await requireExpectedVsActualComparatorUser();
    return apiSuccess(await inspectExpectedVsActualRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect expected vs actual comparator.");
  }
}
