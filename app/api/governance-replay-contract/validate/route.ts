import { apiError, apiSuccess } from "@/src/server/api/response";
import { requireGovernanceReplayUser, validateGovernanceReplayContractRequest } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceReplayUser();
    return apiSuccess(await validateGovernanceReplayContractRequest(request));
  } catch (error) {
    return apiError(error, "Unable to validate governance replay contract.");
  }
}
