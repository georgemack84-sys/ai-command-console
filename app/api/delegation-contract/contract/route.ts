import { apiError, apiSuccess } from "@/src/server/api/response";
import { getDelegationContractResponse, requireDelegationContractUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireDelegationContractUser();
    return apiSuccess(getDelegationContractResponse());
  } catch (error) {
    return apiError(error, "Unable to load Delegation Contract framework.");
  }
}
