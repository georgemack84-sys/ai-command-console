import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireTenantIsolationUser, validatorRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireTenantIsolationUser();
    return apiSuccess(await validatorRequest(request, "segmentation_validation"));
  } catch (error) {
    return apiError(error, "Unable to retrieve memory segmentation validations.");
  }
}
