import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requirePatternIntelligenceDashboardUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePatternIntelligenceDashboardUser();
    return apiSuccess(await inspectRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect pattern intelligence dashboard.");
  }
}

export async function POST(request: Request) {
  try {
    await requirePatternIntelligenceDashboardUser();
    return apiSuccess(await inspectRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect pattern intelligence dashboard.");
  }
}
