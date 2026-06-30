import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireDelegationContractUser, validateDelegationContractRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireDelegationContractUser();
    return apiSuccess(await validateDelegationContractRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate Delegation Contract.");
  }
}
