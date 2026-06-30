import { apiError, apiSuccess } from "@/src/server/api/response";
import { createGovernanceReplayContractRequest, requireGovernanceReplayUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceReplayUser();
    return apiSuccess(await createGovernanceReplayContractRequest(request));
  } catch (error) {
    return apiError(error, "Unable to create governance replay contract.");
  }
}
