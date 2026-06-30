import { apiError, apiSuccess } from "@/src/server/api/response";
import { getAuthorityValidationResponse, requireAuthorityValidationUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAuthorityValidationUser();
    return apiSuccess(getAuthorityValidationResponse());
  } catch (error) {
    return apiError(error, "Unable to load Authority Validation Engine framework.");
  }
}
