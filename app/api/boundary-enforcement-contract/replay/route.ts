import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayBoundaryEnforcementContractRequest, requireBoundaryEnforcementUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireBoundaryEnforcementUser();
    return apiSuccess(await replayBoundaryEnforcementContractRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay Boundary Enforcement Contract.");
  }
}
