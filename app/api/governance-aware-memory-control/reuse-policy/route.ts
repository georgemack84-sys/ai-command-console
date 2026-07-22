import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceMemoryControlUser, validatorRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceMemoryControlUser();
    return apiSuccess(await validatorRequest(request, "reuse_policy_result"));
  } catch (error) {
    return apiError(error, "Unable to retrieve memory reuse policy validation.");
  }
}
