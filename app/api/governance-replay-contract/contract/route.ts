import { apiError, apiSuccess } from "@/src/server/api/response";
import { getGovernanceReplayContractResponse, requireGovernanceReplayUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireGovernanceReplayUser();
    return apiSuccess(getGovernanceReplayContractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve governance replay contract.");
  }
}
