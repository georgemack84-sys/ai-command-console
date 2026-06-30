import { apiError, apiSuccess } from "@/src/server/api/response";
import { ledgerGovernanceInterfacesRequest, requireGovernanceInterfacesUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceInterfacesUser();
    return apiSuccess(await ledgerGovernanceInterfacesRequest(request));
  } catch (error) {
    return apiError(error, "Unable to build governance interface ledger.");
  }
}
