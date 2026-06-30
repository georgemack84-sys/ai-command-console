import { apiError, apiSuccess } from "@/src/server/api/response";
import { getBoundaryEnforcementContractResponse, requireBoundaryEnforcementUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireBoundaryEnforcementUser();
    return apiSuccess(getBoundaryEnforcementContractResponse());
  } catch (error) {
    return apiError(error, "Unable to load Boundary Enforcement Contract.");
  }
}
