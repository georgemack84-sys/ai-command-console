import { apiError, apiSuccess } from "@/src/server/api/response";
import { registryDelegationContractRequest, requireDelegationContractUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireDelegationContractUser();
    return apiSuccess(await registryDelegationContractRequest(request));
  } catch (error) {
    return apiError(error, "Unable to build Delegation Contract registry.");
  }
}
