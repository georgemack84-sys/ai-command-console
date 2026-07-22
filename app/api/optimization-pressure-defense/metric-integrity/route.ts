import { apiError, apiSuccess } from "@/src/server/api/response";
import { metricIntegrityRequest, requireOptimizationPressureUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireOptimizationPressureUser();
    return apiSuccess(await metricIntegrityRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve metric integrity report.");
  }
}
