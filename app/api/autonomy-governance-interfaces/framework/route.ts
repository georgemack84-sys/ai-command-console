import { apiError, apiSuccess } from "@/src/server/api/response";
import { getGovernanceInterfacesResponse, requireGovernanceInterfacesUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireGovernanceInterfacesUser();
    return apiSuccess(getGovernanceInterfacesResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve governance interfaces framework.");
  }
}
