import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceTamperDetectionUser, validateGovernanceTamperDetectionRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceTamperDetectionUser();
    return apiSuccess(await validateGovernanceTamperDetectionRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate governance tamper detection.");
  }
}
