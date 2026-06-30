import { apiError, apiSuccess } from "@/src/server/api/response";
import { classifyGovernanceTamperDetectionRequest, requireGovernanceTamperDetectionUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceTamperDetectionUser();
    return apiSuccess(await classifyGovernanceTamperDetectionRequest(request));
  } catch (error) {
    return apiError(error, "Unable to classify governance tamper detection reason.");
  }
}
