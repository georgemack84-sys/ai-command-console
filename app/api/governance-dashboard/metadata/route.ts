import { apiError, apiSuccess } from "@/src/server/api/response";
import { getGovernanceDashboardContractResponse, getGovernanceDashboardMetadataRequest, requireGovernanceDashboardUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireGovernanceDashboardUser();
    return apiSuccess(request.url.includes("contract=true") ? getGovernanceDashboardContractResponse() : await getGovernanceDashboardMetadataRequest(request));
  } catch (error) {
    return apiError(error, "Unable to retrieve governance dashboard metadata.");
  }
}
