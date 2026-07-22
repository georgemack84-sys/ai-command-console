import { apiError, apiSuccess } from "@/src/server/api/response";
import { assessmentRequest, requireOptimizationPressureUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireOptimizationPressureUser();
    return apiSuccess(await assessmentRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve optimization pressure assessment.");
  }
}
