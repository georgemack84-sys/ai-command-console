import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayGovernanceInterfacesRequest, requireGovernanceInterfacesUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceInterfacesUser();
    return apiSuccess(await replayGovernanceInterfacesRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay governance interface transactions.");
  }
}
