import { apiError, apiSuccess } from "@/src/server/api/response";
import { readinessRequest, requireAdaptiveMemoryCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAdaptiveMemoryCertificationUser();
    return apiSuccess(await readinessRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve adaptive memory certification readiness.");
  }
}
