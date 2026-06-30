import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceInterfacesUser, transactionGovernanceInterfacesRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceInterfacesUser();
    return apiSuccess(await transactionGovernanceInterfacesRequest(request));
  } catch (error) {
    return apiError(error, "Unable to build governance interface transaction.");
  }
}
