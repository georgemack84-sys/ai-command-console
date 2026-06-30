import { apiError, apiSuccess } from "@/src/server/api/response";
import { enforceGovernancePolicyRequest, requireGovernancePolicyUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernancePolicyUser();
    return apiSuccess(await enforceGovernancePolicyRequest(request));
  } catch (error) {
    return apiError(error, "Unable to enforce governance policy.");
  }
}
