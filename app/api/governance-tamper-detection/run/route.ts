import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceTamperDetectionUser, runGovernanceTamperDetectionRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceTamperDetectionUser();
    return apiSuccess(await runGovernanceTamperDetectionRequest(request));
  } catch (error) {
    return apiError(error, "Unable to run governance tamper detection.");
  }
}
