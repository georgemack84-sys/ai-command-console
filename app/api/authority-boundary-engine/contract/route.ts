import { apiError, apiSuccess } from "@/src/server/api/response";
import { getAuthorityBoundaryContractResponse, requireAuthorityBoundaryUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAuthorityBoundaryUser();
    return apiSuccess(getAuthorityBoundaryContractResponse());
  } catch (error) {
    return apiError(error, "Unable to load Authority Boundary Engine contract.");
  }
}
