import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceInterfacesUser, validateGovernanceInterfacesRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceInterfacesUser();
    return apiSuccess(await validateGovernanceInterfacesRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate governance interface transaction.");
  }
}
