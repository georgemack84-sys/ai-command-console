import { apiError, apiSuccess } from "@/src/server/api/response";
import { getVisibilityContractForRequest, requireVisibilityCertificationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireVisibilityCertificationUser();
    return apiSuccess(getVisibilityContractForRequest(request));
  } catch (error) {
    return apiError(error, "Unable to load visibility certification contract.");
  }
}
