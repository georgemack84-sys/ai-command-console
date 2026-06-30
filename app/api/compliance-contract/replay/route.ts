import { apiError, apiSuccess } from "@/src/server/api/response";
import { replayComplianceContractRequest, requireComplianceContractUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireComplianceContractUser();
    return apiSuccess(await replayComplianceContractRequest(request));
  } catch (error) {
    return apiError(error, "Unable to replay Compliance Contract.");
  }
}
