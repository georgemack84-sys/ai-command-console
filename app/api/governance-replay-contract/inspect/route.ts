import { apiError, apiSuccess } from "@/src/server/api/response";
import { inspectGovernanceReplayContractRequest, requireGovernanceReplayUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireGovernanceReplayUser();
    return apiSuccess(await inspectGovernanceReplayContractRequest());
  } catch (error) {
    return apiError(error, "Unable to inspect governance replay contract.");
  }
}

export async function POST(request: Request) {
  try {
    await requireGovernanceReplayUser();
    return apiSuccess(await inspectGovernanceReplayContractRequest(request));
  } catch (error) {
    return apiError(error, "Unable to inspect governance replay contract.");
  }
}
