import { apiError, apiSuccess } from "@/src/server/api/response";
import { createDelegationContractRequest, requireDelegationContractUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireDelegationContractUser();
    return apiSuccess(await createDelegationContractRequest(request));
  } catch (error) {
    return apiError(error, "Unable to create Delegation Contract.");
  }
}
