import { apiError, apiSuccess } from "@/src/server/api/response";
import { registryRequest, requireConfidenceDegradationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireConfidenceDegradationUser();
    return apiSuccess(await registryRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve confidence degradation registry.");
  }
}
