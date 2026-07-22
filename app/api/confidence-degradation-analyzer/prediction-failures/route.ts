import { apiError, apiSuccess } from "@/src/server/api/response";
import { predictionFailuresRequest, requireConfidenceDegradationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireConfidenceDegradationUser();
    return apiSuccess(await predictionFailuresRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve repeated prediction failure analysis.");
  }
}
