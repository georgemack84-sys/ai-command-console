import { apiError, apiSuccess } from "@/src/server/api/response";
import { createBoundaryEnforcementContractRequest, requireBoundaryEnforcementUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireBoundaryEnforcementUser();
    return apiSuccess(await createBoundaryEnforcementContractRequest(request));
  } catch (error) {
    return apiError(error, "Unable to create Boundary Enforcement Contract.");
  }
}
