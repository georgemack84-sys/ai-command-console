import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceTamperDetectionUser, responseGovernanceTamperDetectionRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceTamperDetectionUser();
    return apiSuccess(await responseGovernanceTamperDetectionRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve governance tamper response.");
  }
}
