import { apiError, apiSuccess } from "@/src/server/api/response";
import { getGovernanceTamperDetectionContractResponse, requireGovernanceTamperDetectionUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireGovernanceTamperDetectionUser();
    return apiSuccess(getGovernanceTamperDetectionContractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve governance tamper detection contract.");
  }
}
