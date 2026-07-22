import { apiError, apiSuccess } from "@/src/server/api/response";
import { contractResponse, requireAuthorityBoundaryValidatorUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAuthorityBoundaryValidatorUser();
    return apiSuccess(contractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve authority boundary validator contract.");
  }
}
