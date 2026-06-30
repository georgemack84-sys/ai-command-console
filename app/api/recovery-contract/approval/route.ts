import { apiError, apiSuccess } from "@/src/server/api/response";
import { approvalRequest, requireRecoveryContractUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireRecoveryContractUser();
    return apiSuccess(await approvalRequest(request));
  } catch (error) {
    return apiError(error, "Unable to load recovery approval workflow.");
  }
}
