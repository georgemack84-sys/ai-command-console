import { apiError, apiSuccess } from "@/src/server/api/response";
import { auditGovernanceReplayContractRequest, requireGovernanceReplayUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireGovernanceReplayUser();
    return apiSuccess(await auditGovernanceReplayContractRequest(request));
  } catch (error) {
    return apiError(error, "Unable to append governance replay audit event.");
  }
}
