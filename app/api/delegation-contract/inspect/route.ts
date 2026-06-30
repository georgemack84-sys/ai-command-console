import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectDelegationContractRequest, requireDelegationContractUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireDelegationContractUser();
    return apiSuccess(await inspectDelegationContractRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect Delegation Contract.");
  }
}

export async function POST(request: Request) {
  try {
    await requireDelegationContractUser();
    return apiSuccess(await inspectDelegationContractRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect Delegation Contract.");
  }
}
