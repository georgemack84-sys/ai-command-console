import { apiError, apiSuccess } from "@/src/server/api/response";
import { getExecutionContractResponse, requireExecutionContractUser } from "../core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireExecutionContractUser();
    return apiSuccess(getExecutionContractResponse());
  } catch (error) {
    return apiError(error, "Unable to retrieve execution contract framework.");
  }
}
