import { apiError, apiSuccess } from "@/src/server/api/response";
import { authorizeGovernanceReplayContractRequest, requireGovernanceReplayUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceReplayUser();
    return apiSuccess(await authorizeGovernanceReplayContractRequest(request));
  } catch (error) {
    return apiError(error, "Unable to authorize governance replay contract.");
  }
}
