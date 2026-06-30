import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireDelegationContractUser, versionDelegationContractResponse } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireDelegationContractUser();
    return apiSuccess(versionDelegationContractResponse());
  } catch (error) {
    return apiError(error, "Unable to load Delegation Contract version policy.");
  }
}
