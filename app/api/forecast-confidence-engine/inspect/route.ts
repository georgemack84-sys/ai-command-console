import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectRequest, requireForecastConfidenceUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireForecastConfidenceUser();
    return apiSuccess(await inspectRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect forecast confidence engine.");
  }
}

export async function POST(request: Request) {
  try {
    await requireForecastConfidenceUser();
    return apiSuccess(await inspectRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect forecast confidence engine.");
  }
}
